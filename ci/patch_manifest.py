#!/usr/bin/env python3
"""Manifeste Android : micro, écran allumé, et visibilité sur Google TV.

android/ est régénéré à chaque build (`cap add android`), donc ce script
tourne à chaque fois. Idempotent.
"""
import re

MF = "android/app/src/main/AndroidManifest.xml"
s = open(MF).read()

# --- Micro : l'accordeur écoute la corde jouée -------------------------------
# getUserMedia dans la WebView ne suffit pas : sans la permission déclarée,
# Capacitor ne peut même pas la demander à l'exécution, et la promesse est
# rejetée sans message lisible. MODIFY_AUDIO_SETTINGS évite que le flux passe
# en mode communication (filtrage agressif, qui mange les harmoniques dont la
# détection de hauteur a besoin).
PERMS = [
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS",
]
for p in PERMS:
    if p not in s:
        s = s.replace("<application", '<uses-permission android:name="%s" />\n\n    <application' % p, 1)
        print("permission ajoutée :", p)

# --- Micro absent sur certains téléviseurs -----------------------------------
# Déclarer le micro en required="true" (ce qu'Android déduit de la permission)
# retirerait l'app du Play Store pour les TV sans micro, et surtout ferait
# échouer l'installation sur le Player POP. L'accordeur se désactive tout seul
# quand getUserMedia échoue.
if 'android.hardware.microphone' not in s:
    s = s.replace("<application",
                  '<uses-feature android:name="android.hardware.microphone" android:required="false" />\n\n    <application', 1)
    print("uses-feature microphone (optionnel) ajouté")

# --- Écran qui s'éteint pendant qu'on joue -----------------------------------
# La permission seule n'allume rien : c'est ci/patch_keepawake.py qui pose
# FLAG_KEEP_SCREEN_ON sur la fenêtre (la WebView n'a pas toujours la Screen
# Wake Lock API). Gardée pour les versions d'Android qui l'exigent encore.
if "android.permission.WAKE_LOCK" not in s:
    s = s.replace("<application", '<uses-permission android:name="android.permission.WAKE_LOCK" />\n\n    <application', 1)
    print("permission WAKE_LOCK ajoutée")

# --- Téléviseurs Android ------------------------------------------------------
# leanback/touchscreen non requis : la même APK s'installe sur téléphone et sur
# TV. Sans ces deux lignes, l'installation sur un boîtier sans écran tactile
# est refusée.
if "android.software.leanback" not in s:
    s = s.replace("<application",
                  '<uses-feature android:name="android.software.leanback" android:required="false" />\n'
                  '    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n\n    <application', 1)
    print("uses-feature leanback/touchscreen ajoutés")

# L'accueil Google TV n'affiche QUE les activités qui déclarent cette
# catégorie : sans elle, l'app est installée mais introuvable à la
# télécommande (piège déjà vécu sur Lecteur IPTV).
if "LEANBACK_LAUNCHER" not in s:
    s2 = re.sub(r'(<category android:name="android\.intent\.category\.LAUNCHER"\s*/>)',
                r'\1\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />',
                s, count=1)
    if s2 != s:
        s = s2
        print("LEANBACK_LAUNCHER ajouté")
    else:
        print("ATTENTION : category LAUNCHER introuvable")

# L'entrée d'accueil TV s'affiche vide sans bannière (set_icons.py la génère).
if "android:banner" not in s:
    s = re.sub(r"(<application\b)", r'\1\n        android:banner="@drawable/tv_banner"', s, count=1)
    print("bannière TV déclarée")

# Le clavier virtuel masquait le champ en cours de saisie sur téléphone.
if "adjustResize" not in s:
    s = re.sub(r"(<activity\b)", r'\1\n            android:windowSoftInputMode="adjustResize"', s, count=1)
    print("adjustResize posé sur l'activité")

# --- Casque Meta Quest -------------------------------------------------------
# Sur Horizon OS, une app Android s'ouvre en fenêtre flottante dans la pièce.
# Sans taille par défaut, elle prend un format téléphone étroit : le pupitre
# (mode casque) veut une fenêtre large, où la ligne de tablature se lit à
# distance. Balise <layout> standard d'Android (fenêtres libres), ignorée par
# un téléphone ou une télé.
if "<layout" not in s:
    s2 = re.sub(r'(<activity\b[^>]*>)',
                r'\1\n            <layout android:defaultWidth="1280dp" android:defaultHeight="800dp" android:gravity="center" />',
                s, count=1)
    if s2 != s:
        s = s2
        print("taille de fenêtre par défaut (casque) posée")

open(MF, "w").write(s)
print("manifeste à jour")
