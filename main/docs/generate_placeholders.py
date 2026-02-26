from PIL import Image, ImageDraw, ImageFont, ImageOps
import os

def create_placeholder(filename, text, size=(800, 600), bg_color=(245, 247, 250)):
    # Create image
    img = Image.new('RGB', size, color=bg_color)
    d = ImageDraw.Draw(img)
    
    # Try to load a font
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        large_font = ImageFont.truetype("arial.ttf", 36)
    except IOError:
        font = ImageFont.load_default()
        large_font = ImageFont.load_default()

    # Draw header bar
    d.rectangle([(0, 0), (size[0], 60)], fill=(59, 130, 246)) # Blue header
    d.text((20, 15), "StoreAI Enterprise - " + filename.split('.')[0].replace('_', ' ').title(), fill=(255, 255, 255), font=font)

    # Draw Sidebar placeholder
    d.rectangle([(0, 60), (200, size[1])], fill=(229, 231, 235)) # Light gray sidebar
    
    # Draw Content Area placeholder
    # Central Text
    bbox = d.textbbox((0, 0), text, font=large_font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    center_x = 200 + (size[0] - 200 - text_width) / 2
    center_y = 60 + (size[1] - 60 - text_height) / 2
    
    d.text((center_x, center_y), text, fill=(55, 65, 81), font=large_font, align="center")
    
    # Save
    output_path = os.path.join(os.getcwd(), filename)
    img.save(output_path)
    print(f"Generated: {output_path}")

images = [
    ("hr_employee_master.png", "HR Module\nEmployee Master List"),
    ("hr_attendance_performance.png", "HR Module\nAttendance Roster & Performance Ratings"),
    ("procurement_purchase_order.png", "Procurement Hub\nNew Purchase Order Form"),
    ("warehouse_inbound_grn.png", "Warehouse Management\nInbound Receipt (GRN)"),
    ("sales_pos_terminal.png", "Sales POS Terminal\nHome Delivery Option Selected"),
    ("logistics_outbound_dispatch.png", "Logistics Dashboard\nOutbound Dispatch & Tracking"),
    ("admin_system_access.png", "Admin Settings\nUser & Role Management")
]

if __name__ == "__main__":
    for filename, text in images:
        create_placeholder(filename, text)
