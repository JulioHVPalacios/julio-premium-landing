import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "index.html",
  "css/styles.css",
  "css/mondragon-motion.css",
  "js/main.js",
  "js/mondragon-motion.js",
  "vendor/gsap/gsap.min.js",
  "vendor/gsap/ScrollTrigger.min.js"
];

let failed = false;

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`[QA] Falta: ${rel}`);
    failed = true;
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const requiredLinks = [
  "https://wa.me/51900375447",
  "mailto:juliopalacios9814@gmail.com",
  "https://www.facebook.com/JulioHVPalacios/",
  "https://www.instagram.com/humbertopalaciosv/",
  "https://github.com/JulioHVPalacios?tab=repositories"
];

for (const url of requiredLinks) {
  if (!html.includes(url)) {
    console.error(`[QA] Enlace real no encontrado: ${url}`);
    failed = true;
  }
}

if (!html.includes("mondragon-motion.css") || !html.includes("mondragon-motion.js")) {
  console.error("[QA] La capa de motion no está enlazada en index.html");
  failed = true;
}

if (failed) process.exit(1);
console.log("[QA] Archivos, motion y enlaces principales: OK");
