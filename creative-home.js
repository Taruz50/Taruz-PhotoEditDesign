(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 801px)");
  const root = document.documentElement;
  const heroImage = document.querySelector("[data-hero-image] img");
  const scrollIndicator = document.querySelector("[data-scroll-indicator]");
  const movingImages = [...document.querySelectorAll("[data-scroll-image]")];
  const driftingText = [...document.querySelectorAll("[data-drift]")];
  const revealTargets = [...document.querySelectorAll("[data-reveal]")];
  const header = document.querySelector(".site-header");
  let frameRequested = false;

  const updateHeaderState = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);

  const resetMotion = () => {
    [heroImage, ...movingImages, ...driftingText].filter(Boolean).forEach((element) => {
      element.style.removeProperty("--hero-shift");
      element.style.removeProperty("--image-shift");
      element.style.removeProperty("--drift-y");
    });
    scrollIndicator?.style.removeProperty("--scroll-progress");
  };

  const updateMotion = () => {
    frameRequested = false;
    updateHeaderState();
    if (reducedMotion.matches || !desktop.matches) {
      resetMotion();
      return;
    }

    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const heroProgress = Math.min(scrollY / Math.max(viewportHeight, 1), 1);
    heroImage?.style.setProperty("--hero-shift", `${Math.min(scrollY * 0.055, 46)}px`);
    scrollIndicator?.style.setProperty("--scroll-progress", heroProgress.toFixed(3));

    movingImages.forEach((image, index) => {
      const rect = image.getBoundingClientRect();
      const progress = (viewportHeight * 0.6 - rect.top) / viewportHeight;
      const amount = Math.max(-12, Math.min(12, progress * (index ? 13 : 17)));
      image.style.setProperty("--image-shift", `${amount.toFixed(2)}px`);
    });

    driftingText.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const progress = (viewportHeight * 0.55 - rect.top) / viewportHeight;
      const amount = Math.max(-10, Math.min(10, progress * (index ? 10 : 7)));
      element.style.setProperty("--drift-y", `${amount.toFixed(2)}px`);
    });
  };

  const requestMotionUpdate = () => {
    if (!frameRequested) {
      frameRequested = true;
      window.requestAnimationFrame(updateMotion);
    }
  };

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    root.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });
    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  }

  window.addEventListener("scroll", requestMotionUpdate, { passive: true });
  window.addEventListener("resize", requestMotionUpdate, { passive: true });
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      root.classList.remove("motion-ready");
      revealTargets.forEach((target) => target.classList.add("is-visible"));
    }
    requestMotionUpdate();
  });
  desktop.addEventListener("change", requestMotionUpdate);
  requestMotionUpdate();
})();
