#!/usr/bin/env node
/* Couverture ebook 1600×2560 (JPG) aux couleurs de la charte, + vignette de contrôle 200 px.
   Usage : node cover.js livre.json [--out build]
   livre.json → "couverture": { "modele": "classique|moderne|photo|minimal", "image": "chemin.jpg", "bandeau": "Méthode en 21 jours" }
   Prérequis : build_book.py lancé avant (il écrit build/livre.meta.json avec la charte calculée). */
const path = require("path"), fs = require("fs");
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) { console.error("Playwright est requis : npm i playwright"); process.exit(2); }
const args = process.argv.slice(2);
const livre = path.resolve(args.find(a => !a.startsWith("--")) || "livre.json");
const base = path.dirname(livre);
const oi = args.indexOf("--out"); const OUT = oi >= 0 ? path.resolve(args[oi + 1]) : path.join(base, "build");
const L = JSON.parse(fs.readFileSync(livre, "utf8"));
const metaPath = path.join(OUT, "livre.meta.json");
if (!fs.existsSync(metaPath)) { console.error("Lancez d'abord build_book.py (charte manquante)."); process.exit(2); }
const C = JSON.parse(fs.readFileSync(metaPath, "utf8")).charte;
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "chartes.json"), "utf8"));
const cv = L.couverture || {};
const modele = cv.modele || "classique";
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let img = "";
if (cv.image) { const p = path.resolve(base, cv.image); if (fs.existsSync(p)) img = "data:image/" + (p.endsWith(".png") ? "png" : "jpeg") + ";base64," + fs.readFileSync(p).toString("base64"); }
const fams = [...new Set([C.head, C.body, C.ui])].filter(f => data.polices_google[f]);
const gf = "https://fonts.googleapis.com/css2?" + fams.map(f => "family=" + data.polices_google[f]).join("&") + "&display=swap";

const css = `
*{box-sizing:border-box;margin:0}
body{width:1600px;height:2560px;overflow:hidden}
.c{position:relative;width:1600px;height:2560px;overflow:hidden;background:${C.dark};color:#fff;font-family:"${C.ui}",sans-serif}
.img{position:absolute;inset:0;background:url(${img}) center/cover}
.voile{position:absolute;inset:0}
.titre{font-family:"${C.head}",serif;font-weight:700;line-height:1.05;letter-spacing:-.01em}
.st{font-family:"${C.head}",serif;font-style:italic;font-size:64px;line-height:1.3}
.au{font-weight:700;font-size:54px;letter-spacing:.2em;text-transform:uppercase}
.band{display:inline-block;font-weight:800;font-size:40px;letter-spacing:.14em;text-transform:uppercase;padding:18px 36px;border-radius:60px}
.ed{font-size:34px;letter-spacing:.25em;text-transform:uppercase;opacity:.75}
.zone{position:absolute}
/* classique */
.classique{background:${C.dark}}
.classique .cadre{position:absolute;inset:70px;border:5px solid ${C.accent}}
.classique .cadre2{position:absolute;inset:92px;border:1.5px solid ${C.accent_l};opacity:.5}
.classique .zone{left:190px;right:190px;top:560px;bottom:300px;text-align:center;display:flex;flex-direction:column;align-items:center}
.classique .titre{color:#fff}
.classique .filet{width:180px;height:5px;background:${C.accent};margin:70px auto}
.classique .st{color:${C.sand}}
.classique .au{position:absolute;bottom:230px;left:0;right:0;text-align:center;color:${C.accent_l}}
.classique .band{background:${C.accent};color:#fff;position:absolute;top:220px;left:50%;transform:translateX(-50%)}
/* moderne */
.moderne{background:${C.sand};color:${C.dark}}
.moderne .rond{position:absolute;width:1300px;height:1300px;border-radius:50%;background:${C.accent};right:-560px;top:-520px}
.moderne .rond2{position:absolute;width:800px;height:800px;border-radius:50%;background:${C.accent_l};left:-380px;bottom:-330px}
.moderne .zone{left:140px;right:140px;top:820px;bottom:420px}
.moderne .titre{color:${C.dark};font-weight:900}
.moderne .filet{width:220px;height:16px;background:${C.accent};margin:70px 0 60px}
.moderne .st{color:${C.dark};font-style:normal;font-family:"${C.ui}",sans-serif;font-size:58px}
.moderne .au{position:absolute;left:140px;bottom:150px;color:${C.dark};letter-spacing:.12em}
.moderne .band{background:${C.dark};color:#fff;position:absolute;left:140px;top:200px}
/* photo */
.photo{background:${C.dark}}
.photo .voile{background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,0) 35%,rgba(0,0,0,.75) 100%)}
.photo .zone{left:120px;right:120px;bottom:300px;text-align:center}
.photo .titre{color:#fff;text-shadow:0 6px 40px rgba(0,0,0,.45)}
.photo .st{color:#fff;margin-top:50px}
.photo .au{position:absolute;top:170px;left:0;right:0;text-align:center;color:#fff}
.photo .band{background:${C.accent};color:#fff;margin-top:60px}
/* minimal */
.minimal{background:${C.bg};color:${C.dark}}
.minimal .zone{left:200px;right:200px;top:700px;bottom:500px;text-align:center}
.minimal .titre{color:${C.dark};font-weight:400}
.minimal .filet{width:180px;height:3px;background:${C.accent};margin:70px auto}
.minimal .st{color:${C.muted}}
.minimal .au{position:absolute;top:240px;left:0;right:0;text-align:center;color:${C.dark};font-weight:500;letter-spacing:.3em;font-size:40px}
.minimal .band{color:${C.accent};position:absolute;bottom:200px;left:50%;transform:translateX(-50%);white-space:nowrap}
.minimal .img{inset:auto;left:420px;right:420px;bottom:600px;height:700px;border:3px solid ${C.accent}}
`;
const T = esc(L.titre), ST = esc(L.sous_titre), AU = esc(L.auteur), B = esc(cv.bandeau);
const parts = {
  classique: `<div class="cadre"></div><div class="cadre2"></div>${B ? `<div class="band">${B}</div>` : ""}<div class="zone"><div class="titre fit">${T}</div><div class="filet"></div>${ST ? `<div class="st">${ST}</div>` : ""}</div><div class="au">${AU}</div>`,
  moderne: `${img ? '<div class="img" style="top:55%"></div>' : ""}<div class="rond"></div><div class="rond2"></div>${B ? `<div class="band">${B}</div>` : ""}<div class="zone"><div class="titre fit">${T}</div><div class="filet"></div>${ST ? `<div class="st">${ST}</div>` : ""}</div><div class="au">${AU}</div>`,
  photo: `${img ? '<div class="img"></div>' : `<div class="img" style="background:linear-gradient(160deg,${C.dark},${C.accent})"></div>`}<div class="voile"></div><div class="au">${AU}</div><div class="zone"><div class="titre fit">${T}</div>${ST ? `<div class="st">${ST}</div>` : ""}${B ? `<div class="band">${B}</div>` : ""}</div>`,
  minimal: `<div class="au">${AU}</div>${img ? '<div class="img"></div>' : ""}<div class="zone" ${img ? 'style="top:420px;bottom:1400px"' : ""}><div class="titre fit">${T}</div><div class="filet"></div>${ST ? `<div class="st">${ST}</div>` : ""}</div>${B ? `<div class="band">${B}</div>` : ""}`,
};
if (!parts[modele]) { console.error(`Modèle inconnu « ${modele} » (classique, moderne, photo, minimal)`); process.exit(2); }
const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${gf}"><style>${css}</style></head>
<body><div class="c ${modele}">${parts[modele]}</div>
<script>
// ajuste la taille du titre pour qu'il tienne (4 lignes max) dans sa zone
window.__fit = async function(){
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 4000))]); } catch(e) {}
  const t = document.querySelector('.fit'), z = t.closest('.zone');
  let s = ${Math.round(190 * (cv.taille || 1))};
  t.style.fontSize = s + 'px';
  const tooBig = () => t.scrollWidth > z.clientWidth + 2 || t.offsetHeight > s * 1.06 * 4 + 4 || z.scrollHeight > z.clientHeight + 2;
  while (tooBig() && s > 70) { s -= 4; t.style.fontSize = s + 'px'; }
  return s;
};
</script></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 2560 } });
  await p.setContent(doc, { waitUntil: "networkidle" }).catch(() => {});
  const size = await p.evaluate(() => window.__fit());
  const dest = path.join(OUT, "couverture.jpg");
  await p.screenshot({ path: dest, type: "jpeg", quality: 92 });
  const th = await b.newPage({ viewport: { width: 200, height: 320 } });
  await th.setContent(`<body style="margin:0"><img src="data:image/jpeg;base64,${fs.readFileSync(dest).toString("base64")}" style="width:200px;height:320px"></body>`);
  await th.screenshot({ path: path.join(OUT, "couverture-vignette.png") });
  await b.close();
  console.log(`✓ ${dest} (1600×2560, modèle « ${modele} », titre ${size} px) + couverture-vignette.png : vérifiez que le titre reste lisible en vignette.`);
})().catch(e => { console.error(e); process.exit(2); });
