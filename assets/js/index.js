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
          slidesPerView: 2,
          spaceBetween: 16
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


  const initCounters = () => {
    const counters = qsa(
      "[data-count]"
    );

    if (!counters.length) return;

    const setFinalValue = (element) => {
      const value =
        Number(element.dataset.count) || 0;

      const decimals =
        Number(
          element.dataset.decimals
        ) || 0;

      const prefix =
        element.dataset.prefix || "";

      const suffix =
        element.dataset.suffix || "";

      element.textContent =
        `${prefix}${value.toFixed(decimals)}${suffix}`;
    };

    if (
      reducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      counters.forEach(setFinalValue);
      return;
    }

    const animate = (element) => {
      if (
        element.dataset.countDone === "true"
      ) {
        return;
      }

      element.dataset.countDone = "true";

      const finalValue =
        Number(element.dataset.count) || 0;

      const decimals =
        Number(
          element.dataset.decimals
        ) || 0;

      const prefix =
        element.dataset.prefix || "";

      const suffix =
        element.dataset.suffix || "";

      const duration =
        Number(
          element.dataset.duration
        ) || 1250;

      const start =
        performance.now();

      const update = (time) => {
        const progress =
          Math.min(
            (time - start) /
              duration,
            1
          );

        const eased =
          1 -
          Math.pow(
            1 - progress,
            4
          );

        const current =
          finalValue * eased;

        element.textContent =
          `${prefix}${current.toFixed(decimals)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(
            update
          );
        } else {
          setFinalValue(element);
        }
      };

      requestAnimationFrame(update);
    };

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              animate(entry.target);

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.35
        }
      );

    counters.forEach((element) => {
      observer.observe(element);
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
      reducedMotion ||
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


  const initVideo = () => {
    const section = qs(".home-video");

    if (!section) return;

    const button = qs(
      ".home-video__play",
      section
    );

    const video = qs(
      "video",
      section
    );

    if (!button || !video) {
      return;
    }

    const updateState = () => {
      const playing =
        !video.paused;

      button.classList.toggle(
        "is-playing",
        playing
      );

      button.setAttribute(
        "aria-label",
        playing
          ? "Pause video"
          : "Play video"
      );
    };

    button.addEventListener(
      "click",
      async () => {
        if (video.paused) {
          try {
            await video.play();
          } catch (error) {
            return;
          }
        } else {
          video.pause();
        }

        updateState();
      }
    );

    video.addEventListener(
      "play",
      updateState
    );

    video.addEventListener(
      "pause",
      updateState
    );

    video.addEventListener(
      "ended",
      updateState
    );
  };


  const initProcess = () => {
    const section = qs(
      ".home-process"
    );

    if (!section) return;

    const items = qsa(
      ".home-process__item",
      section
    );

    if (!items.length) return;

    items.forEach(
      (item, index) => {
        item.style.setProperty(
          "--process-index",
          index
        );
      }
    );
  };


  const initScrollMotion = () => {
    if (
      reducedMotion ||
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
      ".home-about__media img"
    ).forEach((image) => {
      window.gsap.fromTo(
        image,
        {
          scale: 1.07
        },
        {
          scale: 1,

          ease: "none",

          scrollTrigger: {
            trigger:
              image.parentElement,

            start:
              "top bottom",

            end:
              "bottom top",

            scrub: 0.6
          }
        }
      );
    });


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


  const refreshMotion = () => {
    window.addEventListener(
      "load",
      () => {
        if (
          typeof window.ScrollTrigger !==
          "undefined"
        ) {
          window.ScrollTrigger.refresh();
        }

        if (
          typeof window.AOS !==
          "undefined"
        ) {
          window.AOS.refresh();
        }
      },
      {
        once: true
      }
    );
  };


  const init = () => {
    initServicesSwiper();

    initTestimonialsSwiper();

    initCases();

    initCounters();

    initHeroEntrance();
    initHeroScroll();

    initVideo();
    initProcess();

    initScrollMotion();

    initMagneticButtons();

    initVisibilityControl();

    refreshMotion();
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
