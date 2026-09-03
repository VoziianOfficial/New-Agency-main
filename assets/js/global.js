(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;

  root.classList.remove("no-js");
  root.classList.add("js");


  const qs = (selector, context = doc) =>
    context ? context.querySelector(selector) : null;

  const qsa = (selector, context = doc) =>
    context ? Array.from(context.querySelectorAll(selector)) : [];

  const config = window.SiteConfig || {};

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const canUseScrollEffects = () =>
    !prefersReducedMotion &&
    window.matchMedia("(min-width: 992px)").matches &&
    window.matchMedia("(pointer: fine)").matches;

  let motionRefreshFrame = null;
  let motionRefreshTimer = null;

  const refreshAnimationEngines = (
    { hardAOS = false } = {}
  ) => {
    if (prefersReducedMotion) {
      return;
    }

    window.clearTimeout(motionRefreshTimer);

    motionRefreshTimer =
      window.setTimeout(() => {
        if (motionRefreshFrame) {
          window.cancelAnimationFrame(
            motionRefreshFrame
          );
        }

        motionRefreshFrame =
          window.requestAnimationFrame(() => {
            motionRefreshFrame = null;

            if (
              typeof window.AOS !==
                "undefined"
            ) {
              if (
                hardAOS &&
                typeof window.AOS
                  .refreshHard ===
                  "function"
              ) {
                window.AOS.refreshHard();
              } else {
                window.AOS.refresh();
              }
            }

            if (
              typeof window.ScrollTrigger !==
              "undefined"
            ) {
              window.ScrollTrigger.refresh();
            }
          });
      }, 80);
  };

  const escapeHTML = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const replaceConfigTokens = (value = "") =>
    String(value).replace(
      /\{companyName\}/g,
      config.companyName || ""
    );


  const applySiteConfig = () => {
    qsa("[data-config]").forEach((element) => {
      const key = element.dataset.config;

      if (!key) return;
      if (!(key in config)) return;

      element.textContent = replaceConfigTokens(config[key]);
    });


    qsa("[data-config-logo]").forEach((image) => {
      if (!config.logo) return;

      image.src = config.logo;

      if (!image.hasAttribute("alt")) {
        image.alt = "";
      }
    });


    qsa("[data-config-brand-mark]").forEach((image) => {
      if (!config.brandMark) return;

      image.src = config.brandMark;

      if (!image.hasAttribute("alt")) {
        image.alt = "";
      }
    });


    qsa("[data-config-disclaimer]").forEach((element) => {
      element.textContent = replaceConfigTokens(
        config.disclaimer || ""
      );
    });


    qsa("[data-config-email]").forEach((element) => {
      if (!config.email) return;

      element.textContent = config.email;
    });


    qsa("[data-config-email-link]").forEach((element) => {
      if (!config.email) return;

      element.href = `mailto:${config.email}`;
      element.textContent = config.email;
    });


    qsa("[data-config-primary-cta]").forEach((element) => {
      if (config.primaryCTA) {
        element.textContent = config.primaryCTA;
      }
    });

    qsa("[data-config-secondary-cta]").forEach((element) => {
      if (config.secondaryCTA) {
        element.textContent = config.secondaryCTA;
      }
    });


    qsa("[data-company-aria]").forEach((element) => {
      const template =
        element.dataset.companyAria ||
        "{companyName}";

      element.setAttribute(
        "aria-label",
        replaceConfigTokens(template)
      );
    });


    const pageKey =
      doc.body?.dataset.pageKey || "";

    const configuredPageTitle =
      pageKey && config.pageTitles
        ? config.pageTitles[pageKey]
        : "";

    const explicitPageTitle =
      configuredPageTitle ||
      doc.body?.dataset.pageTitle ||
      "";

    if (explicitPageTitle) {
      doc.title = replaceConfigTokens(
        explicitPageTitle
      );
    } else if (config.browserTitle) {
      doc.title = replaceConfigTokens(
        config.browserTitle
      );
    }


    qsa("[data-config-favicon]").forEach((link) => {
      if (!config.favicon) return;

      link.href = config.favicon;

      if (link.rel === "icon") {
        link.type = config.favicon.endsWith(".svg")
          ? "image/svg+xml"
          : "image/png";
      }
    });


    if (config.favicon) {
      let favicon =
        qs("[data-config-favicon]") ||
        qs('link[rel="icon"]');

      if (!favicon) {
        favicon = doc.createElement("link");
        favicon.rel = "icon";
        favicon.setAttribute(
          "data-config-favicon",
          ""
        );

        doc.head.appendChild(favicon);
      }

      favicon.type = config.favicon.endsWith(".svg")
        ? "image/svg+xml"
        : "image/png";
      favicon.href = config.favicon;
    }
  };


  const initHeader = () => {
    const header = qs(".site-header");

    if (!header) return;

    let ticking = false;
    let fixed = false;

    const updateHeader = () => {
      const shouldFix = window.scrollY > 260;

      if (shouldFix !== fixed) {
        fixed = shouldFix;

        header.classList.toggle(
          "is-fixed",
          shouldFix
        );
      }

      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(
        updateHeader
      );
    };

    updateHeader();

    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );
  };

  const initServicesDropdown = () => {
    const items = qsa(
      ".main-nav__item--dropdown"
    );

    if (!items.length) return;

    const closeAll = (except = null) => {
      items.forEach((item) => {
        if (item === except) return;

        item.classList.remove("is-open");

        qs(
          "[data-services-dropdown-toggle]",
          item
        )?.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    };

    items.forEach((item) => {
      const toggle = qs(
        "[data-services-dropdown-toggle]",
        item
      );

      if (!toggle) return;

      toggle.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          const shouldOpen =
            !item.classList.contains("is-open");

          closeAll(item);

          item.classList.toggle(
            "is-open",
            shouldOpen
          );

          toggle.setAttribute(
            "aria-expanded",
            String(shouldOpen)
          );
        }
      );
    });

    doc.addEventListener(
      "click",
      (event) => {
        if (
          event.target.closest(
            ".main-nav__item--dropdown"
          )
        ) {
          return;
        }

        closeAll();
      }
    );

    doc.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;

        closeAll();
      }
    );
  };


  const initMenu = () => {
    const panel = qs(".menu-panel");

    if (!panel) return;

    const openButtons = qsa(
      "[data-menu-open]"
    );

    const closeButtons = qsa(
      "[data-menu-close]",
      panel
    );

    let lastFocusedElement = null;
    let menuScrollY = 0;

    const getFocusableElements = () =>
      qsa(
        [
          "a[href]",
          "button:not([disabled])",
          "input:not([disabled])",
          "textarea:not([disabled])",
          "select:not([disabled])",
          '[tabindex]:not([tabindex="-1"])'
        ].join(","),
        panel
      ).filter(
        (element) =>
          element.offsetParent !== null
      );

    const openMenu = () => {
      if (panel.classList.contains("is-open")) {
        return;
      }

      lastFocusedElement =
        doc.activeElement;

      menuScrollY = window.scrollY;

      panel.classList.add("is-open");
      panel.setAttribute(
        "aria-hidden",
        "false"
      );

      body.classList.add("menu-open");
      body.style.position = "fixed";
      body.style.top = `-${menuScrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";

      openButtons.forEach((button) => {
        button.setAttribute(
          "aria-expanded",
          "true"
        );
      });

      window.setTimeout(() => {
        const focusable =
          getFocusableElements();

        focusable[0]?.focus();
      }, 80);
    };

    const closeMenu = (
      { restoreFocus = true } = {}
    ) => {
      if (!panel.classList.contains("is-open")) {
        return;
      }

      const restoreScrollY = menuScrollY;
      const previousScrollBehavior =
        root.style.scrollBehavior;

      if (panel.contains(doc.activeElement)) {
        doc.activeElement.blur();
      }

      root.style.scrollBehavior = "auto";

      panel.classList.remove("is-open");
      panel.setAttribute(
        "aria-hidden",
        "true"
      );

      body.classList.remove("menu-open");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";

      window.scrollTo({
        left: 0,
        top: restoreScrollY,
        behavior: "auto"
      });

      window.requestAnimationFrame(() => {
        root.style.scrollBehavior =
          previousScrollBehavior;
      });

      openButtons.forEach((button) => {
        button.setAttribute(
          "aria-expanded",
          "false"
        );
      });

      if (
        restoreFocus &&
        lastFocusedElement &&
        typeof lastFocusedElement.focus ===
          "function"
      ) {
        window.setTimeout(() => {
          lastFocusedElement.focus({
            preventScroll: true
          });

          window.scrollTo({
            left: 0,
            top: restoreScrollY,
            behavior: "auto"
          });
        }, 60);
      }
    };

    openButtons.forEach((button) => {
      button.addEventListener(
        "click",
        openMenu
      );
    });

    closeButtons.forEach((button) => {
      button.addEventListener(
        "click",
        closeMenu
      );
    });


    qsa("a[href]", panel).forEach(
      (link) => {
        link.addEventListener(
          "click",
          () => {
            closeMenu({
              restoreFocus: false
            });
          }
        );
      }
    );


    doc.addEventListener(
      "keydown",
      (event) => {
        if (
          !panel.classList.contains(
            "is-open"
          )
        ) {
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeMenu();

          return;
        }

        if (event.key !== "Tab") {
          return;
        }

        const focusable =
          getFocusableElements();

        if (!focusable.length) {
          return;
        }

        const first =
          focusable[0];

        const last =
          focusable[
            focusable.length - 1
          ];

        if (
          event.shiftKey &&
          doc.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          doc.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    );
  };


  const initSearch = () => {
    const modal = qs(".search");

    if (!modal) return;

    const input = qs(
      ".search__input",
      modal
    );

    const results = qs(
      ".search__results",
      modal
    );

    const openButtons = qsa(
      "[data-search-open]"
    );

    const closeButtons = qsa(
      "[data-search-close]",
      modal
    );

    const pages = [
      {
        title: "Home",
        description:
          "Performance marketing agency",
        url: "index.html"
      },

      {
        title: "About",
        description:
          "About our performance approach",
        url: "index.html#about"
      },

      {
        title:
          config.services?.googleAds
            ?.title ||
          "Google Ads Management",
        description:
          "Search, Performance Max, Shopping and campaign management",
        url:
          config.services?.googleAds
            ?.url ||
          "google-ads-management.html"
      },

      {
        title:
          config.services
            ?.leadGeneration?.title ||
          "Lead Generation",
        description:
          "Qualified leads and customer acquisition",
        url:
          config.services
            ?.leadGeneration?.url ||
          "lead-generation.html"
      },

      {
        title:
          config.services?.ecommerce
            ?.title ||
          "E-commerce Advertising",
        description:
          "Shopping, PMax and revenue optimisation",
        url:
          config.services?.ecommerce
            ?.url ||
          "ecommerce-advertising.html"
      },

      {
        title:
          config.services
            ?.trackingAutomation
            ?.title ||
          "Tracking & Automation",
        description:
          "Analytics, conversion tracking and automation",
        url:
          config.services
            ?.trackingAutomation?.url ||
          "tracking-automation.html"
      },

      {
        title:
          config.primaryCTA ||
          "Free Google Ads Audit",
        description:
          "Request an account review",
        url: "index.html#contact"
      },

      {
        title:
          config.legal?.privacy
            ?.title ||
          "Privacy Policy",
        description:
          "Privacy information",
        url:
          config.legal?.privacy?.url ||
          "privacy.html"
      },

      {
        title:
          config.legal?.terms
            ?.title ||
          "Terms & Conditions",
        description:
          "Website terms",
        url:
          config.legal?.terms?.url ||
          "terms.html"
      },

      {
        title:
          config.legal?.cookies
            ?.title ||
          "Cookie Policy",
        description:
          "Cookie information",
        url:
          config.legal?.cookies?.url ||
          "cookies.html"
      }
    ];

    let lastFocusedElement = null;

    const renderResults = (
      searchValue = ""
    ) => {
      if (!results) return;

      const query = searchValue
        .trim()
        .toLowerCase();

      if (!query) {
        results.innerHTML = "";

        return;
      }

      const matches = pages.filter(
        (item) => {
          const haystack =
            `${item.title} ${item.description}`
              .toLowerCase();

          return haystack.includes(query);
        }
      );

      if (!matches.length) {
        results.innerHTML = `
          <div class="search-result">
            <span>No matching pages found.</span>
          </div>
        `;

        return;
      }

      results.innerHTML = matches
        .slice(0, 8)
        .map(
          (item) => `
            <a
              class="search-result"
              href="${escapeHTML(item.url)}"
            >
              <span>
                <strong>${escapeHTML(item.title)}</strong>
                <small>${escapeHTML(item.description)}</small>
              </span>
            </a>
          `
        )
        .join("");
    };

    const openSearch = () => {
      lastFocusedElement =
        doc.activeElement;

      modal.classList.add(
        "is-open"
      );

      modal.setAttribute(
        "aria-hidden",
        "false"
      );

      body.classList.add(
        "modal-open"
      );

      window.setTimeout(() => {
        input?.focus();
      }, 70);
    };

    const closeSearch = () => {
      modal.classList.remove(
        "is-open"
      );

      modal.setAttribute(
        "aria-hidden",
        "true"
      );

      body.classList.remove(
        "modal-open"
      );

      if (input) {
        input.value = "";
      }

      if (results) {
        results.innerHTML = "";
      }

      lastFocusedElement?.focus?.();
    };

    openButtons.forEach((button) => {
      button.addEventListener(
        "click",
        openSearch
      );
    });

    closeButtons.forEach((button) => {
      button.addEventListener(
        "click",
        closeSearch
      );
    });

    input?.addEventListener(
      "input",
      () => {
        renderResults(input.value);
      }
    );

    modal.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) {
          closeSearch();
        }
      }
    );

    doc.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          modal.classList.contains(
            "is-open"
          )
        ) {
          closeSearch();
        }
      }
    );
  };


  const initAOS = () => {
    if (
      prefersReducedMotion ||
      typeof window.AOS === "undefined" ||
      !qs("[data-aos]")
    ) {
      return;
    }

    window.AOS.init({
      once: true,
      mirror: false,
      offset: 36,
      duration: 720,
      easing:
        "cubic-bezier(0.22, 1, 0.36, 1)",
      anchorPlacement:
        "top-bottom"
    });

  };


  const initMotionRefresh = () => {
    if (
      typeof window.AOS === "undefined" &&
      typeof window.ScrollTrigger === "undefined"
    ) {
      return;
    }

    window.addEventListener(
      "load",
      () => {
        refreshAnimationEngines({
          hardAOS: true
        });
      },
      { once: true }
    );

    doc.addEventListener(
      "load",
      (event) => {
        if (
          event.target instanceof
            HTMLImageElement ||
          event.target instanceof
            HTMLVideoElement
        ) {
          refreshAnimationEngines();
        }
      },
      true
    );
  };


  const initAccordions = () => {
    const accordions =
      qsa(".accordion");

    accordions.forEach(
      (accordion) => {
        const items = qsa(
          ".accordion__item",
          accordion
        );

        items.forEach(
          (item) => {
            const button = qs(
              ".accordion__button",
              item
            );

            const content = qs(
              ".accordion__content",
              item
            );

            if (!button || !content) {
              return;
            }

            const isOpen =
              item.classList.contains(
                "is-open"
              );

            button.setAttribute(
              "aria-expanded",
              String(isOpen)
            );

            if (!content.id) {
              content.id =
                `accordion-${Math.random()
                  .toString(36)
                  .slice(2, 9)}`;
            }

            button.setAttribute(
              "aria-controls",
              content.id
            );

            button.addEventListener(
              "click",
              () => {
                const currentlyOpen =
                  item.classList.contains(
                    "is-open"
                  );

                if (
                  accordion.hasAttribute(
                    "data-accordion-single"
                  )
                ) {
                  items.forEach(
                    (otherItem) => {
                      if (
                        otherItem === item
                      ) {
                        return;
                      }

                      otherItem.classList.remove(
                        "is-open"
                      );

                      const otherButton =
                        qs(
                          ".accordion__button",
                          otherItem
                        );

                      otherButton?.setAttribute(
                        "aria-expanded",
                        "false"
                      );
                    }
                  );
                }

                item.classList.toggle(
                  "is-open",
                  !currentlyOpen
                );

                button.setAttribute(
                  "aria-expanded",
                  String(
                    !currentlyOpen
                  )
                );
              }
            );
          }
        );
      }
    );
  };


  const initParallax = () => {
    if (!canUseScrollEffects()) {
      return;
    }

    const elements = qsa(
      "[data-parallax]"
    );

    if (!elements.length) {
      return;
    }

    let ticking = false;

    const update = () => {
      const viewportHeight =
        window.innerHeight;

      elements.forEach(
        (element) => {
          const rect =
            element.getBoundingClientRect();

          if (
            rect.bottom < 0 ||
            rect.top >
              viewportHeight
          ) {
            return;
          }

          const speed = Number(
            element.dataset
              .parallaxSpeed || 0.08
          );

          const center =
            rect.top +
            rect.height / 2;

          const viewportCenter =
            viewportHeight / 2;

          const offset =
            (center -
              viewportCenter) *
            speed;

          element.style.transform =
            `translate3d(0, ${offset.toFixed(
              2
            )}px, 0)`;
        }
      );

      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(
        update
      );
    };

    update();

    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestUpdate,
      { passive: true }
    );
  };


  const initRevealObserver = () => {
    const targets = qsa(
      "[data-fade]"
    );

    if (!targets.length) {
      return;
    }

    if (
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      targets.forEach((element) => {
        element.classList.add(
          "is-visible"
        );
      });

      return;
    }

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

              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.14,
          rootMargin:
            "0px 0px -5% 0px"
        }
      );

    targets.forEach((element) => {
      observer.observe(element);
    });
  };


  const initAnchors = () => {
    qsa('a[href*="#"]').forEach(
      (link) => {
        link.addEventListener(
          "click",
          (event) => {
            const href =
              link.getAttribute(
                "href"
              );

            if (
              !href ||
              href === "#" ||
              href.startsWith(
                "javascript:"
              )
            ) {
              return;
            }

            const [
              pathname,
              hash
            ] = href.split("#");

            const currentFile =
              window.location.pathname
                .split("/")
                .pop() ||
              "index.html";

            const linkFile =
              pathname
                ?.split("/")
                .pop() || "";

            const samePage =
              !pathname ||
              pathname === "." ||
              linkFile ===
                currentFile ||
              (
                currentFile === "" &&
                linkFile ===
                  "index.html"
              );

            if (
              !samePage ||
              !hash
            ) {
              return;
            }

            const target =
              doc.getElementById(hash);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
              behavior:
                prefersReducedMotion
                  ? "auto"
                  : "smooth",
              block: "start"
            });

            history.replaceState(
              null,
              "",
              `#${hash}`
            );
          }
        );
      }
    );
  };


  const initCookieConsent = () => {
    const card = qs(
      ".cookie-card"
    );

    if (!card) return;

    const acceptButton = qs(
      "[data-cookie-accept]",
      card
    );

    const closeButton = qs(
      "[data-cookie-close]",
      card
    );

    const storageKey =
      "nova-cookie-consent";

    let alreadyHandled = false;

    try {
      alreadyHandled =
        Boolean(
          localStorage.getItem(
            storageKey
          )
        );
    } catch (error) {
      alreadyHandled = false;
    }

    const hideCard = (
      value = "accepted"
    ) => {
      card.classList.remove(
        "is-visible"
      );

      try {
        localStorage.setItem(
          storageKey,
          value
        );
      } catch (error) {
        }
    };

    if (!alreadyHandled) {
      window.setTimeout(() => {
        card.classList.add(
          "is-visible"
        );
      }, 900);
    }

    acceptButton?.addEventListener(
      "click",
      () => {
        hideCard("accepted");
      }
    );

    closeButton?.addEventListener(
      "click",
      () => {
        hideCard("dismissed");
      }
    );
  };


  const initForms = () => {
    const forms = qsa(
      "form[data-ajax-form]"
    );

    if (!forms.length) {
      return;
    }

    forms.forEach((form) => {
      const message = qs(
        ".form-message",
        form
      );

      const submitButton = qs(
        '[type="submit"]',
        form
      );

      const initialButtonText =
        submitButton?.textContent ||
        "";

      const showMessage = (
        text,
        type
      ) => {
        if (!message) return;

        message.textContent = text;

        message.classList.remove(
          "is-success",
          "is-error"
        );

        message.classList.add(
          "is-visible",
          type === "success"
            ? "is-success"
            : "is-error"
        );
      };

      form.addEventListener(
        "submit",
        async (event) => {
          event.preventDefault();

          if (
            !form.checkValidity()
          ) {
            form.reportValidity();

            return;
          }

          if (submitButton) {
            submitButton.disabled =
              true;

            submitButton.textContent =
              "Sending...";
          }

          message?.classList.remove(
            "is-visible",
            "is-success",
            "is-error"
          );

          try {
            const response =
              await fetch(
                form.action ||
                  "contact.php",
                {
                  method: "POST",
                  body: new FormData(
                    form
                  ),
                  headers: {
                    "X-Requested-With":
                      "XMLHttpRequest"
                  }
                }
              );

            let result = null;

            try {
              result =
                await response.json();
            } catch (error) {
              result = null;
            }

            if (
              !response.ok ||
              result?.success === false
            ) {
              throw new Error(
                result?.message ||
                  "Unable to send your request."
              );
            }

            showMessage(
              result?.message ||
                config.contactSuccessMessage ||
                "Successfully sent!",
              "success"
            );

            form.reset();
          } catch (error) {
            showMessage(
              error?.message ||
                "Something went wrong. Please try again.",
              "error"
            );
          } finally {
            if (submitButton) {
              submitButton.disabled =
                false;

              submitButton.textContent =
                initialButtonText;
            }
          }
        }
      );
    });
  };


  const initActiveNavigation = () => {
    const currentFile =
      window.location.pathname
        .split("/")
        .pop() ||
      "index.html";

    qsa(
      [
        ".main-nav__link",
        ".menu-panel__link",
        ".services-dropdown__link"
      ].join(",")
    ).forEach((link) => {
      const href =
        link.getAttribute("href");

      if (!href) return;

      const linkFile =
        href.split("#")[0]
          .split("/")
          .pop();

      const isHomeLink =
        currentFile ===
          "index.html" &&
        (
          href === "index.html" ||
          href === "./" ||
          href === "/"
        );

      if (
        isHomeLink ||
        (
          linkFile &&
          linkFile === currentFile
        )
      ) {
        link.classList.add(
          "is-active"
        );

        link
          .closest(
            ".main-nav__item--dropdown"
          )
          ?.querySelector(
            "[data-services-dropdown-toggle]"
          )
          ?.classList.add("is-active");
      }
    });
  };


  const initExternalLinks = () => {
    qsa(
      'a[target="_blank"]'
    ).forEach((link) => {
      const rel = new Set(
        (
          link.getAttribute(
            "rel"
          ) || ""
        )
          .split(/\s+/)
          .filter(Boolean)
      );

      rel.add("noopener");
      rel.add("noreferrer");

      link.setAttribute(
        "rel",
        Array.from(rel).join(" ")
      );
    });
  };

  const initCurrentYear = () => {
    const year = qs("#current-year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }
  };


  const initResizeRefresh = () => {
    if (
      typeof window.AOS === "undefined" &&
      typeof window.ScrollTrigger === "undefined"
    ) {
      return;
    }

    let resizeTimer = null;

    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(
          resizeTimer
        );

        resizeTimer =
          window.setTimeout(
            () => {
              refreshAnimationEngines();
            },
            180
          );
      }
    );
  };


  const init = () => {
    applySiteConfig();

    initHeader();
    initServicesDropdown();
    initMenu();
    initSearch();

    initAOS();
    initAccordions();
    initParallax();
    initRevealObserver();

    initAnchors();
    initCookieConsent();
    initForms();

    initActiveNavigation();
    initExternalLinks();
    initCurrentYear();
    initMotionRefresh();
    initResizeRefresh();

    body.classList.add(
      "site-ready"
    );
  };


  if (
    doc.readyState === "loading"
  ) {
    doc.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
