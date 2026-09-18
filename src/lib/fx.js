// Motor de partículas: fogos de artifício e chuva de confete num <canvas>.
// Portado do original (vanilla) quase sem mudanças de comportamento.

const PALETTE = ['#ff5c8a', '#ffd479', '#8be9fd', '#b6ff8a', '#ff9ec4', '#c39bff', '#ffffff'];
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createFx() {
  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let particles = [];
  let raf = null;
  let rocketTimer = null;
  let stopTimer = null;

  function resize() {
    if (!canvas) return;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function attach(el) {
    canvas = el;
    ctx = el.getContext('2d');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    addEventListener('resize', resize);
    resize();
  }

  function detach() {
    removeEventListener('resize', resize);
    stop();
    canvas = null;
    ctx = null;
  }

  function stop() {
    clearInterval(rocketTimer);
    clearTimeout(stopTimer);
    cancelAnimationFrame(raf);
    raf = null;
    particles = [];
    if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.kind === 'confetti') {
        p.vx *= 0.995;
        p.rot += p.vr;
      } else {
        p.vx *= 0.985;
        p.vy *= 0.985;
      }
      if (p.life <= 0 || p.y > innerHeight + 60) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.c;
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.r, -p.r * 0.55, p.r * 2, p.r * 1.1);
        ctx.restore();
      } else {
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
    raf = particles.length ? requestAnimationFrame(loop) : null;
  }

  const kick = () => {
    if (ctx && !raf) raf = requestAnimationFrame(loop);
  };

  function burst(x, y, count = 90, spread = 5.4) {
    if (!ctx || prefersReducedMotion()) return;
    const hue = pick(PALETTE);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spread + 0.6;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1, decay: 0.008 + Math.random() * 0.014, g: 0.045,
        c: Math.random() < 0.25 ? pick(PALETTE) : hue,
        r: 1.4 + Math.random() * 2.2, kind: 'spark',
      });
    }
    kick();
  }

  function confettiFall(n = 130) {
    if (!ctx || prefersReducedMotion()) return;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6,
        vx: (Math.random() - 0.5) * 1.6, vy: 1.4 + Math.random() * 2.6,
        life: 1, decay: 0.0032, g: 0.012, c: pick(PALETTE),
        r: 3 + Math.random() * 4, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.24,
        kind: 'confetti',
      });
    }
    kick();
  }

  function rocket() {
    const x = innerWidth * (0.15 + Math.random() * 0.7);
    const y = innerHeight * (0.15 + Math.random() * 0.35);
    burst(x, y, 70 + ((Math.random() * 60) | 0), 4.5 + Math.random() * 2.5);
  }

  // confete + uma salva de fogos por alguns segundos
  function celebrate(seconds = 7) {
    if (!ctx || prefersReducedMotion()) return;
    confettiFall();
    burst(innerWidth / 2, innerHeight * 0.42, 150, 7);
    clearInterval(rocketTimer);
    clearTimeout(stopTimer);
    rocketTimer = setInterval(rocket, 420);
    stopTimer = setTimeout(() => clearInterval(rocketTimer), seconds * 1000);
  }

  return { attach, detach, burst, celebrate };
}
