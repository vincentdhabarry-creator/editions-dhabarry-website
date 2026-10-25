#!/usr/bin/env python3
"""Assemble le livre imprimable : pages liminaires + chapitres HTML + charte → build/livre.html

Usage : python3 build_book.py livre.json [--out build]
Le fichier livre.json décrit le livre (voir assets/livre.exemple.json).
"""
import argparse, html, json, os, re, shutil, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMATS = {"6x9": (6, 9), "5x8": (5, 8), "5.5x8.5": (5.5, 8.5), "a5": (5.83, 8.27), "13x20": (5.12, 7.87), "8.5x11": (8.5, 11)}


def hx(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    A, B = hx(a), hx(b)
    return "#%02x%02x%02x" % tuple(round(A[i] * (1 - t) + B[i] * t) for i in range(3))


def charte(spec, data):
    """Charte : nom d'une charte fournie, ou objet {dark, accent, text, sand, muted, head, body, ui}."""
    if isinstance(spec, str):
        if spec not in data["chartes"]:
            sys.exit(f"Charte inconnue « {spec} ». Disponibles : {', '.join(data['chartes'])}")
        c = dict(data["chartes"][spec])
    else:
        c = dict(data["chartes"]["dhabarry"]); c.update(spec)
    a, m, W = c["accent"], c["muted"], "#ffffff"
    c.update(accent_l=mix(a, W, .8), accent_m=mix(a, W, .2), bg=mix(a, W, .96), gray=mix(m, W, .8),
             line=mix(m, W, .55), tint=mix(a, W, .94), tint2=mix(m, W, .93))
    return c


def font_stack(name, data):
    return f'"{name}", {data["polices_secours"].get(name, "serif")}'


def esc(s):
    return html.escape(str(s or ""), quote=True)


def css_str(s):
    return str(s or "").replace("\\", "\\\\").replace('"', '\\"')


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("livre"); ap.add_argument("--out", default=None)
    a = ap.parse_args()
    base = os.path.dirname(os.path.abspath(a.livre))
    L = json.load(open(a.livre, encoding="utf-8"))
    out = a.out or os.path.join(base, "build")
    os.makedirs(out, exist_ok=True)
    data = json.load(open(os.path.join(SKILL, "assets", "chartes.json"), encoding="utf-8"))
    C = charte(L.get("charte", "dhabarry"), data)
    w, h = FORMATS.get(L.get("format", "6x9"), FORMATS["6x9"])

    # ---------- chapitres ----------
    body_parts, toc = [], []
    n = 0
    for item in L["chapitres"]:
        if isinstance(item, dict) and "partie" in item:
            pid = f"pt-{len(toc) + 1}"
            body_parts.append(f'<section class="partie" id="{pid}"><div class="pt"><div class="k">{esc(item.get("numero", "Partie"))}</div><h2>{esc(item["partie"])}</h2></div></section>')
            toc.append(("partie", pid, item["partie"], ""))
            continue
        path = item if isinstance(item, str) else item["fichier"]
        src = open(os.path.join(base, path), encoding="utf-8").read()
        n += 1
        cid = f"ch-{n}"
        # identifiant sur la section d'ouverture (pour le sommaire)
        if re.search(r'<section[^>]*class="opener"', src):
            src = re.sub(r'<section([^>]*class="opener")', f'<section id="{cid}"\\1', src, count=1)
            m = re.search(r'<div class="op">.*?<h2[^>]*>(.*?)</h2>', src, re.S)
            title = strip_tags(m.group(1)) if m else f"Chapitre {n}"
        else:
            src = f'<span id="{cid}"></span>' + src
            m = re.search(r"<h[23][^>]*>(.*?)</h[23]>", src, re.S)
            title = strip_tags(m.group(1)) if m else f"Chapitre {n}"
        # titre courant : repère invisible au début du premier contenu après l'ouverture
        op_end = src.find("</section>", src.find('class="opener"')) if 'class="opener"' in src else -1
        nxt = re.compile(r"<section\b[^>]*>").search(src, op_end + 1 if op_end >= 0 else 0)
        rh = f'<span class="rh">{esc(item.get("titre_courant", title) if isinstance(item, dict) else title)}</span>'
        src = src[:nxt.end()] + rh + src[nxt.end():] if nxt else rh + src
        body_parts.append(f'<!-- {esc(path)} -->\n{src}')
        toc.append(("chap", cid, title, f"{n:02d}"))

    # ---------- pages liminaires ----------
    year = L.get("annee", "")
    front = [f'''<section class="front"><div class="titre-livre"><h1>{esc(L["titre"])}</h1>{f'<div class="st">{esc(L["sous_titre"])}</div>' if L.get("sous_titre") else ""}
<div class="filet"></div><div class="au">{esc(L.get("auteur", ""))}</div>{f'<div class="ed">{esc(L["editeur"])}</div>' if L.get("editeur") else ""}</div></section>''']
    cp = [f"© {esc(year)} {esc(L.get('auteur', ''))}{' — ' + esc(L['editeur']) if L.get('editeur') else ''}. Tous droits réservés.",
          "Le Code de la propriété intellectuelle interdit les copies ou reproductions destinées à une utilisation collective. Toute représentation ou reproduction intégrale ou partielle faite par quelque procédé que ce soit, sans le consentement de l'auteur ou de ses ayants droit, est illicite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle."]
    if L.get("isbn"): cp.append(f"ISBN : {esc(L['isbn'])}")
    if year: cp.append(f"Dépôt légal : {esc(year)}")
    if L.get("avertissement"): cp.append(esc(L["avertissement"]))
    if L.get("site"): cp.append(esc(L["site"]))
    front.append('<section class="front"><div class="copyright">' + "".join(f"<p>{p}</p>" for p in cp) + "</div></section>")
    if L.get("dedicace"):
        front.append(f'<section class="front"><div class="dedicace"><p>{esc(L["dedicace"])}</p></div></section>')
    if L.get("sommaire", True):
        lis = []
        for kind, i, t, num in toc:
            if kind == "partie": lis.append(f'<li class="partie"><a href="#{i}"><span class="t">{esc(t)}</span><span class="d"></span></a></li>')
            else: lis.append(f'<li><a href="#{i}"><span class="n">{num}</span><span class="t">{esc(t)}</span><span class="d"></span></a></li>')
        front.append('<section class="front sommaire"><h2>Sommaire</h2><ol>' + "".join(lis) + "</ol></section>")

    # ---------- pages finales ----------
    back = []
    if L.get("a_propos"):
        back.append('<section class="fin"><span class="rh">À propos de l’auteur</span><h2>À propos de l’auteur</h2>' + "".join(f"<p>{esc(p)}</p>" for p in str(L["a_propos"]).split("\n") if p.strip()) + "</section>")
    if L.get("du_meme_auteur") or L.get("message_fin"):
        s = '<section class="fin"><span class="rh">' + ("Du même auteur" if L.get("du_meme_auteur") else "Merci") + '</span>'
        if L.get("du_meme_auteur"):
            s += "<h2>Du même auteur</h2>" + "".join(f"<p><em>{esc(t)}</em></p>" for t in L["du_meme_auteur"])
        if L.get("message_fin"):
            s += '<div class="message-fin">' + "".join(f"<p>{esc(p)}</p>" for p in str(L["message_fin"]).split("\n") if p.strip())
            if L.get("site"): s += f"<p><b>{esc(L['site'])}</b></p>"
            s += "</div>"
        back.append(s + "</section>")

    # ---------- CSS ----------
    css = open(os.path.join(SKILL, "assets", "book.css"), encoding="utf-8").read()
    vals = dict(C, page_w=f"{w}in", page_h=f"{h}in", opener_h=f"{h - 0.01:.2f}in", size=L.get("corps", 10.5),
                f_head=font_stack(C["head"], data), f_body=font_stack(C["body"], data), f_ui=font_stack(C["ui"], data),
                rh_left=css_str(L.get("titre_courant", L["titre"])))
    css = re.sub(r"\{\{(\w+)\}\}", lambda m: str(vals[m.group(1)]), css)
    fams = sorted({C["head"], C["body"], C["ui"]})
    gf = "https://fonts.googleapis.com/css2?" + "&".join("family=" + data["polices_google"][f] for f in fams if f in data["polices_google"]) + "&display=swap"
    shutil.copy(os.path.join(SKILL, "assets", "vendor", "paged.polyfill.min.js"), os.path.join(out, "paged.polyfill.min.js"))
    doc = f'''<!DOCTYPE html>
<html lang="{esc(L.get("langue", "fr"))}"><head><meta charset="utf-8"><title>{esc(L["titre"])}</title>
<link rel="stylesheet" href="{gf}">
<style>{css}</style>
<script>window.PagedConfig = {{ auto: true,
  before: function(){{ return Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(function(r){{ setTimeout(r, 4000); }})]); }},
  after: function(flow){{ window.__paged = flow ? flow.total : true; }} }};</script>
<script src="paged.polyfill.min.js"></script>
</head><body>
{chr(10).join(front)}
{chr(10).join(body_parts)}
{chr(10).join(back)}
</body></html>'''
    dest = os.path.join(out, "livre.html")
    open(dest, "w", encoding="utf-8").write(doc)
    json.dump({"charte": C, "toc": toc, "format": [w, h]}, open(os.path.join(out, "livre.meta.json"), "w"), ensure_ascii=False, indent=1)
    print(f"✓ {dest} — {n} chapitre(s), charte « {C.get('nom', 'personnalisée')} », format {w}×{h} po")


if __name__ == "__main__":
    main()
