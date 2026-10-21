/* dear canih. | tienda de bowls personalizados. Sin dependencias, sin build. */
(function () {
  "use strict";

  var CONFIG = DC.CONFIG, COLORS = DC.COLORS, PRODUCTS = DC.PRODUCTS, BOWLS = DC.BOWLS, LOGO = DC.LOGO;
  var KEY_CART = "dc-order-v1";
  var KEY_LAST = "dc-last-order-v1";
  var KEY_DELIV = "dc-delivery-v1";

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
  function money(n) { return CONFIG.currency + " " + Number(n).toFixed(2); }
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
  function loadJSON(store, k, fallback) {
    try { var v = JSON.parse(store.getItem(k)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; }
  }
  var cart = (function () {
    var v = loadJSON(localStorage, KEY_CART, []);
    if (!Array.isArray(v)) return [];
    return v.filter(validItem).map(function (it) { it.qty = Math.max(1, parseInt(it.qty, 10) || 1); return it; });
  })();
  var delivery = (function () {
    var d = {};
    try { d = loadJSON(sessionStorage, KEY_DELIV, {}) || {}; } catch (e) { d = {}; }
    return { nombres: d.nombres || "", apellidos: d.apellidos || "", provId: d.provId || "", distrito: d.distrito || "",
             direccion: d.direccion || "", celular: d.celular || "" };
  })();
  function persist() { storeSet(KEY_CART, JSON.stringify(cart)); }
  function persistDelivery() { try { sessionStorage.setItem(KEY_DELIV, JSON.stringify(delivery)); } catch (e) { /* sin almacenamiento */ } }

  function cartCount() { return cart.reduce(function (a, it) { return a + it.qty; }, 0); }
  function sameConfig(a, b) {
    return a.productId === b.productId && a.color === b.color && a.size === b.size && (a.name || "") === (b.name || "");
  }
  function mergeDuplicates() {
    var out = [];
    cart.forEach(function (it) {
      var hit = out.filter(function (o) { return sameConfig(o, it); })[0];
      if (hit) hit.qty += it.qty; else out.push(it);
    });
    cart = out;
  }

  var UB = DC.UBIGEO;
  function provById(id) { return UB.provs.filter(function (p) { return p[0] === id; })[0]; }
  function provLabel(p) { return p[1] + (p[2] !== p[1] ? ", " + p[2] : ""); }

  function totals() {
    var sub = cart.reduce(function (a, it) { return a + productById(it.productId).price * it.qty; }, 0);
    var free = cart.length > 0 && sub >= CONFIG.freeShippingFrom;
    var mode, ship = null;
    if (free) { mode = "free"; ship = 0; }
    else if (!delivery.provId) mode = "select";
    else if (CONFIG.flatShippingProvinces.indexOf(delivery.provId) !== -1) { mode = "flat"; ship = CONFIG.shippingLima; }
    else mode = "confirm";
    return { sub: sub, ship: ship, mode: mode, total: ship === null ? null : sub + ship,
             missing: Math.max(0, CONFIG.freeShippingFrom - sub), free: free };
  }
  function shipText(t) {
    return { free: "Gratis", flat: money(t.ship || 0), select: "Selecciona la provincia", confirm: "Se confirmará por WhatsApp" }[t.mode];
  }
  function totalText(t) { return t.total === null ? money(t.sub) + " + envío" : money(t.total); }

  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fmtDate(ts) { var d = new Date(ts); return d.getDate() + " " + MONTHS[d.getMonth()] + ". " + d.getFullYear(); }
  function fmtTime(ts) {
    var d = new Date(ts), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h < 12 ? "a.m" : "p.m");
  }
  function titleCase(s) {
    return s.trim().toLowerCase().replace(/(^|\s)([a-záéíóúüñ])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }

  /* ---------- íconos (trazo de 2px, puntas redondeadas) ---------- */
  function icon(paths, cls) {
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  var IC = {
    close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
    chevron: icon('<path d="M6 9l6 6 6-6"/>'),
    left: icon('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    right: icon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    minus: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z\" fill=\"#67645E\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#67645E\"/><path d=\"M8 12H16\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#F5EFDC\"/></svg>",
    plus: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z\" fill=\"#67645E\" stroke-width=\"1.5\" stroke=\"#67645E\"/><path d=\"M12 8V12M12 12V16M12 12H16M12 12H8\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#F5EFDC\"/></svg>",
    trash: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M19.5 5.5L18.8803 15.5251L18.8802 15.5264C18.7219 18.0868 18.6427 19.3673 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke=\"#67645E\"/><path d=\"M3 5.5H8.05292M8.05292 5.5H16.0557M8.05292 5.5L8.65861 4.17126C9.10063 3.20155 9.32164 2.7167 9.71729 2.41317C9.80498 2.3459 9.8981 2.28601 9.99568 2.23412C10.436 2 10.9688 2 12.0345 2C13.0741 2 13.5939 2 14.027 2.2247C14.1231 2.27454 14.215 2.3321 14.3017 2.39681C14.6928 2.68852 14.9196 3.15626 15.3731 4.09173L16.0557 5.5M16.0557 5.5H21\" stroke-width=\"2\" stroke-linecap=\"round\" stroke=\"#67645E\"/><path d=\"M9.5 16.5V10.5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke=\"#67645E\"/><path d=\"M14.5 16.5V10.5\" stroke-width=\"2\" stroke-linecap=\"round\" stroke=\"#67645E\"/></svg>",
    calendar: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M16 2V6M8 2V6\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#67645E\"/><path d=\"M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#67645E\"/><path d=\"M3 10H21\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#67645E\"/></svg>",
    clock: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z\" stroke-width=\"1.5\" stroke=\"#67645E\"/><path d=\"M12 8V12L14 14\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#67645E\"/></svg>",
    pin: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M18.9108 18C19.8247 19.368 20.2113 20.203 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.78869 20.203 4.17527 19.368 5.08915 18\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#67645E\"/><path d=\"M15 9.5C15 11.1569 13.6569 12.5 12 12.5C10.3431 12.5 9 11.1569 9 9.5C9 7.84315 10.3431 6.5 12 6.5C13.6569 6.5 15 7.84315 15 9.5Z\" stroke-width=\"1.5\" stroke=\"#67645E\"/><path d=\"M12 2C16.0588 2 19.5 5.42803 19.5 9.5869C19.5 13.812 16.0028 16.777 12.7725 18.7932C12.5371 18.9287 12.2709 19 12 19C11.7291 19 11.4629 18.9287 11.2275 18.7932C8.00325 16.7573 4.5 13.8266 4.5 9.5869C4.5 5.42803 7.9412 2 12 2Z\" stroke-width=\"1.5\" stroke=\"#67645E\"/></svg>",
    whatsapp: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M14.2501 16.5C12.4605 16.498 10.7447 15.7862 9.47927 14.5208C8.21383 13.2553 7.50204 11.5396 7.50005 9.75C7.49991 9.2298 7.68002 8.72562 8.00974 8.32326C8.33945 7.9209 8.79841 7.64521 9.30849 7.54313L10.3847 9.69937L9.4688 11.0625C9.40036 11.1652 9.3583 11.2831 9.34636 11.406C9.33443 11.5288 9.35297 11.6526 9.40036 11.7666C9.93698 13.0419 10.9516 14.0565 12.2269 14.5931C12.3412 14.6426 12.466 14.6629 12.5901 14.6521C12.7141 14.6413 12.8336 14.5998 12.9376 14.5312L14.3072 13.6181L16.4635 14.6944C16.3606 15.205 16.0837 15.6642 15.6801 15.9935C15.2764 16.3228 14.771 16.5018 14.2501 16.5ZM12.0001 2.25C10.3167 2.24963 8.66201 2.68508 7.19691 3.51396C5.73182 4.34285 4.50628 5.53692 3.63959 6.97997C2.77289 8.42301 2.29457 10.0659 2.25117 11.7486C2.20777 13.4314 2.60077 15.0967 3.39193 16.5825L2.32787 19.7747C2.23973 20.039 2.22693 20.3226 2.29093 20.5938C2.35492 20.8649 2.49316 21.1129 2.69016 21.3099C2.88717 21.5069 3.13514 21.6451 3.4063 21.7091C3.67745 21.7731 3.96107 21.7603 4.22537 21.6722L7.41755 20.6081C8.72515 21.3036 10.174 21.6921 11.6541 21.744C13.1343 21.7959 14.6068 21.51 15.9599 20.9079C17.3131 20.3057 18.5112 19.4033 19.4635 18.269C20.4158 17.1346 21.0971 15.7983 21.4558 14.3613C21.8145 12.9244 21.8411 11.4246 21.5336 9.97578C21.2261 8.527 20.5926 7.16732 19.6812 5.99992C18.7698 4.83253 17.6044 3.88811 16.2735 3.23836C14.9426 2.58861 13.4811 2.25061 12.0001 2.25ZM12.0001 20.25C10.5497 20.251 9.12483 19.8691 7.86943 19.1428C7.77751 19.0895 7.67532 19.0563 7.56962 19.0455C7.46391 19.0347 7.35712 19.0464 7.2563 19.08L3.75005 20.25L4.91912 16.7438C4.95281 16.643 4.96473 16.5362 4.95406 16.4305C4.94339 16.3248 4.91039 16.2226 4.85724 16.1306C3.94784 14.5584 3.58272 12.7299 3.81852 10.929C4.05432 9.12801 4.87786 7.4552 6.16139 6.17006C7.44491 4.88491 9.11667 4.05925 10.9173 3.82118C12.718 3.5831 14.5469 3.94591 16.1203 4.85333C17.6937 5.76074 18.9237 7.16204 19.6194 8.83983C20.3152 10.5176 20.4378 12.3781 19.9683 14.1327C19.4987 15.8873 18.4633 17.4379 17.0226 18.5439C15.5818 19.65 13.8164 20.2497 12.0001 20.25Z\" fill=\"white\"/></svg>",
    send: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M21.0477 3.05293C18.8697 0.707361 2.48648 6.4532 2.50001 8.551C2.51535 10.9299 8.89809 11.6617 10.6672 12.1581C11.7311 12.4565 12.016 12.7625 12.2613 13.8781C13.3723 18.9305 13.9301 21.4435 15.2014 21.4996C17.2278 21.5892 23.1733 5.342 21.0477 3.05293Z\" stroke-width=\"2\" stroke=\"black\"/><path d=\"M11.4999 12.5L14.9999 9\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"black\"/></svg>",
    download: "<svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M2.99963 17C2.99963 17.93 2.99963 18.395 3.10186 18.7765C3.37926 19.8117 4.1879 20.6204 5.22318 20.8978C5.60468 21 6.06966 21 6.99962 21H6.99963H16.9996H16.9997C17.9296 21 18.3946 21 18.7761 20.8978C19.8113 20.6204 20.62 19.8117 20.8974 18.7765C20.9996 18.395 20.9996 17.93 20.9996 17\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"black\"/><path d=\"M16.4998 11.5C16.4998 11.5 13.1856 16 11.9997 16C10.8139 16 7.49976 11.5 7.49976 11.5M11.9997 15V3\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"black\"/></svg>",
    plusBlue: "<svg class=\"ic\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M16 29.3332C23.3638 29.3332 29.3333 23.3636 29.3333 15.9998C29.3333 8.63604 23.3638 2.6665 16 2.6665C8.63616 2.6665 2.66663 8.63604 2.66663 15.9998C2.66663 23.3636 8.63616 29.3332 16 29.3332Z\" fill=\"#1762FE\" stroke-width=\"1.5\" stroke=\"#1762FE\"/><path d=\"M16 10.6665V15.9998M16 15.9998V21.3332M16 15.9998H21.3333M16 15.9998H10.6666\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#F5EFDC\"/></svg>",
    heart: '<svg class="ic heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  };

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
    document.getElementById("cart-count").textContent = cartCount();
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("on"); }, 2600);
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
    var entry = { id: editingId || uid(), productId: p.id, color: draft.color, size: draft.size, qty: 1 };
    if (hasField(p, "name")) entry.name = draft.name.trim(); // vacío = sin nombre
    if (editingId) {
      var old = cart.filter(function (i) { return i.id === editingId; })[0];
      entry.qty = old ? old.qty : 1;
      cart = cart.map(function (i) { return i.id === editingId ? entry : i; });
      mergeDuplicates(); persist(); updateHeader();
      toast("Cambios guardados");
      var from = editFrom; editFrom = null;
      if (from && from.drawer) reopenDrawer = true;
      location.hash = from && from.hash && from.hash.indexOf("editar=") === -1 ? from.hash : "#/carrito";
    } else {
      var hit = cart.filter(function (i) { return sameConfig(i, entry); })[0];
      if (hit) hit.qty = Math.min(99, hit.qty + 1); else cart.push(entry);
      persist(); updateHeader();
      openDrawer(document.getElementById("add"));
    }
  }

  /* ---------- carrito: filas, barra de progreso, panel lateral ---------- */
  var currentRoute = "";
  var editFrom = null;
  var drawerOpen = false;

  function itemLines(it) {
    var p = productById(it.productId), c = colorById(it.color), lines = [];
    if (hasField(p, "name")) lines.push(["Nombre", it.name || "Sin nombre"]);
    lines.push(["Color", c.label]);
    lines.push(["Tamaño", it.size]);
    return lines;
  }
  function shortSize(s) { return s.replace(/\s+/g, ""); }

  function itemRow(it) {
    var p = productById(it.productId);
    var meta = itemLines(it).map(function (l) {
      return "<span>" + l[0] + ": " + esc(l[0] === "Tamaño" ? shortSize(l[1]) : l[1]) + "</span>";
    }).join('<i aria-hidden="true">/</i>');
    return '<article class="li" data-id="' + it.id + '">' +
      '<div class="li-img">' + inlineStatic(it.productId, it.color, it.name || "") + "</div>" +
      '<div class="li-body"><div class="li-top"><h3>' + esc(p.name) + "</h3>" +
      '<a class="pillbtn" data-act="edit" href="#/producto/' + p.id + "?editar=" + it.id + '">Editar</a></div>' +
      '<p class="li-price">' + money(p.price * it.qty) + "</p>" +
      '<p class="li-meta">' + meta + "</p>" +
      '<div class="li-bottom"><div class="qty" role="group" aria-label="Cantidad de ' + esc(p.name) + '">' +
      '<button type="button" data-act="qty-minus" data-id="' + it.id + '" aria-label="Quitar uno"' + (it.qty <= 1 ? " disabled" : "") + ">" + IC.minus + "</button>" +
      '<span aria-live="polite">' + it.qty + "</span>" +
      '<button type="button" data-act="qty-plus" data-id="' + it.id + '" aria-label="Agregar uno">' + IC.plus + "</button></div>" +
      '<button type="button" class="trash" data-act="remove" data-id="' + it.id + '" aria-label="Eliminar ' + esc(p.name) + '">' + IC.trash + "</button></div>" +
      "</div></article>";
  }

  function progressHTML() {
    var t = totals(), pct = Math.min(100, Math.round(t.sub / CONFIG.freeShippingFrom * 100));
    var msg = t.free ? "¡Listo! Tu pedido tiene <b>delivery gratis</b>"
      : "Estás a <b>" + money(t.missing) + "</b> de obtener delivery gratis";
    return '<div class="prog"><div class="prog-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + CONFIG.freeShippingFrom +
      '" aria-valuenow="' + Math.min(t.sub, CONFIG.freeShippingFrom) + '" aria-label="Progreso hacia el delivery gratis"><i style="width:' + pct + '%"></i></div>' +
      '<p class="prog-t">' + msg + "</p></div>";
  }

  function recommended() {
    var inCart = cart.map(function (i) { return i.productId; });
    return PRODUCTS.filter(function (p) { return inCart.indexOf(p.id) === -1; });
  }
  function recHTML() {
    var list = recommended();
    if (!list.length) return "";
    return '<section class="rec"><div class="rec-h"><h3>Completa tu pedido</h3>' +
      '<div class="rec-nav"><button type="button" class="iconbtn blue" data-act="rec-prev" aria-label="Anterior">' + IC.left + "</button>" +
      '<button type="button" class="iconbtn blue" data-act="rec-next" aria-label="Siguiente">' + IC.right + "</button></div></div>" +
      '<div class="rec-track" id="rec-track">' + list.map(function (p) {
        return '<a class="rec-card" data-act="close-drawer" href="#/producto/' + p.id + '" aria-label="Personalizar ' + esc(p.name) + '">' +
          '<div class="rec-art">' + inlineStatic(p.id, p.cardColor, "") + '<span class="rec-add" aria-hidden="true">' + IC.plusBlue + "</span></div>" +
          "<h4>" + esc(p.name) + "</h4><p>" + money(p.price) + "</p></a>";
      }).join("") + "</div></section>";
  }
  function updateRecNav() {
    var tr = document.getElementById("rec-track"), nav = document.querySelector(".rec-nav");
    if (!tr || !nav) return;
    nav.hidden = tr.scrollWidth <= tr.clientWidth + 2;
  }

  function drawerBody() {
    if (!cart.length) {
      return '<div class="dr-empty"><p>Aún no tienes pedidos.</p><button type="button" class="btn primary" data-act="go-products">Ver productos</button></div>';
    }
    return progressHTML() + '<div class="li-list">' + cart.map(itemRow).join("") + "</div>" + recHTML();
  }
  function drawerFoot() {
    if (!cart.length) return "";
    var t = totals();
    return '<div class="dr-sum"><span>Subtotal</span><b>' + money(t.sub) + "</b></div>" +
      '<p class="note">*El costo de envío se calcula al realizar el pedido</p>' +
      '<a class="btn primary block" data-act="close-drawer" href="#/delivery">Pedir ahora</a>' +
      '<a class="linkbtn center" data-act="close-drawer" href="#/carrito">Ver carrito</a>';
  }
  function renderDrawer() {
    var root = document.getElementById("drawer-root");
    if (!drawerOpen) { root.innerHTML = ""; return; }
    var prev = root.querySelector(".dr-scroll"), top = prev ? prev.scrollTop : 0;
    root.innerHTML =
      '<div class="drawer-bg" data-act="close-drawer"></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-t">' +
      '<header class="dr-h"><h2 id="dr-t">Tu pedido<span class="blue">.</span></h2>' +
      '<button type="button" class="iconbtn" data-act="close-drawer" aria-label="Cerrar">' + IC.close + "</button></header>" +
      '<div class="dr-scroll">' + drawerBody() + "</div>" +
      '<footer class="dr-foot">' + drawerFoot() + "</footer></aside>";
    var sc = root.querySelector(".dr-scroll"); if (sc) sc.scrollTop = top;
    updateRecNav();
  }
  function openDrawer(trigger) {
    if (trigger) lastTrigger = trigger;
    drawerOpen = true;
    document.documentElement.classList.add("lock");
    renderDrawer();
    var c = document.querySelector(".drawer .iconbtn"); if (c) c.focus();
  }
  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    document.documentElement.classList.remove("lock");
    renderDrawer();
    if (lastTrigger && document.body.contains(lastTrigger)) { try { lastTrigger.focus(); } catch (e) { /* nada */ } }
  }

  function refreshViews() {
    persist(); updateHeader();
    if (drawerOpen) renderDrawer();
    if (currentRoute === "carrito") viewCart();
    else if (currentRoute === "delivery") { if (!cart.length) location.hash = "#/carrito"; else paintDeliverySide(); }
  }

  /* ---------- página Tu carrito ---------- */
  function viewCart() {
    if (!cart.length) {
      app.innerHTML = '<section class="page cart"><h1>Tu carrito<span class="blue">.</span></h1>' +
        '<p class="lead">Todavía no hay productos aquí.</p><a class="btn primary" href="#/">Elegir producto</a></section>';
      return;
    }
    var t = totals();
    app.innerHTML =
      '<section class="page cart"><h1>Tu carrito<span class="blue">.</span></h1><div class="cart-grid">' +
      '<div class="li-list wide">' + cart.map(itemRow).join("") + '<p class="more"><a class="linkbtn" href="#/">Agregar otro producto</a></p></div>' +
      '<aside class="summary" aria-label="Resumen del pedido">' + progressHTML() +
      '<div class="dr-sum"><span>Subtotal</span><b>' + money(t.sub) + "</b></div>" +
      '<p class="note">*El costo de envío se calcula al realizar el pedido</p>' +
      '<a class="btn primary block" href="#/delivery">Pedir ahora</a></aside></div></section>';
  }

  /* ---------- pantalla Delivery ---------- */
  var NAME_RE = /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ ]/g;
  function norm(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  function waBase(text) { return "https://wa.me/" + (CONFIG.whatsapp || "") + "?text=" + encodeURIComponent(text); }

  function fieldHTML(id, label, input) {
    return '<div class="fg"><label for="' + id + '">' + label + "</label>" + input + '<p class="ferr" id="' + id + '-err" role="alert"></p></div>';
  }
  function comboField(id, label, placeholder, disabled) {
    return fieldHTML(id, label,
      '<div class="combo" data-combo="' + id + '"><input id="' + id + '" class="inp" type="text" role="combobox" aria-expanded="false" aria-controls="' + id + '-list" ' +
      'aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="' + placeholder + '"' + (disabled ? " disabled" : "") + ">" +
      IC.chevron + '<ul id="' + id + '-list" class="combo-list" role="listbox" aria-label="' + label + '" hidden></ul></div>');
  }

  function viewDelivery() {
    if (!cart.length) { location.hash = "#/carrito"; return; }
    var t = totals();
    app.innerHTML =
      '<section class="deliv"><div class="deliv-main"><h1>Delivery<span class="blue">.</span></h1>' +
      '<form id="dform" novalidate autocomplete="on"><div class="fgrid">' +
      fieldHTML("f-nombres", "Nombres", '<input id="f-nombres" class="inp" type="text" autocomplete="given-name" placeholder="Ingresar" maxlength="50">') +
      fieldHTML("f-apellidos", "Apellidos", '<input id="f-apellidos" class="inp" type="text" autocomplete="family-name" placeholder="Ingresar" maxlength="50">') +
      comboField("f-prov", "Provincia", "Seleccionar", false) +
      comboField("f-dist", "Distrito", "Seleccionar", !delivery.provId) +
      "</div>" +
      fieldHTML("f-dir", "Dirección", '<input id="f-dir" class="inp" type="text" autocomplete="street-address" placeholder="Ingresar" maxlength="140">') +
      fieldHTML("f-cel", "Número de celular", '<div class="phone"><span aria-hidden="true">+51</span><input id="f-cel" class="inp" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="Ingresar" maxlength="9" aria-label="Número de celular, 9 dígitos"></div>') +
      '<button type="submit" class="btn primary block" id="place">Realizar pedido</button></form>' +
      '<a class="contact" href="' + esc(waBase(CONFIG.contactText)) + '" target="_blank" rel="noopener">Contacto</a></div>' +
      '<aside class="deliv-side" aria-label="Resumen del pedido"><button type="button" class="sum-toggle" data-act="toggle-sum" aria-expanded="false">' +
      '<span>Resumen del pedido</span><b id="sum-mini">' + esc(totalText(t)) + "</b>" + IC.chevron + "</button>" +
      '<div class="sum-body"><div class="li-list" id="deliv-items"></div><div id="deliv-sum"></div></div></aside></section>';
    document.getElementById("f-nombres").value = delivery.nombres;
    document.getElementById("f-apellidos").value = delivery.apellidos;
    document.getElementById("f-dir").value = delivery.direccion;
    document.getElementById("f-cel").value = delivery.celular;
    var pr = delivery.provId && provById(delivery.provId);
    if (pr) document.getElementById("f-prov").value = provLabel(pr);
    document.getElementById("f-dist").value = delivery.distrito;
    paintDeliverySide();
  }

  function paintDeliverySide() {
    var items = document.getElementById("deliv-items"), sum = document.getElementById("deliv-sum");
    if (!items || !sum) return;
    var t = totals();
    items.innerHTML = cart.map(itemRow).join("");
    sum.innerHTML =
      '<div class="sum-row"><span>Subtotal</span><span>' + money(t.sub) + "</span></div>" +
      '<div class="sum-row"><span>Envío</span><span>' + esc(shipText(t)) + "</span></div>" +
      '<div class="sum-row t"><span>Total</span><b>' + esc(totalText(t)) + "</b></div>" +
      (t.mode === "confirm" ? '<p class="note">El monto final del envío se confirmará por WhatsApp.</p>' : "") +
      (!t.free ? '<p class="note">Delivery gratis desde ' + money(CONFIG.freeShippingFrom) + ". Te faltan " + money(t.missing) + ".</p>" : "");
    var mini = document.getElementById("sum-mini"); if (mini) mini.textContent = totalText(t);
  }

  /* ---------- listas buscables (provincia y distrito) ---------- */
  var combo = { id: null, items: [], active: -1 };
  function comboOptions(id) {
    if (id === "f-prov") return UB.provs.map(function (p) { return { value: p[0], label: p[1], sub: p[2] !== p[1] ? p[2] : "", key: norm(p[1] + " " + p[2]), text: provLabel(p) }; });
    var list = UB.dists[delivery.provId] || [];
    return list.map(function (n) { return { value: n, label: n, sub: "", key: norm(n), text: n }; });
  }
  function comboRender(id, q) {
    var input = document.getElementById(id), ul = document.getElementById(id + "-list");
    var nq = norm(q || ""), all = comboOptions(id);
    var items = nq ? all.filter(function (o) { return o.key.indexOf(nq) !== -1; }).sort(function (a, b) {
      return (norm(a.label).indexOf(nq) === 0 ? 0 : 1) - (norm(b.label).indexOf(nq) === 0 ? 0 : 1);
    }) : all;
    combo = { id: id, items: items, active: items.length ? 0 : -1 };
    ul.innerHTML = items.length ? items.map(function (o, i) {
      return '<li role="option" id="' + id + "-o" + i + '" data-i="' + i + '" aria-selected="false"' + (i === 0 ? ' class="act"' : "") + ">" + esc(o.label) + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</li>";
    }).join("") : '<li class="none" role="presentation">Sin resultados</li>';
    ul.hidden = false; input.setAttribute("aria-expanded", "true");
    if (items.length) input.setAttribute("aria-activedescendant", id + "-o0"); else input.removeAttribute("aria-activedescendant");
  }
  function comboClose() {
    if (!combo.id) return;
    var input = document.getElementById(combo.id), ul = document.getElementById(combo.id + "-list");
    if (ul) ul.hidden = true;
    if (input) { input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
    combo = { id: null, items: [], active: -1 };
  }
  function comboMove(d) {
    if (!combo.items.length) return;
    var lis = document.querySelectorAll("#" + combo.id + "-list li[role=option]");
    combo.active = (combo.active + d + combo.items.length) % combo.items.length;
    lis.forEach(function (li, i) { li.classList.toggle("act", i === combo.active); });
    var cur = lis[combo.active];
    document.getElementById(combo.id).setAttribute("aria-activedescendant", cur.id);
    cur.scrollIntoView({ block: "nearest" });
  }
  function comboChoose(id, opt) {
    var input = document.getElementById(id);
    input.value = opt.text;
    clearErr(id);
    if (id === "f-prov") {
      if (delivery.provId !== opt.value) {
        delivery.provId = opt.value; delivery.distrito = "";
        var d = document.getElementById("f-dist"); d.value = ""; d.disabled = false;
      }
      paintDeliverySide();
    } else {
      delivery.distrito = opt.value;
    }
    persistDelivery(); comboClose();
  }
  function comboCommitText(id) {
    // si el texto coincide exacto con una opción, se toma como elegida
    var input = document.getElementById(id); if (!input) return;
    var v = norm(input.value), cur = id === "f-prov" ? delivery.provId : delivery.distrito;
    if (cur && input.value && comboOptions(id).some(function (o) { return o.value === cur && o.text === input.value; })) return;
    var hit = comboOptions(id).filter(function (o) { return norm(o.text) === v || norm(o.label) === v; });
    if (hit.length === 1 && v) comboChoose(id, hit[0]);
    else if (id === "f-prov") { delivery.provId = ""; delivery.distrito = ""; var d = document.getElementById("f-dist"); if (d) { d.value = ""; d.disabled = true; } paintDeliverySide(); persistDelivery(); }
    else { delivery.distrito = ""; persistDelivery(); }
  }

  function setErr(id, msg) {
    var e = document.getElementById(id + "-err"), i = document.getElementById(id);
    if (e) e.textContent = msg;
    if (i) i.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function clearErr(id) { setErr(id, ""); }

  function validateDelivery() {
    var errs = [];
    function bad(id, msg) { errs.push([id, msg]); setErr(id, msg); }
    ["f-nombres", "f-apellidos", "f-prov", "f-dist", "f-dir", "f-cel"].forEach(clearErr);
    if (!delivery.nombres.trim()) bad("f-nombres", "Ingresa tus nombres");
    if (!delivery.apellidos.trim()) bad("f-apellidos", "Ingresa tus apellidos");
    comboCommitText("f-prov");
    if (!delivery.provId) bad("f-prov", "Elige una provincia de la lista");
    comboCommitText("f-dist");
    if (!delivery.distrito) bad("f-dist", delivery.provId ? "Elige un distrito de la lista" : "Primero elige la provincia");
    if (!delivery.direccion.trim()) bad("f-dir", "Ingresa tu dirección");
    if (delivery.celular.length !== 9) bad("f-cel", "Ingresa los 9 dígitos de tu celular");
    else if (delivery.celular.charAt(0) !== "9") bad("f-cel", "El celular debe empezar con 9");
    if (errs.length) { var el = document.getElementById(errs[0][0]); if (el) el.focus(); }
    return errs.length === 0;
  }

  /* ---------- mensaje de WhatsApp ---------- */
  function addressText() {
    var p = provById(delivery.provId);
    return delivery.direccion.trim() + ", " + delivery.distrito + ", " + (p ? provLabel(p) : "");
  }
  function phoneText(c) { return c.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"); }
  function orderText(o) {
    var out = ["Hola Dearcanih, quiero hacer un pedido", "", "Pedido del " + fmtDate(o.ts) + ", " + fmtTime(o.ts), ""];
    o.items.forEach(function (it) {
      var p = productById(it.productId);
      out.push(it.qty + "x " + p.name);
      out.push(itemLines(it).map(function (l) { return l[0] + ": " + l[1]; }).join(" · "), "");
    });
    out.push("Subtotal: " + money(o.t.sub));
    out.push("Envío: " + (o.t.mode === "free" ? "Gratis" : o.t.mode === "flat" ? money(o.t.ship) : "Se confirmará por WhatsApp"));
    out.push("Total: " + (o.t.total === null ? money(o.t.sub) + " + envío" : money(o.t.total)), "");
    out.push("Cliente: " + o.customer.name);
    out.push("Celular: " + phoneText(o.customer.phone));
    out.push("Dirección: " + o.address);
    return out.join("\n");
  }

  function placeOrder() {
    if (!validateDelivery()) return;
    var order = {
      ts: Date.now(),
      items: cart.map(function (it) { return { productId: it.productId, color: it.color, size: it.size, name: it.name || "", qty: it.qty }; }),
      t: totals(),
      customer: { name: titleCase(delivery.nombres) + " " + titleCase(delivery.apellidos), phone: delivery.celular },
      address: addressText(),
    };
    storeSet(KEY_LAST, JSON.stringify(order));
    cart = []; persist(); updateHeader();
    try { window.open(waBase(orderText(order)), "_blank", "noopener"); } catch (e) { /* queda el botón Enviar mensaje */ }
    location.hash = "#/pedido-realizado";
  }

  /* ---------- comprobante (imagen) ---------- */
  function loadImg(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }
  function svgURL(svg) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }
  function iconImg(svg, px) { return loadImg(svgURL(svg.replace("<svg ", '<svg width="' + px + '" height="' + px + '" '))); }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrapLines(ctx, text, maxW) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function receiptLines(it) {
    var l = itemLines(it).map(function (x) { return x[0] + ": " + (x[0] === "Tamaño" ? shortSize(x[1]) : x[1]); });
    if (it.qty > 1) l.push("Cantidad: " + it.qty);
    return l;
  }

  function buildReceipt(o) {
    var DISPLAY = cssVar("--display"), BODY = cssVar("--body");
    var fontsReady = Promise.all([
      document.fonts.load("800 40px " + DISPLAY), document.fonts.load("700 30px " + DISPLAY),
      document.fonts.load("400 22px " + BODY), document.fonts.load("700 22px " + BODY),
    ]).catch(function () { /* se dibuja con la fuente de respaldo */ });
    var logoSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + LOGO.vb + '" width="' + LOGO.w * 1.6 + '" height="' + LOGO.h * 1.6 + '">' + LOGO.inner + "</svg>";
    var bowlImgs = o.items.map(function (it) { return loadImg(svgURL(bowlSVG(it.productId, it.color, it.name || "", { standalone: true, width: 700 }))); });
    return Promise.all([fontsReady, loadImg(svgURL(logoSVG)), iconImg(IC.calendar, 36), iconImg(IC.clock, 36), iconImg(IC.pin, 40)].concat(bowlImgs)).then(function (r) {
      var logo = r[1], icCal = r[2], icClock = r[3], icPin = r[4], bowls = r.slice(5);
      var W = 1080, pad = 64, gap = 22;
      var cv = document.createElement("canvas"), ctx = cv.getContext("2d");
      cv.width = W; cv.height = 4000; // alto provisional, se recorta al final
      ctx.textBaseline = "alphabetic";
      var inner = W - pad * 2, y = pad;

      // dibujo en dos pasadas: medir alto y luego pintar
      function paint(draw) {
        var H = 0;
        function run(yy) {
          // cabecera
          ctx.drawImage(logo, pad, yy, logo.width, logo.height);
          ctx.font = "400 32px " + BODY; ctx.fillStyle = "#67645E"; ctx.textAlign = "right";
          var dt = fmtDate(o.ts), tm = fmtTime(o.ts);
          var dw = ctx.measureText(dt).width, tw = ctx.measureText(tm).width;
          ctx.fillText(dt, W - pad, yy + 44); ctx.drawImage(icCal, W - pad - dw - 52, yy + 14, 36, 36);
          ctx.fillText(tm, W - pad, yy + 100); ctx.drawImage(icClock, W - pad - tw - 52, yy + 70, 36, 36);
          ctx.textAlign = "left";
          yy += logo.height + 48;
          // productos
          o.items.forEach(function (it, i) {
            var p = productById(it.productId), lines = receiptLines(it);
            var cardH = Math.max(300, 150 + lines.length * 46);
            ctx.fillStyle = "#F5EFDC"; rr(ctx, pad, yy, inner, cardH, 44); ctx.fill();
            var bw = 340, bh = bw * bowls[i].height / bowls[i].width;
            ctx.drawImage(bowls[i], pad + 30, yy + (cardH - bh) / 2, bw, bh);
            var x = pad + 30 + bw + 40;
            ctx.fillStyle = "#000"; ctx.font = "800 42px " + DISPLAY; ctx.textAlign = "left";
            ctx.fillText(p.name, x, yy + 80);
            ctx.textAlign = "right"; ctx.font = "700 34px " + DISPLAY;
            ctx.fillText(money(p.price * it.qty), W - pad - 32, yy + 80); ctx.textAlign = "left";
            ctx.font = "400 30px " + BODY; ctx.fillStyle = "#67645E";
            lines.forEach(function (l, k) { ctx.fillText(l, x, yy + 140 + k * 46); });
            yy += cardH + gap;
          });
          yy += 18;
          function row(label, value, big) {
            ctx.fillStyle = big ? "#000" : "#67645E";
            ctx.font = big ? "800 50px " + DISPLAY : "400 32px " + BODY;
            ctx.textAlign = "left"; ctx.fillText(label, pad, yy);
            ctx.textAlign = "right"; ctx.fillText(value, W - pad, yy);
            yy += big ? 0 : 52;
          }
          row("Subtotal", money(o.t.sub), false);
          row("Envío", o.t.mode === "free" ? "Gratis" : o.t.mode === "flat" ? money(o.t.ship) : "Se confirmará por WhatsApp", false);
          yy += 28;
          row("Total", o.t.total === null ? money(o.t.sub) + " + envío" : money(o.t.total), true);
          yy += 44;
          ctx.strokeStyle = "#CFC9B6"; ctx.lineWidth = 3; ctx.setLineDash([12, 12]);
          ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(W - pad, yy); ctx.stroke(); ctx.setLineDash([]);
          yy += 44;
          ctx.drawImage(icPin, pad, yy - 6, 40, 40);
          ctx.fillStyle = "#67645E"; ctx.font = "400 30px " + BODY; ctx.textAlign = "left";
          var al = wrapLines(ctx, o.address, inner - 64);
          al.forEach(function (l, k) { ctx.fillText(l, pad + 64, yy + 26 + k * 42); });
          yy += 26 + al.length * 42 + pad - 20;
          return yy;
        }
        return run(draw);
      }
      ctx.fillStyle = "#FFFAEF"; ctx.fillRect(0, 0, W, 4000);
      var H = paint(y);
      var out = document.createElement("canvas"); out.width = W; out.height = H;
      out.getContext("2d").drawImage(cv, 0, 0, W, H, 0, 0, W, H);
      return new Promise(function (res, rej) {
        out.toBlob(function (b) { b ? res(b) : rej(new Error("No se pudo crear la imagen")); }, "image/png");
      });
    });
  }

  /* ---------- pantalla "pedido realizado" ---------- */
  var receiptBlob = null;
  function lastOrder() {
    var o = loadJSON(localStorage, KEY_LAST, null);
    return o && Array.isArray(o.items) && o.items.length && o.t ? o : null;
  }
  function viewDone() {
    var o = lastOrder();
    if (!o) { location.hash = "#/"; return; }
    receiptBlob = null;
    var rows = o.items.map(function (it) {
      var p = productById(it.productId); if (!p) return "";
      var meta = receiptLines(it).map(function (l) { return "<span>" + esc(l) + "</span>"; }).join('<i aria-hidden="true">/</i>');
      return '<div class="rc-item"><div class="rc-img">' + inlineStatic(it.productId, it.color, it.name || "") + '</div><div class="rc-info">' +
        '<div class="rc-top"><h3>' + esc(p.name) + "</h3><b>" + money(p.price * it.qty) + "</b></div><p class=\"li-meta\">" + meta + "</p></div></div>";
    }).join("");
    app.innerHTML =
      '<section class="done"><div class="done-card">' +
      '<img class="sticker" src="assets/gracias.svg" alt="" width="132" height="140">' +
      "<h1>¡Gracias!</h1>" +
      '<p class="lead">Asegúrate de enviarnos tu pedido por WhatsApp. Puedes mandar el mensaje que se abrió o compartirnos esta imagen.</p>' +
      '<div class="receipt"><div class="rc-head"><div class="rc-logo" id="rc-logo"></div>' +
      '<div class="rc-when"><span>' + IC.calendar + esc(fmtDate(o.ts)) + "</span><span>" + IC.clock + esc(fmtTime(o.ts)) + "</span></div></div>" +
      rows +
      '<div class="rc-sum"><div><span>Subtotal</span><span>' + money(o.t.sub) + "</span></div>" +
      "<div><span>Envío</span><span>" + esc(o.t.mode === "free" ? "Gratis" : o.t.mode === "flat" ? money(o.t.ship) : "Se confirmará por WhatsApp") + "</span></div>" +
      '<div class="tot"><span>Total</span><b>' + esc(o.t.total === null ? money(o.t.sub) + " + envío" : money(o.t.total)) + "</b></div></div>" +
      '<p class="rc-addr">' + IC.pin + "<span>" + esc(o.address) + "</span></p></div>" +
      '<button type="button" class="btn primary block" data-act="share" id="share">' + IC.whatsapp + "Compartir</button>" +
      '<div class="done-actions"><a class="linkbtn" href="' + esc(waBase(orderText(o))) + '" target="_blank" rel="noopener">' + IC.send + "Enviar mensaje</a>" +
      '<button type="button" class="linkbtn" data-act="download" id="dl">' + IC.download + "Descargar imagen</button></div>" +
      "</div>" +
      '</section>';
    document.getElementById("rc-logo").innerHTML = '<svg viewBox="' + LOGO.vb + '" aria-hidden="true">' + LOGO.inner + "</svg>";
    buildReceipt(o).then(function (b) { receiptBlob = b; }).catch(function () { /* se reintenta al tocar */ });
  }
  function withReceipt(fn) {
    var o = lastOrder(); if (!o) return;
    if (receiptBlob) return fn(receiptBlob);
    buildReceipt(o).then(function (b) { receiptBlob = b; fn(b); }).catch(function () { toast("No se pudo crear la imagen. Intenta de nuevo."); });
  }
  function downloadReceipt(blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "pedido-dear-canih.png";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function shareReceipt() {
    withReceipt(function (blob) {
      var file;
      try { file = new File([blob], "pedido-dear-canih.png", { type: "image/png" }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "Mi pedido en dear canih." }).catch(function () { /* canceló */ });
      } else {
        downloadReceipt(blob);
        toast("Descargamos la imagen. Adjúntala en tu chat de WhatsApp.");
      }
    });
  }

  /* ---------- footer ---------- */
  function renderFooter(route) {
    var f = document.getElementById("site-footer");
    if (route === "delivery" || route === "pedido-realizado") { f.hidden = true; f.innerHTML = ""; return; }
    var links = ['<a href="' + esc(waBase(CONFIG.contactText)) + '" target="_blank" rel="noopener">Contacto</a>'];
    if (CONFIG.social.instagram) links.push('<a href="' + esc(CONFIG.social.instagram) + '" target="_blank" rel="noopener">Instagram</a>');
    if (CONFIG.social.tiktok) links.push('<a href="' + esc(CONFIG.social.tiktok) + '" target="_blank" rel="noopener">TikTok</a>');
    if (CONFIG.libroReclamaciones) links.push('<a href="' + esc(CONFIG.libroReclamaciones) + '" target="_blank" rel="noopener">Libro de Reclamaciones</a>');
    f.hidden = false;
    f.innerHTML = '<div class="foot-in"><div class="foot-top"><div class="foot-logo"><svg viewBox="' + LOGO.vb + '" aria-hidden="true" role="img">' + LOGO.inner + "</svg></div>" +
      '<p class="foot-slogan">' + esc(CONFIG.slogan) + "</p></div>" +
      '<nav class="foot-links" aria-label="Enlaces">' + links.join("") + "</nav>" +
      '<div class="foot-bot"><p class="foot-sign">' + esc(CONFIG.signature) + " " + IC.heart + "</p>" +
      "<p>© " + new Date().getFullYear() + " dear canih.</p></div></div>";
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    var opt = e.target.closest(".combo-list li[data-i]");
    if (opt) return;
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    var id = el.getAttribute("data-id");
    function line() { return cart.filter(function (i) { return i.id === id; })[0]; }
    if (act === "open-drawer") { openDrawer(el); }
    else if (act === "close-drawer") { if (e.target === el || el.closest(".drawer") || el.classList.contains("drawer-bg")) closeDrawer(); }
    else if (act === "edit") { editFrom = { hash: location.hash || "#/", drawer: drawerOpen }; }
    else if (act === "qty-plus") { var a = line(); if (a) { a.qty = Math.min(99, a.qty + 1); refreshViews(); } }
    else if (act === "qty-minus") { var b = line(); if (b && b.qty > 1) { b.qty -= 1; refreshViews(); } }
    else if (act === "remove") { cart = cart.filter(function (i) { return i.id !== id; }); refreshViews(); toast("Eliminado del carrito"); }
    else if (act === "rec-prev" || act === "rec-next") {
      var tr = document.getElementById("rec-track");
      if (tr) tr.scrollBy({ left: (act === "rec-next" ? 1 : -1) * tr.clientWidth * 0.8, behavior: "smooth" });
    }
    else if (act === "toggle-sum") {
      var side = el.closest(".deliv-side"), on = !side.classList.contains("open");
      side.classList.toggle("open", on); el.setAttribute("aria-expanded", on);
    }
    else if (act === "share") { shareReceipt(); }
    else if (act === "download") { withReceipt(downloadReceipt); }
    else if (act === "new-order") {
      cart = []; persist(); try { localStorage.removeItem(KEY_LAST); } catch (err) { /* nada */ }
      updateHeader(); location.hash = "#/";
    }
    else if (act === "go-products") {
      closeDrawer();
      if (currentRoute !== "") { pendingScroll = true; location.hash = "#/"; }
      else { var t0 = document.getElementById("productos"); if (t0) t0.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }
    else if (act === "to-products") {
      var t = document.getElementById("productos");
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    else if (act === "color") {
      draft.color = el.getAttribute("data-color");
      document.querySelectorAll(".sw").forEach(function (b2) {
        var on = b2 === el;
        b2.classList.toggle("on", on);
        b2.setAttribute("aria-checked", on);
      });
      document.getElementById("color-label").textContent = colorById(draft.color).label;
      paintPreview();
    } else if (act === "size") {
      draft.size = el.getAttribute("data-size");
      document.querySelectorAll(".pill").forEach(function (b3) {
        var on = b3 === el;
        b3.classList.toggle("on", on);
        b3.setAttribute("aria-checked", on);
      });
      paintPreview();
    } else if (act === "add") {
      addToCart();
    } else if (act === "cat") {
      activeCat = el.getAttribute("data-cat");
      viewCatalog();
    }
  });

  document.addEventListener("mousedown", function (e) {
    var li = e.target.closest(".combo-list li[data-i]");
    if (li && combo.id) { e.preventDefault(); comboChoose(combo.id, combo.items[+li.getAttribute("data-i")]); return; }
    if (combo.id && !e.target.closest(".combo")) comboClose();
  });

  document.addEventListener("input", function (e) {
    var t = e.target, id = t.id;
    if (id === "name" && !e.isComposing) { onNameInput(t); return; }
    if (id === "f-nombres" || id === "f-apellidos") {
      var v = t.value.replace(NAME_RE, "").replace(/ {2,}/g, " ").replace(/^ /, "");
      if (v !== t.value) t.value = v;
      delivery[id === "f-nombres" ? "nombres" : "apellidos"] = v; persistDelivery(); clearErr(id);
    } else if (id === "f-dir") {
      delivery.direccion = t.value; persistDelivery(); clearErr(id);
    } else if (id === "f-cel") {
      var d = t.value.replace(/\D/g, "").slice(0, 9);
      if (d !== t.value) t.value = d;
      delivery.celular = d; persistDelivery(); clearErr(id);
    } else if (id === "f-prov" || id === "f-dist") {
      if (id === "f-prov") {
        delivery.provId = ""; delivery.distrito = "";
        var dd = document.getElementById("f-dist"); dd.value = ""; dd.disabled = true;
        paintDeliverySide();
      } else delivery.distrito = "";
      persistDelivery(); clearErr(id); comboRender(id, t.value);
    }
  });
  document.addEventListener("focusin", function (e) {
    var id = e.target.id;
    if (id === "name") { nameFocused = true; paintPreview(); }
    else if (id === "f-prov" || id === "f-dist") {
      var sel = id === "f-prov" ? delivery.provId : delivery.distrito;
      comboRender(id, sel ? "" : e.target.value);
    }
  });
  document.addEventListener("click", function (e) {
    var inp = e.target.closest(".combo input");
    if (inp && !inp.disabled && combo.id !== inp.id) {
      var sel = inp.id === "f-prov" ? delivery.provId : delivery.distrito;
      comboRender(inp.id, sel ? "" : inp.value);
    } else if (e.target.closest(".combo svg") && !combo.id) {
      var i2 = e.target.closest(".combo").querySelector("input"); if (i2 && !i2.disabled) i2.focus();
    }
  });
  document.addEventListener("focusout", function (e) {
    var id = e.target.id;
    if (id === "name") { nameFocused = false; paintPreview(); }
    else if (id === "f-prov" || id === "f-dist") {
      setTimeout(function () {
        if (document.activeElement && document.activeElement.id === id) return;
        comboCommitText(id); comboClose();
      }, 120);
    }
  });
  document.addEventListener("compositionend", function (e) {
    if (e.target.id === "name") onNameInput(e.target);
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id === "dform") { e.preventDefault(); placeOrder(); }
  });
  document.addEventListener("keydown", function (e) {
    var id = e.target.id;
    if (e.key === "Escape") {
      if (combo.id) { comboClose(); return; }
      if (drawerOpen) { closeDrawer(); return; }
    }
    if (drawerOpen && e.key === "Tab") {
      var f = Array.prototype.slice.call(document.querySelectorAll(".drawer a[href], .drawer button:not([disabled])"));
      if (f.length) {
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    if ((id === "f-prov" || id === "f-dist") && !e.isComposing) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (combo.id !== id) comboRender(id, ""); else comboMove(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (combo.id === id) comboMove(-1); }
      else if (e.key === "Enter" && combo.id === id && combo.items[combo.active]) { e.preventDefault(); comboChoose(id, combo.items[combo.active]); }
    }
    if (e.key === "Enter" && id === "name") { e.preventDefault(); addToCart(); }
  });

  /* ---------- rutas ---------- */
  var reopenDrawer = false, pendingScroll = false;
  function route() {
    var h = location.hash.replace(/^#/, "") || "/";
    var parts = h.split("?");
    var segs = parts[0].split("/").filter(Boolean);
    var params = new URLSearchParams(parts[1] || "");
    if (segs[0] === "pedido") { location.replace("#/carrito"); return; }
    if (drawerOpen) { drawerOpen = false; document.documentElement.classList.remove("lock"); renderDrawer(); }
    combo = { id: null, items: [], active: -1 };
    currentRoute = segs[0] || "";
    if (segs[0] === "producto") viewConfig(segs[1], params.get("editar"));
    else if (segs[0] === "carrito") viewCart();
    else if (segs[0] === "delivery") viewDelivery();
    else if (segs[0] === "pedido-realizado") viewDone();
    else viewCatalog();
    renderFooter(currentRoute);
    updateHeader();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    if (pendingScroll) { pendingScroll = false; var t1 = document.getElementById("productos"); if (t1) t1.scrollIntoView({ block: "start" }); }
    if (reopenDrawer) { reopenDrawer = false; openDrawer(); }
  }
  window.addEventListener("hashchange", route);
  route();
})();
