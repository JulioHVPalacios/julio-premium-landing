# Dirección de arte y UX

## Idea rectora

**“Sistema, oficio y estructura.”** La identidad visual mezcla el orden de un plano técnico con la escala y el ritmo de una pieza editorial. La tecnología aparece como herramienta de trabajo, no como decoración futurista.

## Decisiones anti-IA

- Fondo marfil cálido y grafito; acento terracota limitado.
- Sin gradientes violeta/cian, blobs, halos, partículas, glassmorphism, bento genérico ni tarjetas repetidas.
- Hero asimétrico, tipográfico y editorial; no usa badge + H1 centrado + dos botones + mockup.
- Servicios presentados como capítulos narrativos con media sticky en desktop y lectura lineal en móvil.
- Fotografías reales de Pexels; no hay retratos inventados de Julio ni imágenes generadas por IA.
- Sin testimonios, clientes, métricas, premios, años de experiencia o proyectos ficticios.

## Sistema visual

- Background: `#efede6`
- Foreground: `#151512`
- Surface: `#e3e0d7`
- Border: `#c8c3b7`
- Dark: `#171816`
- Accent: `#b94f32`
- Secondary accent: `#526859`
- Sans: Instrument Sans
- Serif: Source Serif 4
- Mono: IBM Plex Mono
- Radio dominante: prácticamente nulo; solo radios pequeños donde tienen función.
- Easing principal: `cubic-bezier(.16,1,.3,1)`.

## Motion language

1. Entrada: desplazamiento vertical corto + reducción de blur.
2. Media: reveal mediante clip-path.
3. Servicios: cambio de imagen por capítulo y progresión sticky.
4. Hero: spotlight de color solo con `pointer: fine`; móvil mantiene imagen monocroma estable.
5. CTA: microdesplazamiento magnético muy suave; nunca necesario para entender o activar el enlace.
6. Reduced motion: revela todo inmediatamente, elimina spotlight y cursor personalizado.

## Arquitectura UX

1. Hero: identidad + qué hace + CTA principal WhatsApp.
2. Servicios: cinco áreas reales sin convertirlas en cinco cards.
3. Enfoque: necesidad → estructura → construcción → comprobación.
4. Capacidades: mapa tipográfico de web, móvil, empresa, automatización y ofimática.
5. Perfil: combina Administración de Empresas + Informática Empresarial sin inventar experiencia.
6. GitHub: enlace al perfil real, sin falsos casos de estudio.
7. Contacto: WhatsApp dominante, correo secundario, redes terciarias.

## Referencias estudiadas

Se revisaron patrones contemporáneos de composición y creative development en:

- Awwwards — portfolios, developer portfolios y tipografía.
- Hoverstat.es — interacción editorial y navegación no convencional.
- Codrops / Tympanus — scroll typography, composición por escenas y motion basado en scroll.
- GSAP / ScrollTrigger — principios de secuenciación y accesibilidad responsive.
- Lenis — filosofía de smooth scroll sin scroll-jacking.

No se copió código o layout literal de estas referencias. El resultado utiliza una dirección propia.

## Decisión tecnológica

La implementación final no introduce React/Next/Three.js/GSAP porque, para una landing de una sola ruta, esas dependencias no aportaban suficiente valor frente al coste de JavaScript y mantenimiento. La interacción se resuelve con HTML semántico, CSS moderno, `IntersectionObserver` y `requestAnimationFrame`.

Esta decisión sigue la prioridad definida en el brief: dirección de arte → UX → UI → contenido → motion → performance → 3D. WebGL se descartó porque habría sido decorativo.
