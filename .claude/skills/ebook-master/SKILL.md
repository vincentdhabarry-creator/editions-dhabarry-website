---
name: ebook-master
description: Écrire et mettre en page un ebook professionnel en français, prêt à vendre (PDF imprimable couleur, EPUB 3, couverture), avec une écriture naturelle sans tics d'IA, des chartes graphiques par thème, des encadrés conseils, des cas pratiques, des exercices et des infographies vectorielles. À utiliser dès que l'utilisateur veut écrire, rédiger, réécrire, structurer, illustrer ou mettre en page un ebook, un livre, un guide, un workbook ou un chapitre — y compris « fais-moi un ebook sur… », « écris le chapitre 3 », « mets mon manuscrit en page », « ajoute des infographies », « change la charte graphique », « humanise ce texte », « enlève le style IA » — même si le format de sortie n'est pas précisé.
---

# Ebook Master (Éditions Dhabarry)

Ce skill produit des ebooks que l'on peut vendre sans rougir : un texte qui sonne comme un auteur, pas comme un modèle de langage, et une mise en page d'éditeur qui ne casse jamais entre deux pages.

Deux idées guident tout le reste :

1. **Le lecteur paie pour une expertise et une voix.** Un texte générique, gonflé de formules creuses, se repère en trois lignes et récolte de mauvais avis. Chaque paragraphe doit apprendre quelque chose ou faire avancer le lecteur.
2. **Une mise en page se vérifie page par page.** Un titre seul en bas de page ou un tableau coupé en deux suffisent à faire « amateur ». Les contrôles automatiques ne voient pas tout : on regarde aussi les pages.

## Flux de travail

### 1. Cadrer (avant d'écrire une ligne)
Récupère ou demande, en une seule fois et brièvement :
- sujet et **promesse** (« après lecture, le lecteur saura… ») ;
- lecteur visé (niveau, situation, ce qui l'empêche d'avancer) ;
- longueur (guide court 30–50 p. ou livre 120 p. +) et format (6×9 po par défaut) ;
- **matière de l'auteur** : anecdotes, méthode, exemples, cas clients, convictions. C'est elle qui rend le livre unique ; demande-la explicitement et utilise-la en priorité ;
- charte graphique (voir `references/chartes.md`, sinon propose celle qui correspond au thème).

Si l'utilisateur veut aller vite, pars d'hypothèses raisonnables, annonce-les en une phrase et avance.

### 2. Construire le plan
Propose le plan (titres de parties/chapitres + une phrase de promesse par chapitre) et fais-le valider avant de rédiger un livre entier. Pour un seul chapitre, inutile.

### 3. Rédiger
Lis **`references/ecriture-sans-ia.md` avant de rédiger** (règles et liste des tics à proscrire) et **`references/methode-ebook.md`** (anatomie d'un chapitre, cas pratiques, conseils, exercices, règles d'honnêteté).

Écris chaque chapitre en HTML dans `chapitres/NN-titre.html` en utilisant les composants de `references/composants.md` (encadrés, cas pratique, comparatif, fiche récap, exercice). Les infographies se dessinent en SVG d'après `references/infographies.md`.

Après chaque chapitre, lance le contrôle de style et corrige ce qu'il relève :
```bash
python3 scripts/lint_style.py chapitres/
```
Le script repère les tics d'IA les plus fréquents et les fautes de typographie française ; il ne remplace pas une relecture : relis ensuite le chapitre à voix haute (mentalement) en suivant la passe d'audit décrite dans `ecriture-sans-ia.md`.

### 4. Assembler et mettre en page
Décris le livre dans `livre.json` (exemple : `assets/livre.exemple.json`) : métadonnées, charte, ordre des chapitres, pages liminaires. Puis :
```bash
python3 scripts/build_book.py livre.json            # → build/livre.html
node scripts/render.js build/livre.html             # → build/livre.pdf + contrôle des pages + planches PNG
```
`render.js` a besoin de Playwright/Chromium (`npm i playwright` si absent ; Paged.js est fourni dans `assets/vendor/`). Il écrit `build/qa.json` et des planches `build/planche-*.png`.

### 5. Contrôler (bloquant)
- `build/qa.json` doit indiquer **0 page vide non voulue, 0 titre orphelin, 0 bloc coupé, 0 débordement**. Sinon corrige (voir `references/pagination.md`) et relance.
- **Regarde toutes les planches PNG** : c'est ce contrôle visuel qui attrape ce que les scripts ratent (en-tête de tableau isolé, grand blanc avant une infographie, texte d'infographie qui se chevauche).
- Si `qa_check_pdf.py` du skill `print-ready-ebook-pdf` est disponible, lance-le aussi sur le PDF final.

Les pages blanches ajoutées pour faire commencer un chapitre en page de droite sont normales ; signale-les comme voulues.

### 6. Exporter
```bash
node scripts/render.js build/livre.html --figures   # exporte aussi chaque infographie en PNG (pour l'EPUB)
python3 scripts/build_epub.py livre.json            # → build/livre.epub (EPUB 3)
node scripts/cover.js livre.json                    # → build/couverture.jpg (1600×2560)
```
Si `epubcheck` est installé (`pip install epubcheck`), valide l'EPUB et corrige jusqu'à 0 erreur.

### 7. Livrer
Livre le PDF, l'EPUB, la couverture et une planche d'aperçu. Dans le message : ce qui a été vérifié (avec les chiffres réels), ce qui reste à valider par l'auteur (faits, citations, cas illustratifs), et rappelle que **KDP demande de déclarer un contenu généré par IA**.

## Règles d'honnêteté (non négociables)
- **Aucun chiffre, étude, date ou citation inventés.** Une statistique sans source vérifiable ne va pas dans le livre. En cas de doute sur une attribution, écris « citation couramment attribuée à… » ou retire-la.
- **Les cas pratiques inventés sont signalés** comme illustratifs. Ceux de l'auteur passent en priorité.
- **Pas de promesse médicale, financière ou juridique** ; renvoie vers un professionnel quand le sujet l'exige.

## Fichiers de référence
| Fichier | Quand le lire |
|---|---|
| `references/ecriture-sans-ia.md` | Avant toute rédaction ou réécriture (« humaniser un texte ») |
| `references/methode-ebook.md` | Avant de rédiger un chapitre |
| `references/composants.md` | Pour écrire le HTML des chapitres |
| `references/infographies.md` | Pour chaque infographie |
| `references/chartes.md` | Pour choisir ou créer une charte graphique |
| `references/pagination.md` | Quand le contrôle des pages signale un problème |
