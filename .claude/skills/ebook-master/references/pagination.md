# Pagination : corriger ce que signale le contrôle

`render.js` vérifie chaque page et écrit `build/qa.json`. Tout problème bloquant se corrige avant livraison ; regardez ensuite **toutes** les planches PNG, car certains défauts ne se voient qu'à l'œil.

Les règles CSS anti-coupure sont déjà dans `assets/book.css` : titres jamais séparés de la suite (`break-after: avoid`), blocs à sens jamais coupés (`break-inside: avoid` sur encadrés, cas, comparatifs, fiches, exercices, figures), paragraphes protégés contre les lignes isolées (`orphans/widows: 3`), chaque section sur une nouvelle page.

| Signalement | Cause habituelle | Correction |
|---|---|---|
| **Titre orphelin** | Bloc insécable très haut juste après un titre | Mettre un paragraphe d'introduction entre le titre et le bloc, ou raccourcir le bloc |
| **Bloc coupé** | Bloc plus haut qu'une page, ou `<table>` | Raccourcir (comparatif ≤ 6 lignes, cas ≤ 4 rangées), scinder en deux blocs, remplacer `<table>` par `.cmp` ou `.grille-ex` |
| **`<table>` détecté** | Paged.js coupe les tableaux et peut isoler l'en-tête | Toujours remplacer par la grille `.cmp` / `.grille-ex` |
| **Débordement** | Infographie trop haute, image trop grande | Réduire la hauteur du `viewBox`, découper l'infographie |
| **Page vide** | `<section>` vide ou `.saut` en trop | Supprimer la section ou le saut |
| **Page peu remplie** (à regarder) | Bloc insécable repoussé à la page suivante | Déplacer le bloc plus loin dans le texte (après un ou deux paragraphes), ou déplacer un encadré court avant lui ; une fin de section à mi-page est normale |

Astuce : quand un grand bloc (infographie, cas pratique) laisse un blanc, déplacez-le d'un paragraphe ou deux plutôt que de le réduire : le texte remplit le trou. Après chaque correction, relancez `render.js` (le moindre changement décale les pages suivantes).

Pages blanches **voulues** : celles qu'insère Paged.js pour qu'un chapitre commence sur une page de droite (`qa.json → pages_blanches_voulues`) ; elles sont normales dans l'édition imprimée.
