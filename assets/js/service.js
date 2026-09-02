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

  const finePointer = window.matchMedia(
    "(pointer: fine)"
  ).matches;


  const initPlatformTabs = () => {
    const sections = qsa(".service-platforms");

    if (!sections.length) return;

    sections.forEach((section) => {
      const tabs = qsa(
        ".service-platforms__tab",
        section
      );

      const panels = qsa(
        ".service-platforms__panel",
        section
      );

      if (!tabs.length || !panels.length) {
        return;
      }

      const activate = (index) => {
        tabs.forEach((tab, tabIndex) => {
          const active = tabIndex === index;

          tab.classList.toggle(
            "is-active",
            active
          );

          tab.setAttribute(
            "aria-selected",
            String(active)
          );

          tab.setAttribute(
            "tabindex",
            active ? "0" : "-1"
          );
        });

        panels.forEach((panel, panelIndex) => {
          const active = panelIndex === index;

          panel.classList.toggle(
            "is-active",
            active
          );

          panel.setAttribute(
            "aria-hidden",
            String(!active)
          );
        });
      };

      tabs.forEach((tab, index) => {
        tab.setAttribute(
          "role",
          "tab"
        );

        tab.addEventListener(
          "click",
          () => {
            activate(index);
          }
        );

        tab.addEventListener(
          "keydown",
          (event) => {
            if (
              event.key !== "ArrowRight" &&
              event.key !== "ArrowLeft"
            ) {
              return;
            }

            event.preventDefault();

            const direction =
              event.key === "ArrowRight"
                ? 1
                : -1;

            let nextIndex =
              index + direction;

            if (nextIndex < 0) {
              nextIndex =
                tabs.length - 1;
            }

            if (
              nextIndex >=
              tabs.length
            ) {
              nextIndex = 0;
            }

            activate(nextIndex);

            tabs[nextIndex]?.focus();
          }
        );
      });

      const initialIndex = Math.max(
        0,
        tabs.findIndex((tab) =>
          tab.classList.contains(
            "is-active"
          )
        )
      );

      activate(initialIndex);
    });
  };


  const initCasesSwiper = () => {
    const slider = qs(
      ".service-cases__slider"
    );

    if (
      !slider ||
      typeof window.Swiper ===
        "undefined"
    ) {
      return;
    }

    const slides = duplicateSlidesForLoop(slider, 4);

    if (!slides.length) return;

    const next = qs(
      ".service-cases__next"
    );

    const prev = qs(
      ".service-cases__prev"
    );

    new window.Swiper(slider, {
      slidesPerView: 1,
      spaceBetween: 18,

      speed: 760,

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
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
    });
  };


  const initCounters = () => {
    const counters = qsa(
      "[data-count]"
    );

    if (!counters.length) return;

    const setValue = (
      element,
      value
    ) => {
      const decimals =
        Number(
          element.dataset.decimals
        ) || 0;

      const prefix =
        element.dataset.prefix || "";

      const suffix =
        element.dataset.suffix || "";

      element.textContent =
        `${prefix}${Number(value).toFixed(decimals)}${suffix}`;
    };

    if (
      reducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      counters.forEach((element) => {
        setValue(
          element,
          Number(
            element.dataset.count
          ) || 0
        );
      });

      return;
    }

    const animateCounter = (
      element
    ) => {
      if (
        element.dataset.countDone ===
        "true"
      ) {
        return;
      }

      element.dataset.countDone =
        "true";

      const target =
        Number(
          element.dataset.count
        ) || 0;

      const duration =
        Number(
          element.dataset.duration
        ) || 1300;

      const startTime =
        performance.now();

      const render = (
        currentTime
      ) => {
        const progress =
          Math.min(
            (currentTime -
              startTime) /
              duration,
            1
          );

        const eased =
          1 -
          Math.pow(
            1 - progress,
            4
          );

        setValue(
          element,
          target * eased
        );

        if (progress < 1) {
          requestAnimationFrame(
            render
          );
        } else {
          setValue(
            element,
            target
          );
        }
      };

      requestAnimationFrame(
        render
      );
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

              animateCounter(
                entry.target
              );

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.3
        }
      );

    counters.forEach(
      (counter) => {
        observer.observe(counter);
      }
    );
  };


  const initHeroEntrance = () => {
    const hero = qs(
      ".service-hero"
    );

    if (
      !hero ||
      reducedMotion ||
      typeof window.gsap ===
        "undefined"
    ) {
      return;
    }

    const label = qs(
      ".service-hero__label",
      hero
    );

    const title = qs(
      ".service-hero__title",
      hero
    );

    const text = qs(
      ".service-hero__text",
      hero
    );

    const actions = qs(
      ".service-hero__actions",
      hero
    );

    const meta = qs(
      ".service-hero__meta",
      hero
    );

    const visual = qs(
      ".service-hero__visual",
      hero
    );

    const metric = qs(
      ".service-hero__metric",
      hero
    );

    const mark = qs(
      ".service-hero__mark",
      hero
    );

    const copyElements = [
      label,
      text,
      actions,
      meta
    ].filter(Boolean);

    if (title) {
      window.gsap.set(title, {
        y: 42,
        opacity: 0
      });
    }

    if (copyElements.length) {
      window.gsap.set(
        copyElements,
        {
          y: 22,
          opacity: 0
        }
      );
    }

    if (visual) {
      window.gsap.set(
        visual,
        {
          x: 34,
          opacity: 0,
          scale: 0.97
        }
      );
    }

    if (metric) {
      window.gsap.set(
        metric,
        {
          y: 28,
          opacity: 0
        }
      );
    }

    if (mark) {
      window.gsap.set(
        mark,
        {
          scale: 0.75,
          rotation: -26,
          opacity: 0
        }
      );
    }

    const timeline =
      window.gsap.timeline({
        defaults: {
          ease: "power3.out"
        }
      });

    if (label) {
      timeline.to(
        label,
        {
          y: 0,
          opacity: 1,
          duration: 0.55
        },
        0.08
      );
    }

    if (title) {
      timeline.to(
        title,
        {
          y: 0,
          opacity: 1,
          duration: 0.9
        },
        0.16
      );
    }

    if (visual) {
      timeline.to(
        visual,
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 1
        },
        0.22
      );
    }

    if (
      copyElements.length
    ) {
      timeline.to(
        copyElements.filter(
          (element) =>
            element !== label
        ),
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.07
        },
        0.5
      );
    }

    if (metric) {
      timeline.to(
        metric,
        {
          y: 0,
          opacity: 1,
          duration: 0.65
        },
        0.62
      );
    }

    if (mark) {
      timeline.to(
        mark,
        {
          scale: 1,
          rotation: -16,
          opacity: 1,
          duration: 0.75
        },
        0.5
      );
    }
  };


  const initHeroPointerMotion =
    () => {
      if (
        reducedMotion ||
        !finePointer
      ) {
        return;
      }

      const hero = qs(
        ".service-hero"
      );

      if (!hero) return;

      const mark = qs(
        ".service-hero__mark",
        hero
      );

      const metric = qs(
        ".service-hero__metric",
        hero
      );

      if (!mark && !metric) {
        return;
      }

      let frame = null;

      let targetX = 0;
      let targetY = 0;

      let currentX = 0;
      let currentY = 0;

      const render = () => {
        currentX +=
          (targetX - currentX) *
          0.08;

        currentY +=
          (targetY - currentY) *
          0.08;

        if (mark) {
          mark.style.transform =
            `translate3d(${currentX}px, ${currentY}px, 0) rotate(-16deg)`;
        }

        if (metric) {
          metric.style.transform =
            `translate3d(${currentX * -0.35}px, ${currentY * -0.35}px, 0)`;
        }

        const difference =
          Math.abs(
            targetX - currentX
          ) +
          Math.abs(
            targetY - currentY
          );

        if (difference > 0.05) {
          frame =
            requestAnimationFrame(
              render
            );
        } else {
          frame = null;
        }
      };

      const requestRender =
        () => {
          if (frame) return;

          frame =
            requestAnimationFrame(
              render
            );
        };

      hero.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            hero.getBoundingClientRect();

          const x =
            (
              event.clientX -
              rect.left
            ) /
              rect.width -
            0.5;

          const y =
            (
              event.clientY -
              rect.top
            ) /
              rect.height -
            0.5;

          targetX = x * 18;
          targetY = y * 14;

          requestRender();
        }
      );

      hero.addEventListener(
        "pointerleave",
        () => {
          targetX = 0;
          targetY = 0;

          requestRender();
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


    const hero = qs(
      ".service-hero"
    );

    const heroMedia = qs(
      ".service-hero__media img",
      hero
    );

    if (hero && heroMedia) {
      window.gsap.to(
        heroMedia,
        {
          yPercent: 7,

          ease: "none",

          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 0.65
          }
        }
      );
    }


    qsa(
      ".service-strategy__media"
    ).forEach((media) => {
      const image =
        qs("img", media);

      if (!image) return;

      window.gsap.fromTo(
        image,
        {
          yPercent: -5
        },
        {
          yPercent: 5,

          ease: "none",

          scrollTrigger: {
            trigger: media,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7
          }
        }
      );
    });


    qsa(
      ".service-case__media"
    ).forEach((media) => {
      const image =
        qs("img", media);

      if (!image) return;

      window.gsap.fromTo(
        image,
        {
          scale: 1.05
        },
        {
          scale: 1,

          ease: "none",

          scrollTrigger: {
            trigger: media,
            start:
              "top bottom",
            end:
              "bottom top",
            scrub: 0.6
          }
        }
      );
    });
  };


  const initFlowMotion = () => {
    const sections = qsa(
      ".service-flow"
    );

    if (!sections.length) {
      return;
    }

    sections.forEach(
      (section) => {
        const cards = qsa(
          ".service-flow__step",
          section
        );

        if (!cards.length) {
          return;
        }

        if (
          reducedMotion ||
          typeof window.gsap ===
            "undefined" ||
          typeof window.ScrollTrigger ===
            "undefined"
        ) {
          return;
        }

        window.gsap.from(
          cards,
          {
            y: 32,
            opacity: 0,

            duration: 0.7,
            stagger: 0.09,

            ease: "power3.out",

            scrollTrigger: {
              trigger: section,
              start:
                "top 78%",

              once: true
            }
          }
        );
      }
    );
  };


  const initProcessMotion = () => {
    const sections = qsa(
      ".service-process"
    );

    if (!sections.length) {
      return;
    }

    sections.forEach(
      (section) => {
        const cards = qsa(
          ".service-process__card",
          section
        );

        if (!cards.length) {
          return;
        }

        cards.forEach(
          (card, index) => {
            card.style.setProperty(
              "--process-index",
              index
            );
          }
        );

        if (
          reducedMotion ||
          typeof window.gsap ===
            "undefined" ||
          typeof window.ScrollTrigger ===
            "undefined"
        ) {
          return;
        }

        window.gsap.from(
          cards,
          {
            y: 26,
            opacity: 0,

            duration: 0.62,
            stagger: 0.075,

            ease:
              "power3.out",

            scrollTrigger: {
              trigger: section,
              start:
                "top 80%",

              once: true
            }
          }
        );
      }
    );
  };


  const initCapabilityMotion =
    () => {
      const sections = qsa(
        ".service-capabilities"
      );

      if (
        !sections.length ||
        reducedMotion ||
        typeof window.gsap ===
          "undefined" ||
        typeof window.ScrollTrigger ===
          "undefined"
      ) {
        return;
      }

      sections.forEach(
        (section) => {
          const cards = qsa(
            ".capability-card",
            section
          );

          if (!cards.length) {
            return;
          }

          window.gsap.from(
            cards,
            {
              y: 28,
              opacity: 0,

              duration: 0.7,

              stagger: 0.08,

              ease:
                "power3.out",

              scrollTrigger: {
                trigger: section,

                start:
                  "top 80%",

                once: true
              }
            }
          );
        }
      );
    };


  const initDashboardMotion =
    () => {
      const sections = qsa(
        ".service-dashboard"
      );

      if (
        !sections.length ||
        reducedMotion ||
        typeof window.gsap ===
          "undefined" ||
        typeof window.ScrollTrigger ===
          "undefined"
      ) {
        return;
      }

      sections.forEach(
        (section) => {
          const metrics = qsa(
            ".service-dashboard__metric",
            section
          );

          const sideCards =
            qsa(
              ".service-dashboard__side-card",
              section
            );

          if (metrics.length) {
            window.gsap.from(
              metrics,
              {
                y: 20,
                opacity: 0,

                duration: 0.6,
                stagger: 0.08,

                ease:
                  "power3.out",

                scrollTrigger: {
                  trigger:
                    section,

                  start:
                    "top 78%",

                  once: true
                }
              }
            );
          }

          if (
            sideCards.length
          ) {
            window.gsap.from(
              sideCards,
              {
                x: 24,
                opacity: 0,

                duration: 0.65,
                stagger: 0.1,

                ease:
                  "power3.out",

                scrollTrigger: {
                  trigger:
                    section,

                  start:
                    "top 78%",

                  once: true
                }
              }
            );
          }
        }
      );
    };


  const initBenefitsMotion =
    () => {
      const sections = qsa(
        ".service-benefits"
      );

      if (!sections.length) {
        return;
      }

      sections.forEach(
        (section) => {
          const items = qsa(
            ".service-benefits__item",
            section
          );

          if (!items.length) {
            return;
          }

          if (
            reducedMotion ||
            typeof window.gsap ===
              "undefined" ||
            typeof window.ScrollTrigger ===
              "undefined"
          ) {
            return;
          }

          window.gsap.from(
            items,
            {
              x: 22,
              opacity: 0,

              duration: 0.58,
              stagger: 0.07,

              ease:
                "power3.out",

              scrollTrigger: {
                trigger:
                  section,

                start:
                  "top 80%",

                once: true
              }
            }
          );
        }
      );
    };


  const initMagneticCTA = () => {
    if (
      reducedMotion ||
      !finePointer
    ) {
      return;
    }

    qsa(
      ".service-cta__action"
    ).forEach((button) => {
      let frame = null;

      let x = 0;
      let y = 0;

      let currentX = 0;
      let currentY = 0;

      const render = () => {
        currentX +=
          (x - currentX) *
          0.12;

        currentY +=
          (y - currentY) *
          0.12;

        button.style.transform =
          `translate3d(${currentX}px, ${currentY}px, 0)`;

        const difference =
          Math.abs(
            x - currentX
          ) +
          Math.abs(
            y - currentY
          );

        if (difference > 0.05) {
          frame =
            requestAnimationFrame(
              render
            );
        } else {
          frame = null;
        }
      };

      const requestRender =
        () => {
          if (frame) return;

          frame =
            requestAnimationFrame(
              render
            );
        };

      button.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            button.getBoundingClientRect();

          x =
            (
              event.clientX -
              rect.left -
              rect.width / 2
            ) * 0.12;

          y =
            (
              event.clientY -
              rect.top -
              rect.height / 2
            ) * 0.12;

          requestRender();
        }
      );

      button.addEventListener(
        "pointerleave",
        () => {
          x = 0;
          y = 0;

          requestRender();
        }
      );
    });
  };


  const initPerformanceHover =
    () => {
      if (
        !finePointer ||
        reducedMotion
      ) {
        return;
      }

      qsa(
        ".service-performance__item"
      ).forEach((item) => {
        item.addEventListener(
          "pointerenter",
          () => {
            item.style.transform =
              "translateY(-4px)";
          }
        );

        item.addEventListener(
          "pointerleave",
          () => {
            item.style.transform =
              "";
          }
        );
      });
    };


  const initRefresh = () => {
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
    initPlatformTabs();

    initCasesSwiper();

    initCounters();

    initHeroEntrance();
    initHeroPointerMotion();

    initScrollMotion();

    initFlowMotion();
    initProcessMotion();
    initCapabilityMotion();
    initDashboardMotion();
    initBenefitsMotion();

    initMagneticCTA();
    initPerformanceHover();

    initRefresh();
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
