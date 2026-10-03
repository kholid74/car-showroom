#!/usr/bin/env python3
"""Uji kandidat warna terhadap ambang WCAG pada beberapa latar.
Pakai: python3 scripts/contrast.py #RRGGBB [latar1 latar2 ...]
"""
import sys, math

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def rel_lum(h):
    h = h.lstrip("#")
    r, g, b = (srgb_to_lin(int(h[i:i+2], 16)) for i in (0, 2, 4))
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast(a, b):
    la, lb = rel_lum(a), rel_lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def oklch(h):
    h = h.lstrip("#")
    r, g, b = (srgb_to_lin(int(h[i:i+2], 16)) for i in (0, 2, 4))
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = l**(1/3), m**(1/3), s**(1/3)
    L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_
    a = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_
    bb = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    return f"oklch({L*100:.1f}% {math.hypot(a,bb):.3f} {math.degrees(math.atan2(bb,a))%360:.1f})"

if __name__ == "__main__":
    args = sys.argv[1:]
    fg = args[0]
    bgs = args[1:] or ["#F7F8FA", "#FFFFFF", "#EFF2F5", "#E7EBEF"]
    print(f"{fg}  {oklch(fg)}")
    for bg in bgs:
        c = contrast(fg, bg)
        print(f"   vs {bg}: {c:5.2f}:1  {'LULUS >=4.5' if c >= 4.5 else 'gagal'}")
