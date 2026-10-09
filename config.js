/* Ajustes de la tienda. Lo único que normalmente se toca está aquí. */
window.DC = window.DC || {};

DC.CONFIG = {
  // Número de WhatsApp de la marca en formato internacional, sin "+" ni espacios.
  // Perú: 51 + 9 dígitos. Ejemplo: "51999888777"
  // Si queda vacío, WhatsApp abre sin destinatario para que el cliente elija el chat.
  whatsapp: "51904854033",

  currency: "S/",
  shippingLima: 15,
  nameMax: 12,
};

/*
  Colores. "up" = zona superior, "lo" = zona inferior, "tx" = texto grabado.
  El interior del bowl (borde claro y sombra) es fijo para todos los colores.
*/
DC.COLORS = [
  { id: "azul",    label: "Azul",    up: "#1762FE", lo: "#0050F7", tx: "#003BB7" },
  { id: "beige",   label: "Beige",   up: "#FBD9CF", lo: "#F8CDC1", tx: "#F29A81" },
  { id: "naranja", label: "Naranja", up: "#FD8B3F", lo: "#F67C2B", tx: "#E55B00" },
  { id: "tan",     label: "Tan",     up: "#716443", lo: "#6A5A34", tx: "#4D3E1B" },
  { id: "rosa",    label: "Rosa",    up: "#FE727F", lo: "#FB5665", tx: "#EA1C2E" },
  { id: "gris",    label: "Gris",    up: "#D8D8DA", lo: "#CCCCCE", tx: "#ACACB1" },
  { id: "negro",   label: "Negro",   up: "#2D2B24", lo: "#24221B", tx: "#000000" },
];
