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
| `FROM_EMAIL` | ex: `Lectura <commandes@editionsdhabarry.com>` |
| `SITE_URL` | ex: `https://editionsdhabarry.vercel.app` |

Redéploie ensuite le site pour que les variables soient prises en compte.

## 4. Tester

1. En mode Test Stripe, utilise la carte `4242 4242 4242 4242`, une date future, un CVC quelconque.
2. Passe une commande depuis `panier.html`.
3. Vérifie que l'email avec le PDF en pièce jointe arrive bien.
4. Vérifie que `confirmation.html` affiche le bon montant et le bon email.
5. Une fois les tests concluants, remplace les clés Stripe `sk_test_...` par les clés `sk_live_...`
   (et refais un webhook Live, les secrets Test et Live sont différents).

## Fichier livré à l'acheteur

Le fichier envoyé après paiement est défini dans `api/webhook.js` (`EBOOK_FILE`) :
actuellement `downloads/IE_Intelligence_Emotionnelle_Mobile.pdf`. Change ce chemin si tu veux
livrer un autre fichier (par ex. une version « print » de meilleure qualité).
