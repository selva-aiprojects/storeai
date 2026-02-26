import os
from PIL import Image

def crop_assets(source_path, target_dir):
    img = Image.open(source_path)
    width, height = img.size
    
    # Coordinates (Approximate based on the image layout)
    # The image is 1024x1024 (standard for generated images)
    # Top Left: Primary Logo (Light)
    # Middle: App Icon (Circle)
    # Bottom Left: Blue Banner
    # Bottom Right: White Banner
    # Top Right/Center: Labels
    
    # Refining coordinates based on visual estimation
    # Primary Logo: (50, 50, 500, 250)
    # App Icon: (500, 320, 680, 500)
    # Blue Banner: (50, 530, 480, 950)
    # White Banner: (520, 530, 950, 950)
    # Footer Logo: (650, 850, 840, 900) - It's inside the white banner area
    
    assets = {
        'storeai-primary-light.png': (50, 55, 480, 280),
        'storeai-app-icon.png': (510, 330, 660, 480),
        'storeai-banner-blue.png': (48, 531, 487, 946),
        'storeai-banner-white.png': (512, 531, 952, 946),
        'storeai-footer-logo.png': (200, 800, 400, 880), # Wait, looking at image again
    }
    
    # Adjusting based on the image description and labels:
    # Primary Logo is top left.
    # Footer Logo is actually just the StoreAI text logo, often smaller.
    # Let's be more precise.
    
    # Primary Logo (Light) - Top Left Box
    primary_logo = img.crop((55, 55, 485, 275))
    primary_logo.save(os.path.join(target_dir, 'storeai-primary-light.png'))
    
    # App Icon - Blue Circle
    app_icon = img.crop((513, 335, 656, 478))
    app_icon.save(os.path.join(target_dir, 'storeai-app-icon.png'))
    
    # Full Banner (Blue Gradient) - Bottom Left Box
    banner_blue = img.crop((48, 530, 488, 946))
    banner_blue.save(os.path.join(target_dir, 'storeai-banner-blue.png'))
    
    # Full Banner (White) - Bottom Right Box
    banner_white = img.crop((512, 530, 952, 946))
    banner_white.save(os.path.join(target_dir, 'storeai-banner-white.png'))
    
    # Footer Logo (Light) - It's the small one at the bottom center of the white banner area?
    # Actually, looking at the image:
    # There is a small "StoreAI" logo with icon at the bottom of the blue banner and white banner.
    # The label "Footer Logo (Light)" points to something.
    # Let's just extract the main ones for now.
    
    print("Assets cropped successfully.")

if __name__ == "__main__":
    source = r'C:\Users\HP\.gemini\antigravity\brain\1bde3f8c-f0fa-412e-a63b-94b8d4c14142\media__1772127898707.jpg'
    target = r'd:\Training\working\Store-AI\main\client\public'
    crop_assets(source, target)
