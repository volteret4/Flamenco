// Registro de palos, etapas, escuelas y artistas del flamenco según El flamenco contado con sencillez de Carlos Arbelos. Cada fichero de capítulo (data/NN-*.js,
// escritos a mano leyendo el libro) llama a FLAMENCO.chapter({...}) y FLAMENCO.add([...], n).
// Los datos se fusionan por id: los arrays se unen y cada capítulo puede añadir
// discos, citas (refs) y una nota propia sobre una escena ya definida en otro.
window.FLAMENCO = (function () {
  const genres = new Map();
  const chapters = [];

  const FAMILIES = {
    raices:     { name: 'Raíces: el crisol gitano, andalusí, sefardí y castellano', color: '#a78bfa' },
    letras:     { name: 'Letras y estudiosos: viajeros, Demófilo, Lorca, flamencología', color: '#94a3b8' },
    hermetica:  { name: 'Etapa hermética: los primeros cantaores', color: '#b45309' },
    cafes:      { name: 'Edad de oro: los cafés cantantes', color: '#f59e0b' },
    opera:      { name: 'Ópera flamenca: teatros, fandangos y cuplé', color: '#fb7185' },
    revalor:    { name: 'Revalorización: concursos, Mairena, tablaos y festivales', color: '#facc15' },
    basicos:    { name: 'Cantes básicos: tonás, siguiriyas, soleares, tangos, cantiñas', color: '#dc2626' },
    fandangos:  { name: 'Derivados del fandango: Málaga, Levante, Huelva', color: '#16a34a' },
    aflamencados: { name: 'Ida y vuelta y cantes aflamencados', color: '#2dd4bf' },
    toque:      { name: 'El toque: la guitarra flamenca', color: '#d6a35c' },
    baile:      { name: 'El baile', color: '#ec4899' },
    fusion:     { name: 'Encuentro con otras músicas: nuevo flamenco y fusión', color: '#38bdf8' },
  };

  const key = (t) => (t.a + '|' + t.t).toLowerCase();

  function mergeArr(a = [], b = [], k = (x) => (typeof x === 'string' ? x.toLowerCase() : JSON.stringify(x))) {
    const seen = new Set(a.map(k));
    const out = a.slice();
    for (const x of b) if (!seen.has(k(x))) { seen.add(k(x)); out.push(x); }
    return out;
  }

  // Anota en cada disco los capítulos que lo citan.
  function cite(tracks, t, ch) {
    const m = tracks.find((x) => key(x) === key(t));
    if (m && ch != null) m.chs = mergeArr(m.chs, [ch]);
  }

  function add(list, chapter) {
    for (const g of list) {
      let cur = genres.get(g.id);
      if (!cur) {
        cur = { id: g.id, aka: [], influences: [], artists: [], tracks: [], labels: [], refs: [], notes: [], chapters: [] };
        genres.set(g.id, cur);
      }
      for (const f of ['aka', 'influences', 'artists', 'labels']) cur[f] = mergeArr(cur[f], g[f]);
      cur.tracks = mergeArr(cur.tracks, (g.tracks || []).map((t) => ({ ...t })), key);
      for (const t of g.tracks || []) {
        if (t.ess) { const m = cur.tracks.find((x) => key(x) === key(t)); if (m) m.ess = 1; }
        cite(cur.tracks, t, chapter);
      }
      cur.refs = mergeArr(cur.refs, (g.refs || []).map((r) => ({ ch: chapter, ...r })), (r) => r.q);
      for (const f of ['name', 'family', 'start', 'end', 'place', 'desc']) if (g[f] != null && cur[f] == null) cur[f] = g[f];
      if (g.desc != null) cur.descCh = cur.descCh ?? chapter;
      if (g.note) cur.notes.push({ ch: chapter, text: g.note });
      if (chapter != null && !cur.chapters.includes(chapter)) cur.chapters.push(chapter);
    }
  }

  return {
    FAMILIES,
    chapters,
    genres,
    chapter(meta) { chapters.push(meta); },
    add,
  };
})();
