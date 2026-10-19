#!/usr/bin/env python3
"""Texto por capítulos de El flamenco contado con sencillez (Carlos Arbelos, Maeva, 2003; ePub de Epublibre).

Uso: python3 -I tools/split.py <dir_xhtml> <dir_salida>

Lee directamente los XHTML del ePub. El libro tiene cinco capítulos y dos apéndices; los largos se parten
por sus apartados para que cada fichero de datos cubra un trozo legible:
1 = prólogo e introducción; 2 = el origen; 3 = su desarrollo; 4-6 = las formas (ritmos básicos, derivados
del fandango, ritmos aflamencados); 7-9 = creadores e intérpretes (cante; toque; baile, piano y fusión);
10 = apéndices (glosario y «Para leer, ver y escuchar»). Las cabeceras salen como «## …»; cada bloque de
versos (div.versos) se une en una sola línea con « / ». Escribe <dir>/NN.txt y <dir>/book.json (párrafos
{ch, sec, segs: [[pág, texto]]}, el formato de tools/refs.py). El ePub no trae paginación impresa: la
página se estima a 300 palabras por página desde el prólogo.
"""
import html
import json
import re
import sys
from pathlib import Path

WORDS_PER_PAGE = 300
FILES = {
    1: ['Prologo', '1-'], 2: ['2-'], 3: ['3-'], 4: ['4-Las_', '4-1'], 5: ['4-2'], 6: ['4-3'],
    7: ['5-Creadores', '5-1'], 8: ['5-2'], 9: ['5-3', '5-4', '5-5'], 10: ['A.', 'B.', 'B_'],
}
BLOCK = re.compile(r'<div class="versos">(.*?)</div>|<(p|h[1-6])\b([^>]*)>(.*?)</\2>', re.S)
SPINE = re.compile(r'<itemref idref="x?([^"]+)\.xhtml"')


def clean(s):
    s = re.sub(r'<sup[^>]*>.*?</sup>', '', s, flags=re.S)
    s = html.unescape(re.sub(r'<[^>]+>', '', s)).replace('⁠', '')
    return re.sub(r'\s+', ' ', s).strip()


def main(src, out):
    src, out = Path(src), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    spine = SPINE.findall(next(src.parent.glob('*.opf')).read_text())
    paras, words = [], 0
    for ch, prefixes in FILES.items():
        sec, text = None, []
        for name in [s for s in spine if any(s.startswith(p) for p in prefixes)]:
            doc = (src / f'{name}.xhtml').read_text()
            for m in BLOCK.finditer(doc[doc.index('<body'):]):
                verses, tag, attrs, inner = m.groups()
                if verses is not None:
                    line = ' / '.join(t for t in (clean(v) for v in re.findall(r'<p\b[^>]*>(.*?)</p>', verses, re.S)) if t)
                else:
                    line = clean(inner)
                if not line:
                    continue
                if tag and tag != 'p':
                    sec = line
                    text.append(f'## {line}')
                    continue
                page = words // WORDS_PER_PAGE + 1
                paras.append({'ch': ch, 'sec': sec, 'segs': [[page, line]]})
                text.append(f'[pág. ≈{page}] {line}')
                words += len(line.split())
        (out / f'{ch:02d}.txt').write_text('\n\n'.join(text) + '\n')
        print(f'cap. {ch}: {sum(len(p["segs"][0][1].split()) for p in paras if p["ch"] == ch)} palabras')
    (out / 'book.json').write_text(json.dumps(paras, ensure_ascii=False))


if __name__ == '__main__':
    main(*sys.argv[1:])
