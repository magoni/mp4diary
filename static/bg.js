(function () {
  "use strict";

  const CONFIG = {
    count: 60,
    sprite: "/static/star.png",
    sizeMin: 3,
    sizeMax: 18,
  };

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function buildConfig() {
    const sizeVal = Math.max(
      1,
      Math.round((CONFIG.sizeMin + CONFIG.sizeMax) / 2)
    );

    const particles = {
      number: {
        value: 50,
        density: { enable: true, value_area: 900 },
      },
      color: { value: "#ffffff" },
      shape: "/static/star.png"
        ? {
            type: "image",
            image: { src: "/static/star.png", width: 100, height: 100 },
          }
        : { type: "circle" },
      opacity: { value: 1, random: true },
      size: { value: sizeVal, random: true, anim: { enable: true } },
      move: {
        enable: !prefersReduced,
        speed: 2,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
      },
    };

    return {
      particles,
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: false }, onclick: { enable: false } },
      },
      retina_detect: true,
    };
  }

  function start() {
    if (prefersReduced) return false;
    const container = document.getElementById("bg-container");
    if (!container) return false;

    // destroy any existing instance attached to the same container
    if (window.pJSDom && window.pJSDom.length) {
      for (let i = window.pJSDom.length - 1; i >= 0; i--) {
        const inst = window.pJSDom[i];
        try {
          if (
            inst &&
            inst.pJS &&
            inst.pJS.canvas &&
            inst.pJS.canvas.el &&
            inst.pJS.canvas.el.parentNode === container
          ) {
            inst.pJS.fn.vendors.destroypJS();
            window.pJSDom.splice(i, 1);
          }
        } catch (e) {
          /* ignore */
        }
      }
    }

    try {
      window.particlesJS("bg-container", buildConfig());
      // apply blur to canvas if requested
      const canvas = container.querySelector("canvas");
      if (canvas && CONFIG.blur) canvas.style.filter = `blur(${CONFIG.blur}px)`;
      return true;
    } catch (err) {
      console.warn("particles.js init failed", err);
      return false;
    }
  }

  function stop() {
    if (!window.pJSDom) return;
    for (let i = window.pJSDom.length - 1; i >= 0; i--) {
      try {
        window.pJSDom[i].pJS.fn.vendors.destroypJS();
      } catch (e) {
        /* ignore */
      }
      window.pJSDom.splice(i, 1);
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else start();
})();
