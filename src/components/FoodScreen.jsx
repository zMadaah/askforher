import { FOODS } from '../config';

export default function FoodScreen({ food, note, onFood, onNote, onBack, onConfirm }) {
  return (
    <section className="screen food-screen">
      <div className="card">
        <p className="kicker">passo 3 de 3</p>
        <h1 className="step-title">
          E pra <span className="grad">comer</span>?
        </h1>
        <p className="sub">Escolha o que te dá mais vontade. Eu cuido de achar o melhor lugar.</p>

        <div className="foods" role="group" aria-label="O que você quer comer">
          {FOODS.map((f) => {
            const selected = food === f.id;
            return (
              <button
                key={f.id}
                type="button"
                className={`food${selected ? ' sel' : ''}`}
                aria-pressed={selected}
                onClick={() => onFood(selected ? null : f.id)}
              >
                <span className="food-emoji" aria-hidden="true">{f.emoji}</span>
                <span className="food-label">{f.label}</span>
              </button>
            );
          })}
        </div>

        <label className="label" htmlFor="note">Algo que eu precise saber</label>
        <textarea
          id="note"
          rows={2}
          maxLength={300}
          placeholder="Alergia, restrição, um lugar que você ama..."
          value={note}
          onChange={(e) => onNote(e.target.value)}
        />

        <div className="rowend">
          <button type="button" className="btn ghost" onClick={onBack}>
            Voltar
          </button>
          <button type="button" className="btn" disabled={!food} onClick={onConfirm}>
            Confirmar encontro
          </button>
        </div>
      </div>
    </section>
  );
}
