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
    if (ecranCourant === 'morceau' && nom !== 'morceau') Tablature.arreter();

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
  var ECRANS_PRATIQUE = ['lecon', 'accordeur', 'metronome', 'morceau', 'accords', 'accord', 'oreille'];
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
  function rendreMorceaux() {
    var h = vide($('listeMorceaux'));
    var niveaux = {};
    Morceaux.tous().forEach(function (p) { (niveaux[p.niveau] = niveaux[p.niveau] || []).push(p); });
    Object.keys(niveaux).sort().forEach(function (n) {
      h.appendChild(el('h3', null, 'Niveau ' + n));
      niveaux[n].forEach(function (p) {
        var b = el('button', 'ligne-morceau');
        var t = el('span');
        t.appendChild(el('b', null, p.titre));
        t.appendChild(el('small', null, p.sous_titre));
        b.appendChild(t);
        b.appendChild(el('span', 'niveau', '♩ = ' + p.tempo));
        b.onclick = function () { ouvrirMorceau(p.id); };
        h.appendChild(b);
      });
    });
  }

  function ouvrirMorceau(id) {
    var p = Morceaux.get(id);
    if (!p) return;
    var h = vide($('detailMorceau'));
    h.appendChild(el('h2', null, p.titre));
    h.appendChild(el('p', 'aide', p.sous_titre));
    h.appendChild(el('p', null, p.description));

    var tempo = p.tempo;
    var ligneTempo = el('div', 'actions');
    var affiche = el('b', null, '♩ = ' + tempo);
    var moins = el('button', 'btn', '−10');
    var plus = el('button', 'btn', '+10');
    moins.onclick = function () { tempo = Math.max(30, tempo - 10); affiche.textContent = '♩ = ' + tempo; };
    plus.onclick = function () { tempo = Math.min(200, tempo + 10); affiche.textContent = '♩ = ' + tempo; };
    ligneTempo.appendChild(moins); ligneTempo.appendChild(affiche); ligneTempo.appendChild(plus);
    h.appendChild(ligneTempo);

    /* Portée, tablature, ou les deux. Le choix est mémorisé : un élève qui
     * apprend à lire la portée veut la portée SEULE, et rebasculer à chaque
     * morceau serait pénible. */
    var barreVue = el('div', 'filtres');
    var zone = el('div');
    function dessiner() {
      var vue = Store.reglages().vuePartition;
      zone.innerHTML =
        (vue !== 'tablature' ? Portee.svg(p, { mesuresParLigne: 2 }) : '') +
        (vue !== 'portee' ? Tablature.svg(p, { mesuresParLigne: 2 }) : '');
      Array.prototype.forEach.call(barreVue.children, function (b) {
        b.classList.toggle('actif', b.dataset.vue === vue);
      });
    }
    [['portee', 'Portée'], ['tablature', 'Tablature'], ['deux', 'Les deux']].forEach(function (v) {
      var b = el('button', '', v[1]);
      b.dataset.vue = v[0];
      b.onclick = function () { Store.reglage('vuePartition', v[0]); dessiner(); };
      barreVue.appendChild(b);
    });
    h.appendChild(barreVue);
    h.appendChild(zone);
    dessiner();

    var actions = el('div', 'actions');
    var bJouer = el('button', 'btn primaire', '▶ Écouter');
    var bStop = el('button', 'btn', '■ Arrêter');
    var bMetro = el('button', 'btn', '🥁 Avec métronome');
    actions.appendChild(bJouer); actions.appendChild(bStop); actions.appendChild(bMetro);
    h.appendChild(actions);
    h.appendChild(el('p', 'aide', 'La note en cours de lecture s’allume dans la tablature. Écoute d’abord, joue ensuite : imiter un modèle sonore va beaucoup plus vite que déchiffrer.'));

    // Rappel de lecture, replié : utile les premières semaines, encombrant
    // ensuite — <details> laisse l'élève décider, sans code de notre part.
    var aide = document.createElement('details');
    aide.innerHTML = '<summary>Comment lire cette tablature ?</summary>' + Illustrations.rendre('tablature');
    h.appendChild(aide);

    function surligner(note) {
      Array.prototype.forEach.call(zone.querySelectorAll('.tab-note, .portee-note'), function (g) {
        g.classList.toggle('en-cours', parseFloat(g.dataset.temps) === note.temps);
      });
    }
    bJouer.onclick = function () {
      Tablature.jouer(p, {
        tempo: tempo,
        surNote: function (n, i) { surligner(n); if (Cast.connecte()) Cast.afficherMorceau(p, i); },
        surFin: function () {
          Array.prototype.forEach.call(zone.querySelectorAll('.tab-note, .portee-note'), function (g) { g.classList.remove('en-cours'); });
        }
      });
    };
    bStop.onclick = function () {
      Tablature.arreter();
      Array.prototype.forEach.call(zone.querySelectorAll('.tab-note, .portee-note'), function (g) { g.classList.remove('en-cours'); });
    };
    bMetro.onclick = function () { reglerTempo(tempo); aller('metronome'); demarrerMetro(); };

    aller('morceau');
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
    $('regCast').value = r.castAppId || '';
    $('castUrl').textContent = urlRecepteur();
    $('castAide').textContent = Cast.configure()
      ? 'Récepteur configuré. Le bouton 📺 en haut à droite lance la diffusion.'
      : 'Sans identifiant de récepteur, la diffusion Chromecast reste désactivée — mais l’app s’installe aussi directement sur une télé Android, et le mode télévision s’y active tout seul.';
    $('aproposVersion').textContent = 'Version ' + (window.APP_VERSION || '?') +
      ' · ' + Lecons.tous().length + ' leçons · ' + Accords.tous().length + ' accords · ' + Morceaux.tous().length + ' morceaux.';
    if (window.AutoBackup && AutoBackup.mount) AutoBackup.mount($('carteBackup'));
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

    // Le service worker ne sert qu'à la version web (PWA) : dans l'APK, tout
    // est déjà local.
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Exposé pour les tests d'interface (jsdom) : aucun autre usage.
  window.AppGuitare = { aller: aller, ouvrirLecon: ouvrirLecon, ouvrirAccord: ouvrirAccord, ouvrirMorceau: ouvrirMorceau, demarrerOreille: demarrerOreille };
})();
