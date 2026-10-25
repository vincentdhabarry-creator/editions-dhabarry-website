#!/usr/bin/env node
/* Met en page le livre (Paged.js dans Chromium), contrôle chaque page, produit le PDF et des planches PNG.
   Usage : node render.js build/livre.html [--figures] [--no-pdf]
   Sorties (dans le dossier du HTML) : livre.pdf, qa.json, pages/p-NNN.png, planche-N.png, figs/fig-NNN.png (--figures)
   Code de sortie 1 si un problème bloquant est détecté. */
const path = require("path"), fs = require("fs");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { console.error("Playwright est requis : npm i playwright (puis, si besoin, npx playwright install chromium)"); process.exit(2); }

const args = process.argv.slice(2);
const file = path.resolve(args.find(a => !a.startsWith("--")) || "build/livre.html");
const OUT = path.dirname(file);
const FIGS = args.includes("--figures"), NOPDF = args.includes("--no-pdf");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("file://" + file);
  await page.waitForFunction("window.__paged", null, { timeout: 300000 });
  await page.waitForTimeout(800);

  // ---------- contrôle de toutes les pages ----------
  const qa = await page.evaluate(() => {
    const pages = [...document.querySelectorAll(".pagedjs_page")];
    const r = { pages: pages.length, pages_blanches_voulues: [], pages_vides: [], titres_orphelins: [], blocs_coupes: [], debordements: [], tableaux: [], pages_peu_remplies: [] };
    const HEAD = "h2,h3,h4,.info-t,.info-h,.box .hd,.exo .hd,.cas .hd";
    const PROTECT = ".box,.cas,.cmp,.recap,.exo,figure,.pull,.grille-ex,.lignes,table";
    const txt = el => (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 70);
    pages.forEach((pg, i) => {
      const n = i + 1;
      if (pg.classList.contains("pagedjs_blank_page")) { r.pages_blanches_voulues.push(n); return; }
      const c = pg.querySelector(".pagedjs_page_content"); if (!c) return;
      const hasMedia = c.querySelector("svg,img,.op,.pt,.lignes,.grille-ex");
      if (c.textContent.replace(/\s+/g, "").length < 3 && !hasMedia) { r.pages_vides.push(n); return; }
      // dernier bloc visible de la page
      const blocks = [...c.querySelectorAll("p,li," + HEAD + ",figure,.cmp,.recap,.exo,.cas,.pull,.lignes,.grille-ex")]
        .filter(e => e.getBoundingClientRect().height > 0 && !e.closest(".op,.pt,.sommaire,.titre-livre")
          && !(e.parentElement && e.parentElement.closest("figure,.box,.exo,.cas,.recap,.cmp,.pull"))); // un bloc insécable compte comme un tout
      const last = blocks[blocks.length - 1];
      if (last && last.matches(HEAD)) { r.titres_orphelins.push({ page: n, texte: txt(last) }); }
      // blocs protégés coupés entre deux pages
      c.querySelectorAll(PROTECT).forEach(e => {
        if (e.hasAttribute("data-split-from") || e.hasAttribute("data-split-to")) r.blocs_coupes.push({ page: n, bloc: e.className || e.tagName.toLowerCase(), texte: txt(e) });
      });
      c.querySelectorAll("table").forEach(t => r.tableaux.push({ page: n, texte: txt(t) }));
      // débordements
      const cr = c.getBoundingClientRect();
      c.querySelectorAll("figure,svg,img,.box,.cas,.cmp,.recap,.exo,.op").forEach(e => {
        const b = e.getBoundingClientRect();
        if (b.right > cr.right + 3 || b.bottom > cr.bottom + 3) r.debordements.push({ page: n, bloc: e.className && e.className.baseVal === undefined ? e.className : e.tagName.toLowerCase(), texte: txt(e) });
      });
      // pages peu remplies au milieu d'une section
      const nx = pages[i + 1];
      const finSection = !nx || nx.classList.contains("pagedjs_blank_page") || nx.querySelector(".pagedjs_page_content section:not([data-split-from])");
      if (last && !finSection && !c.querySelector(".op,.pt")) {
        const cov = (last.getBoundingClientRect().bottom - cr.top) / (cr.height || 1);
        if (cov < 0.6) r.pages_peu_remplies.push({ page: n, remplissage: Math.round(cov * 100) + " %" });
      }
    });
    // dédoublonne les blocs coupés (signalés sur chaque page)
    const seen = new Set(); r.blocs_coupes = r.blocs_coupes.filter(b => { const k = b.bloc + b.texte; if (seen.has(k)) return false; seen.add(k); return true; });
    return r;
  });
  qa.erreurs_js = errors;
  const bloquant = qa.pages_vides.length + qa.titres_orphelins.length + qa.blocs_coupes.length + qa.debordements.length + qa.tableaux.length + errors.length;
  qa.statut = bloquant ? "À CORRIGER" : "OK";
  fs.writeFileSync(path.join(OUT, "qa.json"), JSON.stringify(qa, null, 1));

  // ---------- PDF ----------
  if (!NOPDF) await page.pdf({ path: path.join(OUT, "livre.pdf"), preferCSSPageSize: true, printBackground: true });

  // ---------- captures des pages & planches ----------
  const pdir = path.join(OUT, "pages"); fs.rmSync(pdir, { recursive: true, force: true }); fs.mkdirSync(pdir, { recursive: true });
  const els = await page.$$(".pagedjs_page");
  const shots = [];
  for (let i = 0; i < els.length; i++) {
    const f = path.join(pdir, `p-${String(i + 1).padStart(3, "0")}.png`);
    await els[i].screenshot({ path: f }); shots.push(f);
  }
  fs.readdirSync(OUT).filter(f => /^planche-\d+\.png$/.test(f)).forEach(f => fs.unlinkSync(path.join(OUT, f)));
  const per = 8;
  for (let k = 0; k * per < shots.length; k++) {
    const imgs = shots.slice(k * per, k * per + per).map((f, j) =>
      `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${k * per + j + 1}</figcaption></figure>`).join("");
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
    await sheet.setContent(`<style>body{margin:0;background:#3a342e;font:14px sans-serif;color:#ddd}
      .g{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:18px}figure{margin:0;text-align:center}
      img{width:100%;box-shadow:0 4px 14px rgba(0,0,0,.5);background:#fff}</style><div class="g">${imgs}</div>`);
    await sheet.waitForTimeout(300);
    await sheet.screenshot({ path: path.join(OUT, `planche-${k + 1}.png`), fullPage: true });
    await sheet.close();
  }

  // ---------- infographies en PNG (pour l'EPUB) ----------
  if (FIGS) {
    const fdir = path.join(OUT, "figs"); fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir, { recursive: true });
    const p2 = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3 });
    await p2.goto("file://" + file); await p2.waitForFunction("window.__paged", null, { timeout: 300000 }); await p2.waitForTimeout(500);
    const svgs = await p2.$$(".pagedjs_page figure.info > svg");
    for (let i = 0; i < svgs.length; i++) await svgs[i].screenshot({ path: path.join(fdir, `fig-${String(i + 1).padStart(3, "0")}.png`), omitBackground: false });
    console.log(`✓ ${svgs.length} infographie(s) exportée(s) en PNG → ${fdir}`);
  }
  await browser.close();

  console.log(`${qa.statut === "OK" ? "✓" : "✗"} ${qa.pages} pages · vides ${qa.pages_vides.length} · titres orphelins ${qa.titres_orphelins.length} · blocs coupés ${qa.blocs_coupes.length} · débordements ${qa.debordements.length} · <table> ${qa.tableaux.length} · erreurs JS ${errors.length}`);
  if (qa.pages_blanches_voulues.length) console.log(`  pages blanches voulues (chapitre en page de droite) : ${qa.pages_blanches_voulues.join(", ")}`);
  if (qa.pages_peu_remplies.length) console.log(`  à regarder : pages peu remplies ${qa.pages_peu_remplies.map(p => p.page).join(", ")}`);
  ["pages_vides", "titres_orphelins", "blocs_coupes", "debordements", "tableaux"].forEach(k => qa[k].forEach(x => console.log(`  ✗ ${k} : ${JSON.stringify(x)}`)));
  console.log(`  → regardez les planches : ${path.join(OUT, "planche-*.png")}`);
  process.exit(qa.statut === "OK" ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
