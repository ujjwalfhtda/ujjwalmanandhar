/* ═══════════════════════════════════════════════════
   AUTO GALLERY — renders image/ and video/ folders live
   via the local server's /gallery.json endpoint.
   - Shows the first 8 images and 8 videos on load.
   - "See More" lazily renders + reveals the rest.
   - Polls every 20s and re-renders when new files appear.
═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    const POLL_MS = 20000;
    const VISIBLE = 8;
    let lastFingerprint = "";

    const observed = new WeakSet();
    const hovered = new WeakSet();

    const esc = (s) =>
        String(s).replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
        );

    function imageCard(src, index) {
        let rawName = src.split("/").pop();
        try { rawName = decodeURIComponent(rawName); } catch (e) {}
        const title = esc(rawName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim());
        const href = esc(src);
        return `
            <article class="project-card reveal-up" data-reveal-index="${index}">
                <a href="${href}" target="_blank" aria-label="Open project: ${title}">
                    <img src="${href}" alt="${title}" loading="lazy">
                    <span class="project-overlay">
                        <span>${title}</span>
                        <strong>Portfolio Work</strong>
                    </span>
                </a>
            </article>`;
    }

    function videoCard(video, index) {
        let title = video.title || "Motion Work";
        try { title = decodeURIComponent(title); } catch (e) {}
        const titleEsc = esc(title);
        const src = esc(video.src);
        const poster = video.poster ? `poster="${esc(video.poster)}"` : "";
        return `
            <article class="video-card reveal-up" data-reveal-index="${index}">
                <video src="${src}" ${poster} muted loop playsinline preload="auto"></video>
                <div class="video-info">
                    <span>Motion / Visual Edit</span>
                    <strong>${titleEsc}</strong>
                </div>
            </article>`;
    }

    function initReveal(root) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    const index = parseInt(el.dataset.revealIndex || "0", 10);
                    setTimeout(() => el.classList.add("visible"), index * 80);
                    observer.unobserve(el);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );
        root.querySelectorAll(".reveal-up").forEach((el) => {
            if (observed.has(el)) return;
            observed.add(el);
            observer.observe(el);
        });
    }

    // Web Audio Sound Generator for UI Hover & Click
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playHoverSound() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {}
    }

    function playClickSound() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(260, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (e) {}
    }

    function initVideoHover(root) {
        root.querySelectorAll(".video-card").forEach((card) => {
            if (hovered.has(card)) return;
            hovered.add(card);
            const video = card.querySelector("video");
            if (!video) return;

            card.addEventListener("mouseenter", () => {
                playHoverSound();
                video.muted = false;
                video.play().catch(() => {
                    // Fallback to muted playback if autoplay policy requires user interaction first
                    video.muted = true;
                    video.play().catch(() => {});
                });
            });

            card.addEventListener("mouseleave", () => {
                video.pause();
                video.currentTime = 0;
                video.muted = true;
            });

            card.addEventListener("click", () => {
                playClickSound();
                if (video.paused) {
                    video.muted = false;
                    video.play().catch(() => {});
                } else if (video.muted) {
                    video.muted = false;
                } else {
                    video.pause();
                }
            });
        });
    }

    function buildCards(items, type, start, end) {
        return items.slice(start, end).map((item, i) =>
            type === "image" ? imageCard(item, start + i) : videoCard(item, start + i)
        ).join("");
    }

    function clearToggle(grid) {
        const btn = grid.nextElementSibling;
        if (btn && btn.classList.contains("see-more")) btn.remove();
    }

    function setupToggle(grid, items, type) {
        clearToggle(grid);
        if (items.length <= VISIBLE) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "see-more";

        const renderState = () => {
            btn.textContent = btn.dataset.expanded === "1"
                ? "Show Less"
                : `See More (${items.length - VISIBLE} more)`;
        };
        renderState();

        btn.addEventListener("click", () => {
            const expanded = btn.dataset.expanded === "1";

            if (!expanded) {
                grid.insertAdjacentHTML("beforeend", buildCards(items, type, VISIBLE, items.length));
                const revealed = Array.from(grid.children).slice(VISIBLE);
                revealed.forEach((card) => {
                    card.classList.add("visible", "gallery-enter");
                });
                initReveal(grid);
                if (type === "video") initVideoHover(grid);
            } else {
                Array.from(grid.children).slice(VISIBLE).forEach((card) => card.remove());
            }

            btn.dataset.expanded = expanded ? "0" : "1";
            renderState();
        });

        grid.insertAdjacentElement("afterend", btn);
    }

    function render(data, projectGrid, videoGrid) {
        const images = data.images || [];
        const videos = data.videos || [];

        if (projectGrid) {
            if (images.length) {
                projectGrid.innerHTML = buildCards(images, "image", 0, VISIBLE);
                initReveal(projectGrid);
                setupToggle(projectGrid, images, "image");
            } else {
                projectGrid.innerHTML = `<p class="section-lede">No images found.</p>`;
                clearToggle(projectGrid);
            }
        }

        if (videoGrid) {
            if (videos.length) {
                videoGrid.innerHTML = buildCards(videos, "video", 0, VISIBLE);
                initReveal(videoGrid);
                initVideoHover(videoGrid);
                setupToggle(videoGrid, videos, "video");
            } else {
                videoGrid.innerHTML = `<p class="section-lede">No videos found.</p>`;
                clearToggle(videoGrid);
            }
        }
    }

    async function refresh(projectGrid, videoGrid) {
        try {
            const res = await fetch("gallery.json");
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            const fingerprint = JSON.stringify([data.images || [], data.videos || []]);
            if (fingerprint !== lastFingerprint) {
                lastFingerprint = fingerprint;
                render(data, projectGrid, videoGrid);
            }
        } catch (err) {
            console.warn("Could not fetch gallery.json:", err);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const projectGrid = document.getElementById("project-grid");
        const videoGrid = document.getElementById("video-grid");
        if (!projectGrid && !videoGrid) return;

        refresh(projectGrid, videoGrid);
        setInterval(() => refresh(projectGrid, videoGrid), POLL_MS);
    });
})();
