/* Ma Guitare — assemblage de l'interface.
 *
 * Les modules font le travail (théorie, son, accords, tablature, leçons,
 * accordeur, oreille) ; ce fichier ne fait que les afficher et enchaîner les
 * écrans. Quand quelque chose de musical est faux, c'est dans un module —
 * et c'est testé là-bas.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, classe, texte) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texte != null) n.textContent = texte;
    return n;
  }
  function vide(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  var ecranCourant = 'accueil';

  // ------------------------------------------------------------ navigation
  function aller(nom) {
    // Quitter un écran coupe ce qu'il faisait : rien de pire qu'un métronome
    // qui continue pendant qu'on lit une leçon.
    if (ecranCourant === 'accordeur' && nom !== 'accordeur') arreterAccordeur();
    // Morceau ↔ pupitre : même lecture, deux vues — on ne coupe pas.
    var lecteur = ['morceau', 'pupitre'];
    if (ecranCourant === 'editeur' && nom !== 'editeur') Tablature.arreter();
    if (lecteur.indexOf(ecranCourant) !== -1 && lecteur.indexOf(nom) === -1) Tablature.arreter();
    document.documentElement.classList.toggle('en-pupitre', nom === 'pupitre');

    ecranCourant = nom;
    Array.prototype.forEach.call(document.querySelectorAll('.ecran'), function (s) {
      s.classList.toggle('actif', s.id === 'ecran-' + nom);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#onglets button'), function (b) {
      b.classList.toggle('actif', b.dataset.aller === nom);
    });
    window.scrollTo(0, 0);
    if (nom === 'accueil') rendreAccueil();
    if (nom === 'parcours') rendreParcours();
    if (nom === 'accords') rendreAccords();
    if (nom === 'morceaux') rendreMorceaux();
    if (nom === 'oreille') rendreOreilleAccueil();
    if (nom === 'reglages') rendreReglages();
    if (nom === 'gammes') rendreGammes();
    majStats();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-aller]');
    if (b) { aller(b.dataset.aller); }
  });

  // ------------------------------------------- compteur de temps de pratique
  // Ne tourne que sur les écrans où l'on joue réellement, et s'arrête quand
  // l'app passe en arrière-plan : un compteur qui gonfle tout seul ne veut
  // plus rien dire.
  var ECRANS_PRATIQUE = ['lecon', 'accordeur', 'metronome', 'morceau', 'accords', 'accord', 'oreille', 'gammes', 'editeur', 'pupitre'];
  setInterval(function () {
    if (document.hidden) return;
    if (ECRANS_PRATIQUE.indexOf(ecranCourant) === -1) return;
    Store.ajouterSecondes(5);
    majStats();
  }, 5000);

  function majStats() {
    $('statSerie').textContent = Store.serie();
    $('statMinutes').textContent = Store.minutesDuJour();
  }

  // --------------------------------------------------------------- accueil
  var CONSEILS = [
    'Quinze minutes tous les jours valent mieux que deux heures le dimanche : ce sont les répétitions rapprochées qui installent un geste.',
    'Si un passage résiste, ralentis jusqu’à le réussir trois fois de suite. La vitesse est une conséquence, jamais un objectif.',
    'Coupe tes ongles de la main gauche. C’est la cause n°1 des notes qui frisent chez les débutants.',
    'Travaille les changements d’accords SANS jouer : les doigts seuls, en boucle, devant la télé.',
    'Accorde avant chaque séance. Une guitare fausse apprend de fausses habitudes à ton oreille.',
    'Le pouce de la main gauche reste derrière le manche, jamais par-dessus : sinon, les barrés seront impossibles.',
    'Joue debout de temps en temps : ça oblige la main gauche à tenir toute seule.'
  ];

  function rendreAccueil() {
    var p = Store.progression();
    var suivante = Lecons.suivante(p.lecons);
    var carte = vide($('carteReprendre'));
    if (suivante) {
      carte.appendChild(el('h2', null, 'À faire maintenant'));
      carte.appendChild(el('b', null, suivante.titre));
      carte.appendChild(el('p', 'aide', suivante.chapitre + ' · environ ' + suivante.minutes + ' min'));
      var b = el('button', 'btn primaire large', 'Commencer');
      b.onclick = function () { ouvrirLecon(suivante.id); };
      carte.appendChild(b);
    } else {
      carte.appendChild(el('h2', null, 'Parcours terminé'));
      carte.appendChild(el('p', 'aide', 'Toutes les leçons sont validées. Reprends les morceaux au métronome, et monte le tempo de cinq en cinq.'));
    }

    var obj = Store.reglages().objectifMinutes;
    var faites = Store.minutesDuJour();
    var prog = vide($('carteProgression'));
    prog.appendChild(el('h2', null, 'Aujourd’hui'));
    var barre = el('div', 'barre-objectif');
    var i = el('i');
    i.style.width = Math.min(100, Math.round(faites / obj * 100)) + '%';
    barre.appendChild(i);
    prog.appendChild(barre);
    prog.appendChild(el('p', 'aide', faites + ' min sur ' + obj + ' · ' +
      p.lecons.length + ' leçon' + (p.lecons.length > 1 ? 's' : '') + ' sur ' + Lecons.tous().length +
      ' · série de ' + Store.serie() + ' jour' + (Store.serie() > 1 ? 's' : '')));

    var conseil = vide($('carteConseil'));
    conseil.appendChild(el('h2', null, 'Le conseil du jour'));
    // Indexé sur la date : le même conseil toute la journée, un autre demain.
    var jour = Math.floor(Date.now() / 86400000);
    conseil.appendChild(el('p', null, CONSEILS[jour % CONSEILS.length]));
  }

  // -------------------------------------------------------------- parcours
  function rendreParcours() {
    var faites = Store.progression().lecons;
    var hote = vide($('listeParcours'));
    Lecons.chapitres().forEach(function (ch) {
      var bloc = el('div', 'chapitre');
      bloc.appendChild(el('h3', null, ch.nom));
      ch.lecons.forEach(function (l) {
        var b = el('button', 'ligne-lecon' + (faites.indexOf(l.id) !== -1 ? ' faite' : ''));
        var puce = el('span', 'puce', faites.indexOf(l.id) !== -1 ? '✓' : '');
        b.appendChild(puce);
        var txt = el('span');
        txt.appendChild(el('b', null, l.titre));
        txt.appendChild(el('small', null, l.minutes + ' min · ' + libelleExercice(l.exercice)));
        b.appendChild(txt);
        b.onclick = function () { ouvrirLecon(l.id); };
        bloc.appendChild(b);
      });
      hote.appendChild(bloc);
    });
  }

  function libelleExercice(ex) {
    // Un objet-dictionnaire évaluerait TOUTES ses valeurs, y compris
    // `ex.ref.join(...)` quand `ref` est une simple chaîne : c'est la panne
    // qu'avait attrapée le test d'interface.
    switch (ex.type) {
      case 'accordeur': return 'accordeur';
      case 'metronome': return 'métronome';
      case 'accord': return 'accord ' + ex.ref;
      case 'changements': return 'changements ' + ex.ref.join(' ↔ ');
      case 'morceau': return 'morceau';
      case 'oreille': return 'oreille';
      default: return ex.type;
    }
  }

  // ---------------------------------------------------------------- leçon
  function ouvrirLecon(id) {
    var l = Lecons.get(id);
    if (!l) return;
    var hote = vide($('detailLecon'));
    hote.appendChild(el('h2', null, l.titre));
    hote.appendChild(el('p', 'aide', l.chapitre + ' · ' + l.minutes + ' min'));
    // Le schéma d'abord : sur une position de main, un dessin fait en une
    // seconde ce que le paragraphe met trois phrases à dire.
    (l.images || []).forEach(function (id) {
      var boite = el('div');
      boite.innerHTML = Illustrations.rendre(id);
      hote.appendChild(boite);
    });
    hote.appendChild(el('div', 'lecon-texte', l.texte));

    var carteEx = el('div', 'carte');
    carteEx.appendChild(el('h3', null, 'Exercice'));
    carteEx.appendChild(el('p', null, l.exercice.consigne));
    carteEx.appendChild(widgetExercice(l.exercice));
    hote.appendChild(carteEx);

    var faites = Store.progression().lecons;
    var fait = faites.indexOf(l.id) !== -1;
    var valider = el('button', 'btn ' + (fait ? '' : 'primaire') + ' large',
      fait ? '✓ ' + l.validation : l.validation);
    valider.onclick = function () {
      Store.marquerLecon(l.id, !fait);
      ouvrirLecon(l.id);
      majStats();
    };
    hote.appendChild(valider);
    aller('lecon');
  }

  function widgetExercice(ex) {
    var boite = el('div');
    if (ex.type === 'accord') {
      var a = Accords.get(ex.ref);
      var d = el('div', 'grand-diagramme');
      d.innerHTML = Accords.svg(a, { largeur: 200 });
      boite.appendChild(d);
      var m = el('div');
      m.innerHTML = Illustrations.mainAccord(a, { largeur: 300 }) +
                    Illustrations.positionSurGuitare(a, { largeur: 620 });
      boite.appendChild(m);
      boite.appendChild(boutonJouerAccord(a));
    } else if (ex.type === 'morceau') {
      var b = el('button', 'btn primaire large', 'Ouvrir « ' + Morceaux.get(ex.ref).titre + ' »');
      b.onclick = function () { ouvrirMorceau(ex.ref); };
      boite.appendChild(b);
    } else if (ex.type === 'changements') {
      boite.appendChild(widgetChangements(ex));
    } else if (ex.type === 'accordeur') {
      var ba = el('button', 'btn primaire large', 'Ouvrir l’accordeur');
      ba.onclick = function () { aller('accordeur'); };
      boite.appendChild(ba);
    } else if (ex.type === 'metronome') {
      var bm = el('button', 'btn primaire large', 'Ouvrir le métronome');
      bm.onclick = function () { if (ex.tempo) reglerTempo(ex.tempo); aller('metronome'); };
      boite.appendChild(bm);
    } else if (ex.type === 'oreille') {
      var bo = el('button', 'btn primaire large', 'Lancer le jeu d’écoute');
      bo.onclick = function () { aller('oreille'); demarrerOreille(ex.ref); };
      boite.appendChild(bo);
    }
    return boite;
  }

  function boutonJouerAccord(a) {
    var b = el('button', 'btn large', '▶ Écouter l’accord');
    b.onclick = function () { Audio5.jouerAccord(a.frettes, { timbre: Store.reglages().timbre }); envoyerCast(); };
    return b;
  }

  /* Exercice « changements » : une minute, on compte les allers-retours entre
   * deux accords. C'est la seule mesure objective du progrès d'un débutant,
   * et elle motive bien plus qu'un « c'est mieux ». */
  function widgetChangements(ex) {
    var boite = el('div');
    var paire = ex.ref.join('-');
    var diag = el('div', 'actions');
    ex.ref.forEach(function (id) {
      var d = el('div');
      d.style.width = '46%';
      d.innerHTML = Illustrations.mainAccord(Accords.get(id), { largeur: 260 }) +
        '<div style="text-align:center;font-weight:700">' + id + '</div>';
      diag.appendChild(d);
    });
    boite.appendChild(diag);

    var compteur = el('div', 'metro-tempo', '0');
    var etat = el('div', 'aide', 'Record : ' + Store.record(paire) + ' · objectif ' + (ex.objectif || 20));
    boite.appendChild(compteur);
    boite.appendChild(etat);

    var n = 0, chrono = null, restant = 60;
    var plus = el('button', 'btn primaire large', 'Compter un changement (+1)');
    var demarrer = el('button', 'btn large', '⏱ Démarrer une minute');
    plus.disabled = true;
    plus.onclick = function () { n++; compteur.textContent = n; };
    demarrer.onclick = function () {
      if (chrono) return;
      n = 0; restant = 60; compteur.textContent = '0';
      plus.disabled = false;
      chrono = setInterval(function () {
        restant--;
        etat.textContent = restant + ' s restantes · record ' + Store.record(paire);
        if (restant <= 0) {
          clearInterval(chrono); chrono = null; plus.disabled = true;
          var record = Store.record(paire, n);
          etat.textContent = n + ' changements. Record : ' + record + '.';
        }
      }, 1000);
    };
    boite.appendChild(plus);
    boite.appendChild(demarrer);
    return boite;
  }

  // -------------------------------------------------------------- accords
  var filtreAccords = 'tous';
  function rendreAccords() {
    var familles = ['tous'];
    Accords.tous().forEach(function (a) { if (familles.indexOf(a.famille) === -1) familles.push(a.famille); });
    var f = vide($('filtresAccords'));
    familles.forEach(function (nom) {
      var b = el('button', filtreAccords === nom ? 'actif' : '', nom === 'tous' ? 'Tous' : nom);
      b.onclick = function () { filtreAccords = nom; rendreAccords(); };
      f.appendChild(b);
    });

    var g = vide($('grilleAccords'));
    Accords.tous()
      .filter(function (a) { return filtreAccords === 'tous' || a.famille === filtreAccords; })
      .sort(function (a, b) { return a.rang - b.rang; })
      .forEach(function (a) {
        var v = el('button', 'accord-vignette');
        v.innerHTML = Accords.svg(a, { largeur: 110 });
        v.appendChild(el('b', null, a.id));
        v.appendChild(el('small', null, a.fr));
        v.onclick = function () { ouvrirAccord(a.id); };
        g.appendChild(v);
      });
  }

  function ouvrirAccord(id) {
    var a = Accords.get(id);
    var h = vide($('detailAccord'));
    h.appendChild(el('h2', null, a.id + ' — ' + a.fr));
    var d = el('div', 'grand-diagramme');
    d.innerHTML = Accords.svg(a, { largeur: 260 });
    h.appendChild(d);
    // Le diagramme dit quelle case ; le dessin de main dit comment s'y poser.
    // Les deux côte à côte, parce que c'est le passage de l'un à l'autre qui
    // pose problème au début.
    var main = el('div');
    main.innerHTML = Illustrations.mainAccord(a, { largeur: 320 });
    h.appendChild(main);
    h.appendChild(el('p', 'schema-legende', 'Position de la main gauche. Le pouce reste derrière le manche (en pointillé) : on ne le voit pas de face.'));
    // Et où tout cela tombe sur l'instrument : « case 2 » ne veut rien dire
    // tant qu'on n'a pas vu que c'est juste après la tête.
    var surGuitare = el('div');
    surGuitare.innerHTML = Illustrations.positionSurGuitare(a, { largeur: 640 });
    h.appendChild(surGuitare);
    h.appendChild(el('p', 'schema-legende', 'La même position, replacée sur la guitare entière.'));
    h.appendChild(el('p', 'aide', 'Notes : ' + Accords.notes(a).join(' · ')));
    if (a.barre) h.appendChild(el('p', 'aide', 'Barré : index à plat sur la case ' + a.barre.frette + ', cordes ' + a.barre.de + ' à ' + a.barre.a + '.'));
    var muettes = a.frettes.map(function (f, i) { return f === -1 ? (i + 1) : null; }).filter(Boolean);
    if (muettes.length) h.appendChild(el('p', 'aide', 'Corde' + (muettes.length > 1 ? 's' : '') + ' à ne pas jouer : ' + muettes.join(', ') + '.'));

    var actions = el('div', 'actions');
    var bJouer = el('button', 'btn primaire', '▶ Gratté');
    bJouer.onclick = function () { Audio5.jouerAccord(a.frettes, { timbre: Store.reglages().timbre }); };
    var bArp = el('button', 'btn', '▶ Arpégé');
    bArp.onclick = function () { Audio5.jouerAccord(a.frettes, { ecart: 0.28, duree: 3, timbre: Store.reglages().timbre }); };
    var bNotes = el('button', 'btn', '▶ Corde par corde');
    bNotes.onclick = function () { Audio5.jouerAccord(a.frettes, { ecart: 0.7, duree: 1.2, timbre: Store.reglages().timbre }); };
    actions.appendChild(bJouer); actions.appendChild(bArp); actions.appendChild(bNotes);
    h.appendChild(actions);

    aller('accord');
    if (Cast.connecte()) Cast.afficherAccord(a.id);
  }

  // ------------------------------------------------------------- accordeur
  var accordeurActif = false;
  var cordesJustes = {};

  function rendreCordes(cible) {
    var h = vide($('cordesEtat'));
    for (var n = 6; n >= 1; n--) {
      (function (num) {
        var b = el('button', (cordesJustes[num] ? 'ok ' : '') + (cible === num ? 'vise' : ''),
          num + ' ' + Theorie.CORDES[num].court);
        b.onclick = function () { Audio5.jouerCase(num, 0, { duree: 3, timbre: Store.reglages().timbre }); };
        h.appendChild(b);
      })(n);
    }
  }

  function majAccordeur(m) {
    var aiguille = $('aiguille');
    if (!m || !m.cible) {
      $('accordeurNote').textContent = '—';
      $('accordeurCents').textContent = '';
      aiguille.style.left = '50%';
      aiguille.style.background = 'var(--faux)';
      return;
    }
    var c = m.cible;
    var cents = Math.max(-50, Math.min(50, c.cents));
    aiguille.style.left = (50 + cents) + '%';
    var juste = Math.abs(c.cents) < 5;
    aiguille.style.background = juste ? 'var(--ok)' : (Math.abs(c.cents) < 15 ? 'var(--presque)' : 'var(--faux)');
    $('accordeurNote').textContent = Theorie.CORDES[c.corde].court + ' (corde ' + c.corde + ')';
    $('accordeurCents').textContent = (c.cents > 0 ? '+' : '') + c.cents.toFixed(0) + ' centièmes · ' +
      m.freq.toFixed(1) + ' Hz' + (juste ? ' — juste' : (c.cents > 0 ? ' — trop haut, détends' : ' — trop bas, tends'));
    if (juste) cordesJustes[c.corde] = true;
    rendreCordes(c.corde);
    if (Cast.connecte()) Cast.afficherAccordeur({ corde: c.corde, cents: c.cents, freq: m.freq });
  }

  function basculerAccordeur() {
    if (accordeurActif) { arreterAccordeur(); return; }
    $('accordeurEtat').textContent = 'Autorisation du micro…';
    Accordeur.demarrer(majAccordeur, function (msg) {
      $('accordeurEtat').textContent = msg;
      accordeurActif = false;
      $('btnAccordeur').textContent = 'Écouter';
    }).then(function (ok) {
      if (!ok) return;
      accordeurActif = true;
      $('btnAccordeur').textContent = 'Arrêter';
      $('accordeurEtat').textContent = 'Joue une corde à vide, laisse-la sonner.';
    });
  }

  function arreterAccordeur() {
    Accordeur.arreter();
    accordeurActif = false;
    var b = $('btnAccordeur');
    if (b) b.textContent = 'Écouter';
  }

  // ------------------------------------------------------------- métronome
  var metroTemps = 0;
  function reglerTempo(bpm) {
    var t = Audio5.tempoMetronome(bpm);
    $('metroTempo').textContent = t;
    $('metroSlider').value = t;
    Store.reglage('tempo', t);
    if (Audio5.metronomeActif()) demarrerMetro();   // relance avec le nouveau tempo
    return t;
  }

  function pointsMetro(par) {
    var h = vide($('metroPoints'));
    for (var i = 0; i < par; i++) {
      var p = el('i', i === 0 ? 'fort' : '');
      h.appendChild(p);
    }
  }

  function demarrerMetro() {
    var par = parseInt($('metroMesure').value, 10);
    var sub = parseInt($('metroSub').value, 10);
    pointsMetro(par);
    Audio5.demarrerMetronome({
      tempo: parseInt($('metroSlider').value, 10),
      parMesure: par,
      subdivision: sub,
      surBattement: function (temps, sousPas) {
        if (sousPas !== 0) return;
        metroTemps = temps;
        var pts = $('metroPoints').children;
        for (var i = 0; i < pts.length; i++) pts[i].classList.toggle('actif', i === temps);
        if (Cast.connecte()) Cast.afficherMetronome(Audio5.tempoMetronome(parseInt($('metroSlider').value, 10)), temps, par);
      }
    });
    $('btnMetro').textContent = 'Arrêter';
  }

  function arreterMetro() {
    Audio5.arreterMetronome();
    $('btnMetro').textContent = 'Démarrer';
    Array.prototype.forEach.call($('metroPoints').children, function (p) { p.classList.remove('actif'); });
  }

  // --------------------------------------------------------------- morceaux
  // Un morceau intégré ou une tablature de l'élève : le lecteur ne fait pas
  // la différence, seule la liste les range à part.
  function trouverMorceau(id) { return Morceaux.get(id) || Store.tablature(id); }

  function rendreMorceaux() {
    var h = vide($('listeMorceaux'));
    var niveaux = {};
    Morceaux.tous().forEach(function (p) { (niveaux[p.niveau] = niveaux[p.niveau] || []).push(p); });
    function ligne(p, droite) {
      var b = el('button', 'ligne-morceau');
      var t = el('span');
      t.appendChild(el('b', null, p.titre));
      t.appendChild(el('small', null, p.sous_titre));
      b.appendChild(t);
      b.appendChild(el('span', 'niveau', droite));
      b.onclick = function () { ouvrirMorceau(p.id); };
      return b;
    }
    var NOMS_NIVEAUX = { 3: 'Niveau 3 — premières pièces', 4: 'Niveau 4 — répertoire', 5: 'Niveau 5 — études' };
    Object.keys(niveaux).sort().forEach(function (n) {
      h.appendChild(el('h3', null, NOMS_NIVEAUX[n] || 'Niveau ' + n));
      niveaux[n].forEach(function (p) { h.appendChild(ligne(p, '♩ = ' + p.tempo)); });
    });

    h.appendChild(el('h3', null, 'Mes tablatures'));
    h.appendChild(el('p', 'aide', 'Niveaux 3 à 5 : pièces du Mutopia Project (partitions libres, domaine public ou Creative Commons). Le placement sur le manche est calculé par l’app : si une position te semble inconfortable, le doigté d’une édition papier peut différer.'));

    var perso = Store.tablatures();
    if (!perso.length) h.appendChild(el('p', 'aide', 'Écris ta propre tablature, ou colles-en une trouvée sur internet : elle se jouera ici comme les autres, avec boucle, ralenti et manche.'));
    perso.forEach(function (p) { h.appendChild(ligne(p, p.notes.length + ' notes')); });
    var bNouv = el('button', 'btn primaire large', '✏️ Nouvelle tablature');
    bNouv.onclick = function () { ouvrirEditeur(null); };
    h.appendChild(bNouv);
  }

  /* Le lecteur, façon logiciel de tablature : tempo, boucle sur une section,
   * entraîneur de vitesse, décompte, clic, capodastre, guitare muette et
   * manche qui suit la lecture. Chaque option se résume à un paramètre de
   * Tablature.jouer — ce fichier ne fait que les exposer. */
  function ouvrirMorceau(id) {
    var p = trouverMorceau(id);
    if (!p) return;
    var r = Store.reglages();
    var parMesure = Tablature.noiresParMesure(p);
    var page = Tablature.miseEnPage(p);
    var nbMesures = Math.max(1, Math.ceil(Tablature.duree_totale(p) / parMesure));
    var etat = {
      tempo: p.tempo, capo: 0, de: 1, a: nbMesures,
      boucle: false, entraineur: false, pct: 100,
      decompte: r.decompte, clic: r.clicLecture, muet: false, manche: true
    };

    var h = vide($('detailMorceau'));
    h.appendChild(el('h2', null, p.titre));
    h.appendChild(el('p', 'aide', p.sous_titre));
    if (p.description) h.appendChild(el('p', null, p.description));
    if (p.source) {
      // Mention exigée par la licence (CC-BY) et due dans tous les cas.
      var credit = el('p', 'aide credit');
      credit.appendChild(document.createTextNode('Partition : Mutopia Project' +
        (p.source.copiste ? ', édition de ' + p.source.copiste : '') + ' · ' + p.source.licence +
        (p.tempoOriginal ? ' · tempo de la partition ♩ = ' + p.tempoOriginal : '') + ' · '));
      var lien = el('a', null, 'fiche');
      lien.href = p.source.url; lien.target = '_blank'; lien.rel = 'noopener';
      credit.appendChild(lien);
      h.appendChild(credit);
    }

    // Tempo : ±10, et, quand l'entraîneur tourne, le pourcentage en cours.
    var ligneTempo = el('div', 'actions');
    var affiche = el('b');
    function majTempo() {
      affiche.textContent = '♩ = ' + tempoEffectif() + (etat.entraineur ? ' (' + etat.pct + ' %)' : '');
    }
    function tempoEffectif() { return Math.max(20, Math.round(etat.tempo * etat.pct / 100)); }
    var moins = el('button', 'btn', '−10');
    var plus = el('button', 'btn', '+10');
    moins.onclick = function () { etat.tempo = Math.max(30, etat.tempo - 10); majTempo(); };
    plus.onclick = function () { etat.tempo = Math.min(220, etat.tempo + 10); majTempo(); };
    ligneTempo.appendChild(moins); ligneTempo.appendChild(affiche); ligneTempo.appendChild(plus);
    h.appendChild(ligneTempo);
    majTempo();

    /* Portée, tablature, ou les deux. Le choix est mémorisé : un élève qui
     * apprend à lire la portée veut la portée SEULE, et rebasculer à chaque
     * morceau serait pénible. */
    var barreVue = el('div', 'filtres');
    var zone = el('div');
    function dessiner() {
      var vue = Store.reglages().vuePartition;
      zone.innerHTML =
        (vue !== 'tablature' ? Portee.svg(p, page) : '') +
        (vue !== 'portee' ? Tablature.svg(p, page) : '');
      Array.prototype.forEach.call(barreVue.children, function (b) {
        b.classList.toggle('actif', b.dataset.vue === vue);
      });
      marquerSection();
    }
    [['portee', 'Portée'], ['tablature', 'Tablature'], ['deux', 'Les deux']].forEach(function (v) {
      var b = el('button', '', v[1]);
      b.dataset.vue = v[0];
      b.onclick = function () { Store.reglage('vuePartition', v[0]); dessiner(); };
      barreVue.appendChild(b);
    });
    h.appendChild(barreVue);
    h.appendChild(zone);

    // Manche virtuel : la note jouée s'allume là où poser le doigt.
    var manche = el('div', 'manche-boite');
    function majManche(temps) {
      var pts = temps == null ? [] : p.notes.filter(function (n) { return n.temps === temps; }).map(function (n) {
        return { corde: n.corde, frette: n.frette, classe: 'joue', texte: n.doigt ? String(n.doigt) : '' };
      });
      var maxCase = p.notes.reduce(function (m, n) { return Math.max(m, n.frette); }, 0);
      manche.innerHTML = Manche.svg({ cases: Math.max(5, Math.min(19, maxCase + 1)), points: pts });
    }
    h.appendChild(manche);
    majManche(null);

    var actions = el('div', 'actions');
    var bJouer = el('button', 'btn primaire', '▶ Écouter');
    var bStop = el('button', 'btn', '■ Arrêter');
    var bMetro = el('button', 'btn', '🥁 Métronome seul');
    actions.appendChild(bJouer); actions.appendChild(bStop); actions.appendChild(bMetro);
    h.appendChild(actions);

    // Options de travail : des interrupteurs, pas des cases à cocher — plus
    // gros au doigt, et atteignables à la télécommande.
    var opts = el('div', 'filtres options-lecture');
    function interrupteur(cle, libelle, surChange) {
      var b = el('button', '', libelle);
      function maj() { b.classList.toggle('actif', !!etat[cle]); b.setAttribute('aria-pressed', etat[cle] ? 'true' : 'false'); }
      b.onclick = function () { etat[cle] = !etat[cle]; maj(); if (surChange) surChange(); };
      maj();
      opts.appendChild(b);
      return b;
    }
    interrupteur('boucle', '🔁 Boucle');
    interrupteur('entraineur', '📈 Entraîneur de vitesse', function () {
      // L'entraîneur n'a de sens qu'en boucle : il accélère à chaque tour.
      etat.pct = etat.entraineur ? 60 : 100;
      if (etat.entraineur && !etat.boucle) { etat.boucle = true; opts.children[0].classList.add('actif'); }
      majTempo();
    });
    interrupteur('decompte', '⏱ Décompte', function () { Store.reglage('decompte', etat.decompte); });
    interrupteur('clic', '🥁 Clic', function () { Store.reglage('clicLecture', etat.clic); });
    interrupteur('muet', '🔇 Guitare muette');
    interrupteur('manche', '🎸 Manche', function () { manche.hidden = !etat.manche; });
    h.appendChild(opts);
    h.appendChild(el('p', 'aide', 'Entraîneur de vitesse : démarre à 60 % du tempo et gagne 5 % à chaque tour, jusqu’à 100 %. Guitare muette : l’app tient le temps et suit la partition, c’est toi qui joues.'));

    // Section (boucle A-B) et capodastre : des ± plutôt qu'un curseur, qui
    // capturerait les flèches de la télécommande.
    function reglage(libelle, get, moinsFn, plusFn) {
      var l = el('div', 'actions reglage-lecteur');
      l.appendChild(el('span', 'reglage-nom', libelle));
      var m = el('button', 'btn', '−'), v = el('b'), pl = el('button', 'btn', '+');
      function maj() { v.textContent = get(); }
      m.onclick = function () { moinsFn(); maj(); marquerSection(); };
      pl.onclick = function () { plusFn(); maj(); marquerSection(); };
      l.appendChild(m); l.appendChild(v); l.appendChild(pl);
      maj();
      h.appendChild(l);
    }
    reglage('Depuis la mesure', function () { return etat.de; },
      function () { etat.de = Math.max(1, etat.de - 1); },
      function () { etat.de = Math.min(etat.a, etat.de + 1); });
    reglage('Jusqu’à la mesure', function () { return etat.a + ' / ' + nbMesures; },
      function () { etat.a = Math.max(etat.de, etat.a - 1); },
      function () { etat.a = Math.min(nbMesures, etat.a + 1); });
    reglage('Capodastre', function () { return etat.capo ? 'case ' + etat.capo : 'aucun'; },
      function () { etat.capo = Math.max(0, etat.capo - 1); },
      function () { etat.capo = Math.min(9, etat.capo + 1); });

    // Les notes hors de la section sont estompées : on voit ce qu'on boucle.
    function marquerSection() {
      var de = (etat.de - 1) * parMesure, a = etat.a * parMesure;
      Array.prototype.forEach.call(zone.querySelectorAll('.tab-note, .portee-note'), function (g) {
        var t = parseFloat(g.dataset.temps);
        g.classList.toggle('hors-section', t < de || t >= a);
      });
    }
    dessiner();

    // Tablature texte : pour la recopier, l'envoyer, l'imprimer.
    var texte = document.createElement('details');
    texte.innerHTML = '<summary>Tablature texte (à copier)</summary>';
    var pre = el('pre', 'tab-texte', Tablature.versTexte(p, page.mesuresParLigne));
    var bCopier = el('button', 'btn', '📋 Copier');
    bCopier.onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(function () { bCopier.textContent = '✓ Copiée'; }, function () {});
    };
    texte.appendChild(pre); texte.appendChild(bCopier);
    h.appendChild(texte);

    // Rappel de lecture, replié : utile les premières semaines, encombrant
    // ensuite — <details> laisse l'élève décider, sans code de notre part.
    var aide = document.createElement('details');
    aide.innerHTML = '<summary>Comment lire cette tablature ?</summary>' + Illustrations.rendre('tablature');
    h.appendChild(aide);

    if (p.perso) {
      var gestion = el('div', 'actions');
      var bModif = el('button', 'btn', '✏️ Modifier');
      bModif.onclick = function () { ouvrirEditeur(p.id); };
      var bSuppr = el('button', 'btn', '🗑 Supprimer');
      bSuppr.onclick = function () {
        if (!window.confirm('Supprimer « ' + p.titre + ' » ?')) return;
        Store.supprimerTablature(p.id);
        aller('morceaux');
      };
      gestion.appendChild(bModif); gestion.appendChild(bSuppr);
      h.appendChild(gestion);
    }

    function effacer() {
      Array.prototype.forEach.call(zone.querySelectorAll('.tab-note, .portee-note'), function (g) { g.classList.remove('en-cours'); });
      majManche(null);
      pupitre.fin();
    }
    function surligner(note) {
      Array.prototype.forEach.call(zone.querySelectorAll('.tab-note, .portee-note'), function (g) {
        g.classList.toggle('en-cours', parseFloat(g.dataset.temps) === note.temps);
      });
      if (etat.manche) majManche(note.temps);
      if (window.CasqueVR) CasqueVR.note(note);
      pupitre.note(note);
    }
    function lancer(premier) {
      Tablature.jouer(p, {
        tempo: tempoEffectif(),
        de: (etat.de - 1) * parMesure,
        a: etat.a * parMesure,
        capo: etat.capo,
        // Le décompte n'est donné qu'au premier tour : en boucle, la reprise
        // doit s'enchaîner comme une vraie répétition.
        decompte: premier && etat.decompte ? Math.max(2, Math.round(parMesure)) : 0,
        metronome: etat.clic,
        muet: etat.muet,
        timbre: Store.reglages().timbre,
        surNote: function (n, i) { surligner(n); if (Cast.connecte()) Cast.afficherMorceau(p, i); },
        surFin: function () {
          effacer();
          if (!etat.boucle || (ecranCourant !== 'morceau' && ecranCourant !== 'pupitre')) { if (window.CasqueVR) CasqueVR.fin(); return; }
          if (etat.entraineur && etat.pct < 100) { etat.pct = Math.min(100, etat.pct + 5); majTempo(); pupitre.maj(); }
          lancer(false);
        }
      });
    }
    bJouer.onclick = function () { lancer(true); pupitre.maj(); };
    bStop.onclick = function () { Tablature.arreter(); effacer(); if (window.CasqueVR) CasqueVR.fin(); pupitre.maj(); };
    bMetro.onclick = function () { reglerTempo(tempoEffectif()); aller('metronome'); demarrerMetro(); };

    if (window.CasqueVR) CasqueVR.brancher(h, p, { jouer: function () { lancer(true); }, arreter: bStop.onclick });

    // Mode casque : la même lecture, vue en pupitre plein écran.
    var pupitre = construirePupitre(p, {
      etat: etat, parMesure: parMesure, nbMesures: nbMesures,
      tempo: function () { return affiche.textContent; },
      jouer: bJouer.onclick, arreter: bStop.onclick,
      moins: function () { moins.onclick(); }, plus: function () { plus.onclick(); },
      basculer: function (cle) {
        var b = [].filter.call(opts.children, function (x) { return x.dataset.cle === cle; })[0];
        if (b) b.click();
      }
    });
    Array.prototype.forEach.call(opts.children, function (b, i) {
      b.dataset.cle = ['boucle', 'entraineur', 'decompte', 'clic', 'muet', 'manche'][i];
    });
    var bPupitre = el('button', 'btn ' + (casqueActif() ? 'primaire ' : '') + 'large', '🥽 Mode casque (pupitre)');
    bPupitre.onclick = function () { pupitre.ouvrir(); };
    h.insertBefore(bPupitre, h.children[casqueActif() ? 2 : h.children.length]);
    pupitreCourant = pupitre;

    aller('morceau');
  }

  function casqueActif() { return document.documentElement.classList.contains('casque'); }
  var pupitreCourant = null;

  /* Pupitre : la vue « casque ».
   *
   * Sur un Quest, une app Android s'affiche comme une fenêtre qui flotte dans
   * la pièce (réalité mixte) : on voit sa vraie guitare ET la fenêtre. Le
   * pupitre remplit cette fenêtre avec ce qui sert en jouant, et rien d'autre :
   * la ligne en cours en très gros, la suivante en dessous (les pages tournent
   * toutes seules), le manche, et une barre de gros boutons visables au rayon
   * ou au pincement. Marche aussi sur tablette ou télé, comme lutrin. */
  function construirePupitre(p, ctl) {
    var page = Tablature.miseEnPage(p);
    var lignes = Tablature.systemes(p, page.mesuresParLigne);
    var idx = -1;
    var hote = $('pupitreVue');
    var tete, partition, manche, barre, bLecture;
    var enLecture = false;

    function ligneDe(t) {
      for (var i = 0; i < lignes.length; i++) if (t >= lignes[i].debut && t < lignes[i].fin) return i;
      return 0;
    }
    function rendreLignes(i) {
      idx = i;
      var html = '';
      [i, i + 1].forEach(function (k, rang) {
        if (!lignes[k]) return;
        html += '<div class="pupitre-ligne' + (rang ? ' suivante' : '') + '">' +
          Tablature.svgSysteme(lignes[k], { parMesure: ctl.parMesure, pxParTemps: Math.round(page.pxParTemps * 1.3), interligne: 18 }) + '</div>';
      });
      partition.innerHTML = html;
    }
    function rendreManche(t) {
      var pts = t == null ? [] : p.notes.filter(function (n) { return n.temps === t; }).map(function (n) {
        return { corde: n.corde, frette: n.frette, classe: 'joue', texte: n.doigt ? String(n.doigt) : '' };
      });
      var maxCase = p.notes.reduce(function (m, n) { return Math.max(m, n.frette); }, 0);
      manche.innerHTML = Manche.svg({ cases: Math.max(5, Math.min(12, maxCase + 1)), points: pts });
    }
    function bouton(txt, fn, cle) {
      var b = el('button', 'btn', txt);
      b.onclick = function () { fn(); maj(); };
      if (cle) b.dataset.cle = cle;
      barre.appendChild(b);
      return b;
    }
    function maj() {
      if (!tete) return;
      var mesure = idx < 0 ? 1 : Math.floor(lignes[idx].debut / ctl.parMesure) + 1;
      tete.querySelector('.pupitre-info').textContent = ctl.tempo() + ' · mesure ' + mesure + ' / ' + ctl.nbMesures;
      bLecture.textContent = enLecture ? '■ Arrêter' : '▶ Jouer';
      bLecture.classList.toggle('primaire', !enLecture);
      Array.prototype.forEach.call(barre.querySelectorAll('[data-cle]'), function (b) {
        b.classList.toggle('actif', !!ctl.etat[b.dataset.cle]);
      });
    }

    function ouvrir() {
      vide(hote);
      tete = el('div', 'pupitre-tete');
      var q = el('button', 'btn', '‹ Quitter');
      q.onclick = function () { aller('morceau'); };
      tete.appendChild(q);
      tete.appendChild(el('b', 'pupitre-titre', p.titre));
      tete.appendChild(el('span', 'pupitre-info'));
      hote.appendChild(tete);
      partition = el('div', 'pupitre-partition');
      hote.appendChild(partition);
      manche = el('div', 'pupitre-manche');
      hote.appendChild(manche);
      barre = el('div', 'pupitre-barre');
      bouton('−10', ctl.moins);
      bLecture = bouton('▶ Jouer', function () {
        if (enLecture) { ctl.arreter(); enLecture = false; } else { ctl.jouer(); enLecture = true; }
      });
      bouton('+10', ctl.plus);
      bouton('🔁 Boucle', function () { ctl.basculer('boucle'); }, 'boucle');
      bouton('📈 Vitesse', function () { ctl.basculer('entraineur'); }, 'entraineur');
      bouton('🔇 Muette', function () { ctl.basculer('muet'); }, 'muet');
      bouton('🥁 Clic', function () { ctl.basculer('clic'); }, 'clic');
      if (window.CasqueVR && CasqueVR.immersifPossible) {
        CasqueVR.immersifPossible(p).then(function (libelle) {
          if (!libelle || !barre) return;
          bouton(libelle, function () { CasqueVR.immersif(p); });
        });
      }
      hote.appendChild(barre);
      rendreLignes(ligneDe((ctl.etat.de - 1) * ctl.parMesure));
      rendreManche(null);
      maj();
      aller('pupitre');
    }

    return {
      ouvrir: ouvrir,
      maj: maj,
      note: function (n) {
        if (!partition || ecranCourant !== 'pupitre') return;
        enLecture = true;
        var i = ligneDe(n.temps);
        if (i !== idx) rendreLignes(i);
        Array.prototype.forEach.call(partition.querySelectorAll('.pupitre-ligne:not(.suivante) .tab-note'), function (g) {
          g.classList.toggle('en-cours', parseFloat(g.dataset.temps) === n.temps);
        });
        rendreManche(n.temps);
        maj();
      },
      fin: function () {
        if (!partition) return;
        enLecture = false;
        Array.prototype.forEach.call(partition.querySelectorAll('.tab-note'), function (g) { g.classList.remove('en-cours'); });
        rendreManche(null);
        maj();
      }
    };
  }

  // --------------------------------------------------------------- éditeur
  /* Éditeur de tablature. On saisit comme sur une grille : une corde, une
   * case, et le curseur avance d'une durée. Tout se fait avec des boutons —
   * pas de clavier nécessaire, donc utilisable à la télécommande et au casque. */
  var ed = null;

  var DUREES = [[4, 'Ronde'], [2, 'Blanche'], [1, 'Noire'], [0.5, 'Croche'], [0.25, 'Double']];

  function ouvrirEditeur(id) {
    var base = id ? Store.tablature(id) : null;
    ed = {
      piece: base ? JSON.parse(JSON.stringify(base)) : {
        id: 'perso-' + Date.now(), titre: 'Ma tablature', sous_titre: 'Écrite par moi',
        niveau: 'perso', tempo: 80, signature: [4, 4], description: '', notes: [], perso: true
      },
      curseur: 0, duree: 1, corde: 1, accord: false
    };
    if (base) ed.curseur = Tablature.duree_totale(ed.piece);
    rendreEditeur();
    aller('editeur');
  }

  function rendreEditeur() {
    var p = ed.piece;
    var parMesure = p.signature[0];
    var h = vide($('editeurTab'));

    var titre = el('input', 'saisie');
    titre.value = p.titre; titre.maxLength = 60; titre.setAttribute('aria-label', 'Titre');
    titre.onchange = function () { p.titre = titre.value.trim() || 'Ma tablature'; };
    h.appendChild(titre);

    var ligne = el('div', 'actions');
    var tm = el('button', 'btn', '−5'), tv = el('b', null, '♩ = ' + p.tempo), tp = el('button', 'btn', '+5');
    tm.onclick = function () { p.tempo = Math.max(30, p.tempo - 5); tv.textContent = '♩ = ' + p.tempo; };
    tp.onclick = function () { p.tempo = Math.min(220, p.tempo + 5); tv.textContent = '♩ = ' + p.tempo; };
    ligne.appendChild(tm); ligne.appendChild(tv); ligne.appendChild(tp);
    [2, 3, 4].forEach(function (n) {
      var b = el('button', 'btn' + (parMesure === n ? ' primaire' : ''), n + '/4');
      b.onclick = function () { p.signature = [n, 4]; rendreEditeur(); };
      ligne.appendChild(b);
    });
    h.appendChild(ligne);

    // Aperçu, avec les notes sous le curseur allumées.
    var apercu = el('div', 'editeur-apercu');
    // Le curseur est une note fantôme sur la corde choisie : visible même sur
    // un temps encore vide, et elle prolonge la ligne d'une mesure si besoin.
    var libre = !p.notes.some(function (n) { return n.temps === ed.curseur && n.corde === ed.corde; });
    var notes = p.notes.slice();
    if (libre) notes.push({ corde: ed.corde, frette: '·', temps: ed.curseur, duree: ed.duree });
    apercu.innerHTML = Tablature.svg({ signature: p.signature, notes: notes }, { mesuresParLigne: 2 });
    Array.prototype.forEach.call(apercu.querySelectorAll('.tab-note'), function (g) {
      if (parseFloat(g.dataset.temps) === ed.curseur) g.classList.add('en-cours');
    });
    h.appendChild(apercu);
    var mesure = Math.floor(ed.curseur / parMesure) + 1;
    var temps = +(ed.curseur % parMesure + 1).toFixed(2);
    h.appendChild(el('p', 'aide', 'Curseur : mesure ' + mesure + ', temps ' + temps + ' · ' + p.notes.length + ' notes'));

    h.appendChild(el('h3', null, 'Corde'));
    var cordes = el('div', 'filtres');
    for (var c = 1; c <= 6; c++) {
      (function (num) {
        var b = el('button', ed.corde === num ? 'actif' : '', num + ' · ' + Theorie.CORDES[num].nom);
        b.onclick = function () { ed.corde = num; rendreEditeur(); };
        cordes.appendChild(b);
      })(c);
    }
    h.appendChild(cordes);

    h.appendChild(el('h3', null, 'Durée'));
    var durees = el('div', 'filtres');
    DUREES.forEach(function (d) {
      var b = el('button', ed.duree === d[0] ? 'actif' : '', d[1]);
      b.onclick = function () { ed.duree = d[0]; rendreEditeur(); };
      durees.appendChild(b);
    });
    var bAccord = el('button', ed.accord ? 'actif' : '', '🎶 Accord (ne pas avancer)');
    bAccord.onclick = function () { ed.accord = !ed.accord; rendreEditeur(); };
    durees.appendChild(bAccord);
    h.appendChild(durees);

    h.appendChild(el('h3', null, 'Case — corde ' + ed.corde));
    var grille = el('div', 'grille-cases');
    for (var f = 0; f <= 15; f++) {
      (function (fr) {
        var b = el('button', 'btn', String(fr));
        b.onclick = function () { poserNote(fr); };
        grille.appendChild(b);
      })(f);
    }
    h.appendChild(grille);

    var nav = el('div', 'actions');
    [['◀ Reculer', function () { ed.curseur = Math.max(0, +(ed.curseur - ed.duree).toFixed(4)); }],
     ['Avancer ▶', function () { ed.curseur = +(ed.curseur + ed.duree).toFixed(4); }],
     ['𝄽 Silence', function () { ed.curseur = +(ed.curseur + ed.duree).toFixed(4); }],
     ['⌫ Effacer ici', function () {
       p.notes = p.notes.filter(function (n) { return n.temps !== ed.curseur; });
     }],
     ['↶ Dernière note', function () {
       var n = p.notes.pop();
       if (n) ed.curseur = n.temps;
     }]].forEach(function (a) {
      var b = el('button', 'btn', a[0]);
      b.onclick = function () { a[1](); rendreEditeur(); };
      nav.appendChild(b);
    });
    h.appendChild(nav);

    var fin2 = el('div', 'actions');
    var bEcouter = el('button', 'btn', '▶ Écouter');
    bEcouter.onclick = function () { Tablature.jouer(p, { tempo: p.tempo, timbre: Store.reglages().timbre }); };
    var bSauver = el('button', 'btn primaire', '💾 Enregistrer');
    bSauver.onclick = function () {
      p.titre = titre.value.trim() || 'Ma tablature';
      p.notes.sort(function (x, y) { return x.temps - y.temps || x.corde - y.corde; });
      Store.sauverTablature(p);
      ouvrirMorceau(p.id);
    };
    fin2.appendChild(bEcouter); fin2.appendChild(bSauver);
    h.appendChild(fin2);

    // Import d'une tab texte trouvée sur le web : collée, analysée, ajoutée.
    var imp = document.createElement('details');
    imp.innerHTML = '<summary>Coller une tablature texte (internet)</summary>' +
      '<p class="aide">Six lignes qui commencent par e|, B|, G|, D|, A|, E|. Les notes et les cases sont reprises ; le rythme n’existe pas dans ce format, chaque note devient une croche — ajuste ensuite à l’oreille.</p>';
    var zoneTexte = el('textarea', 'saisie tab-texte');
    zoneTexte.rows = 8;
    zoneTexte.placeholder = 'e|---0---2---|\nB|-1-------3-|\nG|-----------|\nD|-----------|\nA|-----------|\nE|-----------|';
    var bImp = el('button', 'btn primaire', 'Importer');
    var etatImp = el('p', 'aide');
    bImp.onclick = function () {
      var notes = Tablature.depuisTexte(zoneTexte.value);
      if (!notes.length) { etatImp.textContent = 'Aucune tablature reconnue : il faut les six lignes, du Mi aigu (e) au Mi grave (E).'; return; }
      var decal = Tablature.duree_totale(p);
      notes.forEach(function (n) { n.temps += decal; p.notes.push(n); });
      ed.curseur = Tablature.duree_totale(p);
      rendreEditeur();
    };
    imp.appendChild(zoneTexte); imp.appendChild(bImp); imp.appendChild(etatImp);
    h.appendChild(imp);
  }

  function poserNote(frette) {
    var p = ed.piece;
    p.notes = p.notes.filter(function (n) { return !(n.temps === ed.curseur && n.corde === ed.corde); });
    p.notes.push({ corde: ed.corde, frette: frette, temps: ed.curseur, duree: ed.duree, midi: Theorie.midiDeCase(ed.corde, frette) });
    Audio5.jouerCase(ed.corde, frette, { duree: 1.2, timbre: Store.reglages().timbre });
    if (!ed.accord) ed.curseur = +(ed.curseur + ed.duree).toFixed(4);
    rendreEditeur();
  }

  // ---------------------------------------------------------------- gammes
  var gamme = { tonique: 9, type: 'penta-min' };   // La mineur pentatonique : la première qu'on apprend

  function rendreGammes() {
    var h = vide($('gammesContenu'));
    h.appendChild(el('h2', null, 'Gammes sur le manche'));
    var toniques = el('div', 'filtres');
    Theorie.NOMS_FR.forEach(function (nom, i) {
      var b = el('button', gamme.tonique === i ? 'actif' : '', nom);
      b.onclick = function () { gamme.tonique = i; rendreGammes(); };
      toniques.appendChild(b);
    });
    h.appendChild(toniques);
    var types = el('div', 'filtres');
    Gammes.TYPES.forEach(function (t) {
      var b = el('button', gamme.type === t.id ? 'actif' : '', t.nom);
      b.onclick = function () { gamme.type = t.id; rendreGammes(); };
      types.appendChild(b);
    });
    h.appendChild(types);

    h.appendChild(el('p', null, Theorie.NOMS_FR[gamme.tonique] + ' ' + Gammes.type(gamme.type).nom.toLowerCase() + ' : ' + Gammes.noms(gamme.tonique, gamme.type).join(' · ')));
    var m = el('div', 'manche-boite');
    m.innerHTML = Manche.svg({
      cases: 12,
      points: Gammes.positions(gamme.tonique, gamme.type, 12).map(function (pt) {
        return { corde: pt.corde, frette: pt.frette, classe: pt.tonique ? 'tonique' : 'gamme', texte: pt.nom.replace('♯', '#').slice(0, 3) };
      })
    });
    h.appendChild(m);
    h.appendChild(el('p', 'aide', 'Les pastilles pleines sont la tonique. Travaille la gamme case par case, un doigt par case, en montant puis en descendant — lentement, au métronome.'));

    var b = el('button', 'btn primaire large', '▶ Écouter (2 octaves, montante et descendante)');
    b.onclick = function () {
      Audio5.couperTout();
      var tempo = Audio5.tempoMetronome(Store.reglages().tempo);
      Gammes.aJouer(gamme.tonique, gamme.type, 2).forEach(function (midi, i) {
        Audio5.jouerNote(midi, { retard: i * 60 / tempo / 2, duree: 1.2, timbre: Store.reglages().timbre });
      });
    };
    h.appendChild(b);
  }

  // --------------------------------------------------------------- oreille
  var jeu = { id: null, n: 0, bons: 0, courante: null };

  function rendreOreilleAccueil() {
    var h = vide($('oreilleAccueil'));
    $('oreilleJeu').hidden = true;
    h.hidden = false;
    h.appendChild(el('h2', null, 'Former l’oreille'));
    h.appendChild(el('p', 'aide', 'Dix questions, une minute. L’oreille se travaille comme les doigts : un peu, tous les jours.'));
    Oreille.jeux().forEach(function (j) {
      var b = el('button', 'btn large', j.titre);
      b.onclick = function () { demarrerOreille(j.id); };
      h.appendChild(b);
    });
  }

  function demarrerOreille(idJeu) {
    jeu = { id: idJeu, n: 0, bons: 0, courante: null };
    $('oreilleAccueil').hidden = true;
    $('oreilleJeu').hidden = false;
    questionSuivante();
  }

  function questionSuivante() {
    var h = vide($('oreilleJeu'));
    if (jeu.n >= 10) {
      h.appendChild(el('h2', null, 'Résultat : ' + jeu.bons + ' sur 10'));
      h.appendChild(el('p', 'aide', jeu.bons >= 8 ? 'Objectif atteint. Passe au jeu suivant.' : 'Encore un tour : c’est en se trompant qu’on entend la différence.'));
      var r = el('button', 'btn primaire large', 'Rejouer');
      r.onclick = function () { demarrerOreille(jeu.id); };
      var q = el('button', 'btn large', 'Choisir un autre jeu');
      q.onclick = function () { rendreOreilleAccueil(); };
      h.appendChild(r); h.appendChild(q);
      return;
    }
    var q = Oreille.question(jeu.id);
    jeu.courante = q;
    h.appendChild(el('h2', null, 'Question ' + (jeu.n + 1) + ' sur 10'));
    var rejouer = el('button', 'btn primaire large', '🔊 Écouter');
    rejouer.onclick = function () { q.jouer(); };
    h.appendChild(rejouer);

    var choix = el('div', 'choix-oreille');
    q.choix.forEach(function (c) {
      var b = el('button', 'btn', c.libelle);
      b.onclick = function () {
        var bon = c.id === q.bonne;
        if (bon) jeu.bons++;
        b.classList.add(bon ? 'bon' : 'mauvais');
        Array.prototype.forEach.call(choix.children, function (x) { x.disabled = true; });
        var info = el('p', 'aide', (bon ? '✓ ' : '✗ ') + q.explication);
        h.appendChild(info);
        jeu.n++;
        setTimeout(questionSuivante, 1400);
      };
      choix.appendChild(b);
    });
    h.appendChild(choix);
    h.appendChild(el('div', 'score', 'Score : ' + jeu.bons + ' / ' + jeu.n));
    setTimeout(function () { q.jouer(); }, 250);
  }

  // -------------------------------------------------------------- réglages
  function rendreReglages() {
    var r = Store.reglages();
    $('regVolume').value = Math.round(r.volume * 100);
    $('regTimbre').value = r.timbre;
    $('regInstrument').value = r.instrument || '';
    $('regObjectif').value = String(r.objectifMinutes);
    $('regTv').value = r.modeTv == null ? 'auto' : (r.modeTv ? 'oui' : 'non');
    $('regCasque').value = r.modeCasque == null ? 'auto' : (r.modeCasque ? 'oui' : 'non');
    $('regCast').value = r.castAppId || '';
    $('castUrl').textContent = urlRecepteur();
    $('castAide').textContent = Cast.configure()
      ? 'Récepteur configuré. Le bouton 📺 en haut à droite lance la diffusion.'
      : 'Sans identifiant de récepteur, la diffusion Chromecast reste désactivée — mais l’app s’installe aussi directement sur une télé Android, et le mode télévision s’y active tout seul.';
    $('aproposVersion').textContent = 'Version ' + (window.APP_VERSION || '?') +
      ' · ' + Lecons.tous().length + ' leçons · ' + Accords.tous().length + ' accords · ' + Morceaux.tous().length + ' morceaux · ' + Gammes.TYPES.length + ' gammes.';
    if (window.AutoBackup && AutoBackup.mount) AutoBackup.mount($('carteBackup'));
  }

  /* Lien profond « ?morceau=<id> » (ou « #tab=<json> » pour une tablature
   * perso, qui n'existe que dans le stockage de l'APK) : c'est ainsi que
   * l'APK passe la main au navigateur du casque pour la partition immersive. */
  function ouvrirLienProfond() {
    try {
      var id = new URLSearchParams(location.search).get('morceau');
      var m = /#tab=(.+)$/.exec(location.hash);
      if (m) {
        var piece = JSON.parse(decodeURIComponent(m[1]));
        if (piece && piece.id && Array.isArray(piece.notes)) {
          piece.perso = true;
          if (!Store.tablature(piece.id)) Store.sauverTablature(piece);
          id = piece.id;
        }
      }
      if (id && trouverMorceau(id)) { ouvrirMorceau(id); pupitreCourant.ouvrir(); }
    } catch (e) { /* lien abîmé : on reste sur l'accueil */ }
  }

  function urlRecepteur() {
    // La page récepteur est publiée à côté de la PWA (GitHub Pages).
    var base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return /^https?:/.test(base) && location.protocol !== 'file:'
      ? base + 'recepteur.html'
      : 'https://laurentsar.github.io/guitare/recepteur.html';
  }

  // ------------------------------------------------------------------ cast
  function envoyerCast() { /* les écrans appellent Cast.afficher* directement */ }

  function majBoutonCast(etat) {
    var b = $('btnCast');
    b.hidden = !Cast.configure();
    b.classList.toggle('on', etat === 'connecte');
    b.title = etat === 'connecte' ? 'Diffusion en cours' : 'Diffuser sur la télé';
  }

  // ------------------------------------------------------------ démarrage
  function init() {
    Tv.appliquer();
    $('chipVersion').textContent = 'v' + (window.APP_VERSION || '1.0');
    var inst = (Store.reglages().instrument || '').trim();
    $('sousTitre').textContent = (inst ? inst + ' · ' : '') + 'guitare classique · débutant';
    var r = Store.reglages();
    Audio5.volume(r.volume);
    $('metroSlider').value = r.tempo;
    $('metroTempo').textContent = r.tempo;
    pointsMetro(4);
    majStats();
    rendreAccueil();

    $('raccourciEditeur').onclick = function () { ouvrirEditeur(null); };
    // Au casque : raccourci vers les morceaux, où se trouve la partition
    // flottante (elle n'a de sens qu'avec quelque chose à lire).
    if (window.CasqueVR) CasqueVR.appliquer();
    $('raccourciVR').hidden = !casqueActif();
    $('raccourciVR').onclick = function () { aller('morceaux'); };

    // Accordeur
    $('btnAccordeur').onclick = basculerAccordeur;
    $('btnRef').onclick = function () {
      // Les six cordes à vide, du grave à l'aigu : référence à l'oreille quand
      // le micro n'est pas utilisable (pièce bruyante, micro refusé).
      for (var n = 6, i = 0; n >= 1; n--, i++) {
        Audio5.jouerCase(n, 0, { retard: i * 0.9, duree: 2.4, timbre: Store.reglages().timbre });
      }
    };
    rendreCordes(null);
    var schemaTete = document.createElement('div');
    schemaTete.innerHTML = Illustrations.rendre('tete');
    $('ecran-accordeur').querySelector('.carte').appendChild(schemaTete);
    // Accorder sans micro : replié, parce que ça ne sert qu'en dépannage —
    // mais indispensable quand le micro est refusé ou la pièce bruyante.
    var oreilleTuning = document.createElement('details');
    oreilleTuning.innerHTML = '<summary>Accorder à l’oreille, sans micro</summary>' +
      Illustrations.rendre('accordage') +
      '<p class="aide">Appuie sur la case indiquée et compare avec la corde du dessus jouée à vide : les deux doivent sonner pareil. Les boutons ronds ci-dessus jouent chaque corde à vide comme référence.</p>';
    $('ecran-accordeur').querySelector('.carte').appendChild(oreilleTuning);

    // Métronome
    $('btnMetro').onclick = function () { Audio5.metronomeActif() ? arreterMetro() : demarrerMetro(); };
    $('metroSlider').oninput = function () { $('metroTempo').textContent = this.value; };
    $('metroSlider').onchange = function () { reglerTempo(parseInt(this.value, 10)); };
    $('metroMesure').onchange = function () { pointsMetro(parseInt(this.value, 10)); if (Audio5.metronomeActif()) demarrerMetro(); };
    $('metroSub').onchange = function () { if (Audio5.metronomeActif()) demarrerMetro(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-tempo]'), function (b) {
      b.onclick = function () { reglerTempo(parseInt($('metroSlider').value, 10) + parseInt(b.dataset.tempo, 10)); };
    });
    var taps = [];
    $('btnTap').onclick = function () {
      var t = Date.now();
      taps = taps.filter(function (x) { return t - x < 3000; });
      taps.push(t);
      if (taps.length >= 3) {
        var ecarts = [];
        for (var i = 1; i < taps.length; i++) ecarts.push(taps[i] - taps[i - 1]);
        var moy = ecarts.reduce(function (a, b) { return a + b; }, 0) / ecarts.length;
        reglerTempo(Math.round(60000 / moy));
      }
    };

    // Réglages
    $('regVolume').oninput = function () { Audio5.volume(this.value / 100); Store.reglage('volume', this.value / 100); };
    $('regTimbre').onchange = function () { Store.reglage('timbre', this.value); };
    $('regInstrument').onchange = function () {
      Store.reglage('instrument', this.value.trim());
      var i = this.value.trim();
      $('sousTitre').textContent = (i ? i + ' · ' : '') + 'guitare classique · débutant';
    };
    $('regObjectif').onchange = function () { Store.reglage('objectifMinutes', parseInt(this.value, 10)); };
    $('regCasque').onchange = function () {
      Store.reglage('modeCasque', this.value === 'auto' ? null : this.value === 'oui');
      if (window.CasqueVR) CasqueVR.appliquer();
      $('raccourciVR').hidden = !casqueActif();
    };
    $('regTv').onchange = function () {
      Store.reglage('modeTv', this.value === 'auto' ? null : this.value === 'oui');
      Tv.appliquer();
    };
    $('regCast').onchange = function () {
      Store.reglage('castAppId', this.value.trim().toUpperCase());
      Cast.chargerSdk();
      majBoutonCast('pret');
      rendreReglages();
    };

    // Cast
    Cast.ecouter(majBoutonCast);
    majBoutonCast('init');
    if (Cast.configure()) Cast.chargerSdk();
    $('btnCast').onclick = function () { Cast.connecter(); };

    ouvrirLienProfond();

    // Le service worker ne sert qu'à la version web (PWA) : dans l'APK, tout
    // est déjà local.
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Exposé pour les tests d'interface (jsdom) : aucun autre usage.
  window.AppGuitare = { aller: aller, ouvrirLecon: ouvrirLecon, ouvrirAccord: ouvrirAccord, ouvrirMorceau: ouvrirMorceau, demarrerOreille: demarrerOreille, ouvrirEditeur: ouvrirEditeur, pupitre: function () { return pupitreCourant; } };
})();
