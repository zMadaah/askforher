import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TAUNTS } from '../config';
import { useFx } from './FxProvider';

// Tudo o que faz o "Não" escapar: passar o mouse, encostar o dedo, focar, clicar...
const NO_EVENTS = ['mouseenter', 'mouseover', 'touchstart', 'pointerdown', 'focus', 'click'];
const PAD = 12;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export default function AskScreen({ onYes }) {
  const fx = useFx();
  const yesRef = useRef(null);
  const noElRef = useRef(null);
  const dodgesRef = useRef(0);
  const looseRef = useRef(null); // posição do "Não" depois que ele escapa: { x, y, w, h, rot }
  const pendingRef = useRef(false); // a primeira fuga ainda está se acomodando
  const [dodges, setDodges] = useState(0);
  const [loose, setLoose] = useState(null);

  const place = useCallback((next) => {
    looseRef.current = next;
    setLoose(next);
  }, []);

  // escolhe um ponto novo: longe de onde está e sem cobrir o botão "Sim"
  const pickTarget = useCallback(() => {
    const el = noElRef.current;
    const yes = yesRef.current;
    if (!el || !yes) return null;
    const r = el.getBoundingClientRect();
    const y = yes.getBoundingClientRect();
    const maxX = Math.max(innerWidth - r.width - PAD, PAD + 1);
    const maxY = Math.max(innerHeight - r.height - PAD, PAD + 1);
    let x;
    let top;
    let tries = 0;
    do {
      x = PAD + Math.random() * (maxX - PAD);
      top = PAD + Math.random() * (maxY - PAD);
      tries++;
    } while (
      tries < 40 &&
      (Math.hypot(x - r.left, top - r.top) < 150 || // precisa mesmo ir para outro lugar
        (x < y.right + 24 && x + r.width > y.left - 24 && // nunca cobre o Sim
          top < y.bottom + 24 && top + r.height > y.top - 24))
    );
    return { x, y: top, rot: (Math.random() * 24 - 12) | 0 };
  }, []);

  const dodge = useCallback(() => {
    if (pendingRef.current) return;
    const el = noElRef.current;
    if (!el) return;

    if (!looseRef.current) {
      // Primeira fuga: o botão sai do cartão e passa a flutuar sobre a janela,
      // começando exatamente onde estava. O destino só é escolhido depois que
      // o layout se acomoda (o "Sim" se recentraliza quando o "Não" sai da linha).
      const r = el.getBoundingClientRect();
      pendingRef.current = true;
      place({ x: r.left, y: r.top, w: r.width, h: r.height, rot: 0 });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const t = pickTarget();
          if (t) place({ ...looseRef.current, ...t });
          pendingRef.current = false;
        }),
      );
    } else {
      const t = pickTarget();
      if (t) place({ ...looseRef.current, ...t });
    }

    dodgesRef.current += 1;
    setDodges(dodgesRef.current);
  }, [pickTarget, place]);

  // listeners nativos com { passive: false }: o React registra touchstart como
  // passivo, e aqui precisamos de preventDefault para o toque nunca "pegar"
  const onNo = useCallback(
    (e) => {
      e.preventDefault();
      dodge();
    },
    [dodge],
  );
  const bindNo = useCallback(
    (el) => {
      const prev = noElRef.current;
      if (prev) NO_EVENTS.forEach((ev) => prev.removeEventListener(ev, onNo));
      noElRef.current = el;
      if (el) NO_EVENTS.forEach((ev) => el.addEventListener(ev, onNo, { passive: false }));
    },
    [onNo],
  );

  // fuga por proximidade: ele sai antes de o cursor chegar
  useEffect(() => {
    const onMove = (e) => {
      const el = noElRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < r.width * 0.9 + 60) dodge();
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [dodge]);

  // se a janela encolher (ou o celular girar), traz o botão de volta para a área visível
  useEffect(() => {
    const onResize = () => {
      const l = looseRef.current;
      if (!l) return;
      place({
        ...l,
        x: clamp(l.x, PAD, innerWidth - l.w - PAD),
        y: clamp(l.y, PAD, innerHeight - l.h - PAD),
      });
    };
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, [place]);

  const handleYes = () => {
    const r = yesRef.current.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, 120, 6);
    onYes(dodgesRef.current);
  };

  const yesScale = Math.min(1 + dodges * 0.055, 1.75); // o Sim fica cada vez mais tentador
  const noOpacity = dodges > 4 ? Math.max(1 - (dodges - 4) * 0.08, 0.35) : 1;
  const taunt = dodges ? TAUNTS[Math.min(dodges, TAUNTS.length) - 1] : '';

  const noButton = (style) => (
    <button
      ref={bindNo}
      type="button"
      tabIndex={-1}
      className={`btn ghost no${loose ? ' no-loose' : ''}`}
      style={style}
    >
      Não
    </button>
  );

  return (
    <section className="screen">
      <div className="card">
        <p className="kicker">uma pergunta muito importante</p>
        <h1>
          Você topa um <span className="grad">date</span> comigo?
        </h1>
        <div className="choices">
          <button
            ref={yesRef}
            type="button"
            className="btn"
            style={{ transform: `scale(${yesScale})` }}
            onClick={handleYes}
          >
            Sim 💖
          </button>
          {!loose && noButton()}
        </div>
        <div className={`tease${dodges ? ' show' : ''}`} aria-live="polite">
          {taunt}
        </div>
      </div>

      {/* Depois da primeira fuga o "Não" vive direto no <body>: assim as coordenadas
          são sempre as da janela, sem sofrer com o backdrop-filter do cartão. */}
      {loose &&
        createPortal(
          noButton({
            left: loose.x,
            top: loose.y,
            width: loose.w,
            height: loose.h,
            transform: `rotate(${loose.rot}deg)`,
            opacity: noOpacity,
          }),
          document.body,
        )}
    </section>
  );
}
