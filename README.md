# AskHerOut · versão React + Vite 💌

Um convite de date em uma página só:

- **Sim** → confete e fogos de artifício, depois um calendário para escolher dia e horário
  e, por fim, a tela **"E pra comer?"**: uma categoria de comida (pizza, sushi, lanche...) e
  um campo "Algo que eu precise saber" para alergias e restrições.
- **Não** → foge do cursor. Escapa por proximidade, hover, toque, foco e até clique direto,
  então nunca dá para apertar de verdade. O **Sim** cresce a cada fuga.
- Tudo o que foi escolhido (data, horário, comida e observações) vai parar num **arquivo de texto**.

Recriação em React + Vite do projeto [offport/AskHerOut](https://github.com/offport/AskHerOut),
com todos os textos em português do Brasil.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Para testar no celular (na mesma rede Wi-Fi): `npm run dev -- --host` e abra o endereço
de rede que o Vite mostrar.

## Para onde vai a resposta

| Como você roda | O que acontece ao apertar **Confirmar** |
| --- | --- |
| `npm run dev` ou `npm run preview` | É acrescentada ao `responses.txt` na raiz do projeto (mais uma cópia em `responses.jsonl`) |
| Site hospedado + Worker | É acrescentada ao `responses.txt` de um repositório seu: veja [`worker/`](worker/README.md) |
| Site hospedado sozinho (GitHub Pages) | Vira o download `detalhes-do-date.txt` no aparelho de quem respondeu |
| Com `VITE_WHATSAPP` definido | Aparece o botão **Avisar no WhatsApp** (veja abaixo). Se não houver servidor, o site deixa de baixar o `.txt` e pede que a pessoa toque no botão |

## Receber a resposta no WhatsApp

Uma página web não consegue enviar mensagem de WhatsApp sozinha. O que ela consegue é abrir o
WhatsApp de quem respondeu **com a mensagem já escrita e endereçada a você**. Para ligar isso,
coloque o seu número no `.env` (DDI + DDD + número; símbolos são ignorados) e gere o site de novo:

```bash
VITE_WHATSAPP=5511999999999
```

Na tela final aparece o botão **Avisar no WhatsApp 💬**. Ao tocar, abre a conversa dela com você
com um texto assim, e ela só precisa apertar **Enviar**:

```
Aceitei o date! 💖
📅 Quarta-feira, 30 de setembro de 2026 às 20h30
🍣 Sushi
📝 sem glúten, por favor
(tentei apertar o Não 7 vezes 😄)
```

O que isso **não** faz:

- **Não é automático.** Se ela não tocar em Enviar, nada chega. Por isso, sem servidor, a tela
  avisa "Falta só um passo: toque em Avisar no WhatsApp".
- **A mensagem sai em nome dela**, no chat que vocês já têm, e não de um robô.
- **O número fica visível** para quem abrir o código do site (como qualquer `VITE_*`).
- Receber sem depender de ela apertar Enviar exigiria a API do WhatsApp Business ou um serviço de
  terceiros, que mandam de **outro número** (não na conversa de vocês) e têm cadastro e regras
  próprias. O Worker em [`worker/`](worker/README.md) é a alternativa para guardar a resposta
  sem depender dela.

O `responses.txt` e o `responses.jsonl` estão no `.gitignore`: são dados pessoais e não
devem ir para o Git por acidente.

Exemplo de saída:

```
============================================
               CONVITE ACEITO
============================================
Resposta      : SIM
Data          : Quarta-feira, 30 de setembro de 2026 às 20h30
ISO           : 2026-09-30T20:30
Fuso horário  : America/Sao_Paulo
Comida        : Sushi
Observações   : sem glúten, por favor
Fugas do "Não": 7
Enviado em    : 2026-09-18T18:00:00.000Z
Recebido em   : 2026-09-18T18:00:01.000Z
```

## Personalizar

| O quê | Onde |
| --- | --- |
| A pergunta | `<h1>` em `src/components/AskScreen.jsx` |
| As opções de comida (emoji e nome) | `FOODS` em `src/config.js` (troque, apague ou acrescente; a grade tem 4 colunas) |
| As frases do botão que foge | `TAUNTS` em `src/config.js` |
| Os horários prontos | `TIMES` em `src/lib/dates.js` |
| Quantos meses à frente dá para marcar | `VITE_MONTHS_AHEAD` no `.env` (padrão: 4) |
| Seu e-mail (link "enviar por e-mail" na tela final) | `VITE_SEND_TO` no `.env` |
| Seu WhatsApp (botão "Avisar no WhatsApp" na tela final) | `VITE_WHATSAPP` no `.env` |
| Cores | variáveis no topo de `src/styles.css` |

Copie o `.env.example` para `.env` para usar as variáveis `VITE_*`. Elas entram no build e
ficam **visíveis** no site publicado: nunca coloque segredos ali.

## Publicar (GitHub Pages, Netlify, Vercel...)

```bash
npm run build      # gera a pasta dist/
```

Suba o conteúdo de `dist/`. O `base: './'` no `vite.config.js` faz o site funcionar em
qualquer subpasta (o GitHub Pages usa `/nome-do-repositorio/`).

## Estrutura

```
src/
  App.jsx                    fluxo: pergunta → sim → calendário → comida → final
  config.js                  ajustes e frases do botão que foge
  styles.css                 visual (tokens no topo)
  components/
    AskScreen.jsx            pergunta + botão "Não" fugitivo
    YayScreen.jsx            celebração
    CalendarScreen.jsx       calendário e horários
    FoodScreen.jsx           "E pra comer?": categorias e observações
    DoneScreen.jsx           recibo, contagem regressiva e status do salvamento
    FxProvider.jsx           canvas de fogos e confete
    Hearts.jsx               corações subindo ao fundo
  lib/
    fx.js                    motor de partículas
    dates.js                 datas e horários em pt-BR
    entry.js                 formato do responses.txt
    save.js                  para onde a resposta vai
    whatsapp.js              link wa.me com a mensagem pronta
vite.config.js               endpoint /save local (substitui o server.py)
worker/                      relay opcional na Cloudflare
```

## O que mudou em relação ao original

- **React + Vite** no lugar de um `index.html` único; o `server.py` virou um plugin no
  `vite.config.js` (`POST /save`), sem precisar de Python.
- **Tela "E pra comer?" (nova).** O original termina no calendário; esta etapa foi
  acrescentada a partir de uma imagem de referência. Escolher uma comida é obrigatório para
  confirmar (clicar de novo na opção a desmarca), e o campo de recado que ficava no
  calendário passou para cá, como "Algo que eu precise saber", para não haver dois campos
  livres em sequência.
- **Textos em português**, com data por extenso ("Quarta-feira, 30 de setembro de 2026"),
  horário no formato brasileiro ("20h30") e concordância ("às 20h30", "à 1h"). A tela do
  "Sim" diz "Você disse SIM!" e o arquivo de respostas usa "CONVITE ACEITO", sem supor o
  gênero de quem responde.
- **O "Não" é renderizado direto no `<body>`** (portal) depois da primeira fuga. No original
  ele ficava dentro do cartão de vidro (`backdrop-filter`), o que faz o navegador usar o
  cartão, e não a janela, como referência de posição.
- **Nada aponta para o autor original.** O `index.html` de origem trazia o endereço do
  Worker dele fixo no código, o que mandaria as respostas do *seu* convite para o
  repositório dele. Aqui o endereço vem do `.env` e, se ficar vazio, a resposta é baixada
  como arquivo. O `worker/` também não tem repositório nem site padrão: se a configuração
  faltar, ele recusa gravar.
- **Acessibilidade**: foco visível no teclado, `prefers-reduced-motion` respeitado (sem
  corações, fogos ou transições), rótulos em português nos botões do calendário, e zoom por
  pinça liberado (o original bloqueava o zoom da página).
- O plugin do `/save` aceita no máximo 4 KB por resposta e remove quebras de linha dos
  campos antes de gravar.

## Créditos e licença

A ideia, o visual e a mecânica vêm do [offport/AskHerOut](https://github.com/offport/AskHerOut).
O repositório original não traz um arquivo de licença, então, por padrão, os direitos são do
autor: para uso pessoal (mandar um convite) não há problema, mas antes de **publicar ou
redistribuir** esta versão como projeto aberto, vale pedir permissão a ele ou reescrever as
partes que ficaram parecidas.
