const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

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

document.querySelectorAll(".video-card").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    card.addEventListener("mouseenter", () => {
        video.play().catch(() => {});
    });

    card.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
    });

    card.addEventListener("focusin", () => {
        video.play().catch(() => {});
    });

    card.addEventListener("focusout", () => {
        video.pause();
        video.currentTime = 0;
    });
});
