function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close"><span class="material-symbols-outlined">close</span></button>
    `;

    const colors = {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    };

    n.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease;
        font-family: var(--font);
        font-weight: 500;
    `;

    const closeBtn = n.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
    `;

    closeBtn.onclick = () => n.remove();
    closeBtn.onmouseenter = () => (closeBtn.style.background = 'rgba(255,255,255,0.2)');
    closeBtn.onmouseleave = () => (closeBtn.style.background = 'none');

    setTimeout(() => n.remove(), 3000);
    document.body.appendChild(n);
}

const limits = {
    poster: 3 * 1024 * 1024,
    horizontalPoster: 5 * 1024 * 1024,
    trailer: 50 * 1024 * 1024
};

const posterInput = document.getElementById("PosterFile");
const posterPreview = document.getElementById("posterPreview");
const posterText = document.getElementById("uploadText");
const removePoster = document.getElementById("removePoster");

const horizontalInput = document.getElementById("HorizontalPosterFile");
const horizontalPreview = document.getElementById("horizontalPosterPreview");
const horizontalText = document.getElementById("horizontalUploadText");
const removeHorizontal = document.getElementById("removeHorizontalPoster");

const trailerInput = document.getElementById("TrailerFile");
const trailerPreview = document.getElementById("trailerPreview");
const trailerText = document.getElementById("trailerUploadText");
const removeTrailer = document.getElementById("removeTrailer");

function validateImage(file, size, ext, msgSize, msgType) {
    if (!ext.test(file.type)) {
        showNotification(msgType, "error");
        return false;
    }
    if (file.size > size) {
        showNotification(msgSize, "error");
        return false;
    }
    return true;
}

function preview(previewEl, file, textEl, removeBtn) {
    previewEl.src = URL.createObjectURL(file);
    previewEl.style.display = "block";
    textEl.style.display = "none";
    removeBtn.style.display = "inline-flex";
}

posterInput?.addEventListener("change", function () {
    const f = this.files[0];
    if (!f) return;

    if (!validateImage(
        f,
        limits.poster,
        /^image\/(jpeg|jpg|png)$/,
        "Poster file too large. Max 3MB.",
        "Only JPG or PNG allowed."
    )) { this.value = ""; return; }

    preview(posterPreview, f, posterText, removePoster);
});

removePoster?.addEventListener("click", () => {
    posterInput.value = "";
    posterPreview.style.display = "none";
    posterText.style.display = "block";
    removePoster.style.display = "none";
    showNotification("Poster removed.", "info");
});

horizontalInput?.addEventListener("change", function () {
    const f = this.files[0];
    if (!f) return;

    if (!validateImage(
        f,
        limits.horizontalPoster,
        /^image\/(jpeg|jpg|png|webp)$/,
        "Horizontal poster max size is 5MB",
        "Only JPG, PNG or WEBP allowed."
    )) { this.value = ""; return; }

    preview(horizontalPreview, f, horizontalText, removeHorizontal);
});

removeHorizontal?.addEventListener("click", () => {
    horizontalInput.value = "";
    horizontalPreview.style.display = "none";
    horizontalText.style.display = "block";
    removeHorizontal.style.display = "none";
    showNotification("Horizontal poster removed.", "info");
});

trailerInput?.addEventListener("change", function () {
    const f = this.files[0];
    if (!f) return;

    if (!/video\/(mp4|webm)/.test(f.type)) {
        showNotification("Only MP4 or WebM allowed.", "error");
        this.value = "";
        return;
    }

    if (f.size > limits.trailer) {
        showNotification("Trailer max size is 50MB", "error");
        this.value = "";
        return;
    }

    trailerPreview.src = URL.createObjectURL(f);
    trailerPreview.style.display = "block";
    trailerText.style.display = "none";
    removeTrailer.style.display = "inline-flex";
    trailerPreview.load();
});

removeTrailer?.addEventListener("click", () => {
    trailerInput.value = "";
    trailerPreview.src = "";
    trailerPreview.style.display = "none";
    trailerText.style.display = "block";
    removeTrailer.style.display = "none";
    showNotification("Trailer removed.", "info");
});
