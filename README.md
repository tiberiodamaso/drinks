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
assets/js/config.js   URL e chave anon do Supabase (em branco = só localStorage)
assets/js/remoto.js   pedidos/avaliações no Supabase via API REST, com fila offline
assets/js/drinks.js   base de dados: copos, receitas, lista de compras e preparativos
assets/js/art.js      gerador das ilustrações SVG (formato do copo + cor + gelo + guarnições)
assets/js/app.js      flip dos cards, modais, avaliações, gráficos, Meu bar e preparativos
supabase/schema.sql   tabelas, permissões e views do Supabase
```

## Pedidos e avaliações compartilhados (Supabase)

Sem configuração, cada navegador guarda os próprios pedidos no `localStorage` e o menu
**Mais pedidos** fica escondido. Ligando o Supabase, todos os aparelhos gravam no mesmo
banco, sem login:

- cada **Quero esse** vira uma linha em `pedidos`, e o ranking mostra a **contagem absoluta**
  de todos os pedidos, de todos os aparelhos, desde o primeiro;
- quem pediu um drink recebe no cardápio, 3 minutos depois, o convite
  *“Já provou o X?”* para dar de 1 a 5 estrelas e, se quiser, um comentário anônimo.
  Também dá para avaliar pelo verso do card (botão ★) ou pela receita no celular;
- os cards mostram a nota média, e o ranking ganha o gráfico **Mais bem avaliados** e os
  últimos comentários;
- se o Wi-Fi cair, o pedido fica numa fila no aparelho e é enviado quando a conexão voltar.

### Configurar

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano grátis sobra).
2. No **SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Em **Project Settings → API**, copie a *Project URL* e a chave **anon** (ou *publishable*)
   para [`assets/js/config.js`](assets/js/config.js):

   ```js
   window.BAR_CONFIG = {
     supabaseUrl: 'https://xxxx.supabase.co',
     supabaseAnonKey: 'eyJ...'
   };
   ```

4. Publique. O menu **Mais pedidos** aparece sozinho.

A chave anon é pública por natureza (vai no código do site); nunca use a `service_role`.
O que protege os dados são as regras do `schema.sql`:

- o público só consegue **inserir** pedidos e avaliações — não lê, altera nem apaga linhas;
- a leitura é só pelas views `ranking_drinks` (totais e média) e `comentarios_recentes`,
  que não expõem o id anônimo do aparelho;
- nota fora de 1–5 e comentário acima de 500 caracteres são recusados pelo banco;
- cada aparelho tem uma avaliação por drink: se avaliar de novo, vale a mais recente.

Não há como impedir, num site sem login, que alguém mal-intencionado envie pedidos em
massa com a chave pública. Para uma festa isso basta; se um dia precisar, dá para apagar
linhas pelo painel do Supabase (**Table Editor**), que usa permissão de administrador.

### Sem Supabase

As ferramentas *Exportar / Importar / Zerar* da tela de ranking continuam valendo para o
placar local de cada navegador (a importação **soma** ao placar existente).

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
