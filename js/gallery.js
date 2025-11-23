// ===================================
// CONFIGURATION
// ===================================

// Map passwords to gallery collections
// Each password can have multiple galleries
const GALLERIES = {
    'trinity': {
        name: 'Trinity Collection',
        galleries: [
            {
                title: 'Wedding Ceremony',
                description: 'Beautiful moments from the ceremony',
                thumbnail: 'path/to/ceremony-thumb.jpg',
                file: 'galleries/trinity-ceremony.json'
            },
            {
                title: 'Wedding Reception',
                description: 'Dancing and celebration',
                thumbnail: 'path/to/reception-thumb.jpg',
                file: 'galleries/trinity-reception.json'
            },
            {
                title: 'Portraits',
                description: 'Couple and family portraits',
                thumbnail: 'path/to/portraits-thumb.jpg',
                file: 'galleries/trinity-portraits.json'
            }
        ]
    },
    // Example of a single gallery (backwards compatible)
    // 'password123': {
    //     name: 'Smith Family',
    //     galleries: [
    //         {
    //             title: 'Family Photos',
    //             description: 'Summer 2024',
    //             thumbnail: 'path/to/thumb.jpg',
    //             file: 'galleries/smith-family.json'
    //         }
    //     ]
    // }
};

// ===================================
// GLOBAL STATE
// ===================================

let currentGallery = null;
let currentPhotoIndex = 0;
let isSelectMode = false;
let selectedPhotos = new Set();
let currentPassword = null;
let currentGalleryCollection = null;

// ===================================
// PASSWORD AUTHENTICATION
// ===================================

function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const password = passwordInput.value.trim();
    const errorMessage = document.getElementById('error-message');
    
    // Clear previous error
    errorMessage.textContent = '';
    
    // Check if password exists in our gallery mapping
    if (GALLERIES[password]) {
        currentPassword = password;
        currentGalleryCollection = GALLERIES[password];
        
        // Store password for this session
        sessionStorage.setItem('currentPassword', password);
        
        // Show loading screen briefly
        showScreen('loading-screen');
        
        // Show gallery selection screen
        setTimeout(() => {
            displayGallerySelection(currentGalleryCollection);
            showScreen('gallery-selection-screen');
        }, 500);
    } else {
        // Show error
        errorMessage.textContent = 'Incorrect password. Please try again.';
        passwordInput.value = '';
        passwordInput.focus();
        
        // Shake animation
        passwordInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            passwordInput.style.animation = '';
        }, 500);
    }
}

// Allow Enter key to submit password
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        passwordInput.focus();
    }
});

// ===================================
// GALLERY SELECTION
// ===================================

function displayGallerySelection(collection) {
    const collectionTitle = document.getElementById('collection-title');
    const galleryGrid = document.getElementById('gallery-selection-grid');
    
    collectionTitle.textContent = collection.name;
    galleryGrid.innerHTML = '';
    
    collection.galleries.forEach((gallery, index) => {
        const galleryCard = createGalleryCard(gallery, index);
        galleryGrid.appendChild(galleryCard);
    });
}

function createGalleryCard(gallery, index) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.onclick = () => selectGallery(index);
    
    const thumbnail = document.createElement('div');
    thumbnail.className = 'gallery-card-thumbnail';
    if (gallery.thumbnail) {
        thumbnail.style.backgroundImage = `url(${gallery.thumbnail})`;
    } else {
        thumbnail.innerHTML = '<div class="gallery-card-icon">📸</div>';
    }
    
    const content = document.createElement('div');
    content.className = 'gallery-card-content';
    
    const title = document.createElement('h3');
    title.textContent = gallery.title;
    
    const description = document.createElement('p');
    description.textContent = gallery.description;
    
    content.appendChild(title);
    content.appendChild(description);
    
    card.appendChild(thumbnail);
    card.appendChild(content);
    
    return card;
}

function selectGallery(index) {
    const gallery = currentGalleryCollection.galleries[index];
    showScreen('loading-screen');
    loadGallery(gallery.file, currentPassword);
}

function backToGallerySelection() {
    // Clear current gallery
    currentGallery = null;
    isSelectMode = false;
    selectedPhotos.clear();
    
    // Show gallery selection
    displayGallerySelection(currentGalleryCollection);
    showScreen('gallery-selection-screen');
}

// ===================================
// GALLERY LOADING
// ===================================

async function loadGallery(galleryFile, password) {
    try {
        const response = await fetch(galleryFile);
        
        if (!response.ok) {
            throw new Error('Gallery file not found');
        }
        
        const data = await response.json();
        currentGallery = data;
        
        // Store password for this session (optional, for re-authentication)
        sessionStorage.setItem('currentPassword', password);
        
        // Display the gallery
        displayGallery(data);
        
        // Show gallery screen
        showScreen('gallery-screen');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        alert('Error loading gallery. Please contact support.');
        showScreen('password-screen');
    }
}

function displayGallery(data) {
    // Set title and description
    document.getElementById('gallery-title').textContent = data.title || 'Your Photos';
    document.getElementById('gallery-description').textContent = data.description || '';
    document.getElementById('photo-count').textContent = data.photos.length;
    
    // Clear existing photos
    const photoGrid = document.getElementById('photo-grid');
    photoGrid.innerHTML = '';
    
    // Add photos to grid
    data.photos.forEach((photo, index) => {
        const photoItem = createPhotoElement(photo, index);
        photoGrid.appendChild(photoItem);
    });
    
    // Set up download all button
    const downloadAllBtn = document.getElementById('download-all-btn');
    if (data.downloadAllLink) {
        downloadAllBtn.onclick = () => window.open(data.downloadAllLink, '_blank');
    } else {
        downloadAllBtn.style.display = 'none';
    }
}

function createPhotoElement(photo, index) {
    const div = document.createElement('div');
    div.className = 'photo-item';
    div.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = photo.thumbnail || photo.url;
    img.alt = photo.title || `Photo ${index + 1}`;
    img.loading = 'lazy'; // Lazy load images for performance
    
    // Click to open lightbox
    div.onclick = () => {
        if (isSelectMode) {
            togglePhotoSelection(div, index);
        } else {
            openLightbox(index);
        }
    };
    
    div.appendChild(img);
    return div;
}

// ===================================
// LIGHTBOX FUNCTIONALITY
// ===================================

function openLightbox(index) {
    currentPhotoIndex = index;
    const photo = currentGallery.photos[index];
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCounter = document.getElementById('lightbox-counter');
    
    lightboxImage.src = photo.fullsize || photo.url;
    lightboxCounter.textContent = `${index + 1} / ${currentGallery.photos.length}`;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function navigateLightbox(direction) {
    currentPhotoIndex += direction;
    
    // Loop around
    if (currentPhotoIndex < 0) {
        currentPhotoIndex = currentGallery.photos.length - 1;
    } else if (currentPhotoIndex >= currentGallery.photos.length) {
        currentPhotoIndex = 0;
    }
    
    openLightbox(currentPhotoIndex);
}

function downloadCurrentPhoto() {
    const photo = currentGallery.photos[currentPhotoIndex];
    window.open(photo.fullsize || photo.url, '_blank');
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    }
});

// ===================================
// PHOTO SELECTION FUNCTIONALITY
// ===================================

function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    selectedPhotos.clear();
    
    const selectModeBtn = document.getElementById('select-mode-btn');
    const downloadSelectedBtn = document.getElementById('download-selected-btn');
    const photoItems = document.querySelectorAll('.photo-item');
    
    if (isSelectMode) {
        selectModeBtn.textContent = 'Cancel Selection';
        selectModeBtn.classList.add('btn-secondary');
        downloadSelectedBtn.style.display = 'block';
        
        photoItems.forEach(item => {
            item.classList.add('selectable');
            item.classList.remove('selected');
        });
    } else {
        selectModeBtn.textContent = 'Select Photos';
        selectModeBtn.classList.remove('btn-secondary');
        downloadSelectedBtn.style.display = 'none';
        
        photoItems.forEach(item => {
            item.classList.remove('selectable', 'selected');
        });
    }
    
    updateSelectedCount();
}

function togglePhotoSelection(photoElement, index) {
    if (!isSelectMode) return;
    
    if (selectedPhotos.has(index)) {
        selectedPhotos.delete(index);
        photoElement.classList.remove('selected');
    } else {
        selectedPhotos.add(index);
        photoElement.classList.add('selected');
    }
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    countElement.textContent = selectedPhotos.size;
    
    const downloadSelectedBtn = document.getElementById('download-selected-btn');
    downloadSelectedBtn.disabled = selectedPhotos.size === 0;
}

function downloadSelected() {
    if (selectedPhotos.size === 0) {
        alert('Please select at least one photo');
        return;
    }
    
    // Open each selected photo in a new tab
    // Note: Browsers may block multiple tabs, user might need to allow popups
    const photoArray = Array.from(selectedPhotos);
    
    if (photoArray.length > 10) {
        const confirm = window.confirm(
            `You're about to open ${photoArray.length} photos in new tabs. ` +
            `Your browser may block some of them. Continue?`
        );
        if (!confirm) return;
    }
    
    photoArray.forEach((index, i) => {
        const photo = currentGallery.photos[index];
        // Stagger the opening slightly to avoid browser blocking
        setTimeout(() => {
            window.open(photo.fullsize || photo.url, '_blank');
        }, i * 100);
    });
}

function downloadAll() {
    if (currentGallery.downloadAllLink) {
        window.open(currentGallery.downloadAllLink, '_blank');
    } else {
        alert('Download all link not available for this gallery');
    }
}

// ===================================
// SCREEN MANAGEMENT
// ===================================

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function logout() {
    const confirm = window.confirm('Are you sure you want to logout?');
    if (confirm) {
        sessionStorage.removeItem('currentPassword');
        currentGallery = null;
        currentPassword = null;
        currentGalleryCollection = null;
        selectedPhotos.clear();
        isSelectMode = false;
        showScreen('password-screen');
        document.getElementById('password-input').value = '';
    }
}

// ===================================
// SHAKE ANIMATION (for wrong password)
// ===================================

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// ===================================
// INITIALIZATION
// ===================================

// Check if user has active session (optional feature)
document.addEventListener('DOMContentLoaded', function() {
    const savedPassword = sessionStorage.getItem('currentPassword');
    if (savedPassword && GALLERIES[savedPassword]) {
        // Auto-login if session exists
        currentPassword = savedPassword;
        currentGalleryCollection = GALLERIES[savedPassword];
        showScreen('loading-screen');
        setTimeout(() => {
            displayGallerySelection(currentGalleryCollection);
            showScreen('gallery-selection-screen');
        }, 500);
    }
});