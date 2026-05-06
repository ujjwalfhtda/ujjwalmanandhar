document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const header = document.querySelector(".site-header");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();

        const headerOffset = header ? header.offsetHeight + 18 : 0;
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

const flipCards = document.querySelectorAll("[data-flip-card]");

const closeOtherFlipCards = (activeCard) => {
    flipCards.forEach((card) => {
        if (card === activeCard) return;
        card.classList.remove("is-flipped");
        card.setAttribute("aria-pressed", "false");
    });
};

flipCards.forEach((card) => {
    const toggleCard = () => {
        const isFlipped = card.classList.toggle("is-flipped");
        card.setAttribute("aria-pressed", String(isFlipped));
        if (isFlipped) closeOtherFlipCards(card);
    };

    card.addEventListener("click", toggleCard);

    card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleCard();
    });
});

document.addEventListener("click", (event) => {
    if (event.target.closest("[data-flip-card]")) return;
    closeOtherFlipCards();
});

const playPortfolioVideos = () => {
    document.querySelectorAll(".video-card video").forEach((video) => {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.play().catch(() => {});
    });
};

playPortfolioVideos();

document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    playPortfolioVideos();
});
