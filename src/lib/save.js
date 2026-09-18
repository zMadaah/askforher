import { CONFIG } from '../config';
import { entryText } from './entry';

// Para onde a resposta vai:
//  - Worker/backend configurado (VITE_SAVE_ENDPOINT) -> envia para ele
//  - `npm run dev` / `npm run preview`               -> POST /save grava em responses.txt
//  - site estático sem backend (GitHub Pages etc.)   -> entrega um arquivo .txt
//                                                       (ou, com VITE_WHATSAPP, pede que ela toque em "Avisar no WhatsApp")
const onStaticHost = !location.protocol.startsWith('http') || /\.github\.io$/i.test(location.hostname);
const endpoint = CONFIG.remoteEndpoint || (onStaticHost ? '' : CONFIG.saveEndpoint);

function downloadTxt(payload) {
  const url = URL.createObjectURL(new Blob([entryText(payload)], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = CONFIG.fileName;
  a.click();

  const mailto = CONFIG.sendTo
    ? `mailto:${CONFIG.sendTo}?subject=${encodeURIComponent(`É um date! ${payload.pretty}`)}` +
      `&body=${encodeURIComponent(entryText(payload))}`
    : null;

  return { kind: 'download', url, fileName: CONFIG.fileName, mailto };
}

// sem backend: com WhatsApp configurado o caminho de entrega é o botão; sem ele, o arquivo .txt
const fallback = (payload) => (CONFIG.whatsapp ? { kind: 'whatsapp' } : downloadTxt(payload));

export async function saveAnswer(payload) {
  if (!endpoint) return fallback(payload);
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const j = await r.json();
    // hospedagens com fallback de SPA podem devolver 200 com HTML: só vale se o backend confirmar
    if (!j || j.ok !== true) throw new Error('resposta inesperada');
    return { kind: 'ok', file: j.file || 'responses.txt' };
  } catch {
    return fallback(payload); // sem backend por perto
  }
}
