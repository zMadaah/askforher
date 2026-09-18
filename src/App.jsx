import { useEffect, useState } from 'react';
import Hearts from './components/Hearts';
import { FxProvider, useFx } from './components/FxProvider';
import AskScreen from './components/AskScreen';
import YayScreen from './components/YayScreen';
import CalendarScreen from './components/CalendarScreen';
import FoodScreen from './components/FoodScreen';
import DoneScreen from './components/DoneScreen';
import { FOODS } from './config';
import { saveAnswer } from './lib/save';
import { WEEKDAYS, atTime, cap, fmtTime, prettyDate, toISODate } from './lib/dates';

// Fluxo: ask -> yay -> cal -> food -> done  (de food dá para voltar a cal; de done também)
function Flow() {
  const fx = useFx();
  const [screen, setScreen] = useState('ask');
  const [dodges, setDodges] = useState(0);
  const [plan, setPlan] = useState({ date: null, time: null, food: null, note: '' });
  const [result, setResult] = useState(null);

  const patchPlan = (patch) => setPlan((p) => ({ ...p, ...patch }));

  const handleYes = (n) => {
    setDodges(n);
    setScreen('yay');
    fx.celebrate(8);
  };

  const handleConfirm = async () => {
    const { date: d, time: t, food, note } = plan;
    const foodItem = FOODS.find((f) => f.id === food);
    if (!d || !t || !foodItem) return; // os botões já ficam desabilitados; isto é só uma trava
    const payload = {
      answer: 'SIM',
      date: toISODate(d),
      day: cap(WEEKDAYS[d.getDay()]),
      time: t,
      time_pretty: fmtTime(t),
      pretty: `${prettyDate(d)} ${atTime(t)}`,
      food: foodItem.id,
      food_label: foodItem.label,
      note: note.trim(),
      dodges_before_yes: dodges,
      submitted_at: new Date().toISOString(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    };
    const [h, m] = t.split(':').map(Number);

    setResult({
      payload,
      dateLabel: prettyDate(d),
      timeLabel: fmtTime(t),
      foodLabel: `${foodItem.emoji} ${foodItem.label}`,
      target: new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0),
      status: { kind: 'saving' },
    });
    setScreen('done');
    fx.celebrate(9);

    // o salvamento fica aqui (e não num useEffect) para o StrictMode não gravar duas vezes
    const status = await saveAnswer(payload);
    setResult((r) => (r && r.payload === payload ? { ...r, status } : r));
  };

  // fogos extras onde você clicar nas telas felizes
  useEffect(() => {
    if (screen !== 'yay' && screen !== 'done') return undefined;
    const onClick = (e) => fx.burst(e.clientX, e.clientY, 45, 4.5);
    addEventListener('click', onClick);
    return () => removeEventListener('click', onClick);
  }, [screen, fx]);

  return (
    <main className="stage">
      {screen === 'ask' && <AskScreen onYes={handleYes} />}
      {screen === 'yay' && <YayScreen onContinue={() => setScreen('cal')} />}
      {screen === 'cal' && (
        <CalendarScreen
          date={plan.date}
          time={plan.time}
          onDate={(d) => patchPlan({ date: d })}
          onTime={(t) => patchPlan({ time: t })}
          onContinue={() => setScreen('food')}
        />
      )}
      {screen === 'food' && (
        <FoodScreen
          food={plan.food}
          note={plan.note}
          onFood={(f) => patchPlan({ food: f })}
          onNote={(n) => patchPlan({ note: n })}
          onBack={() => setScreen('cal')}
          onConfirm={handleConfirm}
        />
      )}
      {screen === 'done' && result && (
        <DoneScreen result={result} onChangePlan={() => setScreen('cal')} />
      )}
    </main>
  );
}

export default function App() {
  return (
    <>
      <Hearts />
      <FxProvider>
        <Flow />
      </FxProvider>
    </>
  );
}
