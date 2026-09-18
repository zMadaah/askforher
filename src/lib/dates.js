// Datas e horários em português do Brasil.

export const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const WEEKDAYS = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// horários prontos na tela do calendário
export const TIMES = ['11:00', '13:00', '15:00', '17:00', '19:00', '20:30'];

export const pad2 = (n) => String(n).padStart(2, '0');
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// "Setembro de 2026"
export const monthLabel = (d) => `${cap(MONTHS[d.getMonth()])} de ${d.getFullYear()}`;

// "30 de setembro de 2026"
export const longDate = (d) => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;

// "Quarta-feira, 30 de setembro de 2026"
export const prettyDate = (d) => `${cap(WEEKDAYS[d.getDay()])}, ${longDate(d)}`;

// "20:30" -> "20h30" · "19:00" -> "19h"
export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return m ? `${h}h${pad2(m)}` : `${h}h`;
};

// "às 20h30" · "à 1h" (concordância certa com a uma hora)
export const atTime = (t) => `${Number(t.split(':')[0]) === 1 ? 'à' : 'às'} ${fmtTime(t)}`;
