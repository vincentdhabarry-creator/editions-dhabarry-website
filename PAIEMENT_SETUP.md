# Activer le paiement réel

Le code (Stripe Checkout + envoi automatique de l'ebook par email via Resend) est en place.
Il reste à créer les comptes et à renseigner les clés pour que ça devienne réellement fonctionnel.

## 1. Stripe (paiement)

1. Crée un compte sur https://dashboard.stripe.com (mode Test d'abord, tu passeras en mode Live une fois prêt).
2. Récupère ta clé secrète : **Développeurs > Clés API > Secret key** (`sk_test_...`).
3. Une fois le site déployé sur Vercel, va dans **Développeurs > Webhooks > Ajouter un endpoint** :
   - URL : `https://<ton-domaine>/api/webhook`
   - Événement à écouter : `checkout.session.completed`
4. Copie le **Signing secret** du webhook (`whsec_...`).

## 2. Resend (envoi de l'ebook par email)

1. Crée un compte sur https://resend.com.
2. Récupère une clé API (`re_...`).
3. En production, vérifie ton propre domaine dans Resend pour pouvoir envoyer depuis
   `commandes@editionsdhabarry.com` (ou l'adresse de ton choix). En attendant, l'adresse de test
   `onboarding@resend.dev` fonctionne mais n'est pas destinée à un usage réel prolongé.

## 3. Configurer les variables d'environnement sur Vercel

Dans le projet Vercel : **Settings > Environment Variables**, ajoute :

| Variable | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | ta clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | le signing secret du webhook |
| `RESEND_API_KEY` | ta clé API Resend |
| `FROM_EMAIL` | ex: `Editions Dhabarry <commandes@editionsdhabarry.com>` |
| `SITE_URL` | ex: `https://editionsdhabarry.vercel.app` |
| `DOWNLOAD_LINK_SECRET` | une valeur aléatoire unique (voir `.env.example` pour la générer) |

Redéploie ensuite le site pour que les variables soient prises en compte.

## 4. Tester

1. En mode Test Stripe, utilise la carte `4242 4242 4242 4242`, une date future, un CVC quelconque.
2. Passe une commande depuis `panier.html` ou `intelligence-emotionnelle.html`.
3. Vérifie que l'email arrive avec un bouton « Télécharger mon ebook » (voir section suivante).
4. Clique dessus : le PDF téléchargé doit être filigrané à ton adresse email de test.
5. Vérifie que `confirmation.html` affiche le bon montant et le bon email.
6. Une fois les tests concluants, remplace les clés Stripe `sk_test_...` par les clés `sk_live_...`
   (et refais un webhook Live, les secrets Test et Live sont différents).

## Fichier livré à l'acheteur

Après paiement, l'acheteur ne reçoit pas le PDF en pièce jointe : l'email contient un **lien de
téléchargement signé, valable 72h** (`api/webhook.js` génère le lien, `api/download.js` le vérifie
et sert le fichier). À chaque téléchargement, le PDF est **filigrané à la volée** avec l'email de
l'acheteur et son numéro de commande (via `pdf-lib`), pour dissuader le partage et permettre de
tracer l'origine d'une copie qui circulerait.

Cette limite dans le temps évite qu'un lien fixe reste utilisable indéfiniment s'il est partagé,
mais sans base de données il n'y a pas de limite au *nombre* de téléchargements pendant les 72h —
possible à ajouter plus tard (ex. avec Vercel KV / Upstash Redis) si besoin.

Les fichiers disponibles sont définis dans `api/download.js` (`PRODUCTS`) : PDF mobile, PDF
standard, EPUB et workbook (64 pages). Un EPUB ne peut pas être filigrané visuellement comme un PDF
(ce n'est pas des pages fixes) : l'email de l'acheteur est à la place inscrit dans les métadonnées
internes du fichier (`content.opf`), pour rester traçable sans perturber la lecture.

## Protection temporaire de la landing page

Tant que l'offre n'est pas officiellement en vente, `intelligence-emotionnelle.html` peut être
protégée par un mot de passe HTTP (via `middleware.js`, actif uniquement si la variable
`LANDING_PREVIEW_PASSWORD` est configurée sur Vercel — sinon la page reste publique). Ajoute :

| Variable | Valeur |
|---|---|
| `LANDING_PREVIEW_USER` | ex: `dhabarry` (optionnel, `dhabarry` par défaut) |
| `LANDING_PREVIEW_PASSWORD` | le mot de passe de ton choix |

Un navigateur affichera une demande d'identifiant/mot de passe standard avant d'afficher la page.
Retire (ou vide) `LANDING_PREVIEW_PASSWORD` quand tu es prêt à ouvrir la page au public.
