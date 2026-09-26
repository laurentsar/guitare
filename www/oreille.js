/* Entraînement de l'oreille : trois jeux, tirés au sort, notés sur dix.
 *
 * Le son est produit par le même moteur que le reste (audio.js) : l'oreille
 * s'entraîne donc sur le timbre qu'elle entendra en jouant, pas sur un piano
 * de synthèse.
 */
(function (global) {
  'use strict';

  function hasard(n) { return Math.floor(Math.random() * n); }

  var JEUX = {
    // Quelle corde à vide vient d'être jouée ?
    cordes: {
      titre: 'Quelle corde ?',
      question: function () {
        var corde = 1 + hasard(6);
        return {
          jouer: function () { Audio5.jouerCase(corde, 0, { duree: 2.5 }); },
          choix: [1, 2, 3, 4, 5, 6].map(function (n) {
            return { id: n, libelle: n + ' — ' + Theorie.CORDES[n].nom };
          }),
          bonne: corde,
          explication: 'C’était la corde ' + corde + ' (' + Theorie.CORDES[corde].nom + ', ' +
                       Theorie.freqDeCase(corde, 0).toFixed(1) + ' Hz).'
        };
      }
    },
    // Majeur ou mineur ?
    couleur: {
      titre: 'Majeur ou mineur ?',
      question: function () {
        var paires = [['E', 'Em'], ['A', 'Am'], ['D', 'Dm']];
        var paire = paires[hasard(paires.length)];
        var mineur = hasard(2) === 1;
        var accord = Accords.get(paire[mineur ? 1 : 0]);
        return {
          jouer: function () { Audio5.jouerAccord(accord.frettes, { ecart: 0.045 }); },
          choix: [{ id: 'majeur', libelle: 'Majeur' }, { id: 'mineur', libelle: 'Mineur' }],
          bonne: mineur ? 'mineur' : 'majeur',
          explication: 'C’était ' + accord.fr + '.'
        };
      }
    },
    // Deux notes : la seconde est-elle plus haute ou plus basse ?
    hauteur: {
      titre: 'Plus haut ou plus bas ?',
      question: function () {
        var a = 52 + hasard(12);
        var ecart = 1 + hasard(7);
        var monte = hasard(2) === 1;
        var b = monte ? a + ecart : a - ecart;
        return {
          jouer: function () {
            Audio5.jouerNote(a, { duree: 1.6 });
            Audio5.jouerNote(b, { duree: 1.8, retard: 1.0 });
          },
          choix: [{ id: 'haut', libelle: 'Plus haut' }, { id: 'bas', libelle: 'Plus bas' }],
          bonne: monte ? 'haut' : 'bas',
          explication: Theorie.nom(a) + ' puis ' + Theorie.nom(b) + ' (' + ecart + ' demi-ton' + (ecart > 1 ? 's' : '') + ').'
        };
      }
    }
  };

  function jeux() {
    return Object.keys(JEUX).map(function (id) { return { id: id, titre: JEUX[id].titre }; });
  }
  function question(idJeu) {
    var j = JEUX[idJeu] || JEUX.cordes;
    return j.question();
  }

  global.Oreille = { jeux: jeux, question: question };
})(typeof window !== 'undefined' ? window : globalThis);
