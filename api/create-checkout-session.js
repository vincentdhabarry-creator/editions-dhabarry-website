const Stripe = require("stripe");

const EBOOK = {
  name: "L'Intelligence Émotionnelle — Editions Dhabarry",
  description: "Ebook au format PDF — livraison immédiate par email après paiement.",
  unitAmount: 2990, // 29,90 € in cents
  currency: "eur",
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Paiement non configuré (STRIPE_SECRET_KEY manquante)." });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: EBOOK.currency,
            product_data: {
              name: EBOOK.name,
              description: EBOOK.description,
            },
            unit_amount: EBOOK.unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/confirmation.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/ebook-intelligence-emotionnelle.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Erreur création session Stripe:", err);
    return res.status(500).json({ error: "Impossible de créer la session de paiement." });
  }
};
