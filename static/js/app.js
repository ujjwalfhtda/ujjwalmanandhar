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

const backgroundRemoveForm = document.querySelector("#uploadForm");

if (backgroundRemoveForm) {
    const removeBgApiKey = "rFLmaB6ZpEzdqUDfdZDDYxev";
    const imageInput = document.querySelector("#imageInput");
    const dropZone = document.querySelector("#dropZone");
    const removeButton = document.querySelector("#removeButton");
    const clearButton = document.querySelector("#clearButton");
    const statusText = document.querySelector("#status");
    const progressBar = document.querySelector("#progressBar");
    const previewStage = document.querySelector("#previewStage");
    const emptyState = document.querySelector("#emptyState");
    const resultImage = document.querySelector("#resultImage");
    const downloadLink = document.querySelector("#downloadLink");
    const fileName = document.querySelector("#fileName");
    const swatches = document.querySelectorAll(".swatch");

    let selectedFile = null;
    let currentObjectUrl = null;

    const setStatus = (message, progress = 0) => {
        statusText.textContent = message;
        progressBar.style.width = `${Math.max(0, Math.min(progress, 100))}%`;
    };

    const revokeCurrentUrl = () => {
        if (!currentObjectUrl) return;
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    };

    const setDownloadEnabled = (enabled) => {
        downloadLink.classList.toggle("is-disabled", !enabled);
        downloadLink.setAttribute("aria-disabled", String(!enabled));
        if (enabled) return;
        downloadLink.removeAttribute("href");
        downloadLink.removeAttribute("download");
    };

    const resetPreview = () => {
        revokeCurrentUrl();
        resultImage.hidden = true;
        resultImage.removeAttribute("src");
        emptyState.hidden = false;
        previewStage.classList.add("is-empty");
        setDownloadEnabled(false);
    };

    const setFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setStatus("Please choose an image file.");
            return;
        }

        selectedFile = file;
        fileName.textContent = file.name;
        removeButton.disabled = false;
        clearButton.disabled = false;
        resetPreview();
        setStatus("Ready to remove the background.");
    };

    const getRemoveBgError = async (response) => {
        try {
            const data = await response.json();
            return data.errors?.[0]?.title || data.errors?.[0]?.detail || "Could not remove the background.";
        } catch {
            return "Could not remove the background. Please try another image.";
        }
    };

    const processImage = async () => {
        if (!selectedFile) return;

        removeButton.disabled = true;
        imageInput.disabled = true;
        setDownloadEnabled(false);
        setStatus("Uploading image to remove.bg...", 20);

        try {
            const formData = new FormData();
            formData.append("image_file", selectedFile);
            formData.append("size", "auto");

            const response = await fetch("https://api.remove.bg/v1.0/removebg", {
                method: "POST",
                headers: {
                    "X-Api-Key": removeBgApiKey
                },
                body: formData
            });

            setStatus("Removing background...", 72);

            if (!response.ok) {
                throw new Error(await getRemoveBgError(response));
            }

            const resultBlob = await response.blob();
            revokeCurrentUrl();
            currentObjectUrl = URL.createObjectURL(resultBlob);
            resultImage.src = currentObjectUrl;
            resultImage.hidden = false;
            emptyState.hidden = true;
            previewStage.classList.remove("is-empty");

            const safeName = selectedFile.name.replace(/\.[^.]+$/, "") || "image";
            downloadLink.href = currentObjectUrl;
            downloadLink.download = `${safeName}-no-background.png`;
            setDownloadEnabled(true);
            setStatus("Background removed. Your PNG is ready.", 100);
        } catch (error) {
            console.error(error);
            resetPreview();
            setStatus(error.message || "Could not remove the background. Please try another image.");
        } finally {
            removeButton.disabled = false;
            imageInput.disabled = false;
        }
    };

    backgroundRemoveForm.addEventListener("submit", (event) => {
        event.preventDefault();
        processImage();
    });

    imageInput.addEventListener("change", (event) => {
        setFile(event.target.files?.[0]);
    });

    clearButton.addEventListener("click", () => {
        selectedFile = null;
        imageInput.value = "";
        fileName.textContent = "No file selected";
        removeButton.disabled = true;
        clearButton.disabled = true;
        resetPreview();
        setStatus("Upload an image to begin.");
    });

    ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropZone.classList.add("is-dragging");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropZone.classList.remove("is-dragging");
        });
    });

    dropZone.addEventListener("drop", (event) => {
        setFile(event.dataTransfer.files?.[0]);
    });

    downloadLink.addEventListener("click", (event) => {
        if (!downloadLink.classList.contains("is-disabled")) return;
        event.preventDefault();
    });

    swatches.forEach((button) => {
        button.addEventListener("click", () => {
            swatches.forEach((item) => item.classList.remove("is-active"));
            button.classList.add("is-active");
            previewStage.dataset.bg = button.dataset.bg;
        });
    });
}
