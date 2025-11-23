from google.oauth2 import service_account
from googleapiclient.discovery import build
import json
import os

# ====================================
# CONFIGURATION
# ====================================

# Path to your service account credentials JSON file
SERVICE_ACCOUNT_FILE = 'credentials.json'

# Google Drive API scopes
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# ====================================
# FUNCTION TO CREATE GALLERY JSON
# ====================================

def create_gallery_json(folder_id, output_file, title="Photo Gallery", description="", download_all_link=""):
    """
    Generate a gallery JSON file from a Google Drive folder
    
    Args:
        folder_id: Google Drive folder ID
        output_file: Output JSON filename (e.g., 'smith-wedding.json')
        title: Gallery title
        description: Gallery description
        download_all_link: Link to download all photos (optional)
    """
    
    print(f"🔐 Authenticating with Google Drive...")
    
    # Authenticate with Google Drive API
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        service = build('drive', 'v3', credentials=creds)
        print("✅ Authentication successful!")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return
    
    print(f"📂 Fetching files from folder: {folder_id}")
    
    # Get all image files from the folder
    try:
        results = service.files().list(
            q=f"'{folder_id}' in parents and (mimeType contains 'image/')",
            fields="files(id, name, mimeType)",
            orderBy="name"  # Sort by filename
        ).execute()
        
        files = results.get('files', [])
        print(f"📸 Found {len(files)} images")
        
    except Exception as e:
        print(f"❌ Error fetching files: {e}")
        return
    
    if not files:
        print("⚠️  No images found in folder. Make sure:")
        print("   1. The folder ID is correct")
        print("   2. The service account has access to the folder")
        print("   3. The folder contains image files")
        return
    
    # Generate photo objects
    photos = []
    for file in files:
        file_id = file['id']
        file_name = file['name']
        
        print(f"   Adding: {file_name}")
        
        photos.append({
            'url': f"https://lh3.googleusercontent.com/d/{file_id}",
            'thumbnail': f"lh3.googleusercontent.com/d/{file_id}=w500",
            'fullsize': f"https://lh3.googleusercontent.com/d/{file_id}",
            'title': os.path.splitext(file_name)[0]  # Remove file extension
        })
    
    # Create the complete gallery object
    gallery_data = {
        'title': title,
        'description': description,
        'downloadAllLink': download_all_link if download_all_link else f"https://drive.google.com/drive/folders/{folder_id}?usp=sharing",
        'photos': photos
    }
    
    # Write to JSON file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(gallery_data, f, indent=4, ensure_ascii=False)
        
        print(f"\n✅ SUCCESS! Created: {output_file}")
        print(f"📊 Total photos: {len(photos)}")
        print(f"\n📋 Next steps:")
        print(f"   1. Upload '{output_file}' to GitHub (galleries/ folder)")
        print(f"   2. Add password to gallery.js")
        print(f"   3. Share password with client")
        
    except Exception as e:
        print(f"❌ Error writing file: {e}")

# ====================================
# MAIN EXECUTION
# ====================================

if __name__ == "__main__":
    print("=" * 50)
    print("🎨 PHOTO GALLERY JSON GENERATOR")
    print("=" * 50)
    print()
    
    # EXAMPLE USAGE - Replace with your values
    create_gallery_json(
        folder_id="1EbWgOR2xayFOLmUR5zwDiT9cTeHldMns",  # Your Google Drive folder ID
        output_file="InstoniansCP.json",               # Output filename
        title="DUFC vs Instonians | 2025 | College Park",               # Gallery title
        download_all_link="https://drive.google.com/drive/folders/1EbWgOR2xayFOLmUR5zwDiT9cTeHldMns?usp=sharing"
    )
    
    print()
    print("=" * 50)