import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "index.html",
  "css/cinematic-v2.css",
  "js/cinematic-v2.js",
  "vendor/gsap/gsap.min.js",
  "vendor/gsap/ScrollTrigger.min.js"
];

let failed = false;

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`[QA] Falta: ${rel}`);
    failed = true;
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const links = [
  "https://wa.me/51900375447",
  "mailto:juliopalacios9814@gmail.com",
  "https://www.facebook.com/JulioHVPalacios/",
  "https://www.instagram.com/humbertopalaciosv/",
  "https://github.com/JulioHVPalacios?tab=repositories"
];

for (const url of links) {
  if (!html.includes(url)) {
    console.error(`[QA] Falta enlace real: ${url}`);
    failed = true;
  }
}

const prohibited = [
  "Lorem ipsum",
  "testimonial",
  "cliente ficticio",
  "premio ficticio"
];

for (const token of prohibited) {
  if (html.toLowerCase().includes(token.toLowerCase())) {
    console.error(`[QA] Contenido provisional/no permitido detectado: ${token}`);
    failed = true;
  }
}

if (!html.includes("cinematic-v2.css") || !html.includes("cinematic-v2.js")) {
  console.error("[QA] La nueva experiencia cinematográfica no está enlazada.");
  failed = true;
}

if (failed) process.exit(1);
console.log("[QA] Estructura V2, archivos y enlaces reales: OK");
