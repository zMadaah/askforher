import { useEffect, useRef } from 'react';

const GLYPHS = ['\u{1F497}', '\u{1F495}', '\u{1F496}', '\u{1F338}', '✨', '\u{1F498}'];

// Corações e flores subindo ao fundo. É decoração pura, então mexe direto no
// DOM (sem estado do React) para não re-renderizar nada a cada 650 ms.
export default function Hearts() {
  const boxRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timers = new Set();
    const interval = setInterval(() => {
      if (document.hidden) return;
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      h.style.left = `${Math.random() * 100}vw`;
      h.style.fontSize = `${14 + Math.random() * 24}px`;
      h.style.animationDuration = `${9 + Math.random() * 8}s`;
      box.appendChild(h);
      const t = setTimeout(() => { h.remove(); timers.delete(t); }, 18000);
      timers.add(t);
    }, 650);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
      box.replaceChildren();
    };
  }, []);

  return <div ref={boxRef} className="hearts" aria-hidden="true" />;
}
