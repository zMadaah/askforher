export default function YayScreen({ onContinue }) {
  return (
    <section className="screen">
      <div className="card">
        <p className="big" aria-hidden="true">🎉</p>
        <h1>
          Você disse <span className="grad">SIM!</span>
        </h1>
        <p className="sub">
          Melhor decisão da semana. Agora vem a parte importante: quando você está livre?
        </p>
        <button type="button" className="btn" onClick={onContinue}>
          Escolher o dia 📅
        </button>
      </div>
    </section>
  );
}
