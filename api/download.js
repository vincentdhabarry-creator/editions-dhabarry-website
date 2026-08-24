const Stripe = require("stripe");
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");
const JSZip = require("jszip");
const { verify } = require("./_lib/downloadToken");

// Fichiers disponibles au téléchargement, par identifiant public (paramètre ?file=).
const PRODUCTS = {
  "ebook-mobile": {
    type: "pdf",
    path: path.join(process.cwd(), "downloads", "book_print_mobile.pdf"),
    filename: "IE_Intelligence_Emotionnelle_Mobile.pdf",
    label: "Ebook — PDF mobile",
  },
  "ebook-print": {
    type: "pdf",
    path: path.join(process.cwd(), "downloads", "book_print.pdf"),
    filename: "IE_Intelligence_Emotionnelle_Standard.pdf",
    label: "Ebook — PDF standard",
  },
  workbook: {
    type: "pdf",
    path: path.join(process.cwd(), "downloads", "workbook.pdf"),
    filename: "IE_Workbook.pdf",
    label: "Workbook pratique (64 pages)",
  },
  epub: {
    type: "epub",
    path: path.join(process.cwd(), "downloads", "livre.epub"),
    filename: "IE_Intelligence_Emotionnelle.epub",
    label: "Ebook — EPUB",
  },
};

async function watermarkPdf(bytes, stampText) {
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(stampText, {
      x: width / 2 - stampText.length * 3.2,
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

// Un PDF filigrane visuellement chaque page. Un EPUB (zip de fichiers texte)
// ne s'y prête pas de la même façon : on inscrit plutôt l'identité de
// l'acheteur dans les métadonnées internes (content.opf), pour que le
// fichier reste traçable en cas de partage sans altérer la lecture.
async function stampEpub(bytes, stampText) {
  const zip = await JSZip.loadAsync(bytes);
  const opfPath = "EPUB/content.opf";
  const opfContent = await zip.file(opfPath).async("string");
  const stamped = opfContent.replace(
    "</metadata>",
    `<meta property="dhabarry:licensed-to">${stampText}</meta></metadata>`
  );
  zip.file(opfPath, stamped);
  // Le fichier "mimetype" doit rester non compressé en première entrée
  // (spec EPUB/OCF) : generateAsync le compresserait sinon avec le reste.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  return zip.generateAsync({
    type: "nodebuffer",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
  });
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

  const product = PRODUCTS[file];
  if (!product) {
    return res.status(404).json({ error: "Fichier demandé introuvable." });
  }

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
    const stamped =
      product.type === "epub" ? await stampEpub(originalBytes, stamp) : await watermarkPdf(originalBytes, stamp);

    res.setHeader("Content-Type", product.type === "epub" ? "application/epub+zip" : "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${product.filename}"`);
    return res.status(200).send(Buffer.from(stamped));
  } catch (err) {
    console.error("Erreur génération du téléchargement:", err);
    return res.status(500).json({ error: "Impossible de générer le fichier." });
  }
};

module.exports.PRODUCTS = PRODUCTS;
