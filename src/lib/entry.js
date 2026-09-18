// Formato do bloco que vai para o responses.txt.
// Sem nada específico do navegador: é usado pelo app (arquivo .txt de reserva)
// e pelo servidor local do Vite (vite.config.js).

const clean = (v, max = 200) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').slice(0, max);
const row = (label, value) => `${label.padEnd(14)}: ${value}`;

export function entryText(p, receivedAt) {
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
    ...(receivedAt ? [row('Recebido em', receivedAt)] : []),
    '',
    '',
  ].join('\n');
}
