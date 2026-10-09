#!/usr/bin/env python3
"""
Regenera js/glyphs.js (contornos de la fuente Cookies convertidos a polilineas)
y js/bowls.js (los SVG de los bowls con clases de color).

Uso:
    python3 tools/build_assets.py RUTA/COOKIE1.TTF RUTA/Splash-bowl.svg RUTA/Petal-bowl.svg [RUTA/logo.svg]

La fuente NO se incluye en el repo: el sitio solo usa los contornos de A-Z
y de los acentos ya convertidos a vectores.
"""
import json
import re
import sys
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent


class FlatPen(BasePen):
    """Convierte curvas a segmentos rectos para poder deformarlas punto a punto."""

    def __init__(self, glyph_set, steps=7):
        super().__init__(glyph_set)
        self.contours = []
        self.cur = None
        self.steps = steps

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        n = self.steps
        for i in range(1, n + 1):
            t = i / n
            mt = 1 - t
            x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
            y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
            self.cur.append((x, y))

    def _qCurveToOne(self, p1, p2):
        p0 = self._getCurrentPoint()
        n = self.steps
        for i in range(1, n + 1):
            t = i / n
            mt = 1 - t
            x = mt**2 * p0[0] + 2 * mt * t * p1[0] + t**2 * p2[0]
            y = mt**2 * p0[1] + 2 * mt * t * p1[1] + t**2 * p2[1]
            self.cur.append((x, y))

    def _closePath(self):
        if self.cur:
            self.contours.append(self.cur)
        self.cur = None

    _endPath = _closePath


def build_glyphs(ttf_path):
    font = TTFont(ttf_path)
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hm = font["hmtx"]
    out = {}
    wanted = {ch: ord(ch) for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"}
    wanted["acute"] = 0xB4
    wanted["tilde"] = 0x7E
    for key, cp in wanted.items():
        g = cmap[cp]
        pen = FlatPen(gs)
        gs[g].draw(pen)
        bp = BoundsPen(gs)
        gs[g].draw(bp)
        flat = []
        for c in pen.contours:
            pts = []
            for x, y in c:
                pt = (round(x), round(y))
                if not pts or pts[-1] != pt:
                    pts.append(pt)
            if len(pts) > 2:
                flat.append([v for p in pts for v in p])
        out[key] = {
            "adv": hm[g][0],
            "bb": [round(v) for v in bp.bounds],
            "c": flat,
        }
    cap = out["H"]["bb"][3]
    meta = {"cap": cap, "space": 300}
    js = "/* Generado por tools/build_assets.py. No editar a mano. */\n"
    js += "window.DC = window.DC || {};\n"
    js += "DC.GLYPH_META = " + json.dumps(meta) + ";\n"
    js += "DC.GLYPHS = " + json.dumps(out, separators=(",", ":")) + ";\n"
    (ROOT / "js" / "glyphs.js").write_text(js, encoding="utf-8")
    print("glyphs.js", len(js) // 1024, "KB, cap", cap)


def bowl_entry(svg_path):
    svg = Path(svg_path).read_text(encoding="utf-8")
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
    w, h = (float(v) for v in vb.split()[2:4])
    inner = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    inner = re.sub(r"\s+", " ", inner).strip()
    inner = inner.replace('fill="#1762FE"', 'class="up"').replace('fill="#0050F7"', 'class="lo"')
    assert 'class="up"' in inner and 'class="lo"' in inner, svg_path
    return {"vb": vb, "w": w, "h": h, "inner": inner}


def build_bowls(splash_svg, petal_svg):
    data = {"splash": bowl_entry(splash_svg), "petal": bowl_entry(petal_svg)}
    js = "/* Generado por tools/build_assets.py. No editar a mano. */\n"
    js += "window.DC = window.DC || {};\n"
    js += "DC.BOWLS = " + json.dumps(data, ensure_ascii=False) + ";\n"
    (ROOT / "js" / "bowls.js").write_text(js, encoding="utf-8")
    print("bowls.js", len(js) // 1024, "KB")


def build_logo(logo_svg):
    svg = Path(logo_svg).read_text(encoding="utf-8")
    svg = re.sub(r"\s+", " ", svg).strip()
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
    w, h = (float(v) for v in vb.split()[2:4])
    inner = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    js = "/* Generado por tools/build_assets.py. No editar a mano. */\n"
    js += "window.DC = window.DC || {};\n"
    js += "DC.LOGO = " + json.dumps({"vb": vb, "w": w, "h": h, "inner": inner}) + ";\n"
    (ROOT / "js" / "logo.js").write_text(js, encoding="utf-8")
    (ROOT / "assets").mkdir(exist_ok=True)
    (ROOT / "assets" / "logo.svg").write_text(Path(logo_svg).read_text(encoding="utf-8"), encoding="utf-8")
    print("logo.js", len(js) // 1024, "KB")


if __name__ == "__main__":
    if len(sys.argv) not in (4, 5):
        print(__doc__)
        sys.exit(1)
    build_glyphs(sys.argv[1])
    build_bowls(sys.argv[2], sys.argv[3])
    if len(sys.argv) == 5:
        build_logo(sys.argv[4])
