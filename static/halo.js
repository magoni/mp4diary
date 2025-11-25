// halo.js — Floating halo background module
// Exposes: window.HaloBackgroundConfig (optional config object) and window.HaloBackground (API)
(function () {
  "use strict";

  // sensible defaults; users can override by setting window.HaloBackgroundConfig before this file loads
  const DEFAULTS = {
    // particle defaults (many small drifting glows)
    count: 120,
    // dark particle palette — tints of near-black for a subtle, moody background
    colors: [
      "rgba(12, 12, 12, 0.95)",
      "rgba(36, 36, 36, 0.95)",
      "rgba(64, 64, 64, 0.95)",
      "rgba(16, 20, 24, 0.95)",
    ],
    sizeMin: 6,
    sizeMax: 36,
    // tuned blur and opacity for dark particle look on white backgrounds
    blur: 6,
    baseOpacity: 0.95,
    // alpha range for particles (darker on white background) — animate between subtle and nearly full strength
    animationAlpha: {
      min: 0.28,
      maxRange: 0.62, // alpha ranges roughly ~0.28..0.9
    },
    ampX: [8, 220], // min..max for particle drift
    ampY: [8, 150],
    reducedMotion:
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };

  // Merge config from page
  function getConfig() {
    const global = window.HaloBackgroundConfig || {};
    return Object.assign({}, DEFAULTS, global);
  }

  // main initializer — returns the public API for controlling the background
  function init(cfg) {
    const conf = Object.assign({}, getConfig(), cfg || {});
    if (conf.reducedMotion) return { start: () => {}, stop: () => {} }; // noop for reduced-motion users

    const container = document.getElementById(
      conf.containerId || "halo-container"
    );
    if (!container) return { start: () => {}, stop: () => {} };

    // small helper
    const vw = () =>
      Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
    const vh = () =>
      Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );

    container.style.pointerEvents = "none";

    const halos = [];
    let running = false;
    let rafId = null;
    let t0 = performance.now();

    function randRange(a, b) {
      return a + Math.random() * (b - a);
    }

    function createParticle(i) {
      const el = document.createElement("div");
      el.className = "halo";

      // sizes and styles
      const size = Math.round(randRange(conf.sizeMin, conf.sizeMax));
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.background = `radial-gradient(circle at 50% 50%, ${
        conf.colors[i % conf.colors.length]
      } 0%, rgba(0,0,0,0) 70%)`;
      el.style.filter = `blur(${conf.blur}px)`;
      el.style.opacity = conf.baseOpacity;

      const startX = Math.random() * vw();
      const startY = Math.random() * vh();

      const ampX = randRange(conf.ampX[0], conf.ampX[1]);
      const ampY = randRange(conf.ampY[0], conf.ampY[1]);
      const phase = Math.random() * Math.PI * 2;
      const freq = 0.2 + Math.random() * 0.4;

      el.style.left = startX - size / 2 + "px";
      el.style.top = startY - size / 2 + "px";

      // particles should be visually subtle and centered
      el.style.borderRadius = "50%";
      el.style.pointerEvents = "none";
      el.style.mixBlendMode = "multiply";

      container.appendChild(el);
      halos.push({ el, size, startX, startY, ampX, ampY, phase, freq });
    }

    function populate() {
      for (let i = 0; i < conf.count; i++) createParticle(i);
    }

    function animate(now) {
      const t = (now - t0) / 1000;

      for (const h of halos) {
        const x =
          h.startX +
          Math.sin(t * h.freq + h.phase) * h.ampX +
          Math.cos(t * (h.freq / 1.2) + h.phase) * 10;
        const y =
          h.startY +
          Math.cos(t * (h.freq * 0.9) - h.phase) * h.ampY +
          Math.sin(t * (h.freq / 1.3) + h.phase) * 6;

        // particle styling: small scale modulation and flicker in opacity
        const slowScale = 0.85 + 0.3 * Math.abs(Math.sin(t * h.freq + h.phase));
        const alpha =
          conf.animationAlpha.min +
          conf.animationAlpha.maxRange *
            (0.5 + 0.5 * Math.sin(t * h.freq + h.phase));

        h.el.style.transform = `translate3d(${x - h.size / 2}px, ${
          y - h.size / 2
        }px, 0) scale(${slowScale})`;
        h.el.style.opacity = Math.max(0, Math.min(1, alpha));
      }

      rafId = requestAnimationFrame(animate);
    }

    function start() {
      if (running) return;
      running = true;
      t0 = performance.now();
      populate();
      rafId = requestAnimationFrame(animate);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      // remove elements
      for (const h of halos)
        if (h.el && h.el.parentNode) h.el.parentNode.removeChild(h.el);
      halos.length = 0;
    }

    // keep halos responsive
    function onResize() {
      for (const h of halos) {
        h.startX = Math.random() * vw();
        h.startY = Math.random() * vh();
      }
    }

    window.addEventListener("resize", onResize);

    // start automatically on load
    start();

    const api = { start, stop, config: conf };
    return api;
  }

  // make config accessible before script loads and expose API after
  const apiHolder = { _api: null };

  // small helper that initializes based on window.HaloBackgroundConfig
  function boot() {
    const userConfig = window.HaloBackgroundConfig || {};
    apiHolder._api = init(userConfig);
    window.HaloBackground = apiHolder._api || {
      start: () => {},
      stop: () => {},
    };
  }

  // boot once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // expose a safe API if someone wants to start/stop later
  window.HaloBackgroundModule = {
    init: (cfg) => {
      apiHolder._api && apiHolder._api.stop();
      apiHolder._api = init(cfg);
      return apiHolder._api;
    },
    defaults: DEFAULTS,
  };
})();
