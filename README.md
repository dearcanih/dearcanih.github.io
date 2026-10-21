# dear canih. | tienda de bowls personalizados

Sitio estático (HTML, CSS y JS sin dependencias ni build). Funciona abriendo `index.html` o publicado en GitHub Pages.

## Antes de publicar

1. El número de WhatsApp de la marca está en `js/config.js` (formato internacional, sin `+`). Cámbialo ahí si hace falta.

## Publicar en GitHub Pages

1. Crea un repositorio y sube todo el contenido de esta carpeta a la raíz.
2. En el repositorio: Settings, Pages, Source: `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
3. En unos minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

## Vista previa al compartir el link

Las etiquetas Open Graph están en `index.html` y la imagen es `assets/preview.png` (1200x1200). Las URLs son absolutas y asumen `https://dearcanih.github.io/`; si el repositorio se llama distinto, cambia esa base en `index.html`. WhatsApp y otras apps guardan la vista previa en caché: si cambias algo, tarda en actualizarse.

## Cómo funciona el envío

Una página estática no puede mandar una imagen por WhatsApp por sí sola. Al tocar "Enviar pedido por WhatsApp":

1. Se genera una imagen con todos los bowls configurados y el total.
2. Se abre una ventana con dos pasos: guardar la imagen y abrir WhatsApp con el resumen ya escrito.
3. El cliente adjunta la imagen en el chat.

## Cambiar datos

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp, envío a Lima, límite del nombre, texto del banner negro (`promo`, vacío = sin banner) | `js/config.js` |
| Imagen de portada | `assets/portada.jpg` |
| Video del perrito (vertical para escritorio, horizontal para celular) | `assets/media/perrito-v.*` y `perrito-h.*` (mp4, webm y póster) |
| Colores (zona superior, inferior y texto) | `js/config.js`, lista `DC.COLORS` |
| Productos, precios, alturas, tamaños | `js/products.js` |
| Estilo, tipografías y colores de marca | `css/styles.css` (variables en `:root`) |

Para sumar un producto (placa, correa, collar) se agrega un objeto en `js/products.js`. Si hay más de una categoría en `DC.CATEGORIES`, el catálogo muestra filtros automáticamente.

## Nombre curvado

El nombre se proyecta sobre un cilindro para seguir la curva del bowl (`js/curve.js`). Los parámetros de cada producto están en `textArc` dentro de `js/products.js`. La fuente Cookies no trae Á É Í Ó Ú Ñ con forma, así que se arman con la letra base más el acento o la virgulilla de la propia fuente.

## Regenerar assets

`js/glyphs.js`, `js/bowls.js` y `js/logo.js` se generan con:

```
python3 tools/build_assets.py COOKIE1.TTF Splash-bowl.svg Petal-bowl.svg Dearcanih-logo.svg
```

Requiere Python 3 y `fonttools`. El archivo de la fuente Cookies no está en el repo: el sitio solo usa sus contornos ya convertidos.

## Tipografías

Esta versión usa solo fuentes de licencia abierta (SIL OFL), así que se puede publicar sin comprar licencias:

- Archivo en versión ancha (`fonts/ArchivoWide-*.woff2`): títulos y números. Reemplaza a TT Travels.
- Jost Light Italic: frases decorativas. Reemplaza a Neulis.
- Zen Kaku Gothic New: texto de cuerpo.

Las licencias están en `fonts/LICENSE-*.txt`. El código es el mismo que el de la versión con TT Travels: lo único que cambia es `css/fonts.css` y la carpeta `fonts/`.

## Flujo de pedido
- Configurar → "Añadir al carrito" abre el panel "Tu pedido." → "Pedir ahora" (#/delivery) o "Ver carrito" (#/carrito).
- Delivery gratis desde S/ 90 (`freeShippingFrom`). Lima y Callao: S/ 15; otras provincias: se confirma por WhatsApp. Todo en `js/config.js`.
- "Realizar pedido" abre WhatsApp con el detalle y lleva a #/pedido-realizado (recibo en imagen, compartir/descargar). El carrito se vacía al realizar el pedido; el recibo queda guardado.
- Pie de página: Instagram, TikTok y Libro de Reclamaciones aparecen solo cuando pones sus URLs en `config.js` (`social`, `libroReclamaciones`).
- Provincias y distritos: `js/ubigeo.js` (generado con `tools/build_ubigeo.py`).
