#!/usr/bin/env python3
"""Contrôle de style : tics d'écriture IA et typographie française.

Usage : python3 lint_style.py chapitres/            (dossier de .html/.md/.txt)
        python3 lint_style.py chapitre.html texte.md
Sortie : rapport par fichier ; code 1 s'il reste des problèmes bloquants (✗).
Le script ne remplace pas la relecture : il attire l'œil sur les endroits suspects.
"""
import html, os, re, sys
from collections import Counter

BANNIS = [
    r"dans un monde où", r"à l['’]ère du (numérique|digital)", r"de nos jours", r"plongeons", r"plongeon(s)? dans",
    r"découvrons ensemble", r"embarquez", r"(un|ce) véritable voyage", r"tapisserie", r"mosaïque (de|d['’])", r"symphonie (de|d['’])",
    r"pierre angulaire", r"clé de voûte", r"naviguer (dans|à travers) (les|la|ce|cette)", r"se pencher sur", r"mettre en lumière",
    r"met(tent)? en lumière", r"témoigne(nt)? de", r"à la croisée des chemins", r"ouvr(e|ent|ant|ir) la voie", r"joue(nt)? un rôle (crucial|clé|essentiel|central|majeur)",
    r"il est (important|essentiel|crucial) de (noter|souligner|rappeler)", r"il convient de (noter|souligner)", r"n['’]oubliez pas que", r"gardez à l['’]esprit",
    r"en somme", r"en définitive", r"en conclusion", r"force est de constater", r"indéniablement", r"incontestablement", r"résolument",
    r"holistique", r"synergie", r"paradigme", r"game[- ]changer", r"booster",
]
RESIDUS = [r"bien sûr ?!", r"excellente question", r"j['’]espère que (ce|cet|cette)", r"n['’]hésitez pas à", r"en tant qu['’](ia|intelligence artificielle|assistant)",
           r"dans (ce|cet) (chapitre|article|guide), nous allons", r"comme mentionné (précédemment|plus haut)"]
SURVEILLES = ["crucial", "cruciale", "essentiel", "essentielle", "primordial", "fondamental", "incontournable", "véritable", "puissant", "puissante",
              "fascinant", "captivant", "levier", "catalyseur", "explorer", "décortiquer", "révolutionner", "révolutionnaire", "optimiser",
              "favoriser", "dynamique", "profondément", "véritablement", "clé"]
ANGLICISMES = {r"\bimpact(er|é|ée|és|ées|ant|e|ent)\b": "avoir un effet sur / toucher", r"\badresser (un|le|ce|les) (problème|sujet|défi)": "traiter, s'attaquer à",
               r"\bfai(t|re|s) sens\b": "avoir du sens", r"\ben charge de\b": "chargé de", r"\bopportunités?\b": "occasion (si c'est le sens)",
               r"\bchallenger\b": "mettre au défi", r"\bdélivrer (un|des|le) (résultat|message)": "produire, transmettre"}
AUTORITE = [r"selon (les|des|certains) experts", r"(de nombreuses|plusieurs|des) études (montrent|prouvent|démontrent|révèlent)", r"les (scientifiques|spécialistes|chercheurs) s['’]accordent",
            r"la science (montre|prouve)", r"il est prouvé que"]
FAUX_CONTRASTE = r"(ce n['’]est pas|il ne s['’]agit pas( seulement)?( de| d['’])?|ce n['’]est plus)[^.!?\n]{1,80}?[,;:—–]\s*(c['’]est|mais|il s['’]agit)"
QUESTION_THEATRE = r"(?:^|[.!?…]\s+)((?:Le|La|Les|L['’]|Un|Une|Et|Mais|Résultat|Conclusion|Pourquoi|Comment)[^.!?\n]{0,28}\s?\?)\s+(?=[A-ZÀÂÉÈÊ])"
CHUTES = [r"^(tout simplement|et ça change tout|et c['’]est tout|rien de plus|ni plus ni moins|point final|c['’]est aussi simple que ça|la différence est (énorme|immense))\.?$"]


class Txt:
    """Extrait du HTML : paragraphes (avec type), titres, gras, éléments de liste."""
    def __init__(self, raw, is_html):
        self.raw = raw
        if not is_html:
            self.paras = [("p", p.strip()) for p in re.split(r"\n\s*\n", raw) if p.strip()]
            self.heads = [l.lstrip("# ").strip() for l in raw.splitlines() if l.startswith("#")]
            self.bold = len(re.findall(r"\*\*[^*]+\*\*", raw)); self.li_bold = len(re.findall(r"^\s*[-*]\s+\*\*[^*]+\*\*\s*:", raw, re.M))
            return
        r = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I)
        r = re.sub(r"<svg.*?</svg>", " ", r, flags=re.S | re.I)
        self.heads = [self.clean(m) for m in re.findall(r"<h[1-4][^>]*>(.*?)</h[1-4]>", r, re.S)]
        self.bold = len(re.findall(r"<strong\b", r))  # <b> réservé aux fiches récap
        self.li_bold = len(re.findall(r"<li[^>]*>\s*<(strong|b)\b[^>]*>[^<]*?(?::\s*</\1>|</\1>\s*:)", r))
        self.paras = [(t.lower(), self.clean(m)) for t, m in re.findall(r"<(p|li|h[1-4]|div class=\"lb\")[^>]*>(.*?)</(?:p|li|h[1-4]|div)>", r, re.S)]
        self.paras = [(t if t in ("p", "li") else "h", s) for t, s in self.paras if s]

    @staticmethod
    def clean(s):
        return re.sub(r"[ \t\r\n]+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip(" \t\r\n")  # garde les espaces insécables


def ctx(s, m, w=45):
    a, b = max(0, m.start() - w), min(len(s), m.end() + w)
    return ("…" if a else "") + s[a:b].replace("\n", " ") + ("…" if b < len(s) else "")


def check(path):
    raw = open(path, encoding="utf-8").read()
    T = Txt(raw, path.lower().endswith((".html", ".htm")))
    text = "\n".join(s for _, s in T.paras)
    nw = max(1, len(re.findall(r"\w+", text)))
    out = []  # (niveau, message)
    E = lambda m: out.append(("✗", m)); W = lambda m: out.append(("▲", m))

    low = text.lower()
    for pat in BANNIS:
        for m in re.finditer(pat, low): E(f"Expression à bannir « {m.group(0)} » : {ctx(text, m)}")
    for pat in RESIDUS:
        for m in re.finditer(pat, low): E(f"Résidu de conversation « {m.group(0)} » : {ctx(text, m)}")
    for pat in AUTORITE:
        for m in re.finditer(pat, low): E(f"Autorité sans source « {m.group(0)} » : citez la source ou retirez. {ctx(text, m)}")
    for m in re.finditer(FAUX_CONTRASTE, text, re.I): W(f"Faux contraste « Ce n'est pas X, c'est Y » (à garder seulement si X a vraiment été affirmé) : {ctx(text, m)}")
    for m in re.finditer(QUESTION_THEATRE, text): W(f"Question-réponse théâtrale « {m.group(1).strip()} » : écrire la phrase entière. {ctx(text, m)}")
    for t, s in T.paras:
        if t == "p" and any(re.match(c, s.strip().lower()) for c in CHUTES): E(f"Chute dramatique isolée : « {s} »")
        elif t == "p" and len(s.split()) <= 4 and not s.startswith("—") and s.endswith("."): W(f"Paragraphe d'une phrase très courte (chute ?) : « {s} »")
    words = Counter(re.findall(r"[a-zàâçéèêëîïôûùüÿœ]+", low))
    for w in SURVEILLES:
        if words[w] > 1: W(f"« {w} » × {words[w]} : une fois par chapitre au plus, et seulement si c'est le mot juste")
    for pat, rep in ANGLICISMES.items():
        for m in re.finditer(pat, low): W(f"Anglicisme « {m.group(0)} » → {rep} : {ctx(text, m)}")
    # tiret cadratin hors dialogue
    dashes = sum(s.count("—") - (1 if s.startswith("—") else 0) for t, s in T.paras if t != "h")
    limit = max(1, nw // 300)
    if dashes > limit: W(f"{dashes} tirets cadratins d'incise hors dialogue (repère : {limit} max pour {nw} mots) : préférez virgule, deux-points, parenthèses ou deux phrases")
    # triades
    tri = re.findall(r"\b[\wàâçéèêëîïôûùü’'-]+,\s+[\wàâçéèêëîïôûùü’'-]+(?:\s+[\wàâçéèêëîïôûùü’'-]+)?\s+et\s+[\wàâçéèêëîïôûùü’'-]+", text)
    if len(tri) > max(2, nw // 250): W(f"{len(tri)} énumérations en trois termes (« X, Y et Z ») : variez (deux, quatre, un seul exemple)")
    # gras
    if T.bold > max(3, nw // 200): W(f"{T.bold} passages en gras : dans un livre, le gras est rare (repère : {max(3, nw // 200)})")
    if T.li_bold >= 3: W(f"{T.li_bold} puces commençant par une étiquette en gras suivie de deux-points : rédigez en phrases")
    # titres en Majuscule À Chaque Mot
    for h in T.heads:
        ws = [w for w in re.findall(r"[^\s’']+", h)[1:] if len(w) > 3 and w[0].isalpha()]
        if len(ws) >= 2 and sum(w[0].isupper() for w in ws) >= 2 and sum(w[0].isupper() for w in ws) >= len(ws) - 1:
            W(f"Titre en Majuscule À Chaque Mot (usage anglais) : « {h} »")
        if re.search(r"[\U0001F300-\U0001FAFF☀-➿]", h): W(f"Emoji dans un titre : « {h} »")
    # points d'exclamation hors dialogue
    excl = sum(s.count("!") for t, s in T.paras if t == "p" and not s.startswith("—"))
    if excl > 2: W(f"{excl} points d'exclamation hors dialogue")
    # débuts de phrase répétés
    sents = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", text) if s.strip()]
    firsts = [re.match(r"[\wÀ-ÿ’']+", s).group(0).lower() if re.match(r"[\wÀ-ÿ’']+", s) else "" for s in sents]
    for i in range(len(firsts) - 2):
        if firsts[i] and firsts[i] == firsts[i + 1] == firsts[i + 2]: W(f"3 phrases de suite commencent par « {firsts[i]} » : {sents[i][:60]}…"); break
    # typographie
    for m in re.finditer(r'"', text): E(f"Guillemet droit \" → « » : {ctx(text, m, 30)}"); break
    for m in re.finditer(r"(?<=\w)'(?=\w)", text): E(f"Apostrophe droite ' → ’ : {ctx(text, m, 30)}"); break
    for m in re.finditer(r"\.\.\.", text): E(f"« ... » → « … » : {ctx(text, m, 30)}"); break
    for m in re.finditer(r"(?<=[\wÀ-ÿ»)])[;!?]", text): E(f"Espace fine insécable manquante avant « {m.group(0)} » : {ctx(text, m, 30)}"); break
    for m in re.finditer(r"(?<=[A-Za-zÀ-ÿ»)])(?<!https)(?<!http):(?!//)(?=\s)", text): E(f"Espace insécable manquante avant « : » : {ctx(text, m, 30)}"); break
    for m in re.finditer(r" [;:!?»]|« ", text): E(f"Espace ordinaire (sécable) autour de la ponctuation, utilisez une espace insécable : {ctx(text, m, 30)}"); break
    for m in re.finditer(r"\d\s?%|\b\d+(?:[.,]\d+)?\s?(fois|millions?|milliards?)\b", text):
        W(f"Chiffre à sourcer (ne jamais inventer) : {ctx(text, m, 40)}")
    return nw, out


def main():
    paths = []
    for a in sys.argv[1:] or ["chapitres"]:
        if os.path.isdir(a):
            paths += sorted(os.path.join(a, f) for f in os.listdir(a) if f.lower().endswith((".html", ".htm", ".md", ".txt")))
        elif os.path.exists(a): paths.append(a)
    if not paths: sys.exit("Aucun fichier à contrôler.")
    errs = 0
    for p in paths:
        nw, out = check(p)
        e = sum(1 for l, _ in out if l == "✗"); w = len(out) - e; errs += e
        print(f"\n=== {p} — {nw} mots — {e} bloquant(s), {w} à revoir")
        for l, m in out: print(f"  {l} {m}")
        if not out: print("  ✓ rien à signaler")
    print(f"\n{'✓ OK' if not errs else f'✗ {errs} problème(s) bloquant(s)'} sur {len(paths)} fichier(s). Relisez ensuite le texte (passe d'audit de references/ecriture-sans-ia.md).")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
