#!/usr/bin/env python3
"""Icônes Android + bannière TV, dessinées ici plutôt que stockées en PNG.

La machine de développement n'a pas Pillow (ARM64, pas de droits d'install) :
garder un PNG source en dépôt obligerait à le fabriquer à la main à chaque
retouche. Le CI, lui, a Pillow — le dessin vit donc dans ce script, et la
source de vérité reste du code lisible.

Motif : rosace et cordes d'une guitare classique, en clair sur fond sombre.
"""
from PIL import Image, ImageDraw

BG = (14, 18, 27)
BOIS = (214, 168, 106)
CORDE = (236, 240, 248)
ROSACE = (176, 120, 66)


def dessine(taille, marge_ratio=0.0, fond=True):
    """Rend l'icône à la taille voulue. marge_ratio réserve la zone de sécurité
    des icônes adaptatives (le système en rogne les bords et les coins)."""
    g = 4  # supersampling : les cordes font 1 px, elles crénellent sans ça
    t = taille * g
    img = Image.new("RGBA", (t, t), BG if fond else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = int(t * marge_ratio)
    z = t - 2 * m  # zone de dessin

    # Corps de guitare stylisé : deux cercles qui se recouvrent.
    haut = (m + z * 0.22, m + z * 0.10, m + z * 0.78, m + z * 0.66)
    bas = (m + z * 0.10, m + z * 0.34, m + z * 0.90, m + z * 0.96)
    d.ellipse(bas, fill=BOIS)
    d.ellipse(haut, fill=BOIS)

    # Rosace.
    cx, cy, r = m + z * 0.50, m + z * 0.52, z * 0.13
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BG)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=ROSACE, width=max(1, int(z * 0.022)))

    # Manche.
    lm = z * 0.085
    d.rectangle((cx - lm, m, cx + lm, m + z * 0.30), fill=ROSACE)

    # Six cordes, du chevalet au manche.
    for i in range(6):
        x = cx + (i - 2.5) * z * 0.030
        d.line((x, m + z * 0.04, x, m + z * 0.86), fill=CORDE, width=max(1, int(z * 0.008)))

    return img.resize((taille, taille), Image.LANCZOS)


RES = "android/app/src/main/res"
DENSITES = [
    ("mipmap-mdpi", 48),
    ("mipmap-hdpi", 72),
    ("mipmap-xhdpi", 96),
    ("mipmap-xxhdpi", 144),
    ("mipmap-xxxhdpi", 192),
]

import os

for dossier, taille in DENSITES:
    chemin = f"{RES}/{dossier}"
    os.makedirs(chemin, exist_ok=True)
    plate = dessine(taille)
    plate.convert("RGB").save(f"{chemin}/ic_launcher.png")
    plate.convert("RGB").save(f"{chemin}/ic_launcher_round.png")
    # Icône adaptative : le premier plan est rogné jusqu'à 33 %, d'où la marge.
    dessine(int(taille * 2.25), marge_ratio=0.17, fond=False).save(f"{chemin}/ic_launcher_foreground.png")

# Le fond de l'icône adaptative est une couleur unie, pas une image.
os.makedirs(f"{RES}/values", exist_ok=True)
with open(f"{RES}/values/ic_launcher_background.xml", "w") as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
             '    <color name="ic_launcher_background">#0E121B</color>\n</resources>\n')

# Bannière Android TV (320x180) : l'accueil Google TV l'affiche telle quelle.
os.makedirs(f"{RES}/drawable-xhdpi", exist_ok=True)
banniere = Image.new("RGBA", (320, 180), BG)
logo = dessine(150, fond=False)
banniere.paste(logo, (20, 15), logo)
d = ImageDraw.Draw(banniere)
d.text((190, 80), "Ma Guitare", fill=CORDE)
banniere.convert("RGB").save(f"{RES}/drawable-xhdpi/tv_banner.png")

print("icônes et bannière TV générées")
