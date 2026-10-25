# Chartes graphiques

Une charte = 5 couleurs de base + 3 polices. Toutes les nuances (fonds d'encadrés, dégradés, filets) sont calculées par `build_book.py`, ce qui garantit un ensemble harmonieux. Les définitions sont dans `assets/chartes.json`.

| Clé | Nom | Pour quels thèmes | Titres / Texte / Interface |
|---|---|---|---|
| `dhabarry` | Dhabarry Classique (brun, rouge brique, crème) | Psychologie, développement personnel, essai | Playfair Display / Source Serif 4 / Inter |
| `serenite` | Sérénité (vert profond, sauge) | Bien-être, méditation, santé, spiritualité | Cormorant Garamond / Lora / Nunito Sans |
| `business` | Business Pro (marine, or) | Entrepreneuriat, finance, carrière, management | Montserrat / Source Serif 4 / Inter |
| `energie` | Énergie (noir, orange vif) | Sport, motivation, productivité, nutrition | Poppins / Literata / Poppins |
| `digital` | Digital (nuit, violet électrique) | Tech, IA, marketing en ligne, freelancing | Space Grotesk / IBM Plex Serif / IBM Plex Sans |
| `famille` | Famille (bleu, corail) | Parentalité, éducation, jeunesse, couple | Fredoka / Nunito / Nunito |

Choix par défaut : la charte de la maison (`dhabarry`) pour une collection cohérente ; sinon la charte du thème.

## Charte sur mesure
Dans `livre.json`, `"charte"` peut être un objet :
```json
"charte": { "nom": "Cuisine du Sud", "dark": "#3b2a1e", "accent": "#c4622d", "text": "#2a221c", "sand": "#f3e3cf", "muted": "#6e5f52",
            "head": "Playfair Display", "body": "Lora", "ui": "Nunito Sans" }
```
Règles pour qu'elle fonctionne :
- `dark` : très foncé (fond des ouvertures et des fiches récap, texte blanc dessus) ; contraste ≥ 7:1 avec le blanc.
- `accent` : couleur vive mais lisible en petit sur blanc (contraste ≥ 4,5:1) : elle sert aux intertitres et étiquettes.
- `text` : quasi noir, légèrement teinté vers `dark`.
- `sand` : fond très clair (cas pratiques) ; `muted` : gris coloré pour les légendes.
- Polices : uniquement des familles Google Fonts présentes dans `chartes.json` (ajoutez-y la famille et sa police de secours si besoin). Un titre très décoratif se réserve aux titres ; le texte courant reste une police de lecture.

À partir d'une photo de couverture ou d'un logo : relever la couleur dominante foncée (→ `dark`) et la couleur vive principale (→ `accent`), vérifier les contrastes, dériver `sand` (accent très éclairci) et `muted`.

Impression : l'intérieur en couleur coûte nettement plus cher en livre broché (KDP). Pour un broché noir et blanc, choisir une charte dont `accent` reste distinct en niveaux de gris, ou prévoir une version sobre.
