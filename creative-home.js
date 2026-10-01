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
  const comparison = document.querySelector("[data-comparison]");
  const comparisonRange = document.querySelector("[data-comparison-range]");
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

  if (comparison && comparisonRange) {
    let activePointerId = null;
    let hasDemonstrated = false;

    const setComparison = (value) => {
      const position = Math.max(0, Math.min(100, Number(value)));
      comparison.style.setProperty("--comparison-position", `${position}%`);
      comparison.style.setProperty("--raw-label-opacity", Math.min(position / 5, 1).toFixed(2));
      comparison.style.setProperty("--edited-label-opacity", Math.min((100 - position) / 5, 1).toFixed(2));
      comparisonRange.value = position;
    };

    const setFromPointer = (event) => {
      const bounds = comparison.getBoundingClientRect();
      setComparison(((event.clientX - bounds.left) / bounds.width) * 100);
    };

    comparisonRange.addEventListener("input", () => setComparison(comparisonRange.value));
    comparison.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      activePointerId = event.pointerId;
      comparison.setPointerCapture(event.pointerId);
      comparisonRange.focus({ preventScroll: true });
      setFromPointer(event);
    });
    comparison.addEventListener("pointermove", (event) => {
      if (event.pointerId === activePointerId) setFromPointer(event);
    });
    const releasePointer = (event) => {
      if (event.pointerId !== activePointerId) return;
      if (comparison.hasPointerCapture(event.pointerId)) comparison.releasePointerCapture(event.pointerId);
      activePointerId = null;
    };
    comparison.addEventListener("pointerup", releasePointer);
    comparison.addEventListener("pointercancel", releasePointer);

    if (!reducedMotion.matches && "IntersectionObserver" in window) {
      const demonstrate = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting) || hasDemonstrated) return;
        hasDemonstrated = true;
        observer.disconnect();
        comparison.classList.add("is-demonstrating");
        const steps = [[58, 350], [43, 700], [50, 1050]];
        steps.forEach(([value, delay]) => window.setTimeout(() => setComparison(value), delay));
        window.setTimeout(() => comparison.classList.remove("is-demonstrating"), 1400);
      }, { threshold: 0.45 });
      demonstrate.observe(comparison);
    }
  }

  requestMotionUpdate();
})();
