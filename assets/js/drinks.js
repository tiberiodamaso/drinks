/* =========================================================
   Base de dados dos drinks
   Cada drink referencia um dos copos disponíveis em casa.

   FOTOS
   Por padrão o card mostra a ilustração SVG do copo do drink,
   gerada em art.js. Para usar uma foto real, coloque o arquivo
   em assets/img/ e adicione o campo `imagem` ao drink:

       imagem: 'assets/img/mojito.webp',

   A foto substitui a ilustração só naquele card. Se o arquivo
   não carregar, o card volta sozinho para a ilustração.
   ========================================================= */

const GLASSES = {
  martini: {
    id: 'martini',
    artigo: 'na',
    curto: 'Martini',
    nome: 'Taça Martini',
    volume: '250 ml',
    descricao: 'Taça de coquetel clássica, cônica e sem gelo.'
  },
  margarita: {
    id: 'margarita',
    artigo: 'na',
    curto: 'Margarita',
    nome: 'Taça Margarita',
    volume: '375 ml',
    descricao: 'Taça larga com borda ideal para sal ou açúcar.'
  },
  gin: {
    id: 'gin',
    artigo: 'na',
    curto: 'Copa Gin',
    nome: 'Taça de Gin (Copa)',
    volume: '600 ml',
    descricao: 'Balão grande, muito gelo e bastante aroma.'
  },
  rocks: {
    id: 'rocks',
    artigo: 'no',
    curto: 'Rocks',
    nome: 'Copo Rocks / Caipirinha',
    volume: '350 ml',
    descricao: 'Copo baixo e reforçado — serve também para whisky.'
  },
  coquetel: {
    id: 'coquetel',
    artigo: 'na',
    curto: 'Coquetel',
    nome: 'Taça Coquetel Tropical',
    volume: '355 ml',
    descricao: 'Taça alta e curvada, estilo furacão — para drinks longos com muito gelo.'
  }
};

/* Ícones SVG de cada copo (desenhados à mão, sem dependência externa) */
const GLASS_ICONS = {
  martini: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h44L32 36 10 12Z"/><path d="M32 36v18"/><path d="M20 56h24"/><path d="M17 19h30"/></svg>`,
  margarita: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14h48c0 8-8 10-12 14-3 3-4 6-4 9H20c0-3-1-6-4-9C12 24 8 22 8 14Z"/><path d="M32 37v17"/><path d="M20 56h24"/></svg>`,
  gin: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14c0 11 8 20 18 20s18-9 18-20"/><path d="M14 14h36"/><path d="M32 34v16"/><path d="M20 54h24"/></svg>`,
  rocks: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 12h32l-4 40H20L16 12Z"/><path d="M17 24h30"/></svg>`,
  coquetel: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 8c2 4 3 6 3 10 0 6-3 8-3 13 0 6 5 11 12 13 7-2 12-7 12-13 0-5-3-7-3-13 0-4 1-6 3-10"/><path d="M20 8h24"/><path d="M32 44v10"/><path d="M22 56h20"/></svg>`
};

/* =========================================================
   DRINKS
   forca: leve | medio | forte
   ========================================================= */
const DRINKS = [
  /* ---------- TAÇA MARTINI ---------- */
  {
    id: 'dry-martini',
    nome: 'Dry Martini',
    subtitulo: 'O clássico absoluto, gelado e seco',
    copo: 'martini',
    forca: 'forte',
    tags: ['seco', 'clássico', 'herbal'],
    cor: ['#cfe8d5', '#7fb69a'],
    arte: { liquido: ['#f7fbf1', '#c6ddb4'], enfeites: ['twist'] },
    ingredientes: [
      '60 ml de gin Tanqueray',
      '10 ml de Martini Extra Dry',
      'Casca de limão siciliano',
      'Gelo em cubos (só para mexer)'
    ],
    preparo: [
      'Deixe a taça no congelador por 10 minutos.',
      'Em um mixing glass (ou copo alto) com bastante gelo, junte o gin e o vermute.',
      'Mexa com colher por 25 a 30 segundos — não bata, para o drink ficar cristalino.',
      'Coe para a taça gelada.',
      'Torça a casca de limão sobre a superfície para soltar o óleo e deixe na borda.'
    ],
    guarnicao: 'Twist de limão siciliano (ou azeitona, se preferir salgado)',
    dica: 'Quanto menos vermute, mais seco. Se quiser um pouco mais macio, use 15 ml.'
  },
  {
    id: 'white-lady',
    nome: 'White Lady',
    subtitulo: 'Cítrico, seco e elegante',
    copo: 'martini',
    forca: 'medio',
    tags: ['cítrico', 'clássico', 'refrescante'],
    cor: ['#f4f1e4', '#d9c48a'],
    arte: { liquido: ['#fefbf0', '#e4cf94'], enfeites: ['twist'] },
    ingredientes: [
      '45 ml de gin Tanqueray',
      '20 ml de Curaçau triple sec',
      '20 ml de suco de limão taiti fresco',
      'Gelo em cubos'
    ],
    preparo: [
      'Deixe a taça no congelador por 10 minutos.',
      'Junte o gin, o triple sec e o limão na coqueteleira com bastante gelo.',
      'Bata com força por 12 a 15 segundos, até a coqueteleira ficar gelada por fora.',
      'Coe duas vezes (coador da coqueteleira + peneira fina) para a taça gelada.'
    ],
    guarnicao: 'Twist fino de limão siciliano',
    dica: 'Coar duas vezes é o que deixa o drink limpo: sem lascas de gelo, ele não agua no meio do caminho.'
  },
  {
    id: 'tequini',
    nome: 'Tequini',
    subtitulo: 'O Martini que trocou o gin pela tequila',
    copo: 'martini',
    forca: 'forte',
    tags: ['seco', 'agave', 'clássico'],
    cor: ['#f7e6c4', '#c9a227'],
    arte: { liquido: ['#fbf8e6', '#dbc98a'], enfeites: ['azeitona'] },
    ingredientes: [
      '60 ml de tequila (prata de preferência)',
      '10 ml de Martini Extra Dry',
      'Casca de limão',
      'Gelo em cubos'
    ],
    preparo: [
      'Gele bem a taça.',
      'Mexa a tequila com o vermute e bastante gelo por 25 segundos.',
      'Coe para a taça.',
      'Torça a casca de limão por cima e descarte ou use como guarnição.'
    ],
    guarnicao: 'Twist de limão',
    dica: 'Uma pitada mínima de sal na taça realça o agave sem deixar salgado.'
  },
  {
    id: 'el-presidente',
    nome: 'El Presidente',
    subtitulo: 'Cubano dos anos 20, seco e sedoso',
    copo: 'martini',
    forca: 'medio',
    tags: ['seco', 'clássico', 'cítrico'],
    cor: ['#ffd9c0', '#e07a5f'],
    arte: { liquido: ['#ffd9c0', '#e07a5f'], enfeites: ['laranja'] },
    ingredientes: [
      '45 ml de rum Bacardi Carta Blanca',
      '20 ml de Martini Extra Dry',
      '10 ml de Curaçau triple sec',
      '3 gotas de xarope de grenadine (só para cor)',
      'Gelo em cubos'
    ],
    preparo: [
      'Junte tudo no mixing glass com gelo.',
      'Mexa por 25 segundos até gelar bem.',
      'Coe para a taça martini gelada.'
    ],
    guarnicao: 'Casca de laranja torcida',
    dica: 'Grenadine aqui é maquiagem, não doçura: mais que 3 gotas desequilibra.'
  },
  {
    id: 'hortela-martini',
    nome: 'Martini de Hortelã',
    subtitulo: 'Gelado, herbal e absurdamente refrescante',
    copo: 'martini',
    forca: 'medio',
    tags: ['refrescante', 'herbal', 'cítrico'],
    cor: ['#d6f5e3', '#3fa87a'],
    arte: { liquido: ['#e9f9ef', '#9bd8ba'], enfeites: ['hortela'] },
    ingredientes: [
      '50 ml de gin Tanqueray',
      '10 ml de licor Stock Menta',
      '15 ml de suco de limão taiti',
      '6 a 8 folhas de hortelã',
      'Gelo em cubos'
    ],
    preparo: [
      'Coloque as folhas de hortelã na coqueteleira e pressione de leve (sem rasgar).',
      'Adicione gin, licor de menta, limão e gelo.',
      'Bata com força por 12 segundos.',
      'Coe duas vezes para a taça gelada — não deve sobrar folha no drink.'
    ],
    guarnicao: 'Um raminho de hortelã batido na palma da mão',
    dica: 'Bater a hortelã na mão antes de guarnecer libera o aroma sem amargar.'
  },

  /* ---------- TAÇA MARGARITA ---------- */
  {
    id: 'margarita-classica',
    nome: 'Margarita Clássica',
    subtitulo: 'Tequila, limão e sal — nada mais',
    copo: 'margarita',
    forca: 'medio',
    tags: ['cítrico', 'clássico', 'refrescante'],
    cor: ['#f0f7d4', '#a3c44b'],
    arte: { liquido: ['#f4fadd', '#c3da76'], gelo: 'cubos', borda: 'sal', enfeites: ['limao'] },
    ingredientes: [
      '50 ml de tequila',
      '25 ml de Curaçau triple sec',
      '25 ml de suco de limão taiti fresco',
      'Sal grosso moído para a borda',
      'Gelo em cubos'
    ],
    preparo: [
      'Passe um gomo de limão em metade da borda da taça e mergulhe no sal.',
      'Bata tequila, triple sec e limão com bastante gelo por 12 segundos.',
      'Coe para a taça (com ou sem gelo, como preferir).'
    ],
    guarnicao: 'Rodela de limão na borda',
    dica: 'Salgue só metade da borda: quem não gosta bebe pelo outro lado.'
  },
  {
    id: 'blue-margarita',
    nome: 'Blue Margarita',
    subtitulo: 'A clássica com um azul de piscina',
    copo: 'margarita',
    forca: 'medio',
    tags: ['cítrico', 'colorido', 'refrescante'],
    cor: ['#cbe9ff', '#2b8fd6'],
    arte: { liquido: ['#abddf7', '#2b8fd6'], gelo: 'cubos', borda: 'sal', enfeites: ['limao'] },
    ingredientes: [
      '50 ml de tequila',
      '25 ml de Curaçau Blue',
      '25 ml de suco de limão taiti fresco',
      'Sal grosso para a borda',
      'Gelo em cubos'
    ],
    preparo: [
      'Faça a borda de sal com um gomo de limão.',
      'Bata todos os líquidos com gelo por 12 segundos.',
      'Coe para a taça e complete com gelo fresco se quiser.'
    ],
    guarnicao: 'Rodela de limão',
    dica: 'O Blue Curaçau é mais doce que o triple sec — não passe dos 25 ml.'
  },
  {
    id: 'margarita-tangerina',
    nome: 'Margarita de Tangerina',
    subtitulo: 'Cítrica, aromática e levemente adocicada',
    copo: 'margarita',
    forca: 'medio',
    tags: ['cítrico', 'frutado', 'refrescante'],
    cor: ['#ffe0b8', '#f08a24'],
    arte: { liquido: ['#ffd9a6', '#f08a24'], gelo: 'cubos', borda: 'sal', enfeites: ['tangerina'] },
    ingredientes: [
      '50 ml de tequila',
      '15 ml de Curaçau triple sec',
      '15 ml de xarope de tangerina',
      '25 ml de suco de limão taiti fresco',
      'Sal com raspas de laranja para a borda',
      'Gelo em cubos'
    ],
    preparo: [
      'Misture o sal com raspas de laranja e faça a borda da taça.',
      'Bata tequila, triple sec, xarope e limão com gelo por 12 segundos.',
      'Coe para a taça sobre gelo fresco.'
    ],
    guarnicao: 'Gomo de tangerina ou raspas de laranja',
    dica: 'Se a tangerina estiver muito doce, suba o limão para 30 ml.'
  },

  /* ---------- TAÇA DE GIN (COPA 600 ml) ---------- */
  {
    id: 'gin-tonica-classica',
    nome: 'Gin Tônica Clássica',
    subtitulo: 'Zimbro, limão siciliano e muito gelo',
    copo: 'gin',
    forca: 'medio',
    tags: ['refrescante', 'seco', 'herbal'],
    cor: ['#e3f2ff', '#6aa9d8'],
    arte: { liquido: ['#f2faff', '#b2d8f0'], gelo: 'cubos', enfeites: ['siciliano'] },
    ingredientes: [
      '60 ml de gin Tanqueray',
      '200 ml de água tônica bem gelada',
      '4 bagas de zimbro (opcional)',
      'Casca de limão siciliano',
      'Gelo em cubos grandes — encha a taça'
    ],
    preparo: [
      'Encha a taça até a boca com gelo e gire para gelar o vidro; descarte a água.',
      'Espalhe as bagas de zimbro entre os cubos.',
      'Despeje o gin sobre o gelo.',
      'Complete com a tônica escorrendo pela colher, para não perder o gás.',
      'Dê apenas UMA mexida de baixo para cima.'
    ],
    guarnicao: 'Casca larga de limão siciliano, torcida sobre a taça',
    dica: 'Gelo até a boca da taça derrete menos e mantém o drink seco até o fim.'
  },
  {
    id: 'gt-maca-verde',
    nome: 'Gin Tônica de Maçã Verde',
    subtitulo: 'Ácida, crocante e nada enjoativa',
    copo: 'gin',
    forca: 'medio',
    tags: ['refrescante', 'frutado', 'cítrico'],
    cor: ['#e2f7cf', '#79bd3f'],
    arte: { liquido: ['#ecf8d6', '#9acf58'], gelo: 'cubos', enfeites: ['maca', 'alecrim'] },
    ingredientes: [
      '60 ml de gin Tanqueray',
      '15 ml de xarope de maçã verde',
      '10 ml de suco de limão taiti',
      '180 ml de água tônica gelada',
      'Fatias finas de maçã verde',
      'Gelo em cubos — encha a taça'
    ],
    preparo: [
      'Encha a taça de gelo.',
      'Junte gin, xarope e limão e mexa rapidamente para integrar.',
      'Complete com a tônica pela lateral da taça.',
      'Mexa uma vez só e acomode as fatias de maçã entre o gelo.'
    ],
    guarnicao: 'Leque de maçã verde e um raminho de alecrim, se tiver',
    dica: 'O limão é o que impede o xarope de deixar o drink doce. Não pule.'
  },
  {
    id: 'gt-framboesa-hortela',
    nome: 'Gin Tônica de Framboesa e Hortelã',
    subtitulo: 'Frutada no aroma, seca no gole',
    copo: 'gin',
    forca: 'medio',
    tags: ['refrescante', 'frutado', 'herbal'],
    cor: ['#ffd6e2', '#d34b6e'],
    arte: { liquido: ['#ffd0de', '#d3406a'], gelo: 'cubos', enfeites: ['framboesa', 'hortela'] },
    ingredientes: [
      '60 ml de gin Tanqueray',
      '15 ml de xarope de framboesa',
      '15 ml de suco de limão taiti',
      '180 ml de água tônica gelada',
      '1 punhado de hortelã',
      'Gelo em cubos — encha a taça'
    ],
    preparo: [
      'Bata a hortelã entre as mãos e jogue no fundo da taça.',
      'Encha de gelo, adicione gin, xarope e limão.',
      'Complete com tônica escorrendo pela colher.',
      'Mexa uma vez de baixo para cima.'
    ],
    guarnicao: 'Buquê de hortelã bem perto da borda, para sentir no nariz',
    dica: 'Framboesas frescas ou congeladas no gelo deixam o visual impecável.'
  },
  {
    id: 'rosso-tonic',
    nome: 'Rosso Tonic',
    subtitulo: 'Baixo teor alcoólico, amargo e sedento',
    copo: 'gin',
    forca: 'leve',
    tags: ['refrescante', 'amargo', 'leve'],
    cor: ['#ffd2c4', '#c0392b'],
    arte: { liquido: ['#ffbda4', '#c0392b'], gelo: 'cubos', enfeites: ['laranja'] },
    ingredientes: [
      '60 ml de Martini Vermouth Rosso',
      '150 ml de água tônica gelada',
      'Meia rodela grossa de laranja',
      'Gelo em cubos — encha a taça'
    ],
    preparo: [
      'Encha a taça com gelo até a boca.',
      'Despeje o vermute rosso sobre o gelo.',
      'Complete com a tônica.',
      'Mexa uma vez e acomode a laranja.'
    ],
    guarnicao: 'Meia rodela de laranja',
    dica: 'O drink perfeito para quem quer beber a noite toda sem cair. Depois de aberto, guarde o vermute na geladeira.'
  },
  {
    id: 'blue-ocean-tonic',
    nome: 'Blue Ocean Tonic',
    subtitulo: 'Visual de piscina, sabor de gin tônica',
    copo: 'gin',
    forca: 'medio',
    tags: ['refrescante', 'colorido', 'cítrico'],
    cor: ['#cdf1ff', '#1e7fb0'],
    arte: { liquido: ['#c2eaff', '#1e7fb0'], gelo: 'cubos', enfeites: ['limao', 'alecrim'] },
    ingredientes: [
      '50 ml de gin Tanqueray',
      '15 ml de Curaçau Blue',
      '10 ml de suco de limão taiti',
      '180 ml de água tônica gelada',
      'Gelo em cubos — encha a taça'
    ],
    preparo: [
      'Encha a taça de gelo.',
      'Adicione o gin, o limão e por último o Curaçau Blue, que desce e faz o degradê.',
      'Complete com a tônica bem devagar.',
      'Sirva sem mexer, para manter o efeito de camadas.'
    ],
    guarnicao: 'Rodela de limão e, se tiver, um raminho de alecrim',
    dica: 'Não mexa na frente do convidado — o degradê é metade da graça.'
  },

  /* ---------- COPO ROCKS / CAIPIRINHA ---------- */
  {
    id: 'mojito',
    nome: 'Mojito',
    subtitulo: 'Hortelã, limão e soda — o refresco definitivo',
    copo: 'rocks',
    forca: 'medio',
    tags: ['refrescante', 'herbal', 'cítrico'],
    cor: ['#dff6e0', '#48a860'],
    arte: { liquido: ['#ebfae7', '#8ed07e'], gelo: 'triturado', enfeites: ['hortela', 'limao'] },
    ingredientes: [
      '50 ml de rum Bacardi Carta Blanca',
      '10 ml de licor Stock Menta',
      '25 ml de suco de limão taiti',
      '1 colher de chá de açúcar (ou pule, o licor já adoça)',
      '10 folhas de hortelã',
      'Água com gás para completar',
      'Gelo triturado'
    ],
    preparo: [
      'No copo, pressione levemente a hortelã com o açúcar e o limão — pressione, não amasse.',
      'Adicione o rum e o licor de menta.',
      'Encha o copo com gelo triturado e mexa de baixo para cima.',
      'Complete com água com gás e coroe com mais gelo.'
    ],
    guarnicao: 'Buquê generoso de hortelã',
    dica: 'Hortelã rasgada libera clorofila e amarga. Pressione só o suficiente para soltar o aroma.'
  },
  {
    id: 'paloma',
    nome: 'Paloma',
    subtitulo: 'Tequila, cítrico e uma pitada de sal',
    copo: 'rocks',
    forca: 'medio',
    tags: ['refrescante', 'cítrico', 'agave'],
    cor: ['#ffdfe0', '#e06377'],
    arte: { liquido: ['#ffd8da', '#e06377'], gelo: 'cubos', enfeites: ['limao'] },
    ingredientes: [
      '50 ml de tequila',
      '20 ml de suco de limão taiti',
      '10 ml de xarope de tangerina',
      '1 pitada generosa de sal',
      '150 ml de água com gás bem gelada',
      'Gelo em cubos'
    ],
    preparo: [
      'Encha o copo de gelo.',
      'Adicione a tequila, o limão, o xarope e o sal.',
      'Mexa rápido para dissolver o sal.',
      'Complete com a água com gás e dê uma última mexida leve.'
    ],
    guarnicao: 'Gomo de limão e uma pitada de sal na borda',
    dica: 'O sal é o que faz a Paloma: ele arredonda a acidez e puxa o agave da tequila. Não pule a pitada.'
  },
  {
    id: 'highball-ballantines',
    nome: "Highball Ballantine's",
    subtitulo: 'Whisky que se bebe de gole longo',
    copo: 'rocks',
    forca: 'medio',
    tags: ['refrescante', 'seco', 'clássico'],
    cor: ['#ffe9c9', '#b8762a'],
    arte: { liquido: ['#ffdda9', '#c8862f'], gelo: 'cubos', enfeites: ['siciliano'] },
    ingredientes: [
      "50 ml de whisky Ballantine's",
      '150 ml de água com gás bem gelada',
      'Casca de limão siciliano',
      'Gelo em cubos grandes'
    ],
    preparo: [
      'Encha o copo com gelo e gire para gelar; descarte a água derretida.',
      'Despeje o whisky e mexa 5 vezes para gelar.',
      'Complete com a água com gás escorrendo pela lateral.',
      'Mexa apenas uma vez, de baixo para cima.'
    ],
    guarnicao: 'Casca de limão siciliano torcida',
    dica: 'Tudo precisa estar gelado — copo, whisky e soda. É o segredo do highball.'
  },
  {
    id: 'old-parr-apple',
    nome: 'Old Parr Apple Highball',
    subtitulo: 'Maçã verde e whisky escocês',
    copo: 'rocks',
    forca: 'medio',
    tags: ['refrescante', 'frutado', 'cítrico'],
    cor: ['#e9f5cd', '#8aa63c'],
    arte: { liquido: ['#eef5cc', '#a6c14a'], gelo: 'cubos', enfeites: ['maca'] },
    ingredientes: [
      '50 ml de whisky Old Parr',
      '10 ml de xarope de maçã verde',
      '15 ml de suco de limão taiti',
      '120 ml de água com gás gelada',
      'Gelo em cubos'
    ],
    preparo: [
      'Encha o copo de gelo.',
      'Adicione whisky, xarope e limão; mexa para integrar.',
      'Complete com água com gás.',
      'Finalize com fatias finas de maçã verde entre o gelo.'
    ],
    guarnicao: 'Fatias de maçã verde',
    dica: 'Só 10 ml de xarope: o Old Parr já tem um dulçor natural de malte.'
  },
  {
    id: 'caipirissima',
    nome: 'Caipiríssima',
    subtitulo: 'A caipirinha que virou rum',
    copo: 'rocks',
    forca: 'forte',
    tags: ['cítrico', 'clássico', 'refrescante'],
    cor: ['#e8f7d8', '#69a83c'],
    arte: { liquido: ['#f0f9de', '#b6d378'], gelo: 'triturado', enfeites: ['limao'] },
    ingredientes: [
      '60 ml de rum Bacardi Carta Blanca',
      '1 limão taiti cortado em 8 gomos',
      '1 a 2 colheres de chá de açúcar',
      'Gelo em cubos ou triturado'
    ],
    preparo: [
      'Corte o limão em gomos e retire o miolo branco central (é ele que amarga).',
      'Macere com o açúcar no fundo do copo, sem esmagar as cascas.',
      'Adicione o rum e mexa até dissolver o açúcar.',
      'Complete com gelo até a boca e mexa mais uma vez.'
    ],
    guarnicao: 'Um gomo de limão na borda',
    dica: 'Menos açúcar do que você imagina: 1 colher já basta para um limão maduro.'
  },

  /* ---------- TAÇA COQUETEL TROPICAL ---------- */
  {
    id: 'blue-lagoon-seco',
    nome: 'Blue Lagoon Seco',
    subtitulo: 'A versão adulta do drink azul',
    copo: 'coquetel',
    forca: 'medio',
    tags: ['refrescante', 'colorido', 'cítrico'],
    cor: ['#c9edff', '#2478a8'],
    arte: { liquido: ['#aae3fb', '#2478a8'], gelo: 'cubos', enfeites: ['limao', 'cereja'] },
    ingredientes: [
      '50 ml de rum Bacardi Carta Blanca',
      '20 ml de Curaçau Blue',
      '25 ml de suco de limão taiti',
      '100 ml de água com gás ou tônica gelada',
      'Gelo em cubos'
    ],
    preparo: [
      'Bata o rum, o Curaçau e o limão com gelo por 10 segundos.',
      'Coe para a taça cheia de gelo fresco.',
      'Complete com água com gás e mexa uma vez.'
    ],
    guarnicao: 'Rodela de limão e uma cereja, se tiver',
    dica: 'A versão original leva refrigerante de limão e fica enjoativa. Aqui, o limão fresco manda.'
  },
  {
    id: 'tequila-sunrise',
    nome: 'Tequila Sunrise',
    subtitulo: 'Degradê de laranja e granadina',
    copo: 'coquetel',
    forca: 'medio',
    tags: ['frutado', 'clássico', 'colorido'],
    cor: ['#ffd9a8', '#e2571e'],
    arte: { liquido: ['#ffc36b', '#d43a1e'], gelo: 'cubos', enfeites: ['laranja', 'cereja'] },
    ingredientes: [
      '50 ml de tequila',
      '120 ml de suco de laranja natural gelado',
      '10 ml de suco de limão taiti (equilibra a doçura)',
      '10 ml de xarope de grenadine',
      'Gelo em cubos'
    ],
    preparo: [
      'Encha a taça com gelo.',
      'Adicione a tequila, o suco de laranja e o limão; mexa.',
      'Despeje o grenadine bem devagar pela lateral — ele desce e forma o pôr do sol.',
      'Sirva sem mexer.'
    ],
    guarnicao: 'Meia rodela de laranja na borda',
    dica: 'Suco de laranja espremido na hora é o que separa o clássico do drink de festa junina.'
  },
  {
    id: 'peach-fizz-seco',
    nome: 'Peach Fizz Seco',
    subtitulo: 'Pêssego no aroma, cítrico no gole',
    copo: 'coquetel',
    forca: 'medio',
    tags: ['refrescante', 'frutado', 'cítrico'],
    cor: ['#ffe3d3', '#e2865f'],
    arte: { liquido: ['#ffddc8', '#e2865f'], gelo: 'cubos', enfeites: ['siciliano', 'hortela'] },
    ingredientes: [
      '40 ml de gin Tanqueray',
      '15 ml de licor Stock Peach',
      '20 ml de suco de limão taiti',
      '100 ml de água com gás gelada',
      'Gelo em cubos'
    ],
    preparo: [
      'Bata o gin, o licor e o limão com gelo por 10 segundos.',
      'Coe para a taça com gelo novo.',
      'Complete com água com gás e mexa uma vez.'
    ],
    guarnicao: 'Twist de limão e uma folha de hortelã',
    dica: 'Só 15 ml de licor: ele é bem doce e serve como tempero, não como base.'
  },
  {
    id: 'tangerina-cooler',
    nome: 'Tangerina Cooler',
    subtitulo: 'Leve, aromático e perfeito para o calor',
    copo: 'coquetel',
    forca: 'leve',
    tags: ['refrescante', 'leve', 'frutado'],
    cor: ['#ffe6bd', '#e59422'],
    arte: { liquido: ['#ffe4b8', '#e59422'], gelo: 'cubos', enfeites: ['tangerina', 'hortela'] },
    ingredientes: [
      '40 ml de Martini Extra Dry',
      '15 ml de xarope de tangerina',
      '20 ml de suco de limão taiti',
      '120 ml de água com gás gelada',
      'Gelo em cubos'
    ],
    preparo: [
      'Encha a taça de gelo.',
      'Adicione o vermute, o xarope e o limão e mexa bem.',
      'Complete com água com gás.',
      'Finalize com gomos de tangerina ou laranja entre o gelo.'
    ],
    guarnicao: 'Gomos de tangerina e um raminho de hortelã',
    dica: 'Fica em torno de 8% de álcool — ideal para começar a noite ou para quem vai dirigir depois de comer.'
  }
];

/* =========================================================
   LISTA DE COMPRAS
   Quantidade para fazer DOSES_POR_DRINK de cada drink do cardápio.

   busca    regex aplicada às linhas de `ingredientes`; define em quais
            drinks o item aparece e, nas linhas "NN ml de ...", quantos
            ml entram na conta.
   extraMl  ml por dose de linhas sem medida (ex.: "para completar").
   rende    ml por embalagem (garrafa, lata) ou por fruta (suco).
   extraUn  unidades por dose além do suco (gomos, rodelas, cascas).
   qtd      quantidade fixa, para o que não dá para medir em ml.
   fruta    em "Meu bar", o estoque é contado em frutas, não em embalagens.
   opcional em "Meu bar", a falta dele não impede o drink.
   ========================================================= */
const DOSES_POR_DRINK = 3;

const LISTA_COMPRAS = [
  {
    secao: 'Destilados',
    itens: [
      { id: 'gin', nome: 'Gin Tanqueray', busca: /gin tanqueray/i, rende: 750, emb: ['garrafa', 'garrafas'] },
      { id: 'tequila', nome: 'Tequila prata', busca: /ml de tequila/i, rende: 750, emb: ['garrafa', 'garrafas'] },
      { id: 'rum', nome: 'Rum Bacardi Carta Blanca', busca: /bacardi/i, rende: 980, emb: ['garrafa', 'garrafas'] },
      { id: 'ballantines', nome: "Whisky Ballantine's", busca: /ballantine/i, rende: 1000, emb: ['garrafa', 'garrafas'] },
      { id: 'old-parr', nome: 'Whisky Old Parr', busca: /old parr/i, rende: 1000, emb: ['garrafa', 'garrafas'] }
    ]
  },
  {
    secao: 'Vermutes e licores',
    itens: [
      { id: 'extra-dry', nome: 'Martini Extra Dry', busca: /extra dry/i, rende: 750, emb: ['garrafa', 'garrafas'] },
      { id: 'rosso', nome: 'Martini Vermouth Rosso', busca: /vermouth rosso/i, rende: 750, emb: ['garrafa', 'garrafas'] },
      { id: 'triple-sec', nome: 'Curaçau triple sec', busca: /triple sec/i, rende: 720, emb: ['garrafa', 'garrafas'] },
      { id: 'curacau-blue', nome: 'Curaçau Blue', busca: /curaçau blue/i, rende: 720, emb: ['garrafa', 'garrafas'] },
      { id: 'stock-menta', nome: 'Licor Stock Menta', busca: /stock menta/i, rende: 720, emb: ['garrafa', 'garrafas'] },
      { id: 'stock-peach', nome: 'Licor Stock Peach', busca: /stock peach/i, rende: 720, emb: ['garrafa', 'garrafas'] }
    ]
  },
  {
    secao: 'Xaropes',
    itens: [
      { id: 'xarope-tangerina', nome: 'Xarope de tangerina', busca: /xarope de tangerina/i, rende: 700, emb: ['garrafa', 'garrafas'] },
      { id: 'xarope-maca', nome: 'Xarope de maçã verde', busca: /xarope de maçã verde/i, rende: 700, emb: ['garrafa', 'garrafas'] },
      { id: 'xarope-framboesa', nome: 'Xarope de framboesa', busca: /xarope de framboesa/i, rende: 700, emb: ['garrafa', 'garrafas'] },
      { id: 'grenadine', nome: 'Xarope de grenadine', busca: /grenadine/i, rende: 700, emb: ['garrafa', 'garrafas'] }
    ]
  },
  {
    secao: 'Para completar',
    itens: [
      { id: 'tonica', nome: 'Água tônica', busca: /ml de água tônica/i, rende: 350, emb: ['lata de 350 ml', 'latas de 350 ml'] },
      { id: 'agua-gas', nome: 'Água com gás', busca: /água com gás/i, extraMl: { mojito: 100 }, rende: 1500, emb: ['garrafa de 1,5 L', 'garrafas de 1,5 L'] }
    ]
  },
  {
    secao: 'Hortifrúti',
    itens: [
      { id: 'limao-taiti', nome: 'Limão taiti', busca: /limão taiti/i, fruta: true, rende: 30, extraUn: { caipirissima: 1 }, emb: ['limão', 'limões'], nota: '~30 ml de suco por limão' },
      { id: 'laranja', nome: 'Laranja', busca: /laranja/i, fruta: true, rende: 120, extraUn: { 'rosso-tonic': 0.5, 'margarita-tangerina': 0.34 }, emb: ['laranja', 'laranjas'], nota: 'suco, rodelas e raspas' },
      { id: 'siciliano', nome: 'Limão siciliano', busca: /siciliano/i, qtd: '2 unidades', nota: 'só a casca' },
      { id: 'hortela', nome: 'Hortelã', busca: /hortelã/i, qtd: '2 maços' },
      { id: 'maca-verde', nome: 'Maçã verde', busca: /fatias.*maçã verde/i, qtd: '2 unidades' },
      { id: 'zimbro', nome: 'Bagas de zimbro', busca: /zimbro/i, qtd: '1 pacotinho', nota: 'opcional', opcional: true }
    ]
  },
  {
    secao: 'Despensa e gelo',
    itens: [
      { id: 'acucar', nome: 'Açúcar', busca: /açúcar/i, qtd: '1 pacote pequeno' },
      { id: 'sal-grosso', nome: 'Sal grosso', busca: /\bsal\b/i, qtd: '1 pacote' },
      { id: 'gelo', nome: 'Gelo em cubos', busca: /gelo/i, qtd: '4 sacos de 5 kg', nota: 'reserve 1 saco para triturar' }
    ]
  }
];
