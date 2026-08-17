const Stripe = require("stripe");
const { Resend } = require("resend");
const fs = require("fs");
const path = require("path");

// Fichier livré à l'acheteur après paiement confirmé.
const EBOOK_FILE = path.join(process.cwd(), "downloads", "IE_Intelligence_Emotionnelle_Mobile.pdf");
const EBOOK_FILENAME = "IE_Intelligence_Emotionnelle.pdf";

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

async function sendEbookEmail(toEmail) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const pdfBase64 = fs.readFileSync(EBOOK_FILE).toString("base64");

  await resend.emails.send({
    from: process.env.FROM_EMAIL || "Lectura <onboarding@resend.dev>",
    to: toEmail,
    subject: "Votre ebook — L'Intelligence Émotionnelle",
    html: `
      <p>Merci pour votre achat auprès des Lectura !</p>
      <p>Vous trouverez votre ebook <strong>L'Intelligence Émotionnelle</strong> en pièce jointe de cet email, au format PDF.</p>
      <p>Bonne lecture,<br/>Lectura</p>
    `,
    attachments: [
      {
        filename: EBOOK_FILENAME,
        content: pdfBase64,
      },
    ],
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

    if (customerEmail) {
      try {
        await sendEbookEmail(customerEmail);
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
