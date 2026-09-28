"""Lecteur MIDI minimal (SMF 0/1), sans dépendance.

Rend, pour chaque fichier : la résolution (ticks par noire), les notes
{debut, fin, midi, piste} en ticks, les changements de tempo et les chiffrages
de mesure. C'est tout ce qu'il faut pour transformer une partition Mutopia en
morceau de l'app.
"""
import struct


def _vlq(d, i):
    v = 0
    while True:
        b = d[i]; i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def lire(chemin):
    d = open(chemin, 'rb').read()
    assert d[:4] == b'MThd', 'pas un fichier MIDI'
    _, fmt, ntr, div = struct.unpack('>IHHH', d[4:14])
    i = 8 + struct.unpack('>I', d[4:8])[0]
    notes, tempos, mesures = [], [], []
    for piste in range(ntr):
        assert d[i:i + 4] == b'MTrk'
        lg = struct.unpack('>I', d[i + 4:i + 8])[0]
        j, fin, t, statut = i + 8, i + 8 + lg, 0, 0
        ouvertes = {}
        while j < fin:
            dt, j = _vlq(d, j); t += dt
            b = d[j]
            if b == 0xFF:
                typ = d[j + 1]; n, j = _vlq(d, j + 2); data = d[j:j + n]; j += n
                if typ == 0x51: tempos.append((t, int.from_bytes(data, 'big')))
                if typ == 0x58: mesures.append((t, data[0], 2 ** data[1]))
                continue
            if b in (0xF0, 0xF7):
                n, j = _vlq(d, j + 1); j += n; continue
            if b & 0x80: statut = b; j += 1
            typ, canal = statut & 0xF0, statut & 0x0F
            if typ in (0x80, 0x90):
                note, vel = d[j], d[j + 1]; j += 2
                cle = (canal, note)
                if typ == 0x90 and vel > 0:
                    ouvertes.setdefault(cle, []).append(t)
                elif ouvertes.get(cle):
                    deb = ouvertes[cle].pop(0)
                    notes.append({'debut': deb, 'fin': t, 'midi': note, 'piste': piste})
            elif typ in (0xC0, 0xD0): j += 1
            else: j += 2
        i = fin
    notes.sort(key=lambda n: (n['debut'], n['midi']))
    return {'division': div, 'notes': notes, 'tempos': sorted(tempos), 'mesures': sorted(mesures)}
