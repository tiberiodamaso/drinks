# 🍸 Bar do Tibs — Cardápio de Drinks

Cardápio interativo de coquetéis para servir aos convidados. Site 100% estático
(HTML + CSS + JS), pronto para publicar no GitHub Pages.

## O que ele faz

- **22 drinks** refrescantes e pouco doces, cada um pensado para um dos copos disponíveis em casa.
- **Ilustração em cada card**: por padrão cada drink mostra um SVG gerado na hora com o
  formato real do seu copo, a cor da bebida, o gelo e as guarnições. Sem imagens externas,
  sem requisições. Quando você tiver a foto real do drink, é só apontar o campo `imagem`
  (veja abaixo) que ela substitui a ilustração naquele card.
- **Selo do copo**: um chip no canto superior direito do card mostra em que peça o drink é servido.
- **Cards que viram**: toque em qualquer card e o verso mostra ingredientes, modo de preparo, guarnição e uma dica.
- **Botão “Quero esse”**: abre um modal de confirmação; ao confirmar, o pedido é contabilizado.
- **Ranking com Chart.js**: menu próprio com gráfico de barras dos mais pedidos, quantidade de cada drink,
  percentual, pódio e distribuição por tipo de copo.
- **Persistência**: a contagem fica salva no `localStorage` do navegador e sobrevive a recarregamentos.
- **Filtros**: por tipo de copo e busca por nome ou ingrediente.
- **Meus copos**: página com a cristaleira e quantos drinks/pedidos cada peça acumula.

## Publicar no GitHub Pages

```bash
git add .
git commit -m "Cardápio de drinks"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/drinks.git
git push -u origin main
```

Depois, em **Settings → Pages**, escolha *Deploy from a branch* → `main` / `/ (root)`.
O arquivo `.nojekyll` já está no repositório para o GitHub não processar nada com Jekyll.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Estrutura

```
index.html            três telas (cardápio, ranking, copos) em um único documento
assets/css/style.css  tema escuro com acabamento dourado, Bootstrap 5 customizado
assets/js/drinks.js   base de dados: copos, ícones SVG e receitas
assets/js/art.js      gerador das ilustrações SVG (formato do copo + cor + gelo + guarnições)
assets/js/app.js      flip dos cards, modal, persistência, gráficos e filtros
```

## Sobre a persistência

Os pedidos são gravados no `localStorage`, que é **por navegador**. Ou seja:
se cada convidado abrir o site no próprio celular, cada um terá o seu próprio placar.

Duas formas de consolidar o ranking da festa:

1. **Totem de pedidos** (recomendado): deixe um tablet ou celular fixo na mesa do bar e
   todo mundo pede por ali. O placar fica completo e correto.
2. **Exportar/Importar**: na tela de ranking, cada convidado clica em *Exportar dados* e
   você importa os arquivos no dispositivo principal — a importação **soma** ao placar
   existente em vez de sobrescrever.

Para um placar compartilhado em tempo real seria necessário um backend
(Firebase, Supabase ou similar), o que foge do escopo de um site estático.

## Adicionar um drink novo

Inclua um objeto no array `DRINKS` em `assets/js/drinks.js`:

```js
{
  id: 'nome-unico-sem-espaco',
  nome: 'Nome do Drink',
  subtitulo: 'Uma linha de descrição',
  copo: 'martini',          // martini | margarita | gin | rocks | coquetel
  forca: 'medio',           // leve | medio | forte
  tags: ['refrescante', 'cítrico'],
  cor: ['#e3f2ff', '#6aa9d8'],   // [tom claro do brilho, tom de destaque]
  arte: {                        // como a ilustração é desenhada
    liquido: ['#f0f9ff', '#b2d8f0'],  // degradê da bebida (topo, fundo)
    gelo: 'cubos',                    // 'cubos' | 'triturado' | ausente
    borda: 'sal',                     // 'sal' | 'acucar' | ausente
    enfeites: ['limao', 'hortela']    // limao, siciliano, laranja, tangerina, hortela,
  },                                  // cereja, azeitona, maca, framboesa, twist, alecrim
  ingredientes: ['50 ml de ...'],
  preparo: ['Passo um...'],
  guarnicao: 'O que colocar na borda',
  dica: 'O truque que faz diferença'
}
```

Nada mais precisa ser alterado: a ilustração, os cards, os filtros, o ranking e os gráficos
se atualizam sozinhos.

## Fotos dos drinks

Os cards usam a ilustração SVG por padrão. Para trocar por uma foto real, coloque o arquivo
em `assets/img/` e adicione o campo `imagem` ao drink em `assets/js/drinks.js`:

```js
{
  id: 'mojito',
  nome: 'Mojito',
  imagem: 'assets/img/mojito.webp',   // <- só isso
  ...
}
```

É por drink: os que ainda não têm foto continuam com a ilustração, sem nenhum ajuste.
Se o arquivo não carregar (nome errado, arquivo movido), o card volta sozinho para a
ilustração — nada quebra no meio da festa.

O que já está resolvido no CSS:

- a foto aparece com `object-fit: contain` sobre fundo branco, porque as proporções variam
  muito de foto para foto e `cover` corta a taça pela metade;
- o card com foto perde o fundo tingido e fica branco, para a imagem não brigar com a cor;
- toda foto entra com `loading="lazy"`, então só as visíveis são baixadas.

**Sobre a pasta `assets/img/` hoje:** ela tem 21 imagens de uma tentativa anterior e nenhuma
está sendo usada — pode apagar à vontade. Duas delas (`caipirissima.png` e
`gin-tonica-framboesa.png`) têm o xadrez de transparência gravado nos pixels: são capturas
de tela de um editor, não recortes, e apareceriam com o xadrez cinza no card.
