(() => {
  "use strict";

  const doc = document;

  const qs = (selector, context = doc) =>
    context ? context.querySelector(selector) : null;

  const qsa = (selector, context = doc) =>
    context ? Array.from(context.querySelectorAll(selector)) : [];

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;


  const initSectionNavigation = () => {
    const sections = qsa(".legal-section[id]");
    const links = qsa(".legal-sidebar__link[href^='#']");

    if (!sections.length || !links.length) {
      return;
    }

    const linkMap = new Map();

    links.forEach((link) => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      linkMap.set(
        href.replace("#", ""),
        link
      );
    });

    const setActive = (id) => {
      links.forEach((link) => {
        const active =
          link === linkMap.get(id);

        link.classList.toggle(
          "is-active",
          active
        );

        if (active) {
          link.setAttribute(
            "aria-current",
            "true"
          );
        } else {
          link.removeAttribute(
            "aria-current"
          );
        }
      });

      const activeLink =
        linkMap.get(id);

      if (
        activeLink &&
        window.innerWidth <= 991
      ) {
        activeLink.scrollIntoView({
          behavior: reducedMotion
            ? "auto"
            : "smooth",

          block: "nearest",
          inline: "center"
        });
      }
    };


    links.forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const href =
            link.getAttribute("href");

          const id =
            href?.replace("#", "");

          if (!id) return;

          const target =
            doc.getElementById(id);

          if (!target) return;

          event.preventDefault();

          target.scrollIntoView({
            behavior: reducedMotion
              ? "auto"
              : "smooth",

            block: "start"
          });

          history.replaceState(
            null,
            "",
            `#${id}`
          );

          setActive(id);
        }
      );
    });


    if (
      !("IntersectionObserver" in window)
    ) {
      setActive(sections[0].id);
      return;
    }

    let visibleSections = [];

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id =
              entry.target.id;

            if (!id) return;

            if (entry.isIntersecting) {
              visibleSections =
                visibleSections.filter(
                  (item) =>
                    item.id !== id
                );

              visibleSections.push({
                id,
                top:
                  entry.boundingClientRect
                    .top
              });
            } else {
              visibleSections =
                visibleSections.filter(
                  (item) =>
                    item.id !== id
                );
            }
          });

          if (!visibleSections.length) {
            return;
          }

          visibleSections.sort(
            (a, b) =>
              Math.abs(a.top) -
              Math.abs(b.top)
          );

          setActive(
            visibleSections[0].id
          );
        },
        {
          root: null,

          rootMargin:
            "-18% 0px -60% 0px",

          threshold: [0, 0.01]
        }
      );

    sections.forEach((section) => {
      observer.observe(section);
    });


    const initialHash =
      window.location.hash.replace(
        "#",
        ""
      );

    if (
      initialHash &&
      linkMap.has(initialHash)
    ) {
      setActive(initialHash);
    } else {
      setActive(sections[0].id);
    }
  };


  const initCurrentLegalPage = () => {
    const currentFile =
      window.location.pathname
        .split("/")
        .pop() ||
      "";

    qsa(".legal-next__card").forEach(
      (card) => {
        const href =
          card.getAttribute("href");

        if (!href) return;

        const cardFile =
          href
            .split("#")[0]
            .split("/")
            .pop();

        const current =
          cardFile === currentFile;

        card.classList.toggle(
          "is-current",
          current
        );

        if (current) {
          card.setAttribute(
            "aria-current",
            "page"
          );
        } else {
          card.removeAttribute(
            "aria-current"
          );
        }
      }
    );
  };


  const initTables = () => {
    qsa(
      ".legal-table-wrap"
    ).forEach((wrapper) => {
      const table = qs(
        ".legal-table",
        wrapper
      );

      if (!table) return;

      wrapper.setAttribute(
        "tabindex",
        "0"
      );

      wrapper.setAttribute(
        "role",
        "region"
      );

      if (
        !wrapper.hasAttribute(
          "aria-label"
        )
      ) {
        wrapper.setAttribute(
          "aria-label",
          "Scrollable legal information table"
        );
      }
    });
  };


  const initHashPosition = () => {
    const hash =
      window.location.hash;

    if (!hash) return;

    const target = qs(hash);

    if (!target) return;

    window.setTimeout(() => {
      target.scrollIntoView({
        behavior: "auto",
        block: "start"
      });
    }, 80);
  };


  const initScrollSafety = () => {
    const unlockIfNeeded = () => {
      const menuOpen =
        qs(".menu-panel.is-open");

      const searchOpen =
        qs(".search.is-open");

      if (
        !menuOpen &&
        !searchOpen
      ) {
        document.body.classList.remove(
          "menu-open",
          "modal-open",
          "no-scroll"
        );
      }
    };

    window.addEventListener(
      "pageshow",
      unlockIfNeeded
    );

    window.addEventListener(
      "resize",
      unlockIfNeeded
    );

    unlockIfNeeded();
  };


  const initMobileSidebar = () => {
    const nav = qs(
      ".legal-sidebar__box"
    );

    if (!nav) return;

    nav.style.touchAction =
      "pan-x pan-y";
  };


  const initPrintRefresh = () => {
    window.addEventListener(
      "beforeprint",
      () => {
        document.body.classList.remove(
          "menu-open",
          "modal-open",
          "no-scroll"
        );
      }
    );
  };


  const init = () => {
    initSectionNavigation();

    initCurrentLegalPage();

    initTables();

    initHashPosition();

    initScrollSafety();

    initMobileSidebar();

    initPrintRefresh();
  };


  if (
    doc.readyState === "loading"
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
