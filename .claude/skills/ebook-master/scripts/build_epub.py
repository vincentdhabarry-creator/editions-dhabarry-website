#!/usr/bin/env python3
"""Construit un EPUB 3 à partir de livre.json et des chapitres HTML (bibliothèque standard uniquement).

Usage : python3 build_epub.py livre.json [--out build] [--kdp]
Prérequis conseillés : build_book.py (charte) puis `node render.js build/livre.html --figures`
(les infographies SVG sont alors intégrées en PNG, lisibles sur toutes les liseuses ; sinon le SVG est conservé).
--kdp : n'intègre pas la page de couverture dans le texte (Amazon l'ajoute d'après la couverture téléversée).
"""
import argparse, datetime, html, json, os, re, sys, uuid, zipfile
from html.parser import HTMLParser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_book import SKILL, charte, esc  # noqa: E402

VOID = {"br", "hr", "img", "meta", "link", "input", "col", "area", "source", "wbr"}


class X(HTMLParser):
    """Convertit un fragment HTML5 en XHTML bien formé."""
    def __init__(self):
        super().__init__(convert_charrefs=True); self.o = []; self.st = []

    def attrs(self, a):
        return "".join(f' {k}="{html.escape(v if v is not None else k, quote=True)}"' for k, v in a if not k.startswith("on"))

    def handle_starttag(self, t, a):
        if t in VOID: self.o.append(f"<{t}{self.attrs(a)}/>")
        else: self.o.append(f"<{t}{self.attrs(a)}>"); self.st.append(t)

    def handle_startendtag(self, t, a):
        self.o.append(f"<{t}{self.attrs(a)}/>")

    def handle_endtag(self, t):
        if t in VOID or t not in self.st: return
        while self.st:
            x = self.st.pop(); self.o.append(f"</{x}>")
            if x == t: break

    def handle_data(self, d):
        self.o.append(html.escape(d, quote=False))

    def result(self):
        while self.st: self.o.append(f"</{self.st.pop()}>")
        return "".join(self.o)


def xhtml_frag(s):
    p = X(); p.feed(s); p.close(); return p.result()


def page(title, body, lang, epub_type="bodymatter"):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="{lang}" xml:lang="{lang}">
<head><meta charset="UTF-8"/><title>{esc(title)}</title><link rel="stylesheet" type="text/css" href="../css/livre.css"/></head>
<body epub:type="{epub_type}">
{body}
</body></html>'''


def epub_css(C, data):
    stack = lambda n: f'"{n}", {data["polices_secours"].get(n, "serif")}'
    css = f"""@charset "UTF-8";
body{{margin:0 4%; font-family:{stack(C['body'])}; line-height:1.5; color:{C['text']}}}
p{{margin:0 0 .7em; text-align:justify; -webkit-hyphens:auto; hyphens:auto; widows:2; orphans:2}}
h1,h2,h3,h4{{page-break-after:avoid; break-after:avoid; -webkit-hyphens:none; hyphens:none}}
h3{{font-family:{stack(C['head'])}; font-size:1.3em; color:{C['dark']}; margin:1.4em 0 .5em}}
h3 .n{{color:{C['accent']}; font-style:italic; margin-right:.25em}}
h4{{font-family:{stack(C['ui'])}; font-size:1em; color:{C['dark']}}}
.op{{background:{C['dark']}; color:#fff; padding:1.6em 1.2em; margin:0 0 1.5em; border-radius:6px; page-break-after:always}}
.op .big,.op .time{{display:none}}
.op .kicker,.op .goals .t{{font-family:{stack(C['ui'])}; font-size:.7em; letter-spacing:.2em; text-transform:uppercase; color:{C['accent_l']}}}
.op .rule{{width:3em; height:3px; background:{C['accent']}; margin:.6em 0}}
.op h2{{font-family:{stack(C['head'])}; font-size:2em; line-height:1.1; margin:0; color:#fff}}
.op h2 em{{color:{C['accent_l']}}}
.op .sub{{font-style:italic; color:{C['sand']}; margin-top:.5em}}
.op .goals{{margin-top:1.4em; border-top:1px solid {C['muted']}; padding-top:.8em}}
.op .goals li{{font-size:.9em; margin-bottom:.3em}}
.pt{{text-align:center; margin-top:30%; color:{C['accent']}}}
.pt .k{{font-size:.8em; letter-spacing:.2em; text-transform:uppercase}}
.pt h2{{font-family:{stack(C['head'])}; font-size:2em; color:{C['dark']}}}
p.first:first-letter{{float:left; font-family:{stack(C['head'])}; font-size:3.1em; line-height:.85; margin:.05em .08em 0 0; color:{C['accent']}}}
.pull{{border-top:2px solid {C['accent']}; border-bottom:1px solid {C['gray']}; margin:1.2em 0; padding:.6em 0}}
.pull p{{font-family:{stack(C['head'])}; font-style:italic; font-size:1.25em; color:{C['accent']}; text-align:left}}
.pull .who{{font-size:.7em; letter-spacing:.12em; text-transform:uppercase; color:{C['muted']}}}
.box,.cas,.exo,.recap{{border-radius:8px; padding:.8em 1em; margin:1em 0; page-break-inside:avoid}}
.box .hd,.exo .hd{{font-family:{stack(C['ui'])}; font-weight:bold; font-size:.75em; letter-spacing:.12em; text-transform:uppercase; color:{C['accent']}; margin-bottom:.3em}}
.box svg,.exo .hd svg{{width:1.2em; height:1.2em; vertical-align:middle; margin-right:.3em}}
.box p,.cas p,.exo p{{text-align:left}}
.box.conseil{{background:{C['bg']}; border-left:4px solid {C['accent']}}}
.box.attention{{background:{C['tint']}; border:1px dashed {C['accent']}}}
.box.info{{background:{C['tint2']}; border:1px solid {C['gray']}}}
.cas{{background:{C['sand']}}}
.cas .badge{{font-family:{stack(C['ui'])}; font-size:.7em; font-weight:bold; letter-spacing:.12em; text-transform:uppercase; background:{C['dark']}; color:#fff; padding:.15em .5em; border-radius:3px; margin-right:.5em}}
.cas .nm{{font-family:{stack(C['head'])}; font-weight:bold}}
.cas .row{{border-top:1px solid {C['line']}; padding:.4em 0}}
.cas .lb{{font-family:{stack(C['ui'])}; font-size:.7em; font-weight:bold; letter-spacing:.1em; text-transform:uppercase; color:{C['accent']}}}
.cas .note{{font-size:.75em; font-style:italic; color:{C['muted']}}}
.cmp{{margin:1em 0; font-size:.9em}}
.cmp .h{{font-family:{stack(C['ui'])}; font-size:.75em; font-weight:bold; letter-spacing:.1em; text-transform:uppercase; color:#fff; padding:.3em .5em; margin-top:.4em}}
.cmp .h.l{{background:{C['muted']}}} .cmp .h.r{{background:{C['accent']}}}
.cmp .c{{padding:.3em .5em; border-bottom:1px solid {C['gray']}}}
.cmp .c.l{{background:{C['tint2']}}} .cmp .c.r{{background:{C['tint']}}}
.recap{{background:{C['dark']}; color:#fff}}
.recap .t{{font-size:.7em; letter-spacing:.2em; text-transform:uppercase; color:{C['accent_l']}}}
.recap h4{{color:#fff; font-family:{stack(C['head'])}; font-size:1.3em; margin:.2em 0 .6em}}
.recap li b{{color:{C['accent_l']}}}
.exo{{border:1.5px dashed {C['accent']}}}
.lignes div{{height:1.6em; border-bottom:1px solid {C['line']}}}
.grille-ex{{display:none}}
figure{{margin:1em 0; text-align:center; page-break-inside:avoid}}
figure img{{max-width:100%; height:auto}}
figcaption{{font-size:.75em; color:{C['muted']}}}
.info-t{{font-family:{stack(C['ui'])}; font-size:.7em; font-weight:bold; letter-spacing:.14em; text-transform:uppercase; color:{C['accent']}}}
.info-h{{font-family:{stack(C['head'])}; font-weight:bold; font-size:1.15em; color:{C['dark']}; margin-bottom:.4em}}
.titre-livre{{text-align:center; margin-top:25%}} .titre-livre h1{{font-family:{stack(C['head'])}; color:{C['dark']}}}
.titre-livre .st{{font-style:italic; color:{C['accent']}}} .titre-livre .filet{{width:3em; height:3px; background:{C['accent']}; margin:1.2em auto}}
.titre-livre .au{{letter-spacing:.2em; text-transform:uppercase}}
.copyright{{font-size:.8em; margin-top:20%}} .copyright p{{text-align:left}}
.dedicace{{text-align:center; font-style:italic; margin-top:30%}}
.fin h2,nav h1{{font-family:{stack(C['head'])}; color:{C['dark']}}}
.message-fin{{border:1px solid {C['accent_l']}; background:{C['tint']}; border-radius:8px; padding:.8em 1em}}
nav ol{{list-style:none; padding-left:0}} nav ol ol{{padding-left:1.2em}} nav a{{color:inherit; text-decoration:none}}
.cover{{text-align:center; margin:0; padding:0}} .cover img{{height:100%; max-width:100%}}
"""
    for k, v in {"dark": C["dark"], "acc": C["accent"], "accm": C["accent_m"], "accl": C["accent_l"], "sand": C["sand"], "mut": C["muted"],
                 "bg": C["bg"], "text": C["text"], "white": "#fff", "gray": C["gray"], "line": C["line"], "tint": C["tint"]}.items():
        css += f".f-{k}{{fill:{v}}} "
    for k, v in {"dark": C["dark"], "acc": C["accent"], "line": C["line"], "gray": C["gray"], "white": "#fff"}.items():
        css += f".s-{k}{{stroke:{v}}} "
    return css


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("livre"); ap.add_argument("--out"); ap.add_argument("--kdp", action="store_true")
    a = ap.parse_args()
    base = os.path.dirname(os.path.abspath(a.livre)); L = json.load(open(a.livre, encoding="utf-8"))
    out = a.out or os.path.join(base, "build"); os.makedirs(out, exist_ok=True)
    data = json.load(open(os.path.join(SKILL, "assets", "chartes.json"), encoding="utf-8"))
    C = charte(L.get("charte", "dhabarry"), data)
    lang = L.get("langue", "fr")
    figdir = os.path.join(out, "figs"); figs = sorted(f for f in os.listdir(figdir) if f.endswith(".png")) if os.path.isdir(figdir) else []
    cover = os.path.join(out, "couverture.jpg")
    files, images, svg_files = [], [], set()   # files: (id, href, title, xhtml, in_toc, is_part)
    fig_i = 0

    if os.path.exists(cover) and not a.kdp:
        files.append(("cover", "text/couverture.xhtml", "Couverture", page("Couverture", f'<div class="cover"><img src="../images/couverture.jpg" alt="{esc(L["titre"])}"/></div>', lang, "cover"), False, False))
    st = f'<p class="st">{esc(L["sous_titre"])}</p>' if L.get("sous_titre") else ""
    files.append(("titre", "text/titre.xhtml", L["titre"], page(L["titre"], f'<section class="titre-livre" epub:type="titlepage"><h1>{esc(L["titre"])}</h1>{st}<div class="filet"></div><p class="au">{esc(L.get("auteur", ""))}</p></section>', lang, "frontmatter"), False, False))
    year = L.get("annee", "")
    cp = f"<p>© {esc(year)} {esc(L.get('auteur', ''))}{' — ' + esc(L['editeur']) if L.get('editeur') else ''}. Tous droits réservés.</p>"
    cp += "<p>Toute reproduction, même partielle, sans l'accord de l'auteur ou de ses ayants droit est interdite (articles L.335-2 et suivants du Code de la propriété intellectuelle).</p>"
    if L.get("isbn_numerique") or L.get("isbn"): cp += f"<p>ISBN : {esc(L.get('isbn_numerique') or L.get('isbn'))}</p>"
    if L.get("avertissement"): cp += f"<p>{esc(L['avertissement'])}</p>"
    files.append(("copyright", "text/copyright.xhtml", "Copyright", page("Copyright", f'<section class="copyright" epub:type="copyright-page">{cp}</section>', lang, "frontmatter"), False, False))
    if L.get("dedicace"):
        files.append(("dedicace", "text/dedicace.xhtml", "Dédicace", page("Dédicace", f'<section class="dedicace" epub:type="dedication"><p>{esc(L["dedicace"])}</p></section>', lang, "frontmatter"), False, False))
    toc_at = len(files)
    n = 0
    for k, item in enumerate(L["chapitres"]):
        if isinstance(item, dict) and "partie" in item:
            body = f'<section class="partie" epub:type="part"><div class="pt"><p class="k">{esc(item.get("numero", "Partie"))}</p><h2>{esc(item["partie"])}</h2></div></section>'
            files.append((f"p{k + 1}", f"text/partie-{k + 1:02d}.xhtml", item["partie"], page(item["partie"], body, lang), True, True)); continue
        path = item if isinstance(item, str) else item["fichier"]
        src = open(os.path.join(base, path), encoding="utf-8").read()
        n += 1
        m = re.search(r'<div class="op">.*?<h2[^>]*>(.*?)</h2>', src, re.S) or re.search(r"<h[23][^>]*>(.*?)</h[23]>", src, re.S)
        title = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", m.group(1)))).strip() if m else f"Chapitre {n}"
        # infographies : SVG → PNG si disponibles (ordre identique au rendu imprimé)
        svgs = {}
        def repl_fig(mm):
            nonlocal fig_i
            fig_i += 1
            if fig_i <= len(figs):
                name = figs[fig_i - 1]; images.append((name, os.path.join(figdir, name)))
                alt = re.search(r'<div class="info-h">(.*?)</div>', mm.group(0), re.S)
                alt = html.unescape(re.sub(r"<[^>]+>", "", alt.group(1))).strip() if alt else "Infographie"
                return re.sub(r"<svg\b.*?</svg>", f'<img src="../images/{name}" alt="{esc(alt)}"/>', mm.group(0), count=1, flags=re.S)
            return mm.group(0)
        src = re.sub(r'<figure class="info".*?</figure>', repl_fig, src, flags=re.S)
        # SVG restants (icônes, figures sans PNG) : conservés tels quels, hors du convertisseur HTML
        def keep_svg(mm):
            key = f"@@SVG{len(svgs)}@@"; s = mm.group(0)
            if "xmlns=" not in s[:200]: s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
            svgs[key] = s; return key
        src = re.sub(r"<svg\b.*?</svg>", keep_svg, src, flags=re.S)
        body = xhtml_frag(src)
        for key, s in svgs.items(): body = body.replace(key, s)
        if svgs: svg_files.add(f"c{n}")
        files.append((f"c{n}", f"text/chapitre-{n:02d}.xhtml", title, page(title, body, lang), True, False))
    if L.get("a_propos"):
        b = '<section class="fin"><h2>À propos de l’auteur</h2>' + "".join(f"<p>{esc(p)}</p>" for p in str(L["a_propos"]).split("\n") if p.strip()) + "</section>"
        files.append(("auteur", "text/auteur.xhtml", "À propos de l’auteur", page("À propos de l’auteur", b, lang, "backmatter"), True, False))
    if L.get("du_meme_auteur") or L.get("message_fin"):
        b = '<section class="fin">'
        if L.get("du_meme_auteur"): b += "<h2>Du même auteur</h2>" + "".join(f"<p><em>{esc(t)}</em></p>" for t in L["du_meme_auteur"])
        if L.get("message_fin"):
            b += '<div class="message-fin">' + "".join(f"<p>{esc(p)}</p>" for p in str(L["message_fin"]).split("\n") if p.strip())
            if L.get("site"):
                url = L["site"] if L["site"].startswith("http") else "https://" + L["site"]
                b += f'<p><a href="{esc(url)}">{esc(L["site"])}</a></p>'
            b += "</div>"
        files.append(("fin", "text/fin.xhtml", "Du même auteur" if L.get("du_meme_auteur") else "Merci", page("Fin", b + "</section>", lang, "backmatter"), True, False))

    # sommaire (parties imbriquées)
    nav, inpart, kids = "<ol>", False, False
    for fid, href, title, _, intoc, part in files:
        if not intoc: continue
        li = f'<a href="{href}">{esc(title)}</a>'
        if part:
            if inpart: nav += "</ol></li>" if kids else "</li>"
            nav += f"<li>{li}"; inpart, kids = True, False
        elif inpart and fid not in ("auteur", "fin"):
            nav += ("" if kids else "<ol>") + f"<li>{li}</li>"; kids = True
        else:
            if inpart: nav += "</ol></li>" if kids else "</li>"; inpart = False
            nav += f"<li>{li}</li>"
    if inpart: nav += "</ol></li>" if kids else "</li>"
    nav += "</ol>"
    first_body = next((f for f in files if f[4]), None)
    nav_doc = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="{lang}" xml:lang="{lang}">
<head><meta charset="UTF-8"/><title>Sommaire</title><link rel="stylesheet" type="text/css" href="css/livre.css"/></head>
<body><nav epub:type="toc" id="toc"><h1>Sommaire</h1>{nav}</nav>
<nav epub:type="landmarks" hidden="hidden"><ol>{'<li><a epub:type="cover" href="text/couverture.xhtml">Couverture</a></li>' if any(f[0] == "cover" for f in files) else ""}
<li><a epub:type="toc" href="nav.xhtml">Sommaire</a></li>{f'<li><a epub:type="bodymatter" href="{first_body[1]}">Début</a></li>' if first_body else ""}</ol></nav></body></html>'''
    ident = L.get("isbn_numerique") or L.get("isbn")
    ident = f"urn:isbn:{re.sub(r'[^0-9X]', '', ident)}" if ident else f"urn:uuid:{L.get('uuid') or uuid.uuid5(uuid.NAMESPACE_URL, L['titre'] + L.get('auteur', ''))}"
    po = 0; ncx_pts = ""
    for fid, href, title, _, intoc, _p in files:
        if intoc: po += 1; ncx_pts += f'<navPoint id="np{po}" playOrder="{po}"><navLabel><text>{esc(title)}</text></navLabel><content src="{href}"/></navPoint>\n'
    ncx = f'''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="{esc(ident)}"/></head>
<docTitle><text>{esc(L["titre"])}</text></docTitle><navMap>
{ncx_pts}</navMap></ncx>'''
    modified = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    man = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
           '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
           '<item id="css" href="css/livre.css" media-type="text/css"/>']
    if os.path.exists(cover): man.append('<item id="cover-image" href="images/couverture.jpg" media-type="image/jpeg" properties="cover-image"/>')
    seen = set()
    for name, _ in images:
        if name not in seen: seen.add(name); man.append(f'<item id="img-{name[:-4]}" href="images/{name}" media-type="image/png"/>')
    for fid, href, *_ in files:
        prop = ' properties="svg"' if fid in svg_files else ""
        man.append(f'<item id="{fid}" href="{href}" media-type="application/xhtml+xml"{prop}/>')
    spine = []
    for k, f in enumerate(files):
        if k == toc_at: spine.append('<itemref idref="nav"/>')
        spine.append(f'<itemref idref="{f[0]}"/>')
    date_tag = f"<dc:date>{year}</dc:date>" if re.fullmatch(r"\d{4}", str(year)) else ""
    kws = "".join(f"<dc:subject>{esc(k)}</dc:subject>" for k in L.get("mots_cles", []))
    opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="{lang}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">{esc(ident)}</dc:identifier>
<dc:title id="t1">{esc(L["titre"])}</dc:title><meta refines="#t1" property="title-type">main</meta>
{f'<dc:title id="t2">{esc(L["sous_titre"])}</dc:title><meta refines="#t2" property="title-type">subtitle</meta>' if L.get("sous_titre") else ""}
<dc:creator id="aut">{esc(L.get("auteur", "Anonyme"))}</dc:creator><meta refines="#aut" property="role" scheme="marc:relators">aut</meta>
<dc:language>{lang}</dc:language>
{f"<dc:publisher>{esc(L['editeur'])}</dc:publisher>" if L.get("editeur") else ""}
{date_tag}
{f"<dc:description>{esc(L['description'])}</dc:description>" if L.get("description") else ""}
{kws}
<meta property="dcterms:modified">{modified}</meta>
{'<meta name="cover" content="cover-image"/>' if os.path.exists(cover) else ""}
</metadata>
<manifest>
{chr(10).join(man)}
</manifest>
<spine toc="ncx">
{chr(10).join(spine)}
</spine>
</package>'''
    dest = os.path.join(out, "livre-kdp.epub" if a.kdp else "livre.epub")
    with zipfile.ZipFile(dest, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        zc = lambda name, s: z.writestr(name, s, compress_type=zipfile.ZIP_DEFLATED)
        zc("META-INF/container.xml", '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
        zc("OEBPS/content.opf", opf); zc("OEBPS/nav.xhtml", nav_doc); zc("OEBPS/toc.ncx", ncx); zc("OEBPS/css/livre.css", epub_css(C, data))
        if os.path.exists(cover): z.write(cover, "OEBPS/images/couverture.jpg", compress_type=zipfile.ZIP_STORED)
        for name, p in {n_: p for n_, p in images}.items(): z.write(p, "OEBPS/images/" + name, compress_type=zipfile.ZIP_STORED)
        for fid, href, title, doc, *_ in files: zc("OEBPS/" + href, doc)
    print(f"✓ {dest} — {n} chapitre(s), {len(set(i[0] for i in images))} infographie(s) en PNG{'' if os.path.exists(cover) else ' — ⚠ pas de couverture (lancez cover.js avant)'}")
    try:
        from epubcheck import EpubCheck
        r = EpubCheck(dest)
        print(f"  EPUBCheck : {'✓ valide' if r.valid else '✗ invalide'} ({len(r.messages)} message(s))")
        for m in r.messages[:15]: print("   ", m)
    except ImportError:
        print("  (pip install epubcheck pour valider l'EPUB)")


if __name__ == "__main__":
    main()
