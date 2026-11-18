"""Build assets/wallpaper.jpg from the reference lock screen screenshot.

The top of the photo is soft bokeh, so the status bar, date line, clock and
widgets are filled by inpainting a downscaled copy (smooth fill), then adding
back film grain so the patch doesn't look plastic. The bottom buttons and home
bar sit on busy texture; they're inpainted at full size and end up hidden under
the app's own buttons anyway.

Usage: python scripts/make_wallpaper.py reference/lockscreen.png assets/wallpaper.jpg
"""
import sys

import cv2
import numpy as np

# Overlay boxes in screenshot pixels (1284x2778, 3x scale): x0, y0, x1, y1
SOFT_BOXES = [
    (120, 40, 345, 115),    # carrier name
    (905, 40, 1200, 135),   # signal, wifi, battery
    (90, 305, 1200, 405),   # date + next event
    (345, 405, 945, 720),   # clock
    (105, 735, 400, 940),   # weather widget
    (690, 735, 1180, 935),  # verse widget
]
BUTTONS = [(249, 2518), (1034, 2518)]  # flashlight, camera centers
BUTTON_RADIUS = 100
HOME_BAR = (395, 2722, 890, 2775)


def box_mask(shape, boxes):
    mask = np.zeros(shape[:2], np.uint8)
    for x0, y0, x1, y1 in boxes:
        mask[y0:y1, x0:x1] = 255
    return mask


def fill_soft(img, mask, scale=6):
    """Inpaint at low resolution, upsample, and blend in with a feathered edge."""
    h, w = mask.shape
    small = cv2.resize(img, (w // scale, h // scale), interpolation=cv2.INTER_AREA)
    small_mask = cv2.resize(mask, (w // scale, h // scale), interpolation=cv2.INTER_NEAREST)
    small_mask = cv2.dilate(small_mask, np.ones((3, 3), np.uint8))
    filled = cv2.inpaint(small, small_mask, 12, cv2.INPAINT_NS)
    filled = cv2.GaussianBlur(filled, (0, 0), 4)
    filled = cv2.resize(filled, (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32)

    # Match the photo's grain so the fill blends in.
    grain_std = (img.astype(np.float32) - cv2.GaussianBlur(img, (0, 0), 3))[mask == 0].std()
    rng = np.random.default_rng(7)
    filled += rng.normal(0, grain_std * 0.8, filled.shape[:2])[..., None]

    alpha = cv2.GaussianBlur(cv2.dilate(mask, np.ones((25, 25), np.uint8)), (0, 0), 10)
    alpha = (alpha.astype(np.float32) / 255)[..., None]
    out = img.astype(np.float32) * (1 - alpha) + filled * alpha
    return np.clip(out, 0, 255).astype(np.uint8)


def main(src, dst):
    img = cv2.imread(src)
    img = fill_soft(img, box_mask(img.shape, SOFT_BOXES))

    hard = box_mask(img.shape, [HOME_BAR])
    for center in BUTTONS:
        cv2.circle(hard, center, BUTTON_RADIUS, 255, -1)
    img = cv2.inpaint(img, hard, 9, cv2.INPAINT_TELEA)

    cv2.imwrite(dst, img, [cv2.IMWRITE_JPEG_QUALITY, 88])


if __name__ == "__main__":
    main(*sys.argv[1:3])
