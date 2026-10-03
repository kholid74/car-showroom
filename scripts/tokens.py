#!/usr/bin/env python3
"""Token palette -> OKLCH + WCAG contrast. Design tokens are computed, never guessed."""
import math

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_to_oklch(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    r, g, b = srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b)
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = l**(1/3), m**(1/3), s**(1/3)
    L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_
    a = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_
    bb = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    return L, math.hypot(a, bb), math.degrees(math.atan2(bb, a)) % 360

def rel_lum(h):
    h = h.lstrip("#")
    r, g, b = (srgb_to_lin(int(h[i:i+2], 16)) for i in (0, 2, 4))
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast(a, b):
    la, lb = rel_lum(a), rel_lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

# ---- Arah A "Meja Kerja" (ERP) + serapan Arah B untuk katalog publik ----
TOKENS = [
 # nama, hex, peran
 ("canvas",        "#F7F8FA", "latar aplikasi"),
 ("panel",         "#FFFFFF", "permukaan tabel/kartu"),
 ("sunken",        "#EFF2F5", "header tabel, baris terpilih, input"),
 ("sunken-2",      "#E7EBEF", "hover baris"),
 ("hairline",      "#E2E6EB", "garis pemisah 1px"),
 ("hairline-strong","#CFD6DD", "garis tegas / batas kolom"),
 ("ink",           "#15181D", "teks utama"),
 ("ink-2",         "#4C545E", "teks sekunder"),
 ("ink-3",         "#67707B", "teks tersier (AA 4.5:1)"),
 ("accent",        "#0E4F7C", "aksi primer, nav aktif, focus"),
 ("accent-hover",  "#0A3D62", "hover aksi primer"),
 ("accent-soft",   "#E8F0F6", "latar chip aksen / baris aktif"),
 ("money-pos",     "#0B5F3F", "margin/profit positif"),
 ("attention",     "#9A5B06", "perhatian, follow-up jatuh tempo"),
 ("danger",        "#B3261E", "repair required, selisih, hapus"),
 ("st-baru",       "#5B6672", "status BARU MASUK"),
 ("st-inspeksi",   "#0F6E8C", "status INSPEKSI"),
 ("st-recon",      "#9A5B06", "status RECONDITIONING"),
 ("st-ready",      "#1E7A46", "status READY"),
 ("st-booked",     "#7A3E9D", "status BOOKED"),
 ("st-sold",       "#3A4550", "status SOLD"),
 # katalog publik (serapan Arah B)
 ("pub-canvas",    "#FFFFFF", "latar katalog publik"),
 ("pub-panel",     "#F6F4F1", "permukaan hangat katalog"),
 ("pub-chrome",    "#15171C", "rail/chrome gelap"),
 ("pub-accent",    "#C7362C", "CTA katalog publik"),
]

print(f"{'token':16s} {'hex':9s} {'oklch':34s} {'vs canvas':>10s}  {'putih di atasnya':>16s}  peran")
for name, hx, role in TOKENS:
    L, C, H = hex_to_oklch(hx)
    vs = contrast(hx, "#F7F8FA")
    w = contrast("#FFFFFF", hx)
    print(f"{name:16s} {hx:9s} oklch({L*100:.1f}% {C:.3f} {H:.1f}){'':<2s} {vs:9.2f}:1 {w:15.2f}:1  {role}")

FILLED = ["accent", "st-baru", "st-inspeksi", "st-recon", "st-ready", "st-booked", "st-sold",
          "money-pos", "attention", "danger", "pub-accent", "pub-chrome"]
PAL = dict((n, h) for n, h, _ in TOKENS)
print("\n--- ambang: pil terisi wajib >= 4.5:1 untuk teks putih ---")
for n in FILLED:
    c = contrast("#FFFFFF", PAL[n])
    print(f"  {n:12s} {c:5.2f}:1  {'LULUS' if c >= 4.5 else 'GAGAL'}")

print("\n--- teks di atas kanvas wajib >= 4.5:1 ---")
for n in ["ink", "ink-2", "ink-3", "accent", "money-pos", "attention", "danger"]:
    c = contrast(PAL[n], PAL["canvas"])
    print(f"  {n:12s} {c:5.2f}:1  {'LULUS' if c >= 4.5 else 'GAGAL'}")

print("\n--- teks di atas panel putih maupun sunken ---")
for n in ["ink", "ink-2", "ink-3", "accent", "st-ready", "attention"]:
    print(f"  {n:12s} panel {contrast(PAL[n], '#FFFFFF'):5.2f}:1   sunken {contrast(PAL[n], PAL['sunken']):5.2f}:1")
