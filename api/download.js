const Stripe = require("stripe");
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");
const { verify } = require("./_lib/downloadToken");

// Fichiers disponibles au téléchargement, par identifiant public.
const PRODUCTS = {
  "ebook-mobile": {
    path: path.join(process.cwd(), "downloads", "IE_Intelligence_Emotionnelle_Mobile.pdf"),
    filename: "IE_Intelligence_Emotionnelle.pdf",
  },
};

async function watermarkPdf(bytes, stampText) {
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(stampText, {
      x: width / 2 - (stampText.length * 3.2),
      y: height / 2,
      size: 11,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.18,
      rotate: degrees(35),
    });
    page.drawText(stampText, {
      x: 20,
      y: 14,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.5,
    });
  });

  return pdfDoc.save();
}

module.exports = async function handler(req, res) {
  const { token, file } = req.query;

  if (!process.env.DOWNLOAD_LINK_SECRET) {
    return res.status(500).json({ error: "Téléchargement non configuré (DOWNLOAD_LINK_SECRET manquante)." });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Paiement non configuré (STRIPE_SECRET_KEY manquante)." });
  }

  let payload;
  try {
    payload = verify(token, process.env.DOWNLOAD_LINK_SECRET);
  } catch (err) {
    return res.status(403).json({ error: `Lien de téléchargement invalide : ${err.message}` });
  }

  const product = PRODUCTS[file] || PRODUCTS["ebook-mobile"];

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(payload.sid);
  } catch (err) {
    return res.status(404).json({ error: "Commande introuvable." });
  }

  if (session.payment_status !== "paid") {
    return res.status(403).json({ error: "Cette commande n'est pas confirmée comme payée." });
  }

  const buyerEmail = (session.customer_details && session.customer_details.email) || "acheteur";
  const stamp = `${buyerEmail} — commande ${session.id.slice(-8).toUpperCase()}`;

  try {
    const originalBytes = fs.readFileSync(product.path);
    const watermarked = await watermarkPdf(originalBytes, stamp);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${product.filename}"`);
    return res.status(200).send(Buffer.from(watermarked));
  } catch (err) {
    console.error("Erreur génération du téléchargement:", err);
    return res.status(500).json({ error: "Impossible de générer le fichier." });
  }
};
