# dear canih. | tienda de bowls personalizados

Sitio estático (HTML, CSS y JS sin dependencias ni build). Funciona abriendo `index.html` o publicado en GitHub Pages.

## Antes de publicar

1. El número de WhatsApp de la marca está en `js/config.js` (formato internacional, sin `+`). Cámbialo ahí si hace falta.

## Publicar en GitHub Pages

1. Crea un repositorio y sube todo el contenido de esta carpeta a la raíz.
2. En el repositorio: Settings, Pages, Source: `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
3. En unos minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

## Cómo funciona el envío

Una página estática no puede mandar una imagen por WhatsApp por sí sola. Al tocar "Enviar pedido por WhatsApp":

1. Se genera una imagen con todos los bowls configurados y el total.
2. Se abre una ventana con dos pasos: guardar la imagen y abrir WhatsApp con el resumen ya escrito.
3. El cliente adjunta la imagen en el chat.

## Cambiar datos

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp, envío a Lima, límite del nombre | `js/config.js` |
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
