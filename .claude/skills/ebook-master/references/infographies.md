# Infographies en SVG

Les infographies sont dessinées en SVG directement dans le HTML du chapitre : nettes à l'impression, aux couleurs de la charte, sans outil externe. `render.js --figures` les exporte ensuite en PNG pour l'EPUB.

## Règles de dessin
- **Largeur `viewBox` = 400.** La hauteur suit le contenu (180 à 320 en général ; au-delà de 340 l'infographie risque de laisser un grand blanc en bas de la page précédente, car elle ne se coupe pas).
- **Texte : 9 minimum** (≈ 7,5 pt imprimé), 10–11 pour les libellés, 13–14 pour les chiffres et lettres des pastilles. Au-delà de 45 caractères, couper la ligne en deux `<text>`.
- **Couleurs uniquement par classes** : remplissage `f-dark f-acc f-accm f-accl f-sand f-mut f-bg f-text f-white f-gray f-line f-tint` ; contour `s-dark s-acc s-line s-gray s-white` ; dégradés `sc-sand sc-accl sc-acc sc-dark` sur les `<stop>`. Ainsi l'infographie change de couleurs avec la charte.
- **Police** : celle de l'interface par défaut ; `class="ff-head"` pour un grand chiffre ou une lettre de titre.
- **Une idée par infographie**, 3 à 6 éléments. Libellés courts, verbes d'action.
- **Pas de chiffre sans source.** Un graphique de données n'est fait qu'avec des données réelles et sourcées (mentionnées dans la légende).
- Vérifier sur la planche : aucun texte qui se chevauche ou dépasse, rien de coupé au bord.

## Modèles

### 1. Étapes verticales (processus, séquence) — hauteur ≈ 56 × étapes
```html
<svg viewBox="0 0 400 268" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="54" width="400" height="104" rx="10" class="f-accl" opacity=".6"/>   <!-- zone mise en évidence (facultatif) -->
  <text x="390" y="70" text-anchor="end" font-size="8.5" font-weight="800" letter-spacing="1.2" class="f-acc">FENÊTRE DE REPRISE</text>
  <line x1="30" y1="24" x2="30" y2="244" class="s-line" stroke-width="2" stroke-dasharray="3 4"/>
  <circle cx="30" cy="24" r="17" class="f-dark"/><text x="30" y="29" text-anchor="middle" font-size="13" font-weight="800" class="f-white">1</text>
  <text x="58" y="21" font-size="11" font-weight="700" class="f-dark">Le déclencheur</text>
  <text x="58" y="35" font-size="9.5" class="f-mut">Une remarque, un ton, un imprévu.</text>
  <!-- étape suivante : cy + 56, cercle f-acc / f-mut / f-dark selon l'importance -->
</svg>
```

### 2. Méthode en lettres ou en étapes horizontales (acronyme, 3 à 5 étapes)
```html
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <line x1="50" y1="48" x2="350" y2="48" class="s-gray" stroke-width="6" stroke-linecap="round"/>
  <g text-anchor="middle">
    <g transform="translate(50,0)"><circle cy="48" r="36" class="f-dark"/><text y="61" font-size="36" font-weight="900" class="ff-head f-white">S</text>
      <text y="106" font-size="10.5" font-weight="800" class="f-dark">S’arrêter</text>
      <text y="122" font-size="9" class="f-mut">Suspendez ce que</text><text y="134" font-size="9" class="f-mut">vous faites.</text></g>
    <!-- translate(150,0) f-acc · translate(250,0) f-accm · translate(350,0) f-mut  (4 étapes : pas de 100) -->
  </g>
  <rect x="50" y="160" width="300" height="28" rx="14" class="f-accl"/>
  <text x="200" y="178" text-anchor="middle" font-size="9.5" font-weight="700" class="f-acc">Durée : 30 à 60 secondes</text>
</svg>
```
Pour 3 étapes : x = 70, 200, 330 ; pour 5 : x = 40, 120, 200, 280, 360 avec r = 28.

### 3. Échelle d'intensité (0 à 10, niveaux, thermomètre)
```html
<svg viewBox="0 0 400 170" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g-echelle-1" x1="0" x2="1"><stop offset="0" class="sc-sand"/><stop offset=".45" class="sc-accl"/><stop offset=".75" class="sc-acc"/><stop offset="1" class="sc-dark"/></linearGradient></defs>
  <rect x="0" y="16" width="400" height="22" rx="11" fill="url(#g-echelle-1)"/>
  <g font-size="8.5" class="f-mut" text-anchor="middle"><text x="10" y="10">0</text><text x="100" y="10">3</text><text x="200" y="10">5</text><text x="300" y="10">7</text><text x="390" y="10">10</text></g>
  <g class="s-white" stroke-width="2"><line x1="100" y1="16" x2="100" y2="38"/><line x1="200" y1="16" x2="200" y2="38"/><line x1="300" y1="16" x2="300" y2="38"/></g>
  <g font-size="9.5" font-weight="800"><text x="2" y="60" class="f-mut">CALME</text><text x="104" y="60" class="f-accm">VIGILANCE</text><text x="204" y="60" class="f-acc">TENSION</text><text x="304" y="60" class="f-dark">DÉBORDEMENT</text></g>
  <g font-size="9" class="f-text"><text x="2" y="78">Tout va bien.</text><text x="104" y="78">Premier signal.</text><!-- 2 à 3 lignes par zone, 13 d'interligne, 17 caractères max par ligne --></g>
</svg>
```
**Identifiants uniques** : chaque `id` de dégradé ou de flèche doit être unique dans tout le livre (suffixez-les : `g-echelle-3a`).

### 4. Cycle (habitude, boucle, cercle vicieux/vertueux) — 3 à 5 étapes
```html
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="fl-cycle-1" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" class="f-acc"/></marker></defs>
  <circle cx="200" cy="150" r="100" fill="none" class="s-gray" stroke-width="2" stroke-dasharray="4 5"/>
  <path d="M262 72 A100 100 0 0 1 296 128" fill="none" class="s-acc" stroke-width="2.5" marker-end="url(#fl-cycle-1)"/>
  <!-- étapes aux angles −90°, 0°, 90°, 180° : (200,50) (300,150) (200,250) (100,150) -->
  <circle cx="200" cy="50" r="30" class="f-dark"/><text x="200" y="47" text-anchor="middle" font-size="9.5" font-weight="800" class="f-white">1. Signal</text><text x="200" y="60" text-anchor="middle" font-size="8.5" class="f-accl">déclencheur</text>
  <text x="200" y="155" text-anchor="middle" font-size="12" font-weight="800" class="ff-head f-acc">La boucle</text>
</svg>
```
Les libellés longs se placent à l'extérieur du cercle (x ± 45), alignés `start`/`end`.

### 5. Pyramide (priorités, niveaux, besoins) — 3 à 5 niveaux
```html
<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
  <polygon points="200,10 245,70 155,70" class="f-dark"/>
  <polygon points="155,76 245,76 285,136 115,136" class="f-acc"/>
  <polygon points="115,142 285,142 325,202 75,202" class="f-accm"/>
  <text x="200" y="55" text-anchor="middle" font-size="10" font-weight="800" class="f-white">Sens</text>
  <text x="200" y="111" text-anchor="middle" font-size="10" font-weight="800" class="f-white">Relations</text>
  <text x="200" y="177" text-anchor="middle" font-size="10" font-weight="800" class="f-white">Corps</text>
  <text x="200" y="232" text-anchor="middle" font-size="9" class="f-mut">On construit par la base.</text>
</svg>
```

### 6. Chronologie (étapes dans le temps, plan sur 30 jours)
```html
<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="50" x2="380" y2="50" class="s-line" stroke-width="3"/>
  <g text-anchor="middle">
    <circle cx="40" cy="50" r="9" class="f-acc"/><text x="40" y="30" font-size="10" font-weight="800" class="f-dark">J1</text>
    <text x="40" y="75" font-size="9" class="f-text">Observer</text><text x="40" y="88" font-size="9" class="f-mut">sans juger</text>
    <!-- jalons suivants : x = 120, 200, 280, 360 -->
  </g>
</svg>
```

### 7. Matrice 2 × 2 (classer, décider)
```html
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="10" width="175" height="130" rx="8" class="f-acc"/><rect x="220" y="10" width="175" height="130" rx="8" class="f-accl"/>
  <rect x="40" y="145" width="175" height="130" rx="8" class="f-sand"/><rect x="220" y="145" width="175" height="130" rx="8" class="f-gray"/>
  <text x="127" y="40" text-anchor="middle" font-size="11" font-weight="800" class="f-white">Agir maintenant</text>
  <!-- un titre + 2 lignes par case ; axes : texte vertical à x=20 (transform="rotate(-90 20 140)") et horizontal sous la grille -->
  <text x="217" y="292" text-anchor="middle" font-size="9" class="f-mut">← moins important · plus important →</text>
</svg>
```

## Graphiques de données (seulement avec des chiffres sourcés)
Barres simples : un `<rect>` par valeur, hauteur proportionnelle, valeur écrite au-dessus, source en `figcaption`. Pour des graphiques complexes, des bibliothèques libres existent (Apache ECharts, Chart.js, Vega-Lite, Mermaid pour les schémas) : générer un SVG statique et l'insérer comme ci-dessus.
