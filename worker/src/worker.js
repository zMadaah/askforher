/**
 * Relay de gravação do convite (Cloudflare Worker).
 *
 * O site hospedado (GitHub Pages etc.) é estático e não consegue gravar nada.
 * Ele envia a resposta para cá; este Worker guarda o token do GitHub (como
 * segredo, nunca na página) e acrescenta a resposta ao responses.txt de um
 * repositório.
 *
 * Configuração (wrangler.toml [vars] + segredo):
 *   GITHUB_TOKEN    segredo  OBRIGATÓRIO. Token fine-grained, Contents: Read and write,
 *                            só para o repositório das respostas.
 *   REPO            var      OBRIGATÓRIA. "usuario/repositorio" que recebe o responses.txt
 *   ALLOWED_ORIGIN  var      OBRIGATÓRIA. Origem do seu site, ex.: https://usuario.github.io
 *   FILE            var      opcional. Padrão: responses.txt
 *
 * Nada aqui aponta para um repositório ou site padrão de propósito: se algo
 * faltar, o Worker recusa gravar em vez de escrever no lugar errado.
 */

const MAX_BODY = 4096; // uma resposta tem poucas centenas de bytes; o resto é lixo
const MAX_RETRIES = 4; // o GitHub devolve 409 se o arquivo mudou no meio do caminho

const json = (obj, status, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const b64encode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

const b64decode = (str) => {
  const bin = atob(str.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

// tira quebras de linha e limita o tamanho: ninguém consegue forjar entradas falsas no arquivo
const clean = (v, max = 200) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').slice(0, max);
const row = (label, value) => `${label.padEnd(14)}: ${value}`;

/** O bloco exato que vai para o responses.txt (mesmo formato do servidor local do Vite). */
function entry(p, receivedAt) {
  return [
    '='.repeat(44),
    `${' '.repeat(15)}CONVITE ACEITO`,
    '='.repeat(44),
    row('Resposta', clean(p.answer) || 'SIM'),
    row('Data', clean(p.pretty)),
    row('ISO', `${clean(p.date)}T${clean(p.time)}`),
    row('Fuso horário', clean(p.tz, 60)),
    row('Comida', clean(p.food_label, 60) || '(não informada)'),
    row('Observações', clean(p.note, 500) || '(nenhuma)'),
    row('Fugas do "Não"', String(parseInt(p.dodges_before_yes, 10) || 0)),
    row('Enviado em', clean(p.submitted_at, 40)),
    row('Recebido em', receivedAt),
    '',
    '',
  ].join('\n');
}

async function gh(env, path, init = {}) {
  return fetch(`https://api.github.com/repos/${env.REPO}/${path}`, {
    ...init,
    headers: {
      // trim(): um token colado pelo terminal pode chegar com BOM ou quebra de linha,
      // o que deixa o cabeçalho fora do ASCII e faz o GitHub responder 401
      Authorization: `Bearer ${String(env.GITHUB_TOKEN).trim()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'askherout-worker',
      ...(init.headers || {}),
    },
  });
}

/** Lê -> acrescenta -> grava, tentando de novo se alguém commitar no meio. */
async function appendToFile(env, block) {
  const file = env.FILE || 'responses.txt';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const get = await gh(env, `contents/${encodeURIComponent(file)}`);

    let existing = '';
    let sha;
    if (get.status === 200) {
      const meta = await get.json();
      existing = b64decode(meta.content || '');
      sha = meta.sha;
    } else if (get.status !== 404) {
      return { ok: false, status: get.status, detail: await get.text() };
    }

    const put = await gh(env, `contents/${encodeURIComponent(file)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Nova resposta do convite',
        content: b64encode(existing + block),
        ...(sha ? { sha } : {}),
      }),
    });

    if (put.ok) return { ok: true, file };
    if (put.status !== 409 && put.status !== 422) {
      return { ok: false, status: put.status, detail: await put.text() };
    }
    // 409/422 = o arquivo mudou; lê de novo e tenta outra vez
  }
  return { ok: false, status: 409, detail: 'conflitos demais' };
}

export default {
  async fetch(request, env) {
    // recusa gravar enquanto faltar configuração ou os SEU_... do wrangler.toml continuarem no lugar
    if (!env.GITHUB_TOKEN || !env.REPO || !env.ALLOWED_ORIGIN || /SEU_/.test(`${env.REPO}${env.ALLOWED_ORIGIN}`)) {
      return json({ error: 'worker não configurado (GITHUB_TOKEN, REPO e ALLOWED_ORIGIN)' }, 500);
    }
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'somente POST' }, 405, cors);

    // um navegador de outro site não pode usar este Worker
    const origin = request.headers.get('Origin');
    if (origin && env.ALLOWED_ORIGIN !== '*' && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: 'origem não permitida' }, 403, cors);
    }

    const url = new URL(request.url);
    if (url.pathname !== '/save' && url.pathname !== '/') return json({ error: 'não encontrado' }, 404, cors);

    const raw = await request.text();
    if (!raw || raw.length > MAX_BODY) return json({ error: 'corpo inválido' }, 400, cors);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ error: 'json inválido' }, 400, cors);
    }
    if (!payload || typeof payload !== 'object' || !payload.date || !payload.time) {
      return json({ error: 'faltam data e horário' }, 400, cors);
    }

    const result = await appendToFile(env, entry(payload, new Date().toISOString()));
    if (!result.ok) {
      console.log('falha ao gravar no GitHub', result.status, result.detail);
      return json({ error: 'não foi possível salvar' }, 502, cors);
    }
    return json({ ok: true, file: result.file }, 200, cors);
  },
};
