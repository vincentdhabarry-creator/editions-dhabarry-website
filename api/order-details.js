const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: "session_id manquant." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Paiement non configuré (STRIPE_SECRET_KEY manquante)." });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.status(200).json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      customer_email: session.customer_details ? session.customer_details.email : null,
    });
  } catch (err) {
    console.error("Erreur récupération session Stripe:", err);
    return res.status(404).json({ error: "Commande introuvable." });
  }
};
