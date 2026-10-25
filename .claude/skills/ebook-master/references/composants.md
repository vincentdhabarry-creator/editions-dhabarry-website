# Composants HTML d'un chapitre

Un fichier de chapitre (`chapitres/NN-titre.html`) est un fragment HTML : une `section.opener` (ouverture pleine page) puis une ou plusieurs `<section>` de contenu. Chaque nouvelle `<section>` commence une nouvelle page : n'en créez une que pour un vrai saut voulu, sinon laissez le texte couler.

Les couleurs viennent de la charte : **n'écrivez jamais de couleur en dur** (ni `#hex`, ni `style="color:…"`). Utilisez les classes ci-dessous ; dans les SVG, les classes `f-*` (remplissage), `s-*` (contour) et `sc-*` (dégradés).

Exemple complet et validé : `assets/exemple-chapitre.html`.

## Ouverture de chapitre (pleine page)
```html
<section class="opener"><div class="op">
  <div class="big">03</div>
  <div class="time">Lecture · 18 min</div>
  <div class="kicker">Chapitre 03 · Partie I</div>
  <div class="rule"></div>
  <h2>Le kidnapping<br><em>amygdalien</em></h2>
  <div class="sub">Reprendre le contrôle en plein stress</div>
  <div class="goals"><div class="t">Dans ce chapitre, vous allez</div><ol>
    <li>Comprendre pourquoi une émotion forte peut court-circuiter votre raisonnement.</li>
    <li>Repérer les signaux d’alerte de votre corps avant le débordement.</li>
  </ol></div>
</div></section>
```
Le `<h2>` alimente l'en-tête courant et le sommaire. Temps de lecture : environ 230 mots par minute.

## Texte courant
```html
<section>
  <p class="first">Premier paragraphe du chapitre (lettrine automatique)…</p>
  <p>…</p>
  <h3><span class="n">3.1</span>Ce qui se passe dans votre corps</h3>
  <p>…</p>
</section>
```
`h3` = intertitre numéroté, `h4` = sous-intertitre. Italique `<em>` pour l'accent ; gras `<strong>` rare.

## Citation mise en avant
```html
<div class="pull"><p>« Texte de la citation. »</p><div class="who">Auteur, œuvre (ou « couramment attribuée à… »)</div></div>
```

## Encadrés (1 à 3 par chapitre)
```html
<div class="box conseil">
  <div class="hd"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>Le conseil de l’auteur</div>
  <p>Action précise, faisable cette semaine.</p>
</div>
```
Variantes : `box attention` (« Piège fréquent », icône triangle `<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.01"/>`), `box info` (« Le saviez-vous ? », seulement avec une source).

## Cas pratique
```html
<div class="cas">
  <div class="hd"><span class="badge">Cas pratique</span><span class="nm">Karim, 38 ans, chef de projet</span></div>
  <div class="row"><div class="lb">La situation</div><p>…</p></div>
  <div class="row"><div class="lb">Le réflexe</div><p>…</p></div>
  <div class="row"><div class="lb">Ce qu’il fait</div><p>…</p></div>
  <div class="row"><div class="lb">Le résultat</div><p>…</p></div>
  <div class="note">Cas illustratif, construit à partir de situations courantes.</div>
</div>
```
Retirer la `note` uniquement pour un cas réel fourni par l'auteur.

## Comparatif (avant / après, deux approches)
N'utilisez **pas** `<table>` : Paged.js coupe les tableaux et peut laisser l'en-tête seul en bas de page. Utilisez la grille :
```html
<div class="cmp">
  <div class="h l">Réaction impulsive</div><div class="h r">Réponse consciente</div>
  <div class="c l">Immédiate, dictée par l’émotion</div><div class="c r">Différée de quelques secondes</div>
  <div class="c l">…</div><div class="c r">…</div>
</div>
```
4 à 6 lignes maximum (le bloc ne se coupe pas : trop long, il laisserait un grand blanc).

## Fiche récapitulative
```html
<div class="recap"><div class="t">Fiche récapitulative</div><h4>L’essentiel du chapitre 3</h4><ul>
  <li><b>Point clé formulé en action</b> : précision utile.</li>
</ul></div>
```

## Exercice
```html
<div class="exo">
  <div class="hd"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>Exercice · Titre (durée)</div>
  <p>Consigne.</p>
  <div class="lignes"><div></div><div></div><div></div><div></div></div>
</div>
```
Tableau à remplir : grille (pas de `<table>`), une cellule `.c` par case, `.first` sur la première colonne :
```html
<div class="grille-ex" style="grid-template-columns:16% 34% 18% 12% 20%">
  <div class="h">Jour</div><div class="h">Déclencheur</div><div class="h">Signal</div><div class="h">/10</div><div class="h">Réponse</div>
  <div class="c first"></div><div class="c"></div><div class="c"></div><div class="c"></div><div class="c"></div>
</div>
```
(`grid-template-columns` est la seule propriété `style` autorisée.)

## Infographie
```html
<figure class="info">
  <div class="info-t">Infographie</div>
  <div class="info-h">Titre de l’infographie</div>
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">…</svg>
  <figcaption>Schéma simplifié à visée pédagogique.</figcaption>
</figure>
```
Voir `infographies.md`.

## Saut de page forcé
`<div class="saut"></div>` : à éviter ; préférez une nouvelle `<section>`.
