
import { CONFIG } from '../config';

// ============================================================
// WhatsApp - Avisar o responsável
// ============================================================
// Abre o WhatsApp com uma conversa direcionada para o número
// configurado em CONFIG.whatsapp.
//
// A mensagem fica pronta, mas é a pessoa quem toca em "Enviar".
export function whatsappLink({ pretty, food, note, dodges }) {
  if (!CONFIG.whatsapp) return null;

  const lines = [
    'Aceitei o date! 💖',
    `📅 ${pretty}`,
    food,
    note ? `📝 ${note}` : null,
    dodges
      ? `(tentei apertar o Não ${dodges} ${
          dodges === 1 ? 'vez' : 'vezes'
        } 😄)`
      : null,
  ].filter(Boolean);

  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(
    lines.join('\n')
  )}`;
}

// ============================================================
// WhatsApp - Compartilhar convite
// ============================================================
// Não envia para um número específico.
// O WhatsApp será aberto para que a pessoa escolha o contato,
// grupo ou conversa onde deseja compartilhar.
//
// Usa exatamente os dados do convite atual.
export function whatsappShareLink({
  payload,
  dateLabel,
  timeLabel,
  foodLabel,
}) {
  const lines = [
    '💌 Recebi um convite para um date! 💖',
    '',
    `📅 Data: ${dateLabel}`,
    `🕐 Horário: ${timeLabel}`,
    `🍽️ Comida: ${foodLabel}`,
    payload.note ? `📝 Observações: ${payload.note}` : null,
    '',
    'Confira o convite:',
    window.location.href,
  ].filter(Boolean);

  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}