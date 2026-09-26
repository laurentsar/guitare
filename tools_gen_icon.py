#!/usr/bin/env python3
"""Icônes PNG de la PWA, écrites sans Pillow.

Cette machine n'a pas Pillow et ne peut pas l'installer : le PNG est donc
produit à la main (en-tête, IDAT zlib, CRC). C'est une quinzaine de lignes et
ça évite de committer un binaire qu'on ne saurait pas régénérer.

L'APK, elle, a ses icônes générées dans le CI par ci/set_icons.py (Pillow y est
disponible) — le dessin est le même, décrit deux fois faute d'un langage commun.
"""
import struct, zlib, math, os


def png(chemin, taille, pixels):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF)

    brut = b''.join(b'\x00' + bytes(ligne) for ligne in pixels)
    with open(chemin, 'wb') as fh:
        fh.write(b'\x89PNG\r\n\x1a\n')
        fh.write(chunk(b'IHDR', struct.pack('>IIBBBBB', taille, taille, 8, 6, 0, 0, 0)))
        fh.write(chunk(b'IDAT', zlib.compress(brut, 9)))
        fh.write(chunk(b'IEND', b''))


FOND = (14, 18, 27, 255)
BOIS = (214, 168, 106, 255)
ROSACE_INT = (14, 18, 27, 255)
CORDE = (236, 240, 248, 255)


def dessine(taille):
    n = taille
    lignes = []
    cx, cy = n * 0.5, n * 0.52
    for y in range(n):
        ligne = bytearray()
        for x in range(n):
            c = FOND
            # deux ellipses = la caisse
            def dans(ex, ey, rx, ry):
                return ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 <= 1
            if dans(n * 0.5, n * 0.38, n * 0.28, n * 0.28) or dans(n * 0.5, n * 0.65, n * 0.40, n * 0.31):
                c = BOIS
            # manche
            if abs(x - cx) < n * 0.085 and y < n * 0.32:
                c = (176, 120, 66, 255)
            # rosace
            d = math.hypot(x - cx, y - cy)
            if d < n * 0.13:
                c = ROSACE_INT
            if n * 0.115 < d < n * 0.135:
                c = (176, 120, 66, 255)
            # six cordes
            for i in range(6):
                sx = cx + (i - 2.5) * n * 0.030
                if abs(x - sx) < max(0.5, n * 0.004) and n * 0.04 < y < n * 0.88:
                    c = CORDE
            ligne += bytes(c)
        lignes.append(ligne)
    return lignes


os.makedirs('www/img', exist_ok=True)
for t in (192, 512):
    png('www/img/icone-%d.png' % t, t, dessine(t))
    print('www/img/icone-%d.png' % t)
