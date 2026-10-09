/*
  Catálogo. Para sumar un producto nuevo (placa, correa, collar) se agrega un
  objeto aquí. Si hay más de una categoría, el catálogo muestra filtros solo.

  fields: qué campos personaliza el cliente: "name", "color", "size".
  textArc: curva del nombre grabado, en coordenadas del SVG del bowl.
*/
window.DC = window.DC || {};

DC.CATEGORIES = {
  bowls: "Bowls",
};

DC.PRODUCTS = [
  {
    id: "splash",
    category: "bowls",
    name: "Splash bowl",
    height: "8 cm",
    material: "Origen vegetal",
    includes: "Bowl de acero inoxidable",
    price: 45,
    sizes: ["675 ml", "875 ml"],
    fields: ["name", "color", "size"],
    placeholder: "NOMBRE",
    cardColor: "azul",
    // cx/yc: centro del texto. R: radio del bowl a esa altura. ry: R por el seno
    // del ángulo de cámara. cap: alto de las mayúsculas. maxArc: largo máximo.
    textArc: { cx: 240, yc: 196, R: 205, ry: 72, cap: 44, maxArc: 415 },
  },
  {
    id: "petal",
    category: "bowls",
    name: "Petal bowl",
    height: "5.5 cm",
    material: "Origen vegetal",
    includes: "Bowl de acero inoxidable",
    price: 45,
    sizes: ["675 ml", "875 ml"],
    fields: ["color", "size"],
    cardColor: "rosa",
  },
];
