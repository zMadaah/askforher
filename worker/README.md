# Relay de gravação (Cloudflare Worker)

O GitHub Pages só serve arquivos estáticos, então a página não consegue gravar nada
sozinha. Este Worker fica entre a página e a API do GitHub: a página envia a resposta
para ele, ele guarda o token de escrita como **segredo** e acrescenta a resposta ao
`responses.txt` de um repositório.

O token nunca aparece na página nem neste repositório.

> **Use um repositório PRIVADO para as respostas.** Cada resposta (data, horário, fuso, comida e
> observações) vira um commit nesse arquivo. Num repositório público, qualquer pessoa leria.
> O ideal é um repositório separado só para isso, e não o do site.

## Configuração (uns 5 minutos, uma vez só)

**1. Crie o token no GitHub**

<https://github.com/settings/personal-access-tokens/new>

| Campo | Valor |
| --- | --- |
| Token name | `askherout-worker` |
| Expiration | o que preferir (90 dias serve) |
| Repository access | **Only select repositories** → o repositório privado das respostas |
| Permissions → Repository → **Contents** | **Read and write** |

Gere e copie o `github_pat_...` (ele só aparece uma vez). Trate como senha: não coloque
em código, em `.env` do site nem em conversa.

**2. Preencha o `wrangler.toml`**

```toml
[vars]
REPO = "seu-usuario/respostas-privado"
ALLOWED_ORIGIN = "https://seu-usuario.github.io"   # origem do site, sem barra no final
```

Enquanto os valores `SEU_...` continuarem lá, o Worker se recusa a gravar.

**3. Publique** (precisa de Node.js)

```bash
cd worker
npx wrangler login                     # abre o navegador, login único na Cloudflare
npx wrangler secret put GITHUB_TOKEN   # cole o token quando pedir
npx wrangler deploy
```

No fim você tem uma URL como `https://askherout-save.<seu-subdominio>.workers.dev`.

**4. Aponte o site para ele**

Na raiz do projeto, no `.env` (copie do `.env.example`):

```bash
VITE_SAVE_ENDPOINT=https://askherout-save.<seu-subdominio>.workers.dev/save
```

Depois `npm run build` e publique a pasta `dist/`.

**5. Teste**

```bash
curl -X POST https://askherout-save.<seu-subdominio>.workers.dev/save \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://seu-usuario.github.io' \
  -d '{"answer":"SIM","date":"2026-09-30","time":"20:30","pretty":"Quarta-feira, 30 de setembro de 2026 às 20h30","tz":"America/Sao_Paulo","food":"pizza","food_label":"Pizza","note":"teste","dodges_before_yes":3,"submitted_at":"2026-09-18T10:00:00Z"}'
```

Esperado: `{"ok":true,"file":"responses.txt"}` e um commit novo no repositório de respostas.
Apague a entrada de teste depois.

## Comportamento

- Só aceita `POST /save`; o resto recebe 405/404.
- Só aceita requisições vindas da origem configurada em `ALLOWED_ORIGIN` (403 para outras).
- Recusa corpos acima de 4 KB, JSON inválido e respostas sem data/horário.
- Todo campo tem as quebras de linha removidas e o tamanho limitado antes de ser gravado,
  então ninguém consegue forjar entradas falsas no arquivo.
- Lê → acrescenta → grava, com nova tentativa em caso de conflito (409), para duas
  respostas simultâneas não se sobrescreverem.

O endereço do Worker é público por natureza: quem descobrir a URL fora de um navegador
ainda pode enviar lixo. Não consegue ler o token, mexer em outros repositórios nem gravar
em outro arquivo. Se algo abusar, `npx wrangler delete` remove o Worker na hora.

## Se a página não alcançar o Worker

A página entrega o arquivo `.txt` diretamente para quem respondeu, então uma resposta
nunca se perde.
