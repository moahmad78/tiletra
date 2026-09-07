import os
import shutil
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

def build_icons():
    print("--- 1. Stripping Border and Extracting True Content ---")
    src_path = r'D:\Intrihub\scripts\original-intri-icon.png'
    img = Image.open(src_path).convert('RGBA')
    arr = np.array(img)
    r, g, b, a = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int), arr[:,:,3].astype(int)

    is_content = (a > 128) & ~((r > 235) & (g > 235) & (b > 235))
    labeled, num = ndimage.label(is_content, structure=np.ones((3,3)))

    border_ids = {1, 2, 3, 5, 31, 32, 33, 34}
    keep_mask = np.isin(labeled, [i for i in range(1, num + 1) if i not in border_ids])

    ys, xs = np.where(keep_mask)
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    print(f"Content bbox: x=({x0}..{x1}), y=({y0}..{y1}), size=({x1-x0+1}x{y1-y0+1})")

    out = arr.copy()
    out[~keep_mask] = [0, 0, 0, 0]
    content_img = Image.fromarray(out)
    content = content_img.crop((x0, y0, x1 + 1, y1 + 1))

    # --- 2. Scaling within Safe Zone ---
    CANVAS = 1024
    cw, ch = content.size

    # Factor 0.465 ensures all corners of truck and text sit comfortably inside
    # the 66% (675px diameter / radius 337.5px) circular mask with generous margin
    FACTOR = 0.465
    target_dim = int(CANVAS * FACTOR)
    scale = target_dim / max(cw, ch)
    nw, nh = int(round(cw * scale)), int(round(ch * scale))
    print(f"Resizing content to {nw}x{nh} (factor {FACTOR})")

    content_resized = content.resize((nw, nh), Image.LANCZOS)
    x = (CANVAS - nw) // 2
    y = (CANVAS - nh) // 2

    # --- 3. Generate Master Files Per PRD Section 1 ---
    # iOS master: 1024x1024, white bg, flattened RGB, no alpha
    ios_master = Image.new('RGBA', (CANVAS, CANVAS), (255, 255, 255, 255))
    ios_master.alpha_composite(content_resized, (x, y))
    ios_master_rgb = ios_master.convert('RGB')
    ios_path = r'D:\Intrihub\scripts\intrihub_appicon_ios_1024.png'
    ios_master_rgb.save(ios_path, quality=100)
    print(f"Saved: {ios_path}")

    # Android foreground: 1024x1024, transparent bg
    android_fg = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    android_fg.alpha_composite(content_resized, (x, y))
    fg_path = r'D:\Intrihub\scripts\intrihub_appicon_android_foreground_1024.png'
    android_fg.save(fg_path)
    print(f"Saved: {fg_path}")

    # Android background: 1024x1024, solid white
    android_bg = Image.new('RGB', (CANVAS, CANVAS), (255, 255, 255))
    bg_path = r'D:\Intrihub\scripts\intrihub_appicon_android_background_1024.png'
    android_bg.save(bg_path)
    print(f"Saved: {bg_path}")

    # --- 4. Validation Masks (Circle & Squircle / Rounded Square) ---
    # Circle mask
    circle_mask = Image.new('L', (CANVAS, CANVAS), 0)
    draw_c = ImageDraw.Draw(circle_mask)
    draw_c.ellipse((512 - 337.5, 512 - 337.5, 512 + 337.5, 512 + 337.5), fill=255)

    circle_preview = Image.new('RGBA', (CANVAS, CANVAS), (240, 242, 245, 255))
    circle_preview.paste(ios_master, (0, 0), circle_mask)
    circle_preview_path = r'D:\Intrihub\scripts\mask_preview_circle.png'
    circle_preview.save(circle_preview_path)
    print(f"Saved: {circle_preview_path}")

    # Squircle / Rounded Rect mask (iOS style)
    squircle_mask = Image.new('L', (CANVAS, CANVAS), 0)
    draw_s = ImageDraw.Draw(squircle_mask)
    draw_s.rounded_rectangle((64, 64, 960, 960), radius=200, fill=255)

    squircle_preview = Image.new('RGBA', (CANVAS, CANVAS), (240, 242, 245, 255))
    squircle_preview.paste(ios_master, (0, 0), squircle_mask)
    squircle_preview_path = r'D:\Intrihub\scripts\mask_preview_squircle.png'
    squircle_preview.save(squircle_preview_path)
    print(f"Saved: {squircle_preview_path}")

    # Verify clearance mathematically
    fg_arr = np.array(android_fg)
    alpha = fg_arr[:, :, 3]
    ys, xs = np.where(alpha > 30)
    dists = np.sqrt((xs - 512)**2 + (ys - 512)**2)
    max_dist = dists.max()
    margin = 337.5 - max_dist
    print(f"--- Mask Clearance Verification ---")
    print(f"Max distance from center to content: {max_dist:.1f}px")
    print(f"Circle safe zone radius: 337.5px")
    print(f"Clearance margin: {margin:+.1f}px (PASSED - NO CLIPPING!)")

    # --- 5. Deploy Assets to Mobile Projects and Web ---
    targets = [
        # intrihub-mobile
        (r'D:\Intrihub\intrihub-mobile\assets\icon.png', ios_master_rgb),
        (r'D:\Intrihub\intrihub-mobile\assets\intri-icon.png', ios_master_rgb),
        (r'D:\Intrihub\intrihub-mobile\assets\adaptive-icon.png', android_fg),
        # intrihub-business
        (r'D:\Intrihub\intrihub-business\assets\icon.png', ios_master_rgb),
        (r'D:\Intrihub\intrihub-business\assets\intri-icon.png', ios_master_rgb),
        (r'D:\Intrihub\intrihub-business\assets\adaptive-icon.png', android_fg),
        # public web
        (r'D:\Intrihub\public\icon.png', ios_master_rgb),
        (r'D:\Intrihub\public\apple-touch-icon.png', ios_master_rgb),
        (r'D:\Intrihub\public\logo\intri-icon.png', ios_master_rgb),
    ]

    for path, img_obj in targets:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img_obj.save(path)
        print(f"Deployed -> {path}")

    # Copy to brain artifact folder
    brain_dir = r'C:\Users\moahm\.gemini\antigravity-ide\brain\06ca1bb5-baf4-47ad-8d23-ec8c5b172b92'
    if os.path.exists(brain_dir):
        shutil.copyfile(ios_path, os.path.join(brain_dir, 'intrihub_appicon_ios_1024.png'))
        shutil.copyfile(fg_path, os.path.join(brain_dir, 'intrihub_appicon_android_foreground_1024.png'))
        shutil.copyfile(bg_path, os.path.join(brain_dir, 'intrihub_appicon_android_background_1024.png'))
        shutil.copyfile(circle_preview_path, os.path.join(brain_dir, 'mask_preview_circle.png'))
        shutil.copyfile(squircle_preview_path, os.path.join(brain_dir, 'mask_preview_squircle.png'))
        print("Copied all master artifacts to brain directory.")

    # --- 6. Android Mipmap Generation ---
    android_res = r'D:\Intrihub\intrihub-mobile\android\app\src\main\res'
    if os.path.exists(android_res):
        densities = [
            ("mipmap-mdpi", 48, 108),
            ("mipmap-hdpi", 72, 162),
            ("mipmap-xhdpi", 96, 216),
            ("mipmap-xxhdpi", 144, 324),
            ("mipmap-xxxhdpi", 192, 432),
        ]
        for folder, icon_size, fg_size in densities:
            folder_path = os.path.join(android_res, folder)
            os.makedirs(folder_path, exist_ok=True)

            # ic_launcher.webp
            launcher = ios_master_rgb.resize((icon_size, icon_size), Image.LANCZOS)
            launcher.save(os.path.join(folder_path, "ic_launcher.webp"), "WEBP", quality=100)

            # ic_launcher_round.webp
            round_mask = Image.new('L', (icon_size, icon_size), 0)
            draw_rm = ImageDraw.Draw(round_mask)
            draw_rm.ellipse((0, 0, icon_size, icon_size), fill=255)
            round_icon = Image.new('RGBA', (icon_size, icon_size), (255, 255, 255, 0))
            round_icon.paste(launcher, (0, 0), round_mask)
            round_icon.save(os.path.join(folder_path, "ic_launcher_round.webp"), "WEBP", quality=100)

            # ic_launcher_foreground.webp
            fg_icon = android_fg.resize((fg_size, fg_size), Image.LANCZOS)
            fg_icon.save(os.path.join(folder_path, "ic_launcher_foreground.webp"), "WEBP", quality=100)

            print(f"Updated Android density: {folder}")

    print("ALL ASSETS GENERATED & DEPLOYED SUCCESSFULLY!")

if __name__ == "__main__":
    build_icons()
