/* =========================================================
   Bar da Casa — lógica da aplicação
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'bar-do-tibs:pedidos:v1';
  const STORAGE_KEY_LEGADO = 'bar-da-casa:pedidos:v1';
  const STORAGE_KEY_ESTOQUE = 'bar-do-tibs:estoque:v1';
  const STORAGE_KEY_PREPARO = 'bar-do-tibs:preparativos:v1';

  // A contagem segue sendo gravada, mas fica fora da tela enquanto cada
  // aparelho tem o seu placar. Religar junto com o menu "Mais pedidos".
  const MOSTRAR_CONTAGEM = false;

  /* ---------------------------------------------------------
     Persistência (localStorage)
     Formato: { "<drink-id>": <quantidade>, ... }
     --------------------------------------------------------- */
  const Store = {
    read() {
      try {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          // migra pedidos gravados sob o nome antigo do bar
          const antigo = localStorage.getItem(STORAGE_KEY_LEGADO);
          if (antigo) {
            localStorage.setItem(STORAGE_KEY, antigo);
            localStorage.removeItem(STORAGE_KEY_LEGADO);
            raw = antigo;
          }
        }
        if (!raw) return {};
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
        // Mantém apenas ids que ainda existem no cardápio e números válidos
        const clean = {};
        Object.keys(data).forEach((id) => {
          const qty = Number(data[id]);
          if (DRINKS.some((d) => d.id === id) && Number.isFinite(qty) && qty > 0) {
            clean[id] = Math.floor(qty);
          }
        });
        return clean;
      } catch (err) {
        console.warn('Não foi possível ler os pedidos salvos:', err);
        return {};
      }
    },
    write(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        console.warn('Não foi possível salvar os pedidos:', err);
        return false;
      }
    },
    add(id) {
      const data = Store.read();
      data[id] = (data[id] || 0) + 1;
      Store.write(data);
      return data[id];
    },
    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignorado */ }
    }
  };

  /* ---------------------------------------------------------
     Estado da interface
     --------------------------------------------------------- */
  const state = {
    view: 'cardapio',
    glassFilter: 'todos',
    search: '',
    pendingDrink: null
  };

  let charts = { ranking: null, glass: null };

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const num = parseInt(full, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  const FORCA_LABEL = { leve: 'Leve', medio: 'Médio', forte: 'Forte' };
  const FORCA_NIVEL = { leve: 1, medio: 2, forte: 3 };

  function strengthDots(forca) {
    const level = FORCA_NIVEL[forca] || 2;
    let html = '';
    for (let i = 1; i <= 3; i++) {
      html += `<span class="strength-dot${i <= level ? ' on' : ''}"></span>`;
    }
    return `<span class="strength" title="Teor alcoólico: ${FORCA_LABEL[forca]}">${html}
      <span class="visually-hidden">Teor ${FORCA_LABEL[forca]}</span></span>`;
  }

  // Foto do drink quando existe; senão, a ilustração gerada em SVG
  function drinkMedia(drink, uid) {
    if (!drink.imagem) return ART.render(drink, uid);
    return `<img class="drink-photo" src="${escapeHtml(drink.imagem)}"
      alt="${escapeHtml(drink.nome)}" loading="lazy" decoding="async">`;
  }

  // Se a foto não carregar (arquivo movido/renomeado), cai para a ilustração
  function bindFallbackDeImagem(container) {
    container.addEventListener('error', (ev) => {
      const img = ev.target;
      if (!img.classList || !img.classList.contains('drink-photo')) return;
      const card = img.closest('[data-drink]');
      const drink = DRINKS.find((d) => d.id === (card && card.dataset.drink));
      if (drink) img.outerHTML = ART.render(drink);
    }, true); // 'error' não borbulha: escutar na fase de captura
  }

  const ICON_FLIP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M21 3v5h-5"/></svg>`;
  const ICON_RECIPE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
  const ICON_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>`;

  /* ---------------------------------------------------------
     Navegação entre views
     --------------------------------------------------------- */
  function showView(name) {
    state.view = name;
    ['cardapio', 'ranking', 'copos', 'estoque', 'preparo'].forEach((v) => {
      const el = document.getElementById('view-' + v);
      if (el) el.hidden = v !== name;
    });
    $$('.bar-nav .nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.viewLink === name);
    });

    if (name === 'ranking') renderRanking();
    if (name === 'copos') renderGlasses();
    if (name === 'estoque') renderEstoque();
    if (name === 'preparo') renderPreparo();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fecha o menu mobile depois de navegar
    const nav = $('#mainNav');
    if (nav && nav.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(nav).hide();
    }
  }

  /* ---------------------------------------------------------
     Cardápio — filtros e grid
     --------------------------------------------------------- */
  function getFilteredDrinks() {
    const term = state.search.trim().toLowerCase();
    return DRINKS.filter((drink) => {
      if (state.glassFilter !== 'todos' && drink.copo !== state.glassFilter) return false;
      if (!term) return true;
      const haystack = [
        drink.nome,
        drink.subtitulo,
        drink.tags.join(' '),
        drink.ingredientes.join(' '),
        GLASSES[drink.copo].nome
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  // No toque não existe hover: o card não gira, a receita abre numa gaveta.
  // Giro 3D + rolagem interna travava a rolagem da página no iOS.
  const touchQuery = window.matchMedia('(hover: none)');
  const usaGaveta = () => touchQuery.matches;

  function recipeHtml(drink) {
    const ingredientes = drink.ingredientes
      .map((i) => `<li>${escapeHtml(i)}</li>`).join('');
    const preparo = drink.preparo
      .map((p) => `<li>${escapeHtml(p)}</li>`).join('');
    return `
      <p class="recipe-label">Ingredientes</p>
      <ul class="recipe-list">${ingredientes}</ul>
      <p class="recipe-label">Modo de preparo</p>
      <ol class="recipe-list">${preparo}</ol>
      <p class="recipe-label">Guarnição</p>
      <p class="recipe-note">${escapeHtml(drink.guarnicao)}</p>
      <div class="recipe-tip"><strong>Dica:</strong> ${escapeHtml(drink.dica)}</div>`;
  }

  function buildCard(drink, counts) {
    const glass = GLASSES[drink.copo];
    const qty = counts[drink.id] || 0;
    const [light, accent] = drink.cor;
    const gaveta = usaGaveta();

    const tags = drink.tags
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4 col-xxl-3';
    col.innerHTML = `
      <article class="flip-card${gaveta ? ' is-static' : ''}" data-drink="${drink.id}" tabindex="0" role="button"
               aria-label="${escapeHtml(drink.nome)} — toque para ver a receita"${gaveta ? ' aria-haspopup="dialog"' : ''}
               style="--card-accent:${accent}; --card-glow:${hexToRgba(light, .16)}">
        <div class="flip-card-inner">

          <div class="flip-face flip-front">
            <div class="card-media${drink.imagem ? '' : ' tem-arte'}">
              ${MOSTRAR_CONTAGEM && qty > 0 ? `<span class="order-count-badge" data-qty-badge>${qty} pedido${qty > 1 ? 's' : ''}</span>` : ''}
              <span class="glass-chip" title="Servido na ${escapeHtml(glass.nome)} de ${escapeHtml(glass.volume)}">
                ${GLASS_ICONS[drink.copo]}${escapeHtml(glass.curto)}
              </span>
              ${drinkMedia(drink)}
            </div>
            <div class="card-front-body">
              <h2 class="card-name">${escapeHtml(drink.nome)}</h2>
              <p class="card-sub">${escapeHtml(drink.subtitulo)}</p>
              <div class="card-tags">${tags}</div>
            </div>
            <div class="card-front-foot">
              ${strengthDots(drink.forca)}
              <span class="flip-hint">${gaveta ? ICON_RECIPE : ICON_FLIP} Ver receita</span>
            </div>
          </div>

          ${gaveta ? '' : `<div class="flip-face flip-back">
            <div class="back-head">
              <h3 class="back-title">${escapeHtml(drink.nome)}</h3>
              <span class="back-glass">${GLASS_ICONS[drink.copo]}${escapeHtml(glass.nome)} · ${escapeHtml(glass.volume)}</span>
            </div>
            <div class="back-scroll">${recipeHtml(drink)}</div>
            <div class="back-foot">
              <button type="button" class="btn btn-back" data-action="voltar"
                      aria-label="Voltar para a frente do card">${ICON_BACK}</button>
              <button type="button" class="btn btn-gold" data-action="pedir">Quero esse</button>
            </div>
          </div>`}

        </div>
      </article>`;
    return col;
  }

  function renderGrid() {
    const grid = $('#drinkGrid');
    const list = getFilteredDrinks();
    const counts = Store.read();

    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.forEach((drink) => frag.appendChild(buildCard(drink, counts)));
    grid.appendChild(frag);

    $('#emptyState').hidden = list.length > 0;
    $('#resultsInfo').textContent = list.length
      ? `${list.length} ${list.length === 1 ? 'drink disponível' : 'drinks disponíveis'}`
      : '';
  }

  function renderGlassFilters() {
    const wrap = $('#glassFilters');
    const options = [{ id: 'todos', nome: 'Todos', icon: '' }]
      .concat(Object.values(GLASSES).map((g) => ({
        id: g.id, nome: g.curto, icon: GLASS_ICONS[g.id]
      })));

    wrap.innerHTML = options.map((opt) => `
      <button type="button" class="chip${opt.id === state.glassFilter ? ' is-active' : ''}"
              data-glass="${opt.id}" aria-pressed="${opt.id === state.glassFilter}">
        ${opt.icon}${escapeHtml(opt.nome)}
      </button>`).join('');
  }

  /* ---------------------------------------------------------
     Flip + ações dos cards
     --------------------------------------------------------- */
  function flipCard(card, flipped) {
    if (card.classList.contains('is-static')) return;
    card.classList.toggle('is-flipped', flipped);
    card.setAttribute('aria-label',
      `${card.querySelector('.card-name').textContent} — toque para ${flipped ? 'voltar' : 'ver a receita'}`);
  }

  function bindGridEvents() {
    const grid = $('#drinkGrid');

    grid.addEventListener('click', (ev) => {
      const actionBtn = ev.target.closest('[data-action]');
      const card = ev.target.closest('.flip-card');
      if (!card) return;

      if (actionBtn) {
        ev.stopPropagation();
        if (actionBtn.dataset.action === 'voltar') flipCard(card, false);
        if (actionBtn.dataset.action === 'pedir') openConfirm(card.dataset.drink);
        return;
      }

      if (card.classList.contains('is-static')) {
        openRecipe(card.dataset.drink);
        return;
      }

      // Deixa o usuário rolar/selecionar a receita sem desvirar o card
      if (ev.target.closest('.back-scroll')) return;

      flipCard(card, !card.classList.contains('is-flipped'));
    });

    grid.addEventListener('keydown', (ev) => {
      const card = ev.target.closest('.flip-card');
      if (!card || ev.target !== card) return;
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        if (card.classList.contains('is-static')) openRecipe(card.dataset.drink);
        else flipCard(card, !card.classList.contains('is-flipped'));
      }
      if (ev.key === 'Escape') flipCard(card, false);
    });
  }

  /* ---------------------------------------------------------
     Gaveta da receita (telas de toque)
     --------------------------------------------------------- */
  let recipeSheet = null;

  function openRecipe(drinkId) {
    const drink = DRINKS.find((d) => d.id === drinkId);
    if (!drink) return;
    const glass = GLASSES[drink.copo];

    const sheet = $('#recipeSheet');
    sheet.dataset.drink = drink.id;
    const hero = $('#sheetHero');
    hero.dataset.drink = drink.id;
    hero.classList.toggle('tem-arte', !drink.imagem);
    hero.innerHTML = drinkMedia(drink, 'sheet-' + drink.id);
    hero.style.setProperty('--card-glow', hexToRgba(drink.cor[0], .3));
    $('#recipeSheetLabel').textContent = drink.nome;
    $('#sheetGlass').innerHTML =
      `${GLASS_ICONS[drink.copo]}${escapeHtml(glass.nome)} · ${escapeHtml(glass.volume)}`;
    $('#sheetRecipe').innerHTML = recipeHtml(drink);
    sheet.querySelector('.modal-body').scrollTop = 0;

    recipeSheet.show();
  }

  function orderFromSheet() {
    const drinkId = $('#recipeSheet').dataset.drink;
    // Bootstrap não abre um modal enquanto outro ainda está fechando
    $('#recipeSheet').addEventListener('hidden.bs.modal', () => openConfirm(drinkId), { once: true });
    recipeSheet.hide();
  }

  /* ---------------------------------------------------------
     Modal de confirmação
     --------------------------------------------------------- */
  let confirmModal = null;

  function openConfirm(drinkId) {
    const drink = DRINKS.find((d) => d.id === drinkId);
    if (!drink) return;

    state.pendingDrink = drink;
    const glass = GLASSES[drink.copo];

    const hero = $('#modalGlassIcon');
    hero.dataset.drink = drink.id;
    hero.classList.toggle('tem-arte', !drink.imagem);
    hero.innerHTML = drinkMedia(drink, 'modal-' + drink.id);
    hero.style.setProperty('--card-glow', hexToRgba(drink.cor[0], .3));
    $('#confirmModalLabel').textContent = drink.nome;
    $('#modalDesc').textContent =
      `${drink.subtitulo}. Servido ${glass.artigo} ${glass.nome.toLowerCase()} de ${glass.volume}.`;
    $('#modalMeta').innerHTML = [`teor ${FORCA_LABEL[drink.forca].toLowerCase()}`]
      .concat(drink.tags)
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    confirmModal.show();
  }

  function confirmOrder() {
    const drink = state.pendingDrink;
    if (!drink) return;

    const novaQtd = Store.add(drink.id);
    confirmModal.hide();

    updateCardBadge(drink.id, novaQtd);
    updateNavBadge();
    showToast(MOSTRAR_CONTAGEM
      ? `<strong>${escapeHtml(drink.nome)}</strong> anotado! Já são ${novaQtd} pedido${novaQtd > 1 ? 's' : ''} desse drink.`
      : `<strong>${escapeHtml(drink.nome)}</strong> anotado! O bartender já vai preparar.`);

    // Devolve o card para a frente para deixar o cardápio limpo
    const card = $(`.flip-card[data-drink="${drink.id}"]`);
    if (card) setTimeout(() => flipCard(card, false), 250);

    state.pendingDrink = null;
  }

  function updateCardBadge(drinkId, qty) {
    if (!MOSTRAR_CONTAGEM) return;
    const card = $(`.flip-card[data-drink="${drinkId}"]`);
    if (!card) return;
    let badge = card.querySelector('[data-qty-badge]');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'order-count-badge';
      badge.setAttribute('data-qty-badge', '');
      card.querySelector('.card-media').appendChild(badge);
    }
    badge.textContent = `${qty} pedido${qty > 1 ? 's' : ''}`;
  }

  function updateNavBadge() {
    if (!MOSTRAR_CONTAGEM) return;
    const total = Object.values(Store.read()).reduce((a, b) => a + b, 0);
    const badge = $('#navTotalBadge');
    badge.textContent = total;
    badge.hidden = total === 0;
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  let toast = null;
  function showToast(html) {
    $('#toastBody').innerHTML = html;
    toast.show();
  }

  /* ---------------------------------------------------------
     Ranking
     --------------------------------------------------------- */
  function getRanking() {
    const counts = Store.read();
    return Object.keys(counts)
      .map((id) => {
        const drink = DRINKS.find((d) => d.id === id);
        return drink ? { drink, qty: counts[id] } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.qty - a.qty || a.drink.nome.localeCompare(b.drink.nome, 'pt-BR'));
  }

  function renderRanking() {
    const ranking = getRanking();
    const total = ranking.reduce((sum, r) => sum + r.qty, 0);

    $('#rankingEmpty').hidden = total > 0;
    $('#rankingContent').hidden = total === 0;
    $('#statsRow').hidden = total === 0;

    if (total === 0) {
      destroyCharts();
      return;
    }

    // Estatísticas
    $('#statTotal').textContent = total;
    $('#statVariedade').textContent = ranking.length;
    $('#statCampeao').textContent = ranking[0].drink.nome;

    const porCopo = {};
    ranking.forEach((r) => {
      porCopo[r.drink.copo] = (porCopo[r.drink.copo] || 0) + r.qty;
    });
    const copoTop = Object.keys(porCopo).sort((a, b) => porCopo[b] - porCopo[a])[0];
    $('#statCopo').textContent = GLASSES[copoTop].nome;

    renderRankList(ranking, total);
    renderRankingChart(ranking);
    renderGlassChart(porCopo);
  }

  function renderRankList(ranking, total) {
    $('#rankList').innerHTML = ranking.map((r, i) => {
      const pct = Math.round((r.qty / total) * 100);
      return `
        <li class="rank-item">
          <span class="rank-pos">${i + 1}</span>
          <div class="rank-info">
            <p class="rank-name">${escapeHtml(r.drink.nome)}</p>
            <span class="rank-glass">${escapeHtml(GLASSES[r.drink.copo].nome)} · ${pct}% dos pedidos</span>
          </div>
          <span class="rank-qty">${r.qty}<small>${r.qty === 1 ? 'pedido' : 'pedidos'}</small></span>
        </li>`;
    }).join('');
  }

  function chartDefaults() {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#6b6058';
  }

  function renderRankingChart(ranking) {
    chartDefaults();
    const canvas = $('#rankingChart');
    if (charts.ranking) charts.ranking.destroy();

    // Altura proporcional ao número de barras, com mínimo confortável
    canvas.parentElement.style.height = Math.max(280, ranking.length * 42 + 60) + 'px';

    charts.ranking = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ranking.map((r) => r.drink.nome),
        datasets: [{
          label: 'Pedidos',
          data: ranking.map((r) => r.qty),
          backgroundColor: ranking.map((r) => hexToRgba(r.drink.cor[1], .85)),
          borderColor: ranking.map((r) => r.drink.cor[1]),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 22,
          maxBarThickness: 26
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        layout: { padding: { right: 14 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff',
            borderColor: 'rgba(43,36,32,.16)',
            borderWidth: 1,
            titleColor: '#2b2420',
            bodyColor: '#b4621d',
            padding: 11,
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const q = ctx.parsed.x;
                const glass = GLASSES[ranking[ctx.dataIndex].drink.copo].nome;
                return [`${q} ${q === 1 ? 'pedido' : 'pedidos'}`, glass];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, stepSize: 1, color: '#8a7d70' },
            grid: { color: 'rgba(43,36,32,.08)' },
            border: { display: false }
          },
          y: {
            ticks: { color: '#2b2420', font: { size: 12.5 } },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });
  }

  function renderGlassChart(porCopo) {
    chartDefaults();
    const canvas = $('#glassChart');
    if (charts.glass) charts.glass.destroy();

    const ids = Object.keys(porCopo).sort((a, b) => porCopo[b] - porCopo[a]);
    const palette = ['#e29140', '#5aa7d6', '#8bbb3f', '#d9604a', '#a97bc4'];

    charts.glass = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ids.map((id) => `${GLASSES[id].nome} (${GLASSES[id].volume})`),
        datasets: [{
          data: ids.map((id) => porCopo[id]),
          backgroundColor: ids.map((_, i) => hexToRgba(palette[i % palette.length], .88)),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, boxHeight: 12, padding: 14, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: '#ffffff',
            borderColor: 'rgba(43,36,32,.16)',
            borderWidth: 1,
            titleColor: '#2b2420',
            bodyColor: '#6b6058',
            padding: 11,
            callbacks: {
              label: (ctx) => {
                const q = ctx.parsed;
                return ` ${q} ${q === 1 ? 'drink' : 'drinks'}`;
              }
            }
          }
        }
      }
    });
  }

  function destroyCharts() {
    Object.keys(charts).forEach((k) => {
      if (charts[k]) { charts[k].destroy(); charts[k] = null; }
    });
  }

  /* ---------------------------------------------------------
     View "Meus copos"
     --------------------------------------------------------- */
  function renderGlasses() {
    const counts = Store.read();
    $('#glassGrid').innerHTML = Object.values(GLASSES).map((glass) => {
      const drinks = DRINKS.filter((d) => d.copo === glass.id);
      const pedidos = drinks.reduce((sum, d) => sum + (counts[d.id] || 0), 0);
      return `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="glass-card">
            <div class="card-glass-icon">${GLASS_ICONS[glass.id]}</div>
            <h3>${escapeHtml(glass.nome)}</h3>
            <span class="glass-volume">${escapeHtml(glass.volume)}</span>
            <p class="glass-desc">${escapeHtml(glass.descricao)}</p>
            <p class="glass-count">
              <strong>${drinks.length}</strong> ${drinks.length === 1 ? 'drink' : 'drinks'} no cardápio
              ${MOSTRAR_CONTAGEM ? `· <strong>${pedidos}</strong> ${pedidos === 1 ? 'pedido' : 'pedidos'}` : ''}
            </p>
          </div>
        </div>`;
    }).join('');
  }

  /* ---------------------------------------------------------
     Meu bar: o que tenho em casa -> quais drinks dá para fazer
     e o que falta comprar para DOSES_POR_DRINK de cada.
     Estoque: { "<item-id>": quantidade } — em embalagens (garrafas,
     latas, aceitando frações) ou em frutas; itens sem medida guardam só `true`.
     --------------------------------------------------------- */
  const Estoque = {
    read() {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY_ESTOQUE) || '{}');
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      } catch (err) {
        return {};
      }
    },
    write(data) {
      try { localStorage.setItem(STORAGE_KEY_ESTOQUE, JSON.stringify(data)); } catch (err) { /* ignorado */ }
    }
  };

  const fmtNum = (n) => n.toLocaleString('pt-BR');

  // Quanto uma dose de `drink` pede de `item` (null se o drink não usa)
  function necessidadePorDose(item, drink) {
    const linhas = drink.ingredientes.filter((i) => item.busca.test(i));
    const extraMl = (item.extraMl && item.extraMl[drink.id]) || 0;
    const extraUn = (item.extraUn && item.extraUn[drink.id]) || 0;
    if (!linhas.length && !extraMl && !extraUn) return null;
    let ml = extraMl;
    linhas.forEach((l) => {
      const m = l.match(/^(\d+)\s*ml\b/i);
      if (m) ml += Number(m[1]);
    });
    return { ml, un: extraUn };
  }

  const itensDoCatalogo = () => LISTA_COMPRAS.reduce((acc, sec) => acc.concat(sec.itens), []);

  const medido = (item) => !item.qtd; // tem rende/emb: dá para contar quantidade
  const qtdPadrao = (item) => (item.fruta ? 10 : 1);

  // Frações de garrafa aceitas no estoque (o valor do <select> é o índice)
  const FRACOES = [[0, '+ 0'], [1 / 4, '+ ¼'], [1 / 3, '+ ⅓'], [1 / 2, '+ ½'], [2 / 3, '+ ⅔'], [3 / 4, '+ ¾']];

  // 1.5 -> { inteiro: 1, fracao: 3 (½) }
  function separarGarrafas(valor) {
    const v = Number(valor) || 0;
    const inteiro = Math.floor(v + 0.01);
    const resto = v - inteiro;
    let fracao = 0;
    FRACOES.forEach(([f], i) => {
      if (Math.abs(f - resto) < Math.abs(FRACOES[fracao][0] - resto)) fracao = i;
    });
    return { inteiro, fracao };
  }

  // Unidades (frutas) ou ml (bebidas) que uma dose pede e que o estoque tem
  const porDoseDe = (item, nec) => (item.fruta ? nec.ml / item.rende + nec.un : nec.ml);
  const disponivelDe = (item, tem) => (item.fruta ? Number(tem) || 0 : (Number(tem) || 0) * item.rende);

  // Quantas doses de cada drink o estoque permite, e o que falta
  function drinksPossiveis(estoque) {
    const itens = itensDoCatalogo();
    return DRINKS.map((drink) => {
      let doses = Infinity;
      const faltam = [];
      itens.forEach((item) => {
        const nec = necessidadePorDose(item, drink);
        if (!nec || item.opcional) return;
        const tem = estoque[item.id];
        if (tem === undefined) { faltam.push(item.nome); doses = 0; return; }
        if (!medido(item)) return;
        const porDose = porDoseDe(item, nec);
        if (porDose <= 0) return;
        const d = Math.floor(disponivelDe(item, tem) / porDose + 1e-9);
        if (d < 1) faltam.push(`${item.nome} (acabou)`);
        doses = Math.min(doses, d);
      });
      return { drink, doses: doses === Infinity ? 0 : doses, faltam };
    });
  }

  // O que comprar para fazer DOSES_POR_DRINK de cada drink, descontando o estoque
  function listaDeCompras(estoque) {
    return LISTA_COMPRAS.map((sec) => ({
      secao: sec.secao,
      itens: sec.itens.map((item) => {
        if (item.opcional) return null;
        let precisa = 0;
        let usado = false;
        DRINKS.forEach((drink) => {
          const nec = necessidadePorDose(item, drink);
          if (!nec) return;
          usado = true;
          precisa += porDoseDe(item, nec) * DOSES_POR_DRINK;
        });
        if (!usado) return null;
        const tem = estoque[item.id];

        if (!medido(item)) {
          return tem === undefined ? { nome: item.nome, qtd: item.qtd, detalhe: item.nota || '' } : null;
        }

        const falta = precisa - (tem === undefined ? 0 : disponivelDe(item, tem));
        if (falta <= 1e-6) return null;
        const n = Math.max(1, Math.ceil((item.fruta ? falta : falta / item.rende) - 1e-6));
        return {
          nome: item.nome,
          qtd: `${n} ${item.emb[n === 1 ? 0 : 1]}`,
          detalhe: item.fruta ? '' : `faltam ${fmtNum(Math.ceil(falta))} ml`
        };
      }).filter(Boolean)
    })).filter((sec) => sec.itens.length);
  }

  function controleQtd(it, tem, valor) {
    const off = tem ? '' : ' disabled';
    const rotulo = `Quantidade de ${escapeHtml(it.nome)}`;
    // frutas e latas contam só inteiros; garrafas aceitam frações
    if (it.fruta || /^lata/.test(it.emb[0])) {
      return `
        <span class="estoque-qtd">
          <input type="number" class="form-control form-control-sm" min="0" step="1" inputmode="numeric"
                 data-estoque-int="${it.id}" aria-label="${rotulo}"
                 value="${tem ? escapeHtml(Math.round(Number(valor) || 0)) : ''}"${off}>
          <small>${escapeHtml(it.emb[1])}</small>
        </span>`;
    }
    const { inteiro, fracao } = separarGarrafas(valor);
    return `
      <span class="estoque-qtd">
        <input type="number" class="form-control form-control-sm" min="0" step="1" inputmode="numeric"
               data-estoque-int="${it.id}" aria-label="${rotulo} (inteiras)"
               value="${tem ? inteiro : ''}"${off}>
        <select class="form-select form-select-sm" data-estoque-frac="${it.id}"
                aria-label="${rotulo} (fração)"${off}>
          ${FRACOES.map(([, txt], i) =>
            `<option value="${i}"${tem && i === fracao ? ' selected' : ''}>${txt}</option>`).join('')}
        </select>
        <small>${escapeHtml(it.emb[1])}</small>
      </span>`;
  }

  function renderEstoque() {
    const estoque = Estoque.read();
    $('#estoqueSub').textContent = `Marque o que você tem e quanto sobrou. A lista de compras
      mostra o que falta para fazer pelo menos ${DOSES_POR_DRINK} de cada drink do cardápio.`;
    $('#estoqueSecoes').innerHTML = LISTA_COMPRAS.map((sec) => `
      <fieldset class="compras-secao">
        <legend class="recipe-label">${escapeHtml(sec.secao)}</legend>
        ${sec.itens.map((it) => {
          const tem = estoque[it.id] !== undefined;
          return `
          <div class="compra-item estoque-item${tem ? ' is-tem' : ''}">
            <input type="checkbox" class="form-check-input" id="estoque-${it.id}"
                   data-estoque="${it.id}"${tem ? ' checked' : ''}>
            <label class="compra-info" for="estoque-${it.id}">
              <span class="compra-nome">${escapeHtml(it.nome)}</span>
              ${it.opcional ? '<span class="compra-drinks">opcional</span>' : ''}
            </label>
            ${medido(it)
              ? controleQtd(it, tem, estoque[it.id])
              : '<span class="estoque-qtd"><small>tenho / não tenho</small></span>'}
          </div>`;
        }).join('')}
      </fieldset>`).join('');
    renderResultado(estoque);
  }

  function renderResultado(estoque) {
    renderCompras(estoque);
    renderPossiveis(estoque);
  }

  function renderCompras(estoque) {
    const secoes = listaDeCompras(estoque);
    const total = secoes.reduce((n, sec) => n + sec.itens.length, 0);

    $('#comprasFaltaQtd').textContent = total ? `${total} ${total === 1 ? 'item' : 'itens'}` : '';
    $('#comprasFalta').innerHTML = secoes.map((sec) => `
      <li class="falta-secao"><span class="recipe-label">${escapeHtml(sec.secao)}</span></li>
      ${sec.itens.map((it) => `
        <li><span>${escapeHtml(it.nome)}${it.detalhe ? `<small>${escapeHtml(it.detalhe)}</small>` : ''}</span>
          <strong>${escapeHtml(it.qtd)}</strong></li>`).join('')}`).join('');
    $('#comprasTudoOk').hidden = total > 0;
    $('#comprasCopiar').hidden = total === 0;
    $('#estoqueAtalhoQtd').textContent = total
      ? `${total} ${total === 1 ? 'item' : 'itens'} pra comprar`
      : 'Nada pra comprar';
  }

  function renderPossiveis(estoque) {
    const lista = drinksPossiveis(estoque);
    const pode = lista.filter((r) => r.doses > 0).sort((a, b) => b.doses - a.doses);
    const quase = lista.filter((r) => r.doses === 0 && r.faltam.length === 1);
    const nomeCopo = (d) => `${GLASS_ICONS[d.copo]}${escapeHtml(GLASSES[d.copo].curto)}`;

    $('#estoqueContagem').textContent = `${pode.length} de ${DRINKS.length} drinks`;
    $('#estoquePode').innerHTML = pode.map((r) => `
      <li class="pode-item" style="--card-accent:${r.drink.cor[1]}">
        <span class="pode-info">
          <span class="pode-nome">${escapeHtml(r.drink.nome)}</span>
          <span class="pode-copo">${nomeCopo(r.drink)}</span>
        </span>
        <span class="rank-qty">${r.doses}<small>${r.doses === 1 ? 'dose' : 'doses'}</small></span>
      </li>`).join('');
    $('#estoqueVazio').hidden = pode.length > 0;

    $('#estoqueQuaseBox').hidden = quase.length === 0;
    $('#estoqueQuase').innerHTML = quase.map((r) => `
      <li><span>${escapeHtml(r.drink.nome)}</span><strong>falta ${escapeHtml(r.faltam[0])}</strong></li>`).join('');
  }

  function textoCompras() {
    const linhas = listaDeCompras(Estoque.read()).map((sec) =>
      `*${sec.secao}*\n` + sec.itens.map((it) => `- ${it.nome}: ${it.qtd}`).join('\n'));
    return `Lista de compras · Bar do Tibs\n(para ${DOSES_POR_DRINK} de cada drink)\n\n${linhas.join('\n\n')}`;
  }

  async function copiarCompras() {
    const texto = textoCompras();
    try {
      await navigator.clipboard.writeText(texto);
      showToast('Lista copiada! É só colar no WhatsApp ou nas notas.');
    } catch (err) {
      // Sem permissão de área de transferência (ex.: http): usa o compartilhar do sistema
      if (navigator.share) {
        navigator.share({ text: texto }).catch(() => {});
      } else {
        showToast('Não consegui copiar automaticamente neste navegador.');
      }
    }
  }

  // Lê inteiro + fração do item e grava no estoque
  function lerQtd(id) {
    const int = $(`[data-estoque-int="${id}"]`);
    const frac = $(`[data-estoque-frac="${id}"]`);
    const inteiro = parseInt(int ? int.value : '', 10);
    const fracao = frac ? FRACOES[Number(frac.value)] : null;
    const qtd = (Number.isFinite(inteiro) && inteiro > 0 ? inteiro : 0) + (fracao ? fracao[0] : 0);
    const estoque = Estoque.read();
    estoque[id] = qtd;
    Estoque.write(estoque);
    renderResultado(estoque);
  }

  function bindEstoque() {
    const box = $('#estoqueSecoes');
    box.addEventListener('change', (ev) => {
      const frac = ev.target.closest('[data-estoque-frac]');
      if (frac) { lerQtd(frac.dataset.estoqueFrac); return; }
      const check = ev.target.closest('[data-estoque]');
      if (!check) return;
      const id = check.dataset.estoque;
      const item = itensDoCatalogo().find((i) => i.id === id);
      const estoque = Estoque.read();
      const int = $(`[data-estoque-int="${id}"]`);
      const fracSel = $(`[data-estoque-frac="${id}"]`);
      if (check.checked) {
        estoque[id] = medido(item) ? qtdPadrao(item) : true;
        if (int) { int.disabled = false; int.value = estoque[id]; int.select(); }
        if (fracSel) { fracSel.disabled = false; fracSel.value = '0'; }
      } else {
        delete estoque[id];
        if (int) { int.disabled = true; int.value = ''; }
        if (fracSel) { fracSel.disabled = true; fracSel.value = '0'; }
      }
      check.closest('.estoque-item').classList.toggle('is-tem', check.checked);
      Estoque.write(estoque);
      renderResultado(estoque);
    });
    box.addEventListener('input', (ev) => {
      const int = ev.target.closest('[data-estoque-int]');
      if (int) lerQtd(int.dataset.estoqueInt);
    });
    $('#estoqueAtalho').addEventListener('click', () => {
      $('#estoqueResultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#estoqueLimpar').addEventListener('click', () => {
      Estoque.write({});
      renderEstoque();
    });
    $('#comprasCopiar').addEventListener('click', copiarCompras);
  }

  /* ---------------------------------------------------------
     Preparativos: o que deixar pronto antes de abrir o bar,
     para DOSES_POR_DRINK de cada drink. Marcado = já está pronto.
     --------------------------------------------------------- */
  const Preparo = {
    read() {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY_PREPARO) || '[]');
        return new Set(Array.isArray(data) ? data : []);
      } catch (err) {
        return new Set();
      }
    },
    write(set) {
      try { localStorage.setItem(STORAGE_KEY_PREPARO, JSON.stringify([...set])); } catch (err) { /* ignorado */ }
    }
  };

  // ml de todas as linhas "NN ml de ..." de uma receita
  const mlDaReceita = (drink) => drink.ingredientes.reduce((sum, l) => {
    const m = l.match(/^(\d+)\s*ml\b/i);
    return sum + (m ? Number(m[1]) : 0);
  }, 0);

  // Quais drinks usam o preparativo
  function drinksDoPreparo(item) {
    if (item.usos) return DRINKS.filter((d) => item.usos[d.id]);
    if (item.lote) return DRINKS.filter((d) => d.id === item.lote);
    if (item.busca) return DRINKS.filter((d) => necessidadePorDose(item, d));
    if (item.drinks === TODOS_OS_DRINKS) return DRINKS.slice();
    if (Array.isArray(item.drinks)) return DRINKS.filter((d) => item.drinks.includes(d.id));
    return [];
  }

  // { qtd, detalhe } para DOSES_POR_DRINK de cada drink
  function qtdDoPreparo(item) {
    if (item.fixo) return { qtd: item.fixo, detalhe: '' };
    if (item.usos) {
      const n = Object.values(item.usos).reduce((a, b) => a + b, 0) * DOSES_POR_DRINK;
      return { qtd: `${fmtNum(n)} ${item.un[n === 1 ? 0 : 1]}`, detalhe: '' };
    }
    if (item.lote) {
      const drink = DRINKS.find((d) => d.id === item.lote);
      return { qtd: `${fmtNum(mlDaReceita(drink) * DOSES_POR_DRINK)} ml`, detalhe: `${DOSES_POR_DRINK} doses` };
    }
    if (item.busca) {
      const ml = DRINKS.reduce((sum, d) => {
        const nec = necessidadePorDose(item, d);
        return sum + (nec ? nec.ml : 0);
      }, 0) * DOSES_POR_DRINK;
      const n = item.rende ? Math.ceil(ml / item.rende) : 0;
      return { qtd: `${fmtNum(ml)} ml`, detalhe: n ? `≈ ${n} ${item.emb[n === 1 ? 0 : 1]}` : '' };
    }
    const usam = drinksDoPreparo(item).length;
    return { qtd: '', detalhe: usam ? `${usam} ${usam === 1 ? 'drink' : 'drinks'}` : '' };
  }

  function renderPreparo() {
    const feito = Preparo.read();
    $('#preparoSub').textContent = `O que deixar pronto para fazer ${DOSES_POR_DRINK} de cada drink
      sem começar do zero a cada pedido. Marque conforme for aprontando.`;

    $('#preparoEtapas').innerHTML = PREPARATIVOS.map((etapa) => `
      <fieldset class="compras-secao">
        <legend class="recipe-label">${escapeHtml(etapa.etapa)}</legend>
        ${etapa.itens.map((it) => {
          const { qtd, detalhe } = qtdDoPreparo(it);
          const ok = feito.has(it.id);
          return `
          <label class="compra-item preparo-item${ok ? ' is-feito' : ''}">
            <input type="checkbox" class="form-check-input" data-preparo="${it.id}"${ok ? ' checked' : ''}>
            <span class="compra-info">
              <span class="compra-nome">${escapeHtml(it.nome)}${it.opcional ? ' <span class="preparo-opcional">opcional</span>' : ''}</span>
              <span class="compra-drinks">${escapeHtml(it.como)}</span>
            </span>
            ${qtd || detalhe ? `<span class="preparo-qtd">${escapeHtml(qtd)}
              ${detalhe ? `<small>${escapeHtml(detalhe)}</small>` : ''}</span>` : ''}
          </label>`;
        }).join('')}
      </fieldset>`).join('');

    renderProgressoPreparo(feito);
    renderNaHora();
  }

  function renderProgressoPreparo(feito) {
    const total = PREPARATIVOS.reduce((n, e) => n + e.itens.length, 0);
    const prontos = PREPARATIVOS.reduce((n, e) => n + e.itens.filter((it) => feito.has(it.id)).length, 0);
    $('#preparoProgresso').textContent = `${prontos} de ${total} prontos`;
  }

  // Para cada drink, o que já está pronto e os utensílios que ele pede
  function renderNaHora() {
    const porDrink = {};
    DRINKS.forEach((d) => { porDrink[d.id] = { prontos: [], utensilios: [] }; });
    PREPARATIVOS.forEach((etapa) => etapa.itens.forEach((it) => {
      if (!it.curto || it.drinks === TODOS_OS_DRINKS) return;
      drinksDoPreparo(it).forEach((d) => {
        const lista = porDrink[d.id][etapa.utensilios ? 'utensilios' : 'prontos'];
        if (!lista.includes(it.curto)) lista.push(it.curto);
      });
    }));

    $('#preparoNaHora').innerHTML = DRINKS.map((d) => {
      const { prontos, utensilios } = porDrink[d.id];
      return `
      <li class="naHora-item" style="--card-accent:${d.cor[1]}">
        <p class="naHora-nome">${escapeHtml(d.nome)}
          <span class="pode-copo">${GLASS_ICONS[d.copo]}${escapeHtml(GLASSES[d.copo].curto)}</span></p>
        <div class="naHora-chips">
          ${prontos.map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join('')}
          ${utensilios.map((c) => `<span class="tag tag-utensilio">${escapeHtml(c)}</span>`).join('')}
        </div>
        <p class="naHora-deco">Decoração: ${escapeHtml(d.guarnicao)}</p>
      </li>`;
    }).join('');
  }

  function bindPreparo() {
    $('#preparoEtapas').addEventListener('change', (ev) => {
      const check = ev.target.closest('[data-preparo]');
      if (!check) return;
      const feito = Preparo.read();
      if (check.checked) feito.add(check.dataset.preparo); else feito.delete(check.dataset.preparo);
      Preparo.write(feito);
      check.closest('.preparo-item').classList.toggle('is-feito', check.checked);
      renderProgressoPreparo(feito);
    });
    $('#preparoLimpar').addEventListener('click', () => {
      Preparo.write(new Set());
      renderPreparo();
    });
  }

  /* ---------------------------------------------------------
     Ferramentas: exportar / importar / zerar
     --------------------------------------------------------- */
  function exportData() {
    const payload = {
      app: 'bar-do-tibs',
      versao: 1,
      exportadoEm: new Date().toISOString(),
      pedidos: Store.read()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-bar-do-tibs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const pedidos = parsed && parsed.pedidos ? parsed.pedidos : parsed;
        if (!pedidos || typeof pedidos !== 'object') throw new Error('formato inválido');

        // Soma ao que já existe, em vez de sobrescrever
        const atual = Store.read();
        let importados = 0;
        Object.keys(pedidos).forEach((id) => {
          const qty = Math.floor(Number(pedidos[id]));
          if (DRINKS.some((d) => d.id === id) && Number.isFinite(qty) && qty > 0) {
            atual[id] = (atual[id] || 0) + qty;
            importados += qty;
          }
        });
        Store.write(atual);
        renderGrid();
        renderRanking();
        updateNavBadge();
        showToast(`<strong>${importados}</strong> ${importados === 1 ? 'pedido somado' : 'pedidos somados'} ao placar.`);
      } catch (err) {
        showToast('Não consegui ler esse arquivo. Ele veio da opção “Exportar dados”?');
      }
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!window.confirm('Isso apaga toda a contagem de pedidos deste navegador. Confirma?')) return;
    Store.clear();
    destroyCharts();
    renderGrid();
    renderRanking();
    updateNavBadge();
    showToast('Contagem zerada. Pronto para a próxima festa!');
  }

  /* ---------------------------------------------------------
     Inicialização
     --------------------------------------------------------- */
  function init() {
    confirmModal = new bootstrap.Modal($('#confirmModal'));
    recipeSheet = new bootstrap.Modal($('#recipeSheet'));
    toast = new bootstrap.Toast($('#orderToast'), { delay: 3800 });

    renderGlassFilters();
    renderGrid();
    bindGridEvents();
    bindFallbackDeImagem($('#drinkGrid'));
    bindFallbackDeImagem($('#modalGlassIcon'));
    bindFallbackDeImagem($('#sheetHero'));
    // iOS < 14 só conhece a API antiga
    if (touchQuery.addEventListener) touchQuery.addEventListener('change', renderGrid);
    else touchQuery.addListener(renderGrid);
    updateNavBadge();

    // Navegação
    document.addEventListener('click', (ev) => {
      const link = ev.target.closest('[data-view-link]');
      if (!link) return;
      ev.preventDefault();
      showView(link.dataset.viewLink);
    });

    // Filtros de copo
    $('#glassFilters').addEventListener('click', (ev) => {
      const chip = ev.target.closest('.chip');
      if (!chip) return;
      state.glassFilter = chip.dataset.glass;
      renderGlassFilters();
      renderGrid();
    });

    // Busca (com debounce leve)
    let searchTimer;
    $('#searchInput').addEventListener('input', (ev) => {
      clearTimeout(searchTimer);
      const value = ev.target.value;
      searchTimer = setTimeout(() => {
        state.search = value;
        renderGrid();
      }, 140);
    });

    $('#clearFilters').addEventListener('click', () => {
      state.search = '';
      state.glassFilter = 'todos';
      $('#searchInput').value = '';
      renderGlassFilters();
      renderGrid();
    });

    // Modal
    $('#confirmOrderBtn').addEventListener('click', confirmOrder);
    $('#sheetOrderBtn').addEventListener('click', orderFromSheet);
    $('#confirmModal').addEventListener('hidden.bs.modal', () => { state.pendingDrink = null; });

    // Ferramentas
    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (ev) => {
      if (ev.target.files && ev.target.files[0]) importData(ev.target.files[0]);
      ev.target.value = '';
    });
    $('#resetBtn').addEventListener('click', resetData);

    bindEstoque();
    bindPreparo();

    // Mantém o placar sincronizado entre abas abertas no mesmo dispositivo
    window.addEventListener('storage', (ev) => {
      if (ev.key !== STORAGE_KEY) return;
      renderGrid();
      updateNavBadge();
      if (state.view === 'ranking') renderRanking();
      if (state.view === 'copos') renderGlasses();
    });
    window.addEventListener('storage', (ev) => {
      if (ev.key === STORAGE_KEY_ESTOQUE && state.view === 'estoque') renderEstoque();
      if (ev.key === STORAGE_KEY_PREPARO && state.view === 'preparo') renderPreparo();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
