/* =========================================================
   Bar da Casa — lógica da aplicação
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'bar-do-tibs:pedidos:v1';
  const STORAGE_KEY_LEGADO = 'bar-da-casa:pedidos:v1';

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
  const ICON_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>`;

  /* ---------------------------------------------------------
     Navegação entre views
     --------------------------------------------------------- */
  function showView(name) {
    state.view = name;
    ['cardapio', 'ranking', 'copos'].forEach((v) => {
      const el = document.getElementById('view-' + v);
      if (el) el.hidden = v !== name;
    });
    $$('.bar-nav .nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.viewLink === name);
    });

    if (name === 'ranking') renderRanking();
    if (name === 'copos') renderGlasses();

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

  function buildCard(drink, counts) {
    const glass = GLASSES[drink.copo];
    const qty = counts[drink.id] || 0;
    const [light, accent] = drink.cor;

    const ingredientes = drink.ingredientes
      .map((i) => `<li>${escapeHtml(i)}</li>`).join('');
    const preparo = drink.preparo
      .map((p) => `<li>${escapeHtml(p)}</li>`).join('');
    const tags = drink.tags
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4 col-xxl-3';
    col.innerHTML = `
      <article class="flip-card" data-drink="${drink.id}" tabindex="0" role="button"
               aria-label="${escapeHtml(drink.nome)} — toque para ver a receita"
               style="--card-accent:${accent}; --card-glow:${hexToRgba(light, .16)}">
        <div class="flip-card-inner">

          <div class="flip-face flip-front">
            <div class="card-media${drink.imagem ? '' : ' tem-arte'}">
              ${qty > 0 ? `<span class="order-count-badge" data-qty-badge>${qty} pedido${qty > 1 ? 's' : ''}</span>` : ''}
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
              <span class="flip-hint">${ICON_FLIP} Ver receita</span>
            </div>
          </div>

          <div class="flip-face flip-back">
            <div class="back-head">
              <h3 class="back-title">${escapeHtml(drink.nome)}</h3>
              <span class="back-glass">${GLASS_ICONS[drink.copo]}${escapeHtml(glass.nome)} · ${escapeHtml(glass.volume)}</span>
            </div>
            <div class="back-scroll">
              <p class="recipe-label">Ingredientes</p>
              <ul class="recipe-list">${ingredientes}</ul>
              <p class="recipe-label">Modo de preparo</p>
              <ol class="recipe-list">${preparo}</ol>
              <p class="recipe-label">Guarnição</p>
              <p class="recipe-note">${escapeHtml(drink.guarnicao)}</p>
              <div class="recipe-tip"><strong>Dica:</strong> ${escapeHtml(drink.dica)}</div>
            </div>
            <div class="back-foot">
              <button type="button" class="btn btn-back" data-action="voltar"
                      aria-label="Voltar para a frente do card">${ICON_BACK}</button>
              <button type="button" class="btn btn-gold" data-action="pedir">Quero esse</button>
            </div>
          </div>

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

      // Deixa o usuário rolar/selecionar a receita sem desvirar o card
      if (ev.target.closest('.back-scroll')) return;

      flipCard(card, !card.classList.contains('is-flipped'));
    });

    grid.addEventListener('keydown', (ev) => {
      const card = ev.target.closest('.flip-card');
      if (!card || ev.target !== card) return;
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        flipCard(card, !card.classList.contains('is-flipped'));
      }
      if (ev.key === 'Escape') flipCard(card, false);
    });
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
    showToast(`<strong>${escapeHtml(drink.nome)}</strong> anotado! Já são ${novaQtd} pedido${novaQtd > 1 ? 's' : ''} desse drink.`);

    // Devolve o card para a frente para deixar o cardápio limpo
    const card = $(`.flip-card[data-drink="${drink.id}"]`);
    if (card) setTimeout(() => flipCard(card, false), 250);

    state.pendingDrink = null;
  }

  function updateCardBadge(drinkId, qty) {
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
              · <strong>${pedidos}</strong> ${pedidos === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
        </div>`;
    }).join('');
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
    toast = new bootstrap.Toast($('#orderToast'), { delay: 3800 });

    renderGlassFilters();
    renderGrid();
    bindGridEvents();
    bindFallbackDeImagem($('#drinkGrid'));
    bindFallbackDeImagem($('#modalGlassIcon'));
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
    $('#confirmModal').addEventListener('hidden.bs.modal', () => { state.pendingDrink = null; });

    // Ferramentas
    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (ev) => {
      if (ev.target.files && ev.target.files[0]) importData(ev.target.files[0]);
      ev.target.value = '';
    });
    $('#resetBtn').addEventListener('click', resetData);

    // Mantém o placar sincronizado entre abas abertas no mesmo dispositivo
    window.addEventListener('storage', (ev) => {
      if (ev.key !== STORAGE_KEY) return;
      renderGrid();
      updateNavBadge();
      if (state.view === 'ranking') renderRanking();
      if (state.view === 'copos') renderGlasses();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
