import os
from PIL import Image

src_dir = r"C:\Users\Lenovo\.gemini\antigravity\brain\0b4a90fe-e48e-45aa-b229-563c65d25b09\.user_uploaded"
dest_dir = r"C:\Users\Lenovo\.gemini\antigravity\scratch\exousia\public\images"

os.makedirs(dest_dir, exist_ok=True)

# 1. Clue'd Up (media__1789918647722.png) - 1024x390 -> 4:3 landscape
# Subject: Central question mark & investigation board
cluedup_path = os.path.join(src_dir, "media__1789918647722.png")
with Image.open(cluedup_path) as img:
    w, h = img.size # 1024, 390
    target_w = int(h * (4 / 3)) # 520
    left = (w - target_w) // 2 + 30 # slightly shift to center question mark & site 17 notes
    right = left + target_w
    top = 0
    bottom = h
    crop_cluedup = img.crop((left, top, right, bottom))
    crop_cluedup.convert("RGB").save(os.path.join(dest_dir, "event-cluedup-4x3.jpg"), "JPEG", quality=95)
    print(f"Clue'd Up cropped to {crop_cluedup.size} (4:3 ratio = {crop_cluedup.width / crop_cluedup.height:.4f})")

# 2. The Hawkins Trap (media__1789918652673.jpg) - 1024x682 -> 4:3 landscape
# Subject: Classroom with blue projector screen & desk rows
hawkins_path = os.path.join(src_dir, "media__1789918652673.jpg")
with Image.open(hawkins_path) as img:
    w, h = img.size # 1024, 682
    target_w = int(h * (4 / 3)) # 909
    left = (w - target_w) // 2
    right = left + target_w
    top = 0
    bottom = h
    crop_hawkins = img.crop((left, top, right, bottom))
    crop_hawkins.convert("RGB").save(os.path.join(dest_dir, "event-hawkins-4x3.jpg"), "JPEG", quality=95)
    print(f"Hawkins Trap cropped to {crop_hawkins.size} (4:3 ratio = {crop_hawkins.width / crop_hawkins.height:.4f})")

# 3. Dark Protocol (media__1789918658746.jpg) - 1024x768 (Already 4:3)
# Keep composition 100% as-is
darkprotocol_path = os.path.join(src_dir, "media__1789918658746.jpg")
with Image.open(darkprotocol_path) as img:
    img.convert("RGB").save(os.path.join(dest_dir, "event-darkprotocol-4x3.jpg"), "JPEG", quality=95)
    print(f"Dark Protocol kept as-is at {img.size} (4:3 ratio = {img.width / img.height:.4f})")

# 4. Nexora (media__1789918664496.jpg) - 562x680 (Portrait) -> 4:3 landscape
# Subject: Glowing red CRT terminals & keyboards
nexora_path = os.path.join(src_dir, "media__1789918664496.jpg")
with Image.open(nexora_path) as img:
    w, h = img.size # 562, 680
    target_h = int(w * (3 / 4)) # 421
    left = 0
    right = w
    # Center on the glowing CRT monitors in the middle section
    top = int((h - target_h) * 0.42)
    bottom = top + target_h
    crop_nexora = img.crop((left, top, right, bottom))
    crop_nexora.convert("RGB").save(os.path.join(dest_dir, "event-nexora-4x3.jpg"), "JPEG", quality=95)
    print(f"Nexora cropped to {crop_nexora.size} (4:3 ratio = {crop_nexora.width / crop_nexora.height:.4f})")
