import { useMemo, useState } from 'react';
import { CONFIG } from '../config';
import { TIMES, WEEKDAYS_SHORT, fmtTime, longDate, monthLabel } from '../lib/dates';

export default function CalendarScreen({ date, time, onDate, onTime, onContinue }) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const maxMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + CONFIG.monthsAhead, 1),
    [today],
  );

  // se a pessoa voltou para mudar o plano, abre direto no mês já escolhido
  const [view, setView] = useState(() => {
    const base = date ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  // horário digitado à mão (fora dos botões prontos)
  const [custom, setCustom] = useState(() => (time && !TIMES.includes(time) ? time : ''));

  const shiftMonth = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const leadingBlanks = view.getDay();
  const ready = Boolean(date && time);

  const pickPreset = (t) => {
    setCustom('');
    onTime(t);
  };
  const changeCustom = (e) => {
    const v = e.target.value;
    setCustom(v);
    if (v) onTime(v); // o campo vira '' enquanto está incompleto: ignora
  };

  return (
    <section className="screen cal-screen">
      <div className="card">
        <p className="kicker">passo 2 de 3</p>
        <h1 className="step-title">Escolha o dia e o horário</h1>

        <div className="calwrap">
          <div className="calside">
            <div className="calhead">
              <button
                type="button"
                className="nav"
                aria-label="Mês anterior"
                disabled={+view <= +minMonth}
                onClick={() => shiftMonth(-1)}
              >
                &lsaquo;
              </button>
              <b aria-live="polite">{monthLabel(view)}</b>
              <button
                type="button"
                className="nav"
                aria-label="Próximo mês"
                disabled={+view >= +maxMonth}
                onClick={() => shiftMonth(1)}
              >
                &rsaquo;
              </button>
            </div>

            <div className="dow" aria-hidden="true">
              {WEEKDAYS_SHORT.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div key={`b${i}`} className="day blank" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(view.getFullYear(), view.getMonth(), i + 1);
                const isToday = +d === +today;
                const selected = date && +d === +date;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`day${isToday ? ' today' : ''}${selected ? ' sel' : ''}`}
                    disabled={d < today}
                    aria-pressed={Boolean(selected)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={longDate(d)}
                    onClick={() => onDate(d)}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="optside">
            <span className="label" id="lbl-time">Qual horário funciona?</span>
            <div className="slots" role="group" aria-labelledby="lbl-time">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`slot${time === t && !custom ? ' sel' : ''}`}
                  aria-pressed={time === t && !custom}
                  onClick={() => pickPreset(t)}
                >
                  {fmtTime(t)}
                </button>
              ))}
              <input
                type="time"
                className="slot custom-time"
                aria-label="Ou escolha outro horário"
                value={custom}
                onChange={changeCustom}
              />
            </div>

            <div className="rowend">
              <button type="button" className="btn" disabled={!ready} onClick={onContinue}>
                Continuar 🍽️
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
