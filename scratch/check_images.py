import os
from PIL import Image

dir_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\0b4a90fe-e48e-45aa-b229-563c65d25b09\.user_uploaded"

files = [
    "media__1789918647722.png",
    "media__1789918652673.jpg",
    "media__1789918658746.jpg",
    "media__1789918664496.jpg"
]

names = ["Clue'd Up", "The Hawkins Trap", "Dark Protocol", "Nexora"]

for file_name, event in zip(files, names):
    full_path = os.path.join(dir_path, file_name)
    if os.path.exists(full_path):
        with Image.open(full_path) as img:
            w, h = img.size
            ratio = w / h
            target_4_3_w = int(h * (4 / 3))
            print(f"[{event}] {file_name}: {w}x{h} (ratio: {ratio:.4f})")
    else:
        print(f"[{event}] {file_name}: NOT FOUND")
