/* =========================================================
   Remoto — pedidos e avaliações no Supabase (API REST, sem login)

   Sem configuração em config.js, `Remoto.ativo` é false e o site
   segue só com o localStorage. Com configuração:
     - cada pedido/avaliação vai para o Supabase;
     - se a rede falhar, fica numa fila local e é reenviado
       quando a conexão voltar (Wi-Fi de festa cai);
     - o ranking lê a contagem absoluta de todos os aparelhos.
   ========================================================= */
const Remoto = (function () {
  'use strict';

  const cfg = window.BAR_CONFIG || {};
  const ativo = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const base = ativo ? cfg.supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '') + '/rest/v1/' : '';
  const headers = ativo ? {
    apikey: cfg.supabaseAnonKey,
    'Content-Type': 'application/json'
  } : {};
  // A chave anon antiga é um JWT e também vai no Authorization; a nova
  // (sb_publishable_...) não é JWT e o Supabase recusa se for nesse cabeçalho.
  if (ativo && /^eyJ/.test(cfg.supabaseAnonKey)) headers.Authorization = 'Bearer ' + cfg.supabaseAnonKey;

  const KEY_DISPOSITIVO = 'bar-do-tibs:dispositivo:v1';
  const KEY_FILA = 'bar-do-tibs:fila:v1';

  function lerJson(key, padrao) {
    try { return JSON.parse(localStorage.getItem(key)) || padrao; } catch (err) { return padrao; }
  }
  function gravarJson(key, valor) {
    try { localStorage.setItem(key, JSON.stringify(valor)); } catch (err) { /* ignorado */ }
  }

  // Id anônimo do aparelho: só serve para "uma avaliação por aparelho por drink"
  function novoUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function dispositivo() {
    let id = null;
    try { id = localStorage.getItem(KEY_DISPOSITIVO); } catch (err) { /* ignorado */ }
    if (!id) {
      id = novoUuid();
      try { localStorage.setItem(KEY_DISPOSITIVO, id); } catch (err) { /* ignorado */ }
    }
    return id;
  }

  class ErroHttp extends Error {
    constructor(status, texto) { super(`HTTP ${status}: ${texto}`); this.status = status; }
  }
  // 4xx (menos timeout e excesso de requisições) nunca vai dar certo: não reenviar
  const definitivo = (err) => err instanceof ErroHttp &&
    err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429;

  async function inserir(tabela, linha) {
    const res = await fetch(base + tabela, {
      method: 'POST',
      headers: Object.assign({ Prefer: 'return=minimal' }, headers),
      body: JSON.stringify(linha)
    });
    if (!res.ok) throw new ErroHttp(res.status, await res.text());
  }

  async function ler(caminho) {
    const res = await fetch(base + caminho, { headers });
    if (!res.ok) throw new ErroHttp(res.status, await res.text());
    return res.json();
  }

  // Envia na hora; se falhar por rede, guarda na fila
  async function enviar(tabela, linha) {
    try {
      await inserir(tabela, linha);
      return true;
    } catch (err) {
      if (definitivo(err)) { console.warn('Supabase recusou:', err); return false; }
      const fila = lerJson(KEY_FILA, []);
      fila.push({ tabela, linha });
      gravarJson(KEY_FILA, fila);
      return false;
    }
  }

  let sincronizando = false;
  async function sincronizar() {
    if (!ativo || sincronizando) return;
    sincronizando = true;
    try {
      let fila = lerJson(KEY_FILA, []);
      while (fila.length) {
        try {
          await inserir(fila[0].tabela, fila[0].linha);
        } catch (err) {
          if (!definitivo(err)) break; // rede ainda fora: tenta depois
          console.warn('Descartando item da fila:', err);
        }
        fila = lerJson(KEY_FILA, []).slice(1);
        gravarJson(KEY_FILA, fila);
      }
    } finally {
      sincronizando = false;
    }
  }

  function pedir(drinkId) {
    return enviar('pedidos', {
      drink_id: drinkId,
      dispositivo: dispositivo(),
      criado_em: new Date().toISOString()
    });
  }

  function avaliar(drinkId, nota, comentario) {
    const texto = (comentario || '').trim().slice(0, 500);
    return enviar('avaliacoes', {
      drink_id: drinkId,
      nota,
      comentario: texto || null,
      dispositivo: dispositivo(),
      criado_em: new Date().toISOString()
    });
  }

  // { "<drink-id>": { pedidos, avaliacoes, media } }
  async function ranking() {
    const linhas = await ler('ranking_drinks?select=drink_id,pedidos,avaliacoes,media');
    const mapa = {};
    linhas.forEach((l) => {
      mapa[l.drink_id] = {
        pedidos: Number(l.pedidos) || 0,
        avaliacoes: Number(l.avaliacoes) || 0,
        media: l.media === null ? null : Number(l.media)
      };
    });
    return mapa;
  }

  function comentarios() {
    return ler('comentarios_recentes?select=drink_id,nota,comentario,criado_em');
  }

  if (ativo) {
    window.addEventListener('online', sincronizar);
    setInterval(sincronizar, 60000);
  }

  return { ativo, pedir, avaliar, ranking, comentarios, sincronizar };
})();
