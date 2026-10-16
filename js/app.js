/* dear canih. | tienda de bowls personalizados. Sin dependencias, sin build. */
(function () {
  "use strict";

  var CONFIG = DC.CONFIG, COLORS = DC.COLORS, PRODUCTS = DC.PRODUCTS, BOWLS = DC.BOWLS, LOGO = DC.LOGO;
  var KEY_CART = "dc-order-v1";
  var KEY_REGION = "dc-region-v1";

  var app = document.getElementById("app");
  var draft = null;       // configuración en curso
  var editingId = null;   // id del item que se edita
  var activeCat = "todos";
  var lastTrigger = null;
  var nameFocused = false;

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return CONFIG.currency + " " + n; }
  function colorById(id) { return COLORS.filter(function (c) { return c.id === id; })[0]; }
  function productById(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function hasField(p, f) { return p.fields.indexOf(f) !== -1; }
  function uid() { return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function storeGet(k, fallback) { try { var v = localStorage.getItem(k); return v === null ? fallback : v; } catch (e) { return fallback; } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento, sigue en memoria */ } }

  /* ---------- estado ---------- */
  function validItem(it) {
    var p = it && productById(it.productId);
    return !!(p && colorById(it.color) && p.sizes.indexOf(it.size) !== -1);
  }
  var cart = (function () {
    try { var v = JSON.parse(storeGet(KEY_CART, "[]")); return Array.isArray(v) ? v.filter(validItem) : []; } catch (e) { return []; }
  })();
  var region = storeGet(KEY_REGION, "lima") === "provincia" ? "provincia" : "lima";
  function persist() { storeSet(KEY_CART, JSON.stringify(cart)); storeSet(KEY_REGION, region); }

  function totals() {
    var sub = cart.reduce(function (a, it) { return a + productById(it.productId).price; }, 0);
    var ship = region === "lima" ? CONFIG.shippingLima : null;
    return { sub: sub, ship: ship, total: ship === null ? null : sub + ship };
  }

  /* ---------- SVG del bowl ---------- */
  function bowlSVG(productId, colorId, name, opts) {
    opts = opts || {};
    var p = productById(productId), c = colorById(colorId), b = BOWLS[productId];
    var hasName = hasField(p, "name");
    var inner = b.inner;
    var tx = "";
    if (opts.standalone) {
      inner = inner.replace(/class="up"/g, 'fill="' + c.up + '"').replace(/class="lo"/g, 'fill="' + c.lo + '"');
      if (hasName && name) tx = '<path fill="' + c.tx + '" d="' + DC.namePath(name, p.textArc) + '"/>';
      var w = opts.width || b.w;
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + b.vb + '" width="' + w + '" height="' + Math.round(w * b.h / b.w) + '">' + inner + tx + "</svg>";
    }
    if (hasName) tx = '<path class="tx" d=""/>';
    return '<svg class="bowl" viewBox="' + b.vb + '" role="img" aria-label="' + esc(p.name) + '" style="--up:' + c.up + ";--lo:" + c.lo + ";--tx:" + c.tx + '">' + inner + tx + "</svg>";
  }
  function inlineStatic(productId, colorId, name) {
    // SVG sin clases para usar dentro de tarjetas y filas
    return bowlSVG(productId, colorId, name, { standalone: true }).replace(/ width="\d+" height="\d+"/, "");
  }

  /* ---------- dibujos de marca ---------- */
  var SHINE = '<svg class="doodle shine" viewBox="0 0 111 111" aria-hidden="true"><g fill="none" stroke="#1762FE"><path d="M87.875 83.25C80.9375 57.8125 55.5 50.875 55.5 50.875C55.5 50.875 37 67.0625 37 97.125" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.25 46.3652C15.4167 41.6931 33.3 36.0863 55.5 51.0378C60.896 43.2453 77.7 29.5311 101.75 37.013" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M69.375 23.125C64.75 26.2083 55.5 36.075 55.5 50.875C53.9585 43.1667 46.25 25.9 27.75 18.5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.75 64.75C32.3132 60.125 44.1773 50.875 55.1291 50.875C59.6921 56.271 63.8569 64.75 61.9736 83.25" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5688 14.3375H14.3375M14.8 14.3375C14.8 14.5929 14.5929 14.8 14.3375 14.8C14.0821 14.8 13.875 14.5929 13.875 14.3375C13.875 14.0821 14.0821 13.875 14.3375 13.875C14.5929 13.875 14.8 14.0821 14.8 14.3375Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M78.3969 14.3375H78.1656M78.6281 14.3375C78.6281 14.5929 78.4209 14.8 78.1656 14.8C77.9103 14.8 77.7031 14.5929 77.7031 14.3375C77.7031 14.0821 77.9103 13.875 78.1656 13.875C78.4209 13.875 78.6281 14.0821 78.6281 14.3375Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M95.0453 57.8189H94.8141M95.2766 57.8189C95.2766 58.0742 95.0694 58.2814 94.8141 58.2814C94.5588 58.2814 94.3516 58.0742 94.3516 57.8189C94.3516 57.5632 94.5588 57.3564 94.8141 57.3564C95.0694 57.3564 95.2766 57.5632 95.2766 57.8189Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M60.2836 96.6617H60.0523M60.5148 96.6617C60.5148 96.917 60.3081 97.1242 60.0523 97.1242C59.797 97.1242 59.5898 96.917 59.5898 96.6617C59.5898 96.4064 59.797 96.1992 60.0523 96.1992C60.3081 96.1992 60.5148 96.4064 60.5148 96.6617Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.1938 73.5367H18.9625M19.425 73.5367C19.425 73.792 19.2179 73.9992 18.9625 73.9992C18.7071 73.9992 18.5 73.792 18.5 73.5367C18.5 73.2814 18.7071 73.0742 18.9625 73.0742C19.2179 73.0742 19.425 73.2814 19.425 73.5367Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M83.0219 51.3375H82.7906M83.2531 51.3375C83.2531 51.5928 83.0459 51.8 82.7906 51.8C82.5353 51.8 82.3281 51.5928 82.3281 51.3375C82.3281 51.0822 82.5353 50.875 82.7906 50.875C83.0459 50.875 83.2531 51.0822 83.2531 51.3375Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M51.1078 18.9625H50.8766M51.3391 18.9625C51.3391 19.2179 51.1319 19.425 50.8766 19.425C50.6213 19.425 50.4141 19.2179 50.4141 18.9625C50.4141 18.7071 50.6213 18.5 50.8766 18.5C51.1319 18.5 51.3391 18.7071 51.3391 18.9625Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
  var ARROW_R = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW_D = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13M4 11l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW_UR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ARROW_L = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17 10H4M9 4l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CALL_ARROW_DOWN_LEFT = '<svg viewBox="0 0 64 56" aria-hidden="true"><path d="M58 4C36 2 14 12 10 40M3 32l7 10 9-8" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CALL_ARROW_UP_RIGHT = '<svg viewBox="0 0 64 56" aria-hidden="true"><path d="M6 52C10 26 32 14 54 12M44 4l11 8-9 9" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- cabecera ---------- */
  document.getElementById("logo").innerHTML =
    '<svg viewBox="' + LOGO.vb + '" aria-hidden="true">' + LOGO.inner + "</svg>";
  (function () {
    var pr = document.getElementById("promo");
    if (pr && CONFIG.promo) { pr.textContent = CONFIG.promo; pr.hidden = false; }
  })();
  function updateHeader() {
    document.getElementById("cart-count").textContent = cart.length;
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  /* ---------- catálogo ---------- */
  function viewCatalog() {
    var cats = Object.keys(DC.CATEGORIES);
    var filters = "";
    if (cats.length > 1) {
      filters = '<div class="filters" role="group" aria-label="Categorías">' +
        ["todos"].concat(cats).map(function (k) {
          var label = k === "todos" ? "Todos" : DC.CATEGORIES[k];
          return '<button type="button" class="chip" data-act="cat" data-cat="' + k + '" aria-pressed="' + (activeCat === k) + '">' + esc(label) + "</button>";
        }).join("") + "</div>";
    }
    var list = PRODUCTS.filter(function (p) { return activeCat === "todos" || p.category === activeCat; });
    var cards = list.map(function (p) {
      return '<a class="card" href="#/producto/' + p.id + '" aria-label="Personalizar ' + esc(p.name) + '">' +
        '<div class="card-art"><div class="art-in">' + inlineStatic(p.id, p.cardColor, "") + "</div></div>" +
        '<div class="card-body"><div><h3>' + esc(p.name) + "</h3><p>" + money(p.price) + "</p></div>" +
        '<span class="go" aria-hidden="true">' + ARROW_UR + "</span></div></a>";
    }).join("");
    app.innerHTML =
      '<section class="page">' +
      '<div class="hero"><img src="assets/portada.jpg" alt="" width="1672" height="941" fetchpriority="high">' +
      '<div class="hero-in"><h1>Para cada momento a su lado.</h1>' +
      '<button type="button" class="btn primary" data-act="to-products">Haz tu pedido! ' + ARROW_D + "</button></div></div>" +
      '<h2 class="sec" id="productos">Nuestros productos<span class="blue">.</span></h2>' + filters +
      '<div class="shelf"><div class="vid" id="vid"></div>' + cards + "</div></section>";
    mountVideo();
  }

  var mq = window.matchMedia("(max-width: 860px)");
  function mountVideo() {
    var box = document.getElementById("vid");
    if (!box) return;
    var k = mq.matches ? "h" : "v", base = "assets/media/perrito-" + k;
    box.innerHTML = '<video autoplay muted loop playsinline preload="auto" poster="' + base + '.jpg" aria-label="Un perrito tomando agua de un bowl dear canih.">' +
      '<source src="' + base + '.webm" type="video/webm"><source src="' + base + '.mp4" type="video/mp4"></video>';
    var v = box.firstChild; v.muted = true;
    var pr = v.play && v.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  if (mq.addEventListener) mq.addEventListener("change", mountVideo);

  /* ---------- configurador ---------- */
  function sanitizeName(raw) {
    return raw.normalize("NFC").toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, "").replace(/ {2,}/g, " ").replace(/^ /, "");
  }

  function stepHead(n, title, meta) {
    return '<header class="step-h"><span class="n">' + n + "</span><h3>" + title + "</h3>" + (meta ? '<span class="meta">' + meta + "</span>" : "") + "</header>";
  }

  function viewConfig(pid, editId) {
    var p = productById(pid);
    if (!p) { location.hash = "#/"; return; }
    var item = editId ? cart.filter(function (i) { return i.id === editId; })[0] : null;
    draft = item
      ? { productId: item.productId, color: item.color, size: item.size, name: item.name || "" }
      : { productId: p.id, color: "azul", size: p.sizes[0], name: "" };
    editingId = item ? item.id : null;
    nameFocused = false;

    var n = 0, steps = "";
    if (hasField(p, "name")) {
      steps += '<section class="step">' +
        stepHead(++n, "Nombre", '<span id="cnt">' + draft.name.length + "</span>/" + CONFIG.nameMax) +
        '<input id="name" class="field" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" ' +
        'aria-label="Nombre para el bowl" aria-describedby="name-hint name-err" placeholder="' + esc(p.placeholder) + '" value="' + esc(draft.name) + '">' +
        '<p class="hint" id="name-hint">Letras, tildes y Ñ. Si lo dejas vacío, el bowl va sin nombre.</p>' +
        '<p class="err" id="name-err" role="alert"></p></section>';
    }
    if (hasField(p, "color")) {
      steps += '<section class="step">' +
        stepHead(++n, 'Color <span class="sub">· <span id="color-label">' + esc(colorById(draft.color).label) + "</span></span>", "") +
        '<div class="swatches" role="radiogroup" aria-label="Color">' +
        COLORS.map(function (c) {
          var on = c.id === draft.color;
          return '<button type="button" class="sw' + (on ? " on" : "") + '" role="radio" aria-checked="' + on + '" aria-label="' + esc(c.label) +
            '" data-act="color" data-color="' + c.id + '"><span class="dot" style="background:' + c.up + '"></span></button>';
        }).join("") + "</div></section>";
    }
    if (hasField(p, "size")) {
      steps += '<section class="step">' + stepHead(++n, "Tamaño", "") +
        '<div class="pills" role="radiogroup" aria-label="Tamaño">' +
        p.sizes.map(function (s) {
          var on = s === draft.size;
          return '<button type="button" class="pill' + (on ? " on" : "") + '" role="radio" aria-checked="' + on + '" data-act="size" data-size="' + esc(s) + '">' + esc(s) + "</button>";
        }).join("") + "</div></section>";
    }

    app.innerHTML =
      '<div class="cfg">' +
      '<div class="stage" id="stage">' +
      '<div class="bowl-box">' + bowlSVG(p.id, draft.color, "") +
      '<div class="callout c1"><span>Acero inoxidable</span>' + CALL_ARROW_DOWN_LEFT + "</div>" +
      '<div class="callout c2"><span>Material de origen vegetal</span>' + CALL_ARROW_UP_RIGHT + "</div></div>" +
      SHINE + '<div class="legend"><span id="legend-l"></span><span id="legend-r"></span></div></div>' +
      '<div class="panel"><div class="panel-head">' +
      '<span class="tag">' + esc(DC.CATEGORIES[p.category]) + "</span>" +
      "<h1>" + esc(p.name) + '<span class="blue">.</span></h1></div>' +
      '<p class="desc">Bowl de ' + esc(p.height.replace(/\s+/g, "")) + ", hecho con material de origen vegetal. Incluye un plato de acero inoxidable.</p>" +
      steps +
      '<div class="actions"><span class="total">' + money(p.price) + '</span><button type="button" class="btn primary" id="add" data-act="add">' +
      (editingId ? "Guardar cambios" : "Añadir al carrito") + "</button></div></div></div>";
    paintPreview();
  }

  function paintPreview() {
    var p = productById(draft.productId), c = colorById(draft.color);
    var svg = document.querySelector("#stage .bowl");
    if (!svg) return;
    svg.style.setProperty("--up", c.up);
    svg.style.setProperty("--lo", c.lo);
    svg.style.setProperty("--tx", c.tx);
    var tx = svg.querySelector(".tx");
    if (tx) {
      var name = draft.name.trim();
      var shown = name || (nameFocused ? p.placeholder : "");
      tx.setAttribute("d", shown ? DC.namePath(shown, p.textArc) : "");
      tx.classList.toggle("ghost", !name);
    }
    var left = hasField(p, "name") && draft.name.trim() ? draft.name.trim() : p.name;
    document.getElementById("legend-l").textContent = left.toUpperCase();
    document.getElementById("legend-r").textContent = c.label.toUpperCase() + " · " + draft.size.replace(/\s+/g, "");
  }

  function onNameInput(input) {
    var raw = input.value;
    var caret = input.selectionStart == null ? raw.length : input.selectionStart;
    var cleaned = sanitizeName(raw);
    var caretClean = sanitizeName(raw.slice(0, caret)).length;
    var err = document.getElementById("name-err");
    err.textContent = "";
    if (cleaned.length > CONFIG.nameMax) {
      cleaned = cleaned.slice(0, CONFIG.nameMax);
      err.textContent = "Máximo " + CONFIG.nameMax + " caracteres.";
    }
    if (cleaned !== raw) {
      input.value = cleaned;
      var pos = Math.min(caretClean, cleaned.length);
      try { input.setSelectionRange(pos, pos); } catch (e) { /* algunos teclados no lo permiten */ }
    }
    draft.name = cleaned;
    document.getElementById("cnt").textContent = cleaned.length;
    paintPreview();
  }

  function addToCart() {
    var p = productById(draft.productId);
    var name = draft.name.trim();
    var entry = { id: editingId || uid(), productId: p.id, color: draft.color, size: draft.size };
    if (hasField(p, "name")) entry.name = name; // vacío = sin nombre
    if (editingId) {
      cart = cart.map(function (i) { return i.id === editingId ? entry : i; });
    } else {
      cart.push(entry);
    }
    persist();
    toast(editingId ? "Cambios guardados" : "Agregado a tu pedido");
    location.hash = "#/pedido";
  }

  /* ---------- pedido ---------- */
  function itemLines(it) {
    var p = productById(it.productId), c = colorById(it.color), lines = [];
    if (hasField(p, "name")) lines.push(["Nombre", it.name || "Sin nombre"]);
    lines.push(["Color", c.label]);
    lines.push(["Tamaño", it.size]);
    return lines;
  }

  function viewCart() {
    if (!cart.length) {
      app.innerHTML = '<section class="page cart"><h1>Tu pedido<span class="blue">.</span></h1>' +
        '<p class="lead">Todavía no hay bowls aquí.</p><a class="btn primary" href="#/">Elegir producto</a></section>';
      return;
    }
    var rows = cart.map(function (it) {
      var p = productById(it.productId);
      return '<article class="item"><div class="thumb">' + inlineStatic(it.productId, it.color, it.name || "") + "</div><div>" +
        "<h2>" + esc(p.name) + "</h2><ul>" +
        itemLines(it).map(function (l) { return "<li>" + l[0] + ": <b>" + esc(l[1]) + "</b></li>"; }).join("") + "</ul>" +
        '<div class="row"><a class="linkbtn" href="#/producto/' + p.id + "?editar=" + it.id + '">Editar</a>' +
        '<button type="button" class="linkbtn" data-act="remove" data-id="' + it.id + '">Quitar</button>' +
        '<span class="p">' + money(p.price) + "</span></div></div></article>";
    }).join("");
    app.innerHTML =
      '<section class="page cart"><h1>Tu pedido<span class="blue">.</span></h1><div class="cart-grid">' +
      '<div><div class="items">' + rows + '</div><p class="more"><a class="btn ghost" href="#/">Agregar otro producto</a></p></div>' +
      '<aside class="summary" aria-label="Resumen del pedido"><h2>Resumen</h2>' +
      '<div class="step"><div class="step-h"><h3>Entrega</h3></div><div class="pills" role="radiogroup" aria-label="Entrega">' +
      '<button type="button" class="pill' + (region === "lima" ? " on" : "") + '" role="radio" aria-checked="' + (region === "lima") + '" data-act="region" data-region="lima">Lima</button>' +
      '<button type="button" class="pill' + (region === "provincia" ? " on" : "") + '" role="radio" aria-checked="' + (region === "provincia") + '" data-act="region" data-region="provincia">Provincia</button></div></div>' +
      '<div id="sum"></div>' +
      '<button type="button" class="btn primary block" data-act="send" id="send">Enviar pedido por WhatsApp</button>' +
      '<p class="note">Se genera una imagen con tu configuración y se abre WhatsApp con el resumen escrito. Adjunta la imagen en el chat.</p></aside></div></section>';
    paintSummary();
  }

  function paintSummary() {
    var t = totals(), el = document.getElementById("sum");
    if (!el) return;
    var shipTxt = t.ship === null ? "Se calcula al hacer el pedido" : money(t.ship);
    var totalTxt = t.total === null ? money(t.sub) + " + envío" : money(t.total);
    el.innerHTML =
      '<div class="sum-row"><span>Subtotal</span><b>' + money(t.sub) + "</b></div>" +
      '<div class="sum-row"><span>Envío</span><b style="text-align:right">' + shipTxt + "</b></div>" +
      '<div class="sum-row t"><span>Total</span><span>' + totalTxt + "</span></div>";
  }

  /* ---------- mensaje e imagen para WhatsApp ---------- */
  function orderText() {
    var t = totals();
    var out = ["Hola, quiero hacer este pedido en dear canih.:", ""];
    cart.forEach(function (it, i) {
      var p = productById(it.productId);
      out.push((i + 1) + ". " + p.name);
      itemLines(it).forEach(function (l) { out.push("   " + l[0] + ": " + l[1]); });
      out.push("   " + money(p.price), "");
    });
    out.push("Subtotal: " + money(t.sub));
    out.push("Envío: " + (t.ship === null ? "Provincia, por calcular" : "Lima, " + money(t.ship)));
    out.push("Total: " + (t.total === null ? money(t.sub) + " + envío por calcular" : money(t.total)), "");
    out.push("Adjunto la imagen con mi configuración.");
    return out.join("\n");
  }
  function waLink() {
    var base = "https://wa.me/" + (CONFIG.whatsapp || "");
    if (!CONFIG.whatsapp) console.warn("dear canih.: falta el número de WhatsApp en js/config.js");
    return base + "?text=" + encodeURIComponent(orderText());
  }

  function loadImg(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }
  function svgURL(svg) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function buildOrderImage() {
    var DISPLAY = cssVar("--display"), BODY = cssVar("--body");
    var fontsReady = Promise.all([
      document.fonts.load("800 40px " + DISPLAY), document.fonts.load("700 30px " + DISPLAY),
      document.fonts.load("400 22px " + BODY), document.fonts.load("700 22px " + BODY),
    ]).catch(function () { /* se dibuja con la fuente de respaldo */ });

    var logoSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + LOGO.vb + '" width="' + LOGO.w * 1.5 + '" height="' + LOGO.h * 1.5 + '">' + LOGO.inner + "</svg>";
    var imgs = cart.map(function (it) {
      return loadImg(svgURL(bowlSVG(it.productId, it.color, it.name || "", { standalone: true, width: 760 })));
    });
    return Promise.all([fontsReady, loadImg(svgURL(logoSVG))].concat(imgs)).then(function (r) {
      var logo = r[1], bowls = r.slice(2);
      var W = 1080, pad = 56, cardH = 320, gap = 24, headH = 200, footH = 290;
      var t = totals();
      var H = headH + cart.length * (cardH + gap) + footH;
      var cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#FFFAEF"; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(logo, pad, 40, logo.width, logo.height);
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#000"; ctx.textAlign = "right";
      ctx.font = '800 56px ' + DISPLAY;
      var dotW = ctx.measureText(".").width;
      ctx.fillText("Mi pedido", W - pad - dotW, 110);
      ctx.fillStyle = "#1762FE"; ctx.fillText(".", W - pad, 110);
      ctx.textAlign = "left";

      cart.forEach(function (it, i) {
        var p = productById(it.productId), y = headH + i * (cardH + gap);
        ctx.fillStyle = "#ECE9DF"; rr(ctx, pad, y, W - pad * 2, cardH, 44); ctx.fill();
        var bw = 400, bh = bw * bowls[i].height / bowls[i].width;
        ctx.drawImage(bowls[i], pad + 28, y + (cardH - bh) / 2, bw, bh);
        var x = pad + 28 + bw + 36;
        ctx.fillStyle = "#000"; ctx.font = '800 42px ' + DISPLAY;
        ctx.fillText(p.name, x, y + 78);
        ctx.textAlign = "right"; ctx.fillText(money(p.price), W - pad - 32, y + 78); ctx.textAlign = "left";
        var ly = y + 138;
        itemLines(it).forEach(function (l) {
          ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.font = '400 22px ' + BODY;
          ctx.fillText(l[0].toUpperCase(), x, ly);
          ctx.fillStyle = "#000"; ctx.font = '800 36px ' + DISPLAY;
          ctx.fillText(l[1], x + 150, ly + 2);
          ly += 62;
        });
      });

      var fy = headH + cart.length * (cardH + gap) + 24;
      function line(label, value, yy, big) {
        ctx.fillStyle = "#000";
        ctx.font = (big ? '800 44px ' : '700 30px ') + DISPLAY;
        ctx.textAlign = "left"; ctx.fillText(label, pad, yy);
        ctx.textAlign = "right"; ctx.fillText(value, W - pad, yy);
      }
      line("Subtotal", money(t.sub), fy + 36, false);
      line("Envío", t.ship === null ? "Provincia, por calcular" : "Lima, " + money(t.ship), fy + 90, false);
      ctx.fillStyle = "#000"; ctx.fillRect(pad, fy + 118, W - pad * 2, 3);
      line("Total", t.total === null ? money(t.sub) + " + envío" : money(t.total), fy + 190, true);
      return new Promise(function (res, rej) {
        cv.toBlob(function (b) { b ? res(b) : rej(new Error("No se pudo crear la imagen")); }, "image/png");
      });
    });
  }

  function openModal(blobUrl) {
    var root = document.getElementById("modal-root");
    root.innerHTML =
      '<div class="modal-bg" data-act="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-t">' +
      '<h2 id="m-t">Tu pedido está listo<span class="blue">.</span></h2>' +
      '<div class="shot"><img src="' + blobUrl + '" alt="Imagen con la configuración de tu pedido"></div>' +
      '<ol><li><span class="n">1</span><a class="btn ghost block" id="m-dl" href="' + blobUrl + '" download="pedido-dear-canih.png">Guardar imagen</a></li>' +
      '<li><span class="n">2</span><a class="btn primary block" id="m-wa" href="' + esc(waLink()) + '" target="_blank" rel="noopener">Abrir WhatsApp</a></li></ol>' +
      '<p class="note">En el chat, adjunta la imagen guardada. El resumen del pedido ya va escrito.</p>' +
      '<button type="button" class="linkbtn close" data-act="close-modal">Cerrar</button></div></div>';
    var first = document.getElementById("m-dl");
    if (first) first.focus();
  }
  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
    if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus();
  }

  function sendOrder(btn) {
    lastTrigger = btn;
    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = "Preparando imagen...";
    buildOrderImage().then(function (blob) {
      openModal(URL.createObjectURL(blob));
    }).catch(function () {
      toast("No se pudo crear la imagen. Intenta de nuevo.");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    if (act === "close-modal") {
      if (e.target === el || el.classList.contains("close")) closeModal();
      return;
    }
    if (act === "to-products") {
      var t = document.getElementById("productos");
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (act === "color") {
      draft.color = el.getAttribute("data-color");
      document.querySelectorAll(".sw").forEach(function (b) {
        var on = b === el;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", on);
      });
      document.getElementById("color-label").textContent = colorById(draft.color).label;
      paintPreview();
    } else if (act === "size") {
      draft.size = el.getAttribute("data-size");
      document.querySelectorAll(".pill").forEach(function (b) {
        var on = b === el;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", on);
      });
      paintPreview();
    } else if (act === "add") {
      addToCart();
    } else if (act === "remove") {
      cart = cart.filter(function (i) { return i.id !== el.getAttribute("data-id"); });
      persist(); updateHeader(); viewCart();
      toast("Quitado del pedido");
    } else if (act === "region") {
      region = el.getAttribute("data-region");
      persist();
      document.querySelectorAll('[data-act="region"]').forEach(function (b) {
        var on = b === el;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", on);
      });
      paintSummary();
    } else if (act === "send") {
      sendOrder(el);
    } else if (act === "cat") {
      activeCat = el.getAttribute("data-cat");
      viewCatalog();
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "name" && !e.isComposing) onNameInput(e.target);
  });
  document.addEventListener("focusin", function (e) {
    if (e.target.id === "name") { nameFocused = true; paintPreview(); }
  });
  document.addEventListener("focusout", function (e) {
    if (e.target.id === "name") { nameFocused = false; paintPreview(); }
  });
  document.addEventListener("compositionend", function (e) {
    if (e.target.id === "name") onNameInput(e.target);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.querySelector(".modal-bg")) closeModal();
    if (e.key === "Enter" && e.target.id === "name") { e.preventDefault(); addToCart(); }
  });

  /* ---------- rutas ---------- */
  function route() {
    var h = location.hash.replace(/^#/, "") || "/";
    var parts = h.split("?");
    var segs = parts[0].split("/").filter(Boolean);
    var params = new URLSearchParams(parts[1] || "");
    if (segs[0] === "producto") viewConfig(segs[1], params.get("editar"));
    else if (segs[0] === "pedido") viewCart();
    else viewCatalog();
    updateHeader();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);
  route();
})();
