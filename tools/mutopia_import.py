#!/usr/bin/env python3
"""Importe des pièces du Mutopia Project (partitions libres) dans l'app.

    python3 tools/mutopia_import.py <dossier des .mid/.ly> > www/repertoire.js

Mutopia publie pour chaque pièce la source LilyPond et un fichier MIDI. Le
MIDI donne les hauteurs et les durées exactes ; ce script décide OÙ jouer
chaque note sur le manche — ce que ni le MIDI ni la plupart des partitions ne
disent — puis écrit le résultat dans le format des morceaux de l'app.

Licences : on ne garde que le domaine public et CC-BY (paternité). Le
« ShareAlike » imposerait sa licence à l'app entière. La mention exigée par
CC-BY (titre, copiste, source, licence) est reprise dans chaque morceau et
affichée dans l'app.

Placement sur le manche : programmation dynamique sur les attaques
successives. Un « état » est la position de toutes les notes qui sonnent à un
instant (celles qui attaquent ET celles qui sont encore tenues, qui gardent
leur corde). Coût : écart de la main (4 cases au plus), hauteur sur le manche
(les positions basses et les cordes à vide sont celles d'un élève), et
déplacement de la main d'une attaque à la suivante.
"""
import itertools
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import midi  # noqa: E402

CORDES = {1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40}
CASE_MAX = 12
GRILLE = 12            # durées arrondies au 1/12 de noire (doubles croches + triolets)

# id, fichier, titre, compositeur, œuvre, niveau, description.
PIECES = [
    ('menuet-sol', 'anna-magdalena-04-guitar-tab', 'Menuet en Sol', 'Attribué à J. S. Bach (C. Petzold)', 'BWV Anh. 114 · Petit livre d’Anna Magdalena', 3,
     'Le menuet que tout le monde connaît. Deux voix : la mélodie en haut, une basse simple en dessous — la première pièce où les deux mains font vraiment de la musique ensemble.'),
    ('greensleeves', 'Greensleaves', 'Greensleeves', 'Traditionnel anglais', 'XVIe siècle', 3,
     'La mélodie Renaissance la plus célèbre, avec son accompagnement. À trois temps : pense la mesure en « UN-deux-trois ».'),
    ('carulli-valse-1', 'guitar-skole-no-01', 'Valse', 'F. Carulli', 'op. 241 n° 1', 3,
     'Basse au pouce, mélodie aux doigts : le geste de base de toute la guitare classique, sur une valse de deux lignes.'),
    ('carulli-valse-4', 'guitar-skole-no-06', 'Valse', 'F. Carulli', 'op. 241 n° 4', 3,
     'Même principe que la valse n° 1, avec des accords de trois notes à plaquer proprement.'),
    ('carulli-andantino', 'guitar-skole-no-08', 'Andantino', 'F. Carulli', 'op. 241 n° 5', 3,
     'Un chant lent au-dessus d’une basse régulière. Tout l’enjeu est de faire chanter la voix du haut plus fort que le reste.'),
    ('horetzky-clair', 'horetzky21', 'Au clair de la lune (harmonisé)', 'F. Horetzky', 'Airs nationaux n° 21', 3,
     'La mélodie de tes débuts, cette fois harmonisée par un guitariste du XIXe siècle. Compare avec la version à une voix du niveau 1.'),
    ('horetzky-bergere', 'horetzky44', 'Il pleut, il pleut, bergère', 'F. Horetzky', 'Airs nationaux n° 44', 3,
     'Mesure à 6/8 : deux grands temps de trois croches. Compte « UN-deux-trois DEUX-deux-trois ».'),
    ('horetzky-noel', 'horetzky6', 'Un Noël', 'F. Horetzky', 'Airs nationaux n° 6', 3,
     'Un noël ancien arrangé simplement : mélodie claire, basses espacées.'),
    ('giuliani-50-1', 'giuliani-op50n01', 'Petite pièce n° 1', 'M. Giuliani', 'op. 50 n° 1 (« Le Papillon »)', 3,
     'Le recueil que Giuliani a écrit pour les débutants. Mélodie en tierces, main gauche en première position.'),
    ('sor-andante', 'guitar-skole-no-02', 'Andante', 'F. Sor', 'op. 35 n° 1', 4,
     'Sor, le grand pédagogue de la guitare. Des accords liés à tenir : lève les doigts le plus tard possible.'),
    ('sor-allegretto', 'guitar-skole-no-03', 'Allegretto', 'F. Sor', 'op. 44 n° 2', 4,
     'Deux voix bien séparées, dans le style d’un duo. Joue d’abord chaque voix seule.'),
    ('sor-landler', 'guitar-skole-no-18', 'Ländler', 'F. Sor', 'danse autrichienne', 4,
     'L’ancêtre de la valse, à 3/8. Léger, dansant : ne t’attarde pas sur les temps faibles.'),
    ('coste-menuet', 'guitar-skole-no-10', 'Menuet du XVIIe siècle', 'N. Coste', 'arrangement', 4,
     'Un menuet ancien arrangé par Coste : accords de quatre notes, à plaquer d’un seul geste.'),
    ('mertz-andante', 'guitar-skole-no-04', 'Andante', 'J. K. Mertz', 'méthode', 4,
     'Mertz, romantique viennois : un chant expressif sur des basses tenues.'),
    ('mertz-andantino', 'guitar-skole-no-05', 'Andantino', 'J. K. Mertz', 'méthode', 4,
     'Plus long et plus chantant que l’Andante. Travaille-le phrase par phrase avec la boucle.'),
    ('giuliani-50-2', 'giuliani-op50n02', 'Petite pièce n° 2', 'M. Giuliani', 'op. 50 n° 2', 4,
     'Plus vif, avec des accords jusqu’à cinq notes. Anacrouse : la pièce commence avant le premier temps.'),
    ('giuliani-50-3', 'giuliani-op50n03', 'Petite pièce n° 3', 'M. Giuliani', 'op. 50 n° 3', 4,
     'Une marche légère à 2/4. Les notes répétées doivent rester égales.'),
    ('giuliani-50-4', 'giuliani-op50n04', 'Petite pièce n° 4', 'M. Giuliani', 'op. 50 n° 4', 4,
     'À 6/8, balancé comme une barcarolle.'),
    # --- Ajouts v1.14 : pièces faciles du recueil Guitar-Skole et de Giuliani.
    # Niveau d'après le placement calculé : case 5 au plus et tempo calme →
    # niveau 3 ; jusqu'à la case 8 ou plus vif → 4 ; au-delà → 5.
    ('carulli-valse-11', 'guitar-skole-no-11', 'Tempo di valse', 'F. Carulli', 'Guitar-Skole n° 11', 3,
     'Une valse à 3/8 qui ne quitte pas les trois premières cases. Un temps par mesure : pense « UN-et-et ».'),
    ('mertz-marche', 'guitar-skole-no-21', 'Tempo di marcia', 'J. K. Mertz', 'Guitar-Skole n° 21', 3,
     'Une petite marche, rien au-delà de la case 4. Garde un pas régulier, comme en marchant.'),
    ('sor-35-14', 'Sor_Etude_Opus35_14', 'Étude', 'F. Sor', 'op. 35 n° 14', 3,
     'Une étude lente de Sor en première position : une mélodie et sa basse, des accords de trois notes au plus.'),
    ('mertz-andante-3', 'guitar-skole-no-07', 'Andante', 'J. K. Mertz', 'Études de style n° 3 · Guitar-Skole n° 7', 3,
     'Lent, en première position. Des accords jusqu’à quatre notes : pose toute la main avant de pincer.'),
    ('giuliani-50-21', 'giuliani-op50n21', 'Petite pièce n° 21', 'M. Giuliani', 'op. 50 n° 21', 3,
     'À trois temps, sans dépasser la case 5. Les accords tombent sur le premier temps : appuie-le un peu.'),
    ('carulli-andante-grazioso', 'guitar-skole-no-13', 'Andante grazioso', 'F. Carulli', 'Guitar-Skole n° 13', 3,
     'À 2/4, gracieux et sans hâte. Tout se joue dans les cinq premières cases.'),
    ('carulli-valse-17', 'guitar-skole-no-17', 'Tempo di valse', 'F. Carulli', 'Guitar-Skole n° 17', 3,
     'Une deuxième valse de Carulli à 3/8, un peu plus longue que la n° 11. Toujours en première position.'),
    ('carcassi-allegretto-22', 'guitar-skole-no-22', 'Allegretto', 'M. Carcassi', 'Guitar-Skole n° 22', 3,
     'À 3/8, léger. Rien au-delà de la case 5 : un bon pont vers les études de Carcassi.'),
    ('carulli-poco-allegro', 'guitar-skole-no-20', 'Poco allegro', 'F. Carulli', 'Guitar-Skole n° 20', 4,
     'Trois premières cases seulement, mais plus de notes et un tempo plus vif : à travailler au ralenti d’abord.'),
    ('giuliani-50-20', 'giuliani-op50n20', 'Petite pièce n° 20', 'M. Giuliani', 'op. 50 n° 20', 4,
     'À 6/8 : deux grands temps de trois croches. Case 4 au plus.'),
    ('giuliani-50-11', 'giuliani-op50n11', 'Petite pièce n° 11', 'M. Giuliani', 'op. 50 n° 11', 4,
     'À 2/4, dans les trois premières cases, mais vif : la main droite doit rester régulière.'),
    ('giuliani-50-13', 'giuliani-op50n13', 'Petite pièce n° 13', 'M. Giuliani', 'op. 50 n° 13', 4,
     'Une seule ligne, sans accord, dans les trois premières cases — mais en notes rapides. Alterne i-m sans exception.'),
    ('giuliani-50-15', 'giuliani-op50n15', 'Petite pièce n° 15', 'M. Giuliani', 'op. 50 n° 15', 4,
     'À 6/8, deux voix. Quelques notes montent à la case 6.'),
    ('coste-gavotte', 'guitar-skole-no-24', 'Gavotte du XVIIe siècle', 'N. Coste', 'arrangement · Guitar-Skole n° 24', 4,
     'Une gavotte ancienne arrangée par Coste, mesure à la blanche (2/2). Courte, avec quelques notes à la case 6.'),
    ('carcassi-allegretto-19', 'guitar-skole-no-19', 'Allegretto', 'M. Carcassi', 'Guitar-Skole n° 19', 4,
     'À 2/4, assez long. La main monte jusqu’à la case 7 par moments.'),
    ('mertz-andantino-14', 'guitar-skole-no-14', 'Andantino', 'J. K. Mertz', 'Guitar-Skole n° 14', 4,
     'Un chant sur des accords jusqu’à quatre notes ; quelques passages à la case 7.'),
    ('carcassi-allegretto-15', 'guitar-skole-no-15', 'Allegretto', 'M. Carcassi', 'Guitar-Skole n° 15', 4,
     'À 3/8, avec des montées jusqu’à la case 8.'),
    ('carcassi-60-7', 'carcassi-op60-07', 'Étude n° 7', 'M. Carcassi', 'op. 60 n° 7', 5,
     'Une étude en notes continues sur tout le manche (jusqu’à la case 7). Pour la régularité de la main droite.'),
    ('carcassi-60-8', 'carcassi-op60-08', 'Étude n° 8', 'M. Carcassi', 'op. 60 n° 8', 5,
     'Une seule ligne qui voyage jusqu’à la case 9 : l’étude des changements de position.'),
    ('mertz-cantabile', 'guitar-skole-no-12', 'Cantabile', 'J. K. Mertz', 'Guitar-Skole n° 12', 5,
     'Chanté, lent, mais la mélodie monte haut (case 10) : il faut déplacer la main en gardant le son lié.'),
    ('mertz-adagio', 'guitar-skole-no-09', 'Adagio', 'J. K. Mertz', 'Guitar-Skole n° 9', 5,
     'Un adagio romantique qui monte jusqu’à la case 12.'),
    ('giuliani-50-12', 'giuliani-op50n12', 'Petite pièce n° 12', 'M. Giuliani', 'op. 50 n° 12', 5,
     'À 6/8, avec des passages jusqu’à la case 12.'),
    ('brahms-valse-3', 'brahms-vals3', 'Valse n° 3', 'J. Brahms', 'op. 39 n° 3 · arrangement pour guitare', 5,
     'Une des seize valses de Brahms, arrangée pour guitare. Beaucoup de positions hautes.'),
    ('brahms-valse-9', 'brahms-vals9', 'Valse n° 9', 'J. Brahms', 'op. 39 n° 9 · arrangement pour guitare', 5,
     'Plus longue que la n° 3, et encore plus de positions hautes : un objectif pour plus tard.'),
    ('carcassi-60-1', 'carcassi-op60-01', 'Étude n° 1', 'M. Carcassi', 'op. 60 n° 1', 5,
     'L’étude de gammes la plus jouée au monde. Main droite en alternance i-m stricte, jamais deux fois le même doigt.'),
    ('carcassi-60-3', 'carcassi-op60-03', 'Étude n° 3', 'M. Carcassi', 'op. 60 n° 3', 5,
     'Arpèges continus : la mélodie est cachée dans la première note de chaque groupe. Fais-la ressortir.'),
    ('mertz-etude', 'mertz_etude', 'Étude en La mineur', 'J. K. Mertz', '', 5,
     'Une étude d’arpèges romantique : basse, puis accord déroulé. Idéale pour régulariser p-i-m-a.'),
    ('sanz-preludio', 'sanz-1', 'Preludio', 'G. Sanz', 'Instrucción de música sobre la guitarra española', 5,
     'Sanz, maître espagnol du XVIIe siècle, à l’époque où la guitare avait cinq chœurs. Mesure à la blanche (2/2).'),
]


def meta_ly(txt):
    time = re.search(r'\\time\s*(\d+)\s*/\s*(\d+)', txt)
    partial = re.search(r'\\partial\s*(\d+)(\.?)', txt)
    sig = (int(time.group(1)), int(time.group(2))) if time else (4, 4)
    anacrouse = 0
    if partial:
        anacrouse = 4 / int(partial.group(1)) * (1.5 if partial.group(2) else 1)
    return sig, anacrouse


def q(x):
    return round(x * GRILLE) / GRILLE


RELACHE = 2.5   # coût de lâcher une note tenue pour libérer sa corde


def options(attaques, fixes, hauteur):
    """Toutes les façons de poser les notes `attaques` (identifiants, hauteur
    dans `hauteur`) sur des cordes distinctes. Les notes tenues (`fixes`)
    gardent leur corde et leur case — sauf si une attaque a besoin de leur
    corde : on les lâche alors (elles s'arrêtent), contre une pénalité. C'est
    ce que fait un guitariste qui coupe une basse pour jouer la mélodie."""
    cand = []
    for n in attaques:
        p = hauteur[n]
        cand.append([(s, p - m) for s, m in CORDES.items() if 0 <= p - m <= CASE_MAX])
    out = []
    for combo in itertools.product(*cand):
        cordes = [s for s, _ in combo]
        if len(set(cordes)) != len(cordes):
            continue
        pos, lachees = {}, []
        for n, sf in fixes.items():
            if sf[0] in cordes:
                lachees.append(n)
            else:
                pos[n] = sf
        pos.update({n: sf for n, sf in zip(attaques, combo)})
        frettes = [f for _, f in pos.values() if f > 0]
        ecart = (max(frettes) - min(frettes)) if frettes else 0
        if ecart > 4:
            continue
        cout = ecart * 1.5 + (4 if ecart == 4 else 0) + len(lachees) * RELACHE
        cout += sum(f for _, f in pos.values()) * 0.12 + (max(frettes) * 0.35 if frettes else 0)
        nouvelles = [f for _, f in combo if f > 0]
        main = (min(nouvelles), max(nouvelles)) if nouvelles else None
        out.append((cout, pos, main, lachees))
    out.sort(key=lambda o: o[0])
    return out[:60]


def placer(evenements, hauteur):
    """evenements : [(temps, [notes attaquées], [notes tenues])] où une note
    est un identifiant unique ; renvoie {id: (corde, case)}."""
    etats_prec = [(0.0, {}, None, None, [])]   # (coût, pos {id:(c,f)}, main, parent, lâchées)
    historique = []
    for temps, attaques, tenues in evenements:
        nouveaux = []
        for cout_p, pos_p, main_p, _, _l in etats_prec:
            fixes = {n: pos_p[n] for n in tenues if n in pos_p}
            ops = options(attaques, fixes, hauteur)
            for cout, pos, main, lachees in ops[:25]:
                # La main couvre quatre cases sans bouger (un doigt par case) :
                # tant que les notes tiennent dans cette fenêtre, pas de
                # déplacement. Sinon on paie le trajet de l'index.
                if main is None:
                    depl, fenetre = 0, main_p
                elif main_p is None:
                    depl, fenetre = 0, main
                else:
                    lo, hi = min(main[0], main_p[0]), max(main[1], main_p[1])
                    if hi - lo <= 3:
                        depl, fenetre = 0, (lo, hi)
                    else:
                        depl, fenetre = abs(main[0] - main_p[0]), main
                nouveaux.append((cout_p + cout + depl * 1.2, pos, fenetre, (cout_p, pos_p), [(n, temps) for n in lachees]))
        if not nouveaux:
            raise ValueError('accord injouable à %s : %s' % (temps, attaques))
        # Faisceau : on garde les meilleurs chemins, distincts par position.
        nouveaux.sort(key=lambda e: e[0])
        vus, garde = set(), []
        for e in nouveaux:
            cle = tuple(sorted((n, sf) for n, sf in e[1].items() if n in attaques or n in tenues))
            if cle in vus:
                continue
            vus.add(cle); garde.append(e)
            if len(garde) >= 30:
                break
        historique.append(garde)
        etats_prec = garde
    # Remontée : on suit les parents depuis le meilleur état final.
    resultat, coupes = {}, {}
    e = etats_prec[0]
    for niveau in range(len(historique) - 1, -1, -1):
        resultat.update({n: sf for n, sf in e[1].items() if n not in resultat})
        for n, t in e[4]:
            coupes[n] = min(t, coupes.get(n, t))
        parent = e[3]
        if niveau == 0 or parent is None:
            break
        e = next(x for x in historique[niveau - 1] if x[1] is parent[1])
    return resultat, coupes


def convertir(dossier, fichier):
    m = midi.lire(os.path.join(dossier, fichier + '.mid'))
    sig, anacrouse = meta_ly(open(os.path.join(dossier, fichier + '.ly'), encoding='utf-8', errors='replace').read())
    div = m['division']
    # Portée + tablature dans le même fichier : deux pistes qui jouent les
    # mêmes notes, l'une à l'octave de l'autre (portée écrite sans le « 8 »).
    # On ne garde que la plus grave, qui est la hauteur réelle.
    pistes = {}
    for n in m['notes']:
        pistes.setdefault(n['piste'], set()).add((n['debut'], n['midi']))
    exclues = set()
    for a in pistes:
        for b in pistes:
            if a != b and b not in exclues:
                decale = {(t, p - 12) for t, p in pistes[a]}
                if len(decale & pistes[b]) >= 0.9 * len(pistes[a]):
                    exclues.add(a)
    notes = {}
    for n in m['notes']:
        if n['piste'] in exclues:
            continue
        cle = (q(n['debut'] / div), n['midi'])
        d = max(1 / GRILLE, q((n['fin'] - n['debut']) / div))
        if cle not in notes or notes[cle] < d:      # doublons (portée + tablature)
            notes[cle] = d
    liste = sorted((t, p, d) for (t, p), d in notes.items())
    # Partition écrite en clé de sol simple : elle sonne une octave trop haut.
    # Une pièce pour guitare seule descend toujours sous le Mi3.
    if min(p for _, p, _ in liste) >= 52:
        liste = [(t, p - 12, d) for t, p, d in liste]
    if min(p for _, p, _ in liste) < 40:
        raise ValueError('note sous le Mi grave : accordage spécial')
    noires_mesure = sig[0] * 4 / sig[1]
    decal = (noires_mesure - anacrouse) if anacrouse else 0
    liste = [(round(t + decal, 4), p, d) for t, p, d in liste]

    ids = {i: n for i, n in enumerate(liste)}
    par_temps = {}
    for i, (t, p, d) in ids.items():
        par_temps.setdefault(t, []).append(i)
    evenements = []
    for t in sorted(par_temps):
        attaques = sorted(par_temps[t], key=lambda i: -ids[i][1])
        tenues = [i for i, (t0, p, d) in ids.items() if t0 < t < t0 + d - 1e-6]
        # Même hauteur réattaquée pendant qu'elle est tenue : la tenue s'arrête.
        hauteurs = {ids[i][1] for i in attaques}
        tenues = [i for i in tenues if ids[i][1] not in hauteurs]
        evenements.append((t, attaques, tenues))
    pos, coupes = placer(evenements, {i: n[1] for i, n in ids.items()})
    durees = {}
    for i, (t, p, d) in ids.items():
        if i in coupes:                 # basse lâchée pour libérer sa corde
            d = round(coupes[i] - t, 4)
        durees[i] = d
    # Une corde ne sonne qu'une note : celle qui attaque arrête la précédente
    # (note réattaquée pendant qu'elle est tenue, ou triolets dont les durées
    # arrondies se chevauchent de quelques cent-millièmes).
    par_corde = {}
    for i in ids:
        par_corde.setdefault(pos[i][0], []).append(i)
    for liste_c in par_corde.values():
        liste_c.sort(key=lambda i: ids[i][0])
        for a, b in zip(liste_c, liste_c[1:]):
            ecart = ids[b][0] - ids[a][0]
            if ids[a][0] + durees[a] > ids[b][0] + 1e-6 and ecart > 0:
                durees[a] = round(ecart, 4)
    sortie = []
    for i, (t, p, d) in ids.items():
        c, f = pos[i]
        assert CORDES[c] + f == p
        sortie += [t, c, f, durees[i], p]
    tempo = round(60e6 / m['tempos'][0][1]) if m['tempos'] else 80
    return sortie, sig, tempo


def main():
    dossier = sys.argv[1]
    sel = json.load(open(os.path.join(dossier, 'selection.json')))
    par_fichier = {o['base']: o for o in sel.values()}
    blocs = []
    for pid, fichier, titre, compo, oeuvre, niveau, desc in PIECES:
        o = par_fichier[fichier]
        notes, sig, tempo = convertir(dossier, fichier)
        licence = o['lic']
        blocs.append({
            'id': pid, 'titre': titre, 'compositeur': compo, 'oeuvre': oeuvre, 'niveau': niveau,
            'description': desc, 'signature': list(sig),
            # Tempo de travail : 70 % de celui de la partition. L'original
            # est gardé pour l'entraîneur de vitesse et l'affichage.
            'tempo': max(40, round(tempo * 0.7 / 2) * 2), 'tempoOriginal': tempo,
            'source': {'copiste': o.get('maintainer'), 'licence': licence, 'url': o['info'],
                       'fichier': o['mid']},
            'notes': notes,
        })
        print('%-20s %4d notes  %s  ♩=%d' % (pid, len(notes) // 5, licence, tempo), file=sys.stderr)
    print('/* Répertoire importé du Mutopia Project (www.mutopiaproject.org).')
    print(' * GÉNÉRÉ par tools/mutopia_import.py — ne pas éditer à la main.')
    print(' * Domaine public ou Creative Commons Attribution : titre, copiste, source')
    print(' * et licence de chaque pièce sont dans `source` et affichés dans l\'app.')
    print(' * notes = suite plate [temps, corde, case, durée, midi, ...]. */')
    print('(function (global) {')
    print("  'use strict';")
    print('  global.REPERTOIRE_MUTOPIA = ' + json.dumps(blocs, ensure_ascii=False, separators=(',', ':')) + ';')
    print("})(typeof window !== 'undefined' ? window : globalThis);")


if __name__ == '__main__':
    main()
