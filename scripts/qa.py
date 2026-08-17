from pathlib import Path
from bs4 import BeautifulSoup
import re, sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
errors=[]
# IDs unique
ids=[x.get('id') for x in soup.find_all(id=True)]
if len(ids)!=len(set(ids)): errors.append('IDs duplicados')
# required links
hrefs={a.get('href') for a in soup.find_all('a')}
required=[
 'mailto:juliopalacios9814@gmail.com',
 'https://www.facebook.com/JulioHVPalacios/',
 'https://www.instagram.com/humbertopalaciosv/',
 'https://github.com/JulioHVPalacios?tab=repositories'
]
for href in required:
    if href not in hrefs: errors.append(f'Falta enlace: {href}')
if not any((h or '').startswith('https://wa.me/51900375447') for h in hrefs): errors.append('Falta WhatsApp')
# local anchors
for href in hrefs:
    if href and href.startswith('#') and not soup.select_one(href): errors.append(f'Anchor roto: {href}')
# images local existence and alts
for img in soup.find_all('img'):
    src=img.get('src','')
    if src and not src.startswith(('http','data:')) and not (root/src).exists(): errors.append(f'Imagen faltante: {src}')
    if not img.has_attr('alt'): errors.append(f'Imagen sin alt: {src}')
# local scripts/styles
for tag,attr in [('script','src'),('link','href')]:
    for el in soup.find_all(tag):
        val=el.get(attr)
        if val and not val.startswith(('http','mailto:','#','/')) and not (root/val).exists(): errors.append(f'Recurso local faltante: {val}')
# semantic basics
if len(soup.find_all('h1'))!=1: errors.append('Debe existir exactamente un H1')
for landmark in ['header','main','footer','nav']:
    if not soup.find(landmark): errors.append(f'Falta landmark {landmark}')
# No placeholder hrefs / lorem
if 'href="#"' in html: errors.append('Existe href="#"')
if re.search(r'lorem\s+ipsum', html, re.I): errors.append('Existe Lorem Ipsum')
print('QA estático:', 'OK' if not errors else 'FALLÓ')
for e in errors: print('-',e)
sys.exit(1 if errors else 0)
