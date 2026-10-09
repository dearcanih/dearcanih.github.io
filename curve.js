/*
  Nombre curvado sobre el bowl.

  1. Arma el texto con los contornos de Cookies (glyphs.js). La fuente no trae
     Á É Í Ó Ú Ñ con forma, así que se componen: letra base + acento o virgulilla.
  2. Proyecta cada punto sobre un cilindro visto desde arriba: el texto sigue la
     curva del bowl y las letras de los extremos se angostan, como en el objeto real.
  3. Si el nombre es largo, se achica solo hasta que quepa en el largo máximo.
*/
(function () {
  "use strict";
  window.DC = window.DC || {};

  var G = DC.GLYPHS;
  var META = DC.GLYPH_META;
  var BASE = { "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ñ": "N" };

  function layout(text) {
    var items = [];
    var x = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === " ") { x += META.space; continue; }
      var key = BASE[ch] || ch;
      var g = G[key];
      if (!g) continue;
      items.push({ k: key, x: x, y: 0, s: 1 });
      var bb = g.bb;
      var w = bb[2] - bb[0];
      if (ch === "Ñ") {
        var t = G.tilde;
        var tb = t.bb;
        var s = (0.75 * w) / (tb[2] - tb[0]);
        var cxg = (bb[0] + bb[2]) / 2;
        var tc = ((tb[0] + tb[2]) / 2) * s;
        items.push({ k: "tilde", x: x + cxg - tc, y: bb[3] + 25 - tb[1] * s, s: s });
      } else if (ch !== key) {
        var a = G.acute;
        var ab = a.bb;
        var cx2 = (bb[0] + bb[2]) / 2 + 0.08 * w + 8;
        var ac = (ab[0] + ab[2]) / 2;
        items.push({ k: "acute", x: x + cx2 - ac, y: bb[3] + 20 - ab[1], s: 1 });
      }
      x += g.adv;
    }
    return items;
  }

  function extent(items) {
    var min = Infinity;
    var max = -Infinity;
    items.forEach(function (it) {
      var bb = G[it.k].bb;
      min = Math.min(min, it.x + bb[0] * it.s);
      max = Math.max(max, it.x + bb[2] * it.s);
    });
    return [min, max];
  }

  function scaleFor(items, geom) {
    var e = extent(items);
    var kCap = geom.cap / META.cap;
    var kFit = geom.maxArc / (e[1] - e[0]);
    return { k: Math.min(kCap, kFit), e: e, shrunk: kFit < kCap };
  }

  /* Devuelve el atributo "d" de un <path> con el nombre ya curvado. */
  DC.namePath = function (text, geom) {
    var items = layout(text);
    if (!items.length) return "";
    var sc = scaleFor(items, geom);
    var k = sc.k;
    var cxu = (sc.e[0] + sc.e[1]) / 2;
    var vy = Math.cos(Math.asin(geom.ry / geom.R));
    var midY = META.cap / 2;
    var out = [];
    items.forEach(function (it) {
      G[it.k].c.forEach(function (c) {
        var d = "";
        for (var i = 0; i < c.length; i += 2) {
          var u = (it.x + c[i] * it.s - cxu) * k;
          var v = (it.y + c[i + 1] * it.s - midY) * k * vy;
          var th = u / geom.R;
          var X = geom.cx + geom.R * Math.sin(th);
          var Y = geom.yc - v - geom.ry * (1 - Math.cos(th));
          d += (i ? "L" : "M") + X.toFixed(1) + " " + Y.toFixed(1);
        }
        out.push(d + "Z");
      });
    });
    return out.join("");
  };

  /* Solo para pruebas: altura real de mayúscula y si el nombre se achicó. */
  DC.nameInfo = function (text, geom) {
    var items = layout(text);
    if (!items.length) return null;
    var sc = scaleFor(items, geom);
    return { capPx: sc.k * META.cap, shrunk: sc.shrunk };
  };
})();
