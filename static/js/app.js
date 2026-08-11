/* ═══════════════════════════════════════════════════
   SMOOTH SCROLL
═══════════════════════════════════════════════════ */
const header = document.querySelector(".site-header");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (!target) return;
        event.preventDefault();
        const headerOffset = header ? header.offsetHeight + 16 : 0;
        const targetTop = targetId === "#top"
            ? 0
            : target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        });
        history.pushState(null, "", targetId);
    });
});

/* ═══════════════════════════════════════════════════
   HEADER SCROLL DETECTION
═══════════════════════════════════════════════════ */
if (header) {
    const onScroll = () => {
        header.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}

/* ═══════════════════════════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
═══════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const index = parseInt(el.dataset.revealIndex || "0", 10);
            setTimeout(() => {
                el.classList.add("visible");
            }, index * 80);
            revealObserver.unobserve(el);
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

// Assign staggered reveal indices within each section/group
document.querySelectorAll(".reveal-up").forEach((el) => {
    // Find siblings with same class in same parent to stagger them
    const siblings = Array.from(el.parentElement.querySelectorAll(":scope > .reveal-up, :scope > * > .reveal-up"));
    const index = siblings.indexOf(el);
    el.dataset.revealIndex = index >= 0 ? index : 0;
    revealObserver.observe(el);
});

/* ═══════════════════════════════════════════════════
   VIDEO HOVER PLAY / PAUSE
═══════════════════════════════════════════════════ */
document.querySelectorAll(".video-card").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";

    card.addEventListener("mouseenter", () => {
        video.play().catch(() => { });
    });

    card.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
    });
});

/* ═══════════════════════════════════════════════════
   RE-REVEAL ON TAB FOCUS (accessibility)
═══════════════════════════════════════════════════ */
document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    // Pause any playing videos when tab loses focus
    document.querySelectorAll(".video-card video").forEach((v) => v.pause());
});
