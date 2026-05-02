document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));

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
