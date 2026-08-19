const Stripe = require("stripe");
const { Resend } = require("resend");
const { createDownloadToken } = require("./_lib/downloadToken");

const config = {
  api: {
    bodyParser: false, // la vérification de signature Stripe exige le corps brut de la requête
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Le fichier n'est jamais joint tel quel : on envoie un lien de téléchargement
// signé, à durée limitée (72h), qui génère un PDF filigrané au nom de
// l'acheteur au moment du clic (voir api/download.js). Ça évite qu'un lien
// fixe circule indéfiniment et rend le fichier traçable s'il est partagé.
async function sendEbookEmail(toEmail, sessionId, siteUrl) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  if (!process.env.DOWNLOAD_LINK_SECRET) {
    throw new Error("DOWNLOAD_LINK_SECRET manquante : impossible de générer un lien de téléchargement sécurisé.");
  }

  const token = createDownloadToken({ sessionId, secret: process.env.DOWNLOAD_LINK_SECRET });
  const downloadUrl = `${siteUrl}/api/download?file=ebook-mobile&token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL || "Editions Dhabarry <onboarding@resend.dev>",
    to: toEmail,
    subject: "Votre ebook — L'Intelligence Émotionnelle",
    html: `
      <p>Merci pour votre achat auprès des Éditions Dhabarry !</p>
      <p>Votre ebook <strong>L'Intelligence Émotionnelle</strong> vous attend, personnalisé à votre nom :</p>
      <p><a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#0b1b33;color:#fff;text-decoration:none;border-radius:4px;">Télécharger mon ebook (PDF)</a></p>
      <p style="font-size:12px;color:#666;">Ce lien est valable 72 heures. Passé ce délai, contactez-nous pour en recevoir un nouveau.</p>
      <p>Bonne lecture,<br/>Editions Dhabarry</p>
    `,
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Méthode non autorisée.");
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Webhook Stripe appelé mais STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET manquantes.");
    return res.status(500).end("Webhook non configuré.");
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Signature webhook Stripe invalide:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerEmail = session.customer_details && session.customer_details.email;
    const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

    if (customerEmail) {
      try {
        await sendEbookEmail(customerEmail, session.id, siteUrl);
      } catch (err) {
        console.error("Échec de l'envoi de l'ebook par email:", err);
        return res.status(500).send("Email delivery failed");
      }
    } else {
      console.error("checkout.session.completed sans email client:", session.id);
    }
  }

  return res.status(200).json({ received: true });
};

module.exports.config = config;
