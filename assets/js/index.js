(() => {
  "use strict";

  const doc = document;

  const qs = (selector, context = doc) =>
    context ? context.querySelector(selector) : null;

  const qsa = (selector, context = doc) =>
    context ? Array.from(context.querySelectorAll(selector)) : [];

  const duplicateSlidesForLoop = (slider, minSlides) => {
    const wrapper = qs(".swiper-wrapper", slider);

    if (!wrapper) return [];

    const originals = qsa(".swiper-slide", wrapper);

    if (!originals.length) return [];

    let index = 0;

    while (wrapper.children.length < minSlides) {
      const clone = originals[index % originals.length].cloneNode(true);

      clone
        .querySelectorAll("[id]")
        .forEach((element) => element.removeAttribute("id"));

      wrapper.appendChild(clone);
      index += 1;
    }

    return qsa(".swiper-slide", wrapper);
  };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const canUseScrollEffects = () =>
    !reducedMotion &&
    window.matchMedia("(min-width: 992px)").matches &&
    window.matchMedia("(pointer: fine)").matches;


  const initServicesSwiper = () => {
    const slider = qs(".home-services__slider");

    if (
      !slider ||
      typeof window.Swiper === "undefined"
    ) {
      return;
    }

    const slides = duplicateSlidesForLoop(slider, 6);

    if (!slides.length) return;

    const next = qs(
      ".home-services__next"
    );

    const prev = qs(
      ".home-services__prev"
    );

    new window.Swiper(slider, {
      slidesPerView: 1.08,
      spaceBetween: 12,

      speed: 720,

      loop: true,

      grabCursor: true,

      watchSlidesProgress: true,

      observer: true,
      observeParents: true,

      navigation: {
        nextEl: next,
        prevEl: prev
      },

      autoplay: reducedMotion
        ? false
        : {
            delay: 4200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },

      breakpoints: {
        580: {
          slidesPerView: 1.45,
          spaceBetween: 14
        },

        768: {
          slidesPerView: 2,
          spaceBetween: 14
        },

        1100: {
          slidesPerView: 2.35,
          spaceBetween: 16
        },

        1320: {
          slidesPerView: 3,
          spaceBetween: 18
        }
      }
    });
  };


  const initTestimonialsSwiper = () => {
    const slider = qs(
      ".home-testimonials__slider"
    );

    if (
      !slider ||
      typeof window.Swiper === "undefined"
    ) {
      return;
    }

    const slides = duplicateSlidesForLoop(slider, 4);

    if (!slides.length) return;

    const next = qs(
      ".home-testimonials__next"
    );

    const prev = qs(
      ".home-testimonials__prev"
    );

    new window.Swiper(slider, {
      slidesPerView: 1,
      spaceBetween: 18,

      speed: 760,

      loop: true,

      grabCursor: true,

      autoHeight: false,

      navigation: {
        nextEl: next,
        prevEl: prev
      },

      autoplay: reducedMotion
        ? false
        : {
            delay: 5600,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
    });
  };


  const initCases = () => {
    const section = qs(
      ".home-cases__accordion"
    );

    if (!section) return;

    const cases = qsa(
      ".home-case",
      section
    );

    if (!cases.length) return;

    const activateCase = (target) => {
      cases.forEach((item) => {
        const active =
          item === target;

        item.classList.toggle(
          "is-active",
          active
        );

        item.setAttribute(
          "aria-expanded",
          String(active)
        );
      });
    };

    const firstActive =
      qs(".home-case.is-active", section) ||
      cases[0];

    activateCase(firstActive);

    cases.forEach((item) => {
      item.setAttribute(
        "tabindex",
        "0"
      );

      item.setAttribute(
        "role",
        "button"
      );

      item.addEventListener(
        "mouseenter",
        () => {
          if (
            window.innerWidth > 767
          ) {
            activateCase(item);
          }
        }
      );

      item.addEventListener(
        "click",
        () => {
          activateCase(item);
        }
      );

      item.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          event.preventDefault();

          activateCase(item);
        }
      );
    });
  };


  const initAboutTabs = () => {
    const section = qs("[data-about-tabs]");

    if (!section) return;

    const tabs = qsa("[data-about-tab]", section);
    const title = qs("[data-about-title]", section);
    const kicker = qs("[data-about-kicker]", section);
    const text = qs("[data-about-text]", section);
    const cardTitle = qs("[data-about-card-title]", section);
    const cardText = qs("[data-about-card-text]", section);

    if (
      !tabs.length ||
      !title ||
      !kicker ||
      !text ||
      !cardTitle ||
      !cardText
    ) {
      return;
    }

    const activateTab = (tab) => {
      tabs.forEach((item) => {
        const active =
          item === tab;

        item.classList.toggle(
          "is-active",
          active
        );

        item.setAttribute(
          "aria-pressed",
          String(active)
        );
      });

      kicker.textContent =
        tab.dataset.kicker || "";

      title.textContent =
        tab.dataset.title || "";

      text.textContent =
        tab.dataset.text || "";

      cardTitle.textContent =
        tab.dataset.cardTitle || "";

      cardText.textContent =
        tab.dataset.cardText || "";

      section.classList.add(
        "is-switching"
      );

      window.setTimeout(
        () => {
          section.classList.remove(
            "is-switching"
          );
        },
        260
      );
    };

    tabs.forEach((tab) => {
      tab.addEventListener(
        "mouseenter",
        () => activateTab(tab)
      );

      tab.addEventListener(
        "focus",
        () => activateTab(tab)
      );

      tab.addEventListener(
        "click",
        () => activateTab(tab)
      );
    });
  };


  const initHeroEntrance = () => {
    const hero = qs(".home-hero");

    if (!hero) return;

    const titleLines = qsa(
      ".home-hero__title-line",
      hero
    );

    const label = qs(
      ".home-hero__label",
      hero
    );

    const intro = qs(
      ".home-hero__intro",
      hero
    );

    const visual = qs(
      ".home-hero__visual",
      hero
    );

    if (
      reducedMotion ||
      typeof window.gsap ===
        "undefined"
    ) {
      return;
    }

    window.gsap.set(
      titleLines,
      {
        yPercent: 110,
        opacity: 0
      }
    );

    window.gsap.set(
      [label, intro],
      {
        y: 20,
        opacity: 0
      }
    );

    window.gsap.set(
      visual,
      {
        scale: 0.94,
        opacity: 0
      }
    );

    const timeline =
      window.gsap.timeline({
        defaults: {
          ease: "power3.out"
        }
      });

    timeline
      .to(
        label,
        {
          y: 0,
          opacity: 1,
          duration: 0.65
        },
        0.12
      )

      .to(
        titleLines,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.95,
          stagger: 0.1
        },
        0.2
      )

      .to(
        visual,
        {
          scale: 1,
          opacity: 1,
          duration: 1.1
        },
        0.25
      )

      .to(
        intro,
        {
          y: 0,
          opacity: 1,
          duration: 0.7
        },
        0.62
      );
  };


  const initHeroScroll = () => {
    if (
      !canUseScrollEffects() ||
      typeof window.gsap ===
        "undefined" ||
      typeof window.ScrollTrigger ===
        "undefined"
    ) {
      return;
    }

    const hero = qs(".home-hero");

    const visual = qs(
      ".home-hero__visual",
      hero
    );

    const copy = qs(
      ".home-hero__copy",
      hero
    );

    if (
      !hero ||
      !visual ||
      !copy
    ) {
      return;
    }

    window.gsap.registerPlugin(
      window.ScrollTrigger
    );

    window.gsap.to(
      visual,
      {
        y: 55,

        ease: "none",

        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.55
        }
      }
    );

    window.gsap.to(
      copy,
      {
        y: -22,

        ease: "none",

        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.55
        }
      }
    );
  };


  const initProcess = () => {
    const section = qs(
      ".home-process"
    );

    if (!section) return;

    const visualImage = qs(
      ".home-process__visual img",
      section
    );

    const items = qsa(
      ".home-process__item",
      section
    );

    if (
      !items.length ||
      !visualImage
    ) {
      return;
    }

    const setActiveItem = (activeItem) => {
      const thumbImage = qs(
        ".home-process__thumb img",
        activeItem
      );

      if (!thumbImage) {
        return;
      }

      const title = qs(
        ".home-process__body h3",
        activeItem
      );

      const isSameImage =
        visualImage.currentSrc === thumbImage.currentSrc ||
        visualImage.getAttribute("src") === thumbImage.getAttribute("src");

      items.forEach(
        (item) => {
          const isActive = item === activeItem;

          item.classList.toggle(
            "is-active",
            isActive
          );

          item.setAttribute(
            "aria-pressed",
            String(isActive)
          );
        }
      );

      if (isSameImage) return;

      visualImage.classList.add(
        "is-switching"
      );

      window.setTimeout(
        () => {
          visualImage.src = thumbImage.src;
          visualImage.alt = title
            ? `${title.textContent.trim()} process`
            : "Agency process";

          visualImage.classList.remove(
            "is-switching"
          );
        },
        reducedMotion ? 0 : 160
      );
    };

    items.forEach(
      (item, index) => {
        item.style.setProperty(
          "--process-index",
          index
        );

        item.setAttribute(
          "role",
          "button"
        );

        item.setAttribute(
          "tabindex",
          "0"
        );

        item.setAttribute(
          "aria-pressed",
          "false"
        );

        item.addEventListener(
          "click",
          () => setActiveItem(item)
        );

        item.addEventListener(
          "keydown",
          (event) => {
            if (
              event.key !== "Enter" &&
              event.key !== " "
            ) {
              return;
            }

            event.preventDefault();
            setActiveItem(item);
          }
        );
      }
    );
  };


  const initPerformanceSystem = () => {
    const field = qs(
      "[data-performance-system-field]"
    );

    if (!field) return;

    const capsules = qsa(
      "[data-system-capsule]",
      field
    );

    if (!capsules.length) return;

    const positions = [
      [0.1, 0.44, -2.5],
      [0.33, 0.28, 4],
      [0.43, 0.56, -6],
      [0.49, 0.1, 8],
      [0.64, 0.34, -3],
      [0.68, 0.6, 5]
    ];

    let bounds = {
      width: 0,
      height: 0
    };

    let bodies = [];
    let activeBody = null;
    let isRunning = false;
    let frameId = 0;
    let lastTime = 0;
    let resizeTimer = 0;

    const clamp = (value, min, max) =>
      Math.min(
        Math.max(value, min),
        max
      );

    const render = (body) => {
      body.element.style.transform =
        `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}deg)`;
    };

    const measure = () => {
      const rect = field.getBoundingClientRect();

      bounds = {
        width: rect.width,
        height: rect.height
      };

      bodies = capsules.map(
        (element, index) => {
          const width = element.offsetWidth;
          const height = element.offsetHeight;
          const position =
            positions[index % positions.length];
          const x = clamp(
            bounds.width * position[0],
            0,
            bounds.width - width
          );
          const y = clamp(
            bounds.height * position[1],
            0,
            bounds.height - height
          );

          return {
            element,
            width,
            height,
            x,
            y,
            vx: 0,
            vy: 0,
            angle: position[2],
            baseAngle: position[2],
            va: 0,
            homeX: x,
            homeY: y,
            pointerX: 0,
            pointerY: 0,
            lastPointerX: 0,
            lastPointerY: 0,
            isDragging: false
          };
        }
      );

      bodies.forEach(render);
    };

    const keepInBounds = (body) => {
      if (body.x < 0) {
        body.x = 0;
        body.vx = Math.abs(body.vx) * 0.46;
      }

      if (body.y < 0) {
        body.y = 0;
        body.vy = Math.abs(body.vy) * 0.46;
      }

      if (body.x + body.width > bounds.width) {
        body.x = bounds.width - body.width;
        body.vx = -Math.abs(body.vx) * 0.46;
      }

      if (body.y + body.height > bounds.height) {
        body.y = bounds.height - body.height;
        body.vy = -Math.abs(body.vy) * 0.46;
      }
    };

    const resolveCollisions = () => {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          const a = bodies[i];
          const b = bodies[j];
          const dx =
            a.x + a.width / 2 -
            (b.x + b.width / 2);
          const dy =
            a.y + a.height / 2 -
            (b.y + b.height / 2);
          const overlapX =
            (a.width + b.width) / 2 -
            Math.abs(dx);
          const overlapY =
            (a.height + b.height) / 2 -
            Math.abs(dy);

          if (
            overlapX <= 0 ||
            overlapY <= 0
          ) {
            continue;
          }

          const pushX = dx < 0 ? -1 : 1;
          const pushY = dy < 0 ? -1 : 1;
          const aLocked = a.isDragging ? 0.18 : 1;
          const bLocked = b.isDragging ? 0.18 : 1;
          const total =
            aLocked + bLocked;

          if (overlapX < overlapY) {
            const push =
              overlapX / total;

            a.x += push * pushX * aLocked;
            b.x -= push * pushX * bLocked;
            a.vx += 0.34 * pushX * aLocked;
            b.vx -= 0.34 * pushX * bLocked;
            a.va += 0.018 * pushX;
            b.va -= 0.018 * pushX;
          } else {
            const push =
              overlapY / total;

            a.y += push * pushY * aLocked;
            b.y -= push * pushY * bLocked;
            a.vy += 0.34 * pushY * aLocked;
            b.vy -= 0.34 * pushY * bLocked;
            a.va -= 0.018 * pushY;
            b.va += 0.018 * pushY;
          }
        }
      }
    };

    const tick = (time) => {
      if (!isRunning) return;

      const delta = Math.min(
        (time - lastTime) / 16.67 || 1,
        2
      );
      const idleTime = time * 0.001;

      lastTime = time;

      bodies.forEach(
        (body, index) => {
          if (body.isDragging) {
            const targetX =
              body.pointerX - body.width / 2;
            const targetY =
              body.pointerY - body.height / 2;

            body.vx +=
              (targetX - body.x) * 0.34 * delta;
            body.vy +=
              (targetY - body.y) * 0.34 * delta;
            body.vx *= 0.64;
            body.vy *= 0.64;
            body.va +=
              (body.pointerX - body.lastPointerX) * 0.0015;
          } else {
            body.vx +=
              (body.homeX - body.x) * 0.0011 * delta;
            body.vy +=
              (body.homeY - body.y) * 0.0011 * delta;

            if (!reducedMotion) {
              body.vx +=
                Math.sin(idleTime + index * 1.7) * 0.012;
              body.vy +=
                Math.cos(idleTime * 0.9 + index) * 0.01;
              body.va +=
                Math.sin(idleTime * 0.7 + index) * 0.0008;
            }

            body.vx *= 0.985;
            body.vy *= 0.985;
            body.va *= 0.95;
          }

          body.x += body.vx * delta;
          body.y += body.vy * delta;
          body.angle += body.va * delta;
          body.angle +=
            (body.baseAngle - body.angle) * 0.012 * delta;

          keepInBounds(body);
        }
      );

      resolveCollisions();

      bodies.forEach(
        (body) => {
          keepInBounds(body);
          render(body);
        }
      );

      frameId = window.requestAnimationFrame(
        tick
      );
    };

    const start = () => {
      if (isRunning) return;

      isRunning = true;
      lastTime = performance.now();
      frameId = window.requestAnimationFrame(
        tick
      );
    };

    const stop = () => {
      isRunning = false;
      window.cancelAnimationFrame(
        frameId
      );
    };

    const getBody = (element) =>
      bodies.find(
        (body) => body.element === element
      );

    const updatePointer = (event, body) => {
      const rect = field.getBoundingClientRect();

      body.lastPointerX = body.pointerX;
      body.lastPointerY = body.pointerY;
      body.pointerX = clamp(
        event.clientX - rect.left,
        0,
        bounds.width
      );
      body.pointerY = clamp(
        event.clientY - rect.top,
        0,
        bounds.height
      );
    };

    capsules.forEach(
      (capsule) => {
        capsule.addEventListener(
          "pointerdown",
          (event) => {
            if (
              event.pointerType === "touch" ||
              !window.matchMedia("(pointer: fine)").matches
            ) {
              return;
            }

            const body = getBody(capsule);

            if (!body) return;

            activeBody = body;
            body.isDragging = true;
            body.element.classList.add(
              "is-dragging"
            );
            updatePointer(event, body);
            body.lastPointerX = body.pointerX;
            body.lastPointerY = body.pointerY;
            capsule.setPointerCapture(
              event.pointerId
            );
            start();
          }
        );

        capsule.addEventListener(
          "pointermove",
          (event) => {
            if (
              !activeBody ||
              activeBody.element !== capsule
            ) {
              return;
            }

            updatePointer(
              event,
              activeBody
            );
          }
        );

        capsule.addEventListener(
          "pointerup",
          () => {
            if (
              !activeBody ||
              activeBody.element !== capsule
            ) {
              return;
            }

            activeBody.isDragging = false;
            activeBody.vx +=
              (activeBody.pointerX - activeBody.lastPointerX) * 0.18;
            activeBody.vy +=
              (activeBody.pointerY - activeBody.lastPointerY) * 0.18;
            activeBody.element.classList.remove(
              "is-dragging"
            );
            activeBody = null;
          }
        );

        capsule.addEventListener(
          "pointercancel",
          () => {
            if (
              !activeBody ||
              activeBody.element !== capsule
            ) {
              return;
            }

            activeBody.isDragging = false;
            activeBody.element.classList.remove(
              "is-dragging"
            );
            activeBody = null;
          }
        );
      }
    );

    measure();

    if (
      "IntersectionObserver" in window
    ) {
      const observer =
        new IntersectionObserver(
          (entries) => {
            entries.forEach(
              (entry) => {
                if (entry.isIntersecting) {
                  start();
                } else {
                  stop();
                }
              }
            );
          },
          {
            rootMargin: "180px 0px"
          }
        );

      observer.observe(field);
    } else {
      start();
    }

    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(
          resizeTimer
        );

        resizeTimer = window.setTimeout(
          () => {
            measure();
            start();
          },
          160
        );
      }
    );
  };


  const initScrollMotion = () => {
    if (
      !canUseScrollEffects() ||
      typeof window.gsap ===
        "undefined" ||
      typeof window.ScrollTrigger ===
        "undefined"
    ) {
      return;
    }

    window.gsap.registerPlugin(
      window.ScrollTrigger
    );


    qsa(
      ".team-card"
    ).forEach((card) => {
      const image =
        qs("img", card);

      if (!image) return;

      window.gsap.fromTo(
        image,
        {
          yPercent: -3
        },
        {
          yPercent: 3,

          ease: "none",

          scrollTrigger: {
            trigger: card,
            start:
              "top bottom",
            end:
              "bottom top",
            scrub: 0.65
          }
        }
      );
    });
  };


  const initMagneticButtons = () => {
    if (
      reducedMotion ||
      !window.matchMedia(
        "(pointer: fine)"
      ).matches
    ) {
      return;
    }

    const buttons = qsa(
      ".home-cta__button"
    );

    buttons.forEach((button) => {
      button.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            button.getBoundingClientRect();

          const x =
            event.clientX -
            rect.left -
            rect.width / 2;

          const y =
            event.clientY -
            rect.top -
            rect.height / 2;

          button.style.transform =
            `translate3d(${x * 0.12}px, ${y * 0.12}px, 0)`;
        }
      );

      button.addEventListener(
        "pointerleave",
        () => {
          button.style.transform =
            "";
        }
      );
    });
  };


  const initVisibilityControl = () => {
    doc.addEventListener(
      "visibilitychange",
      () => {
        qsa(
          ".marquee__track"
        ).forEach((track) => {
          track.style.animationPlayState =
            doc.hidden
              ? "paused"
              : "";
        });
      }
    );
  };


  const init = () => {
    initServicesSwiper();

    initTestimonialsSwiper();

    initCases();

    initAboutTabs();

    initHeroEntrance();
    initHeroScroll();

    initProcess();

    initPerformanceSystem();

    initScrollMotion();

    initMagneticButtons();

    initVisibilityControl();
  };


  if (
    doc.readyState ===
    "loading"
  ) {
    doc.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }
})();
