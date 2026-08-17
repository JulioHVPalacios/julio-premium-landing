# QA — Landing Julio Humberto Vera Palacios

## Estado

**APROBADO para entrega local.**

## Validaciones ejecutadas

- HTML semántico parseado y revisado.
- Un solo `h1`.
- Landmarks: `header`, `nav`, `main`, `footer`.
- IDs únicos.
- Anchors internos existentes.
- Sin `href="#"` provisional.
- Sin Lorem Ipsum.
- Todos los recursos locales referenciados existen.
- Todas las imágenes tienen `alt`.
- WhatsApp usa `wa.me/51900375447` con mensaje neutral.
- Correo usa `mailto:juliopalacios9814@gmail.com`.
- Facebook, Instagram y GitHub usan las URLs proporcionadas.
- JavaScript validado mediante `node --check`.
- CSS parseado sin errores con `tinycss2`.
- `npm run check`: OK.
- Consola durante auditoría visual: 0 errores.
- Overflow horizontal comprobado: 0 px en 375, 768, 1024, 1440 y 1920 px.
- `prefers-reduced-motion`: contenido visible, spotlight desactivado, cursor personalizado desactivado.
- Navegación móvil: abre/cierra, bloquea scroll del documento y responde a Escape.

## Auditoría visual

Capturas revisadas en:

- 375 × 900
- 768 × 1000
- 1024 × 900
- 1440 × 1000
- 1920 × 1080

Además se inspeccionaron servicios, perfil, contacto y menú móvil.

### Corrección de segunda pasada

En 768 px el enlace secundario de correo quedaba demasiado comprimido junto al CTA principal. Se rediseñó el bloque para apilar el correo debajo del CTA en tablet, manteniendo la composición del hero.

## Nota sobre tipografías durante QA offline

Las capturas de QA se renderizaron sin descargar Google Fonts para evitar dependencia de red dentro del entorno de pruebas. El sitio real solicita Instrument Sans, Source Serif 4 e IBM Plex Mono; si la red no está disponible, mantiene fallbacks legibles.

## Publicación

No se realizó deploy ni push a GitHub. Canonical y sitemap permanecen relativos para no inventar un dominio. Al publicar en un dominio real deben sustituirse por URLs absolutas.
