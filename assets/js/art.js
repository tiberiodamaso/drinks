/* =========================================================
   Ilustrações dos drinks
   Gera um SVG para cada drink: o copo real, a cor da bebida,
   o gelo e as guarnições. Sem imagens externas.
   ========================================================= */

const ART = (function () {
  'use strict';

  /* ---------- Geometria de cada copo (viewBox 200x200) ---------- */
  const SHAPES = {
    martini: {
      externo: 'M44,48 L156,48 L100,116 Z',
      interno: 'M50,54 L150,54 L100,108 Z',
      haste: 'M100,116 L100,155',
      base: { cx: 100, cy: 158, rx: 27, ry: 5.5 },
      superficie: 60,
      fundo: 108,
      borda: [44, 48, 156, 48],
      apoio: { x: 141, y: 48 },
      topo: { x: 100, y: 40 },
      gelo: []
    },
    margarita: {
      externo: 'M32,42 C32,62 54,62 68,74 C78,83 86,92 88,104 L112,104 C114,92 122,83 132,74 C146,62 168,62 168,42 Z',
      interno: 'M39,48 C39,61 58,64 72,76 C81,84 90,94 92,102 L108,102 C110,94 119,84 128,76 C142,64 161,61 161,48 Z',
      haste: 'M100,104 L100,150',
      base: { cx: 100, cy: 153, rx: 29, ry: 5.5 },
      superficie: 54,
      fundo: 102,
      borda: [32, 42, 168, 42],
      apoio: { x: 152, y: 42 },
      topo: { x: 100, y: 34 },
      gelo: [{ x: 80, y: 62, s: 14, r: -14 }, { x: 106, y: 58, s: 12, r: 20 }, { x: 94, y: 76, s: 11, r: 8 }]
    },
    gin: {
      externo: 'M56,42 C36,54 34,80 52,92 C64,100 81,104 100,104 C119,104 136,100 148,92 C166,80 164,54 144,42 Z',
      interno: 'M61,48 C44,58 43,80 58,89 C69,96 83,99 100,99 C117,99 131,96 142,89 C157,80 156,58 139,48 Z',
      haste: 'M100,104 L100,148',
      base: { cx: 100, cy: 151, rx: 30, ry: 6 },
      superficie: 50,
      fundo: 99,
      borda: [56, 42, 144, 42],
      apoio: { x: 133, y: 43 },
      topo: { x: 100, y: 32 },
      gelo: [{ x: 74, y: 60, s: 17, r: -12 }, { x: 104, y: 54, s: 15, r: 18 }, { x: 118, y: 74, s: 16, r: -6 }, { x: 84, y: 82, s: 14, r: 24 }]
    },
    rocks: {
      externo: 'M54,52 L146,52 L140,152 C139.7,157 136,160 131,160 L69,160 C64,160 60.3,157 60,152 Z',
      interno: 'M59,58 L141,58 L135.4,149 C135.2,151.5 133.4,153 131,153 L69,153 C66.6,153 64.8,151.5 64.6,149 Z',
      haste: null,
      base: null,
      superficie: 70,
      fundo: 152,
      borda: [54, 52, 146, 52],
      apoio: { x: 133, y: 52 },
      topo: { x: 100, y: 44 },
      gelo: [{ x: 80, y: 80, s: 18, r: -14 }, { x: 108, y: 74, s: 16, r: 16 }, { x: 96, y: 100, s: 17, r: 4 }]
    },
    coquetel: {
      externo: 'M62,32 C68,44 72,48 72,60 C72,74 62,80 62,94 C62,114 78,128 100,134 C122,128 138,114 138,94 C138,80 128,74 128,60 C128,48 132,44 138,32 Z',
      interno: 'M68,38 C73,48 77,52 77,62 C77,74 68,80 68,94 C68,111 82,123 100,128 C118,123 132,111 132,94 C132,80 123,74 123,62 C123,52 127,48 132,38 Z',
      haste: 'M100,134 L100,158',
      base: { cx: 100, cy: 161, rx: 26, ry: 5.5 },
      superficie: 44,
      fundo: 128,
      borda: [62, 32, 138, 32],
      apoio: { x: 130, y: 33 },
      topo: { x: 100, y: 30 },
      gelo: [{ x: 88, y: 62, s: 13, r: -14 }, { x: 109, y: 56, s: 11, r: 16 }, { x: 98, y: 80, s: 12, r: 6 }]
    }
  };

  /* ---------- Guarnições ---------- */

  // Roda de fruta cítrica com gomos
  function citrico(x, y, r, casca, polpa, rot) {
    let gomos = '';
    for (let i = 0; i < 8; i++) {
      const a1 = ((i * 45) + 5) * Math.PI / 180;
      const a2 = (((i + 1) * 45) - 5) * Math.PI / 180;
      const rr = r * 0.74;
      gomos += `<path d="M${x},${y} L${(x + Math.cos(a1) * rr).toFixed(1)},${(y + Math.sin(a1) * rr).toFixed(1)} A${rr.toFixed(1)},${rr.toFixed(1)} 0 0 1 ${(x + Math.cos(a2) * rr).toFixed(1)},${(y + Math.sin(a2) * rr).toFixed(1)} Z" fill="${polpa}"/>`;
    }
    return `<g transform="rotate(${rot || 0} ${x} ${y})">
      <circle cx="${x}" cy="${y}" r="${r}" fill="${casca}"/>
      <circle cx="${x}" cy="${y}" r="${r * 0.84}" fill="#fff" opacity=".92"/>
      ${gomos}
    </g>`;
  }

  // Meia-roda apoiada na borda
  function meiaLua(x, y, r, casca, polpa) {
    return `<g>
      <path d="M${x - r},${y} A${r},${r} 0 0 1 ${x + r},${y} Z" fill="${casca}"/>
      <path d="M${x - r * 0.84},${y} A${r * 0.84},${r * 0.84} 0 0 1 ${x + r * 0.84},${y} Z" fill="#fff" opacity=".9"/>
      <path d="M${x - r * 0.72},${y} A${r * 0.72},${r * 0.72} 0 0 1 ${x + r * 0.72},${y} Z" fill="${polpa}"/>
      <path d="M${x},${y} L${x},${y - r * 0.72}M${x},${y} L${x - r * 0.5},${y - r * 0.5}M${x},${y} L${x + r * 0.5},${y - r * 0.5}"
            stroke="#fff" stroke-width="1.4" opacity=".75"/>
    </g>`;
  }

  function folha(x, y, s, rot, cor) {
    return `<path d="M${x},${y} C${x + s * 0.55},${y - s * 0.5} ${x + s * 0.95},${y - s * 0.05} ${x + s * 1.15},${y + s * 0.2}
             C${x + s * 0.8},${y + s * 0.5} ${x + s * 0.25},${y + s * 0.42} ${x},${y} Z"
             fill="${cor}" transform="rotate(${rot} ${x} ${y})"/>`;
  }

  function hortela(x, y, s) {
    return `<g>
      <path d="M${x},${y + s * 1.5} C${x - 1},${y + s * 0.6} ${x + 1},${y + s * 0.4} ${x},${y}"
            stroke="#4f9b52" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${folha(x, y + s * 0.15, s * 0.8, -142, '#5aae5c')}
      ${folha(x, y + s * 0.45, s * 0.72, -28, '#79c46f')}
      ${folha(x - 1, y - s * 0.15, s * 0.62, -85, '#66b862')}
    </g>`;
  }

  function cereja(x, y) {
    return `<g>
      <path d="M${x},${y} C${x + 3},${y - 8} ${x + 8},${y - 12} ${x + 12},${y - 13}"
            stroke="#7a6a3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y + 5}" r="6" fill="#d33b52"/>
      <circle cx="${x - 2}" cy="${y + 3}" r="1.8" fill="#fff" opacity=".55"/>
    </g>`;
  }

  function azeitona(x, y) {
    return `<g>
      <path d="M${x - 14},${y - 16} L${x + 12},${y + 8}" stroke="#b9b2a6" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="${x}" cy="${y - 3}" rx="6.5" ry="5.4" fill="#8ba03f" transform="rotate(-40 ${x} ${y - 3})"/>
      <circle cx="${x + 1}" cy="${y - 4}" r="2" fill="#d94f4f"/>
    </g>`;
  }

  function fatiaMaca(x, y, rot) {
    return `<g transform="rotate(${rot || 0} ${x} ${y})">
      <path d="M${x - 13},${y} C${x - 13},${y - 9} ${x - 6},${y - 14} ${x},${y - 14}
               C${x + 6},${y - 14} ${x + 13},${y - 9} ${x + 13},${y} Z" fill="#e8f2c9"/>
      <path d="M${x - 13},${y} C${x - 13},${y - 9} ${x - 6},${y - 14} ${x},${y - 14}
               C${x + 6},${y - 14} ${x + 13},${y - 9} ${x + 13},${y}" fill="none" stroke="#8cbf3f" stroke-width="2.4"/>
      <path d="M${x - 2},${y - 3} l2,-3 l2,3 l-2,3 Z" fill="#b9cf8a"/>
    </g>`;
  }

  function framboesas(x, y) {
    const bola = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#c9385f"/>`;
    return `<g>
      ${bola(x, y, 3)}${bola(x + 4.6, y - 1, 3)}${bola(x + 2.3, y + 3.6, 3)}${bola(x + 2.3, y - 4, 2.6)}
      ${bola(x + 14, y + 8, 2.8)}${bola(x + 18, y + 7, 2.8)}${bola(x + 16, y + 11.4, 2.8)}
    </g>`;
  }

  function twist(x, y, cor) {
    return `<path d="M${x},${y} C${x + 10},${y + 2} ${x + 13},${y + 12} ${x + 5},${y + 16}
             C${x - 3},${y + 20} ${x - 6},${y + 11} ${x + 1},${y + 8}"
             stroke="${cor}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }

  function alecrim(x, y) {
    let agulhas = '';
    for (let i = 0; i < 7; i++) {
      const yy = y + i * 4.4;
      agulhas += `<path d="M${x},${yy} l-5.5,-3.2M${x},${yy} l5.5,-3.2" stroke="#5c9160" stroke-width="1.3" stroke-linecap="round"/>`;
    }
    return `<g><path d="M${x},${y - 3} L${x},${y + 30}" stroke="#4a7d4e" stroke-width="1.5" stroke-linecap="round"/>${agulhas}</g>`;
  }

  const GUARNICOES = {
    limao:      (s) => citrico(s.apoio.x, s.apoio.y, 12, '#7cb342', '#cfe89a', 12),
    siciliano:  (s) => citrico(s.apoio.x, s.apoio.y, 12, '#e8c02f', '#f7ecad', -10),
    laranja:    (s) => meiaLua(s.apoio.x, s.apoio.y, 14, '#ef8a1f', '#fbcf8e'),
    tangerina:  (s) => citrico(s.apoio.x, s.apoio.y, 11.5, '#f08a24', '#fcd39a', 18),
    hortela:    (s) => hortela(s.topo.x + 16, s.topo.y - 22, 13),
    cereja:     (s) => cereja(s.apoio.x - 4, s.apoio.y - 12),
    azeitona:   (s) => azeitona(s.topo.x + 2, s.topo.y + 4),
    maca:       (s) => fatiaMaca(s.apoio.x - 2, s.apoio.y + 2, 14),
    framboesa:  (s) => framboesas(s.apoio.x - 6, s.apoio.y - 14),
    twist:      (s) => twist(s.apoio.x - 4, s.apoio.y - 12, '#e8c02f'),
    twistVerde: (s) => twist(s.apoio.x - 4, s.apoio.y - 12, '#8cbf3f'),
    alecrim:    (s) => alecrim(s.topo.x - 20, s.topo.y - 26)
  };

  /* ---------- Gelo ---------- */
  function cuboGelo(c) {
    return `<g transform="rotate(${c.r} ${c.x} ${c.y})">
      <rect x="${c.x - c.s / 2}" y="${c.y - c.s / 2}" width="${c.s}" height="${c.s}" rx="3.5"
            fill="#ffffff" opacity=".42"/>
      <rect x="${c.x - c.s / 2}" y="${c.y - c.s / 2}" width="${c.s}" height="${c.s}" rx="3.5"
            fill="none" stroke="#ffffff" stroke-width="1.3" opacity=".72"/>
      <path d="M${c.x - c.s / 2 + 3},${c.y - c.s / 2 + 3} l${c.s * 0.32},0" stroke="#fff" stroke-width="1.6"
            stroke-linecap="round" opacity=".8"/>
    </g>`;
  }

  function geloTriturado(shape) {
    let out = '';
    const zona = shape.gelo.length ? shape.gelo : [{ x: 100, y: shape.superficie + 20, s: 16, r: 0 }];
    zona.forEach((c, i) => {
      for (let k = 0; k < 3; k++) {
        const x = c.x + ((k - 1) * 6) + (i % 2 ? 3 : -3);
        const y = c.y + (k % 2 ? 5 : -4);
        out += `<path d="M${x},${y} l6,2 l-2,6 l-6,-2 Z" fill="#fff" opacity="${0.34 + (k * 0.08)}"
                 transform="rotate(${(i * 37 + k * 23) % 90} ${x} ${y})"/>`;
      }
    });
    return out;
  }

  /* ---------- Borda de sal / açúcar ---------- */
  function bordaGranulada(shape, cor) {
    const [x1, y1, x2] = shape.borda;
    let pontos = '';
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const x = x1 + ((x2 - x1) * i) / n;
      const dy = ((i * 7919) % 5) * 0.5;
      pontos += `<circle cx="${x.toFixed(1)}" cy="${(y1 + 1.5 + dy).toFixed(1)}" r="${(1.2 + (i % 3) * 0.35).toFixed(1)}"
                  fill="${cor}" opacity=".95"/>`;
    }
    return pontos;
  }

  /* ---------- Render principal ---------- */
  function render(drink, uid) {
    const shape = SHAPES[drink.copo];
    const arte = drink.arte || {};
    const liquido = arte.liquido || drink.cor;
    const id = `${uid || drink.id}`;
    const gid = `liq-${id}`;
    const cid = `cut-${id}`;
    const bid = `bg-${id}`;

    const temGelo = arte.gelo && shape.gelo.length;
    const enfeites = (arte.enfeites || [])
      .map((g) => (GUARNICOES[g] ? GUARNICOES[g](shape) : ''))
      .join('');

    return `<svg viewBox="20 4 160 168" role="img" aria-label="Ilustração do drink ${drink.nome}"
      xmlns="http://www.w3.org/2000/svg" class="drink-art">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="${shape.superficie}" x2="0" y2="${shape.fundo}" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${liquido[0]}"/>
          <stop offset="38%" stop-color="${liquido[1]}" stop-opacity=".62"/>
          <stop offset="100%" stop-color="${liquido[1]}"/>
        </linearGradient>
        <radialGradient id="${bid}" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stop-color="${drink.cor[0]}" stop-opacity=".95"/>
          <stop offset="100%" stop-color="${drink.cor[0]}" stop-opacity="0"/>
        </radialGradient>
        <clipPath id="${cid}"><path d="${shape.interno}"/></clipPath>
      </defs>

      <circle cx="100" cy="88" r="78" fill="url(#${bid})"/>

      ${shape.base ? `<ellipse cx="${shape.base.cx}" cy="${shape.base.cy + 6}" rx="${shape.base.rx + 4}" ry="4"
                       fill="#2b2420" opacity=".07"/>`
                   : `<ellipse cx="100" cy="163" rx="46" ry="5" fill="#2b2420" opacity=".07"/>`}

      <g class="art-glass">
        <path d="${shape.externo}" fill="#ffffff" opacity=".55"/>

        <g clip-path="url(#${cid})">
          <rect x="0" y="${shape.superficie}" width="200" height="200" fill="url(#${gid})"/>
          <rect x="0" y="${shape.superficie}" width="200" height="2.6" fill="#ffffff" opacity=".5"/>
          ${temGelo ? (arte.gelo === 'triturado' ? geloTriturado(shape) : shape.gelo.map(cuboGelo).join('')) : ''}
          <path d="M0,0 L200,0 L200,200 Z" fill="#ffffff" opacity=".1"/>
        </g>

        <path d="${shape.externo}" fill="none" stroke="#3c332c" stroke-width="2.6"
              stroke-linejoin="round" opacity=".8"/>
        ${shape.haste ? `<path d="${shape.haste}" stroke="#3c332c" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>` : ''}
        ${shape.base ? `<ellipse cx="${shape.base.cx}" cy="${shape.base.cy}" rx="${shape.base.rx}" ry="${shape.base.ry}"
                         fill="#ffffff" fill-opacity=".7" stroke="#3c332c" stroke-width="2.6" stroke-opacity=".8"/>` : ''}
        <path d="${shape.externo}" fill="none" stroke="#ffffff" stroke-width="1" opacity=".5"/>
      </g>

      ${arte.borda ? bordaGranulada(shape, arte.borda === 'sal' ? '#e9e4dc' : '#f2e2b8') : ''}
      ${enfeites}
    </svg>`;
  }

  return { render, SHAPES };
})();
