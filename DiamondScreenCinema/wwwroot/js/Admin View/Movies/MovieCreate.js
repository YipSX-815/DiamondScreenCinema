function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success'
            ? '#22c55e'
            : type === 'warning'
                ? '#f59e0b'
                : type === 'error'
                    ? '#ef4444'
                    : '#3b82f6'};
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

    const closeBtn = notification.querySelector('.notification-close');
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

    closeBtn.addEventListener('click', () => notification.remove());
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'none');

    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 3000);

    document.body.appendChild(notification);
}

const MAX_POSTER_SIZE_MB = 3;
const MAX_TRAILER_SIZE_MB = 50;

// elements
const posterInput = document.getElementById("PosterFile");
const posterPreview = document.getElementById("posterPreview");
const posterUploadText = document.getElementById("uploadText");
const removePosterBtn = document.getElementById("removePoster");

const trailerInput = document.getElementById("TrailerFile");
const trailerPreview = document.getElementById("trailerPreview");
const trailerUploadText = document.getElementById("trailerUploadText");
const removeTrailerBtn = document.getElementById("removeTrailer");

// POSTER
posterInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    // Validate format
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        showNotification("❌ Only JPG or PNG files are allowed for posters.", "error");
        posterInput.value = "";
        return;
    }

    // Validate size
    if (file.size > MAX_POSTER_SIZE_MB * 1024 * 1024) {
        showNotification(`❌ Poster file too large. Max size: ${MAX_POSTER_SIZE_MB}MB`, "error");
        posterInput.value = "";
        return;
    }

    // Preview
    posterPreview.src = URL.createObjectURL(file);
    posterPreview.style.display = "block";
    posterPreview.style.border = "none";
    posterUploadText.style.display = "none";
    removePosterBtn.style.display = "inline-flex";
});

// Remove Poster
removePosterBtn?.addEventListener("click", function () {
    posterInput.value = "";
    posterPreview.src = "";
    posterPreview.style.display = "none";
    posterPreview.style.border = "none";
    posterUploadText.style.display = "block";
    removePosterBtn.style.display = "none";
    showNotification("Poster removed.", "info");
});

// TRAILER
trailerInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    // Validate format
    if (!file.type.match(/^video\/(mp4|webm)$/)) {
        showNotification("❌ Only MP4 or WebM video files are allowed.", "error");
        trailerInput.value = "";
        return;
    }

    // Validate size
    if (file.size > MAX_TRAILER_SIZE_MB * 1024 * 1024) {
        showNotification(`❌ Trailer file too large. Max size: ${MAX_TRAILER_SIZE_MB}MB`, "error");
        trailerInput.value = "";
        return;
    }

    // Preview
    trailerPreview.src = URL.createObjectURL(file);
    trailerPreview.style.display = "block";
    trailerUploadText.style.display = "none";
    removeTrailerBtn.style.display = "inline-flex";
    trailerPreview.load();
});

// Remove Trailer
removeTrailerBtn?.addEventListener("click", function () {
    trailerInput.value = "";
    trailerPreview.src = "";
    trailerPreview.style.display = "none";
    trailerUploadText.style.display = "block";
    removeTrailerBtn.style.display = "none";
    showNotification("Trailer removed.", "info");
});

// HORIZONTAL POSTER with DIMENSION VALIDATION
const horizontalPosterInput = document.getElementById("HorizontalPosterFile");
const horizontalPosterPreview = document.getElementById("horizontalPosterPreview");
const horizontalUploadText = document.getElementById("horizontalUploadText");
const removeHorizontalPosterBtn = document.getElementById("removeHorizontalPoster");

horizontalPosterInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    // Validate format
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        showNotification("❌ Only JPG, PNG or WEBP allowed.", "error");
        this.value = "";
        return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
        showNotification("❌ Horizontal poster max size is 5MB", "error");
        this.value = "";
        return;
    }

    // Validate image dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;

        // Check if image is landscape (width > height)
        if (width <= height) {
            showNotification("❌ Horizontal poster must be landscape orientation (width > height)", "error");
            horizontalPosterInput.value = "";
            URL.revokeObjectURL(objectUrl);
            return;
        }

        // Check aspect ratio - must be between 16:9 (1.78) and 21:9 (2.33)
        if (aspectRatio < 1.5 || aspectRatio > 2.5) {
            showNotification("❌ Use 16:9 ratio (1920×1080) or 21:9 ratio (1920×800) for best fit", "error");
            horizontalPosterInput.value = "";
            URL.revokeObjectURL(objectUrl);
            return;
        }

        // Recommended width check
        if (width > 2560) {
            showNotification("⚠️ Image too wide! Recommended max width: 2560px. Current: " + width + "px", "warning");
            horizontalPosterInput.value = "";
            URL.revokeObjectURL(objectUrl);
            return;
        }

        if (width < 1280) {
            showNotification("⚠️ Image too small. Recommended min width: 1280px. Current: " + width + "px", "warning");
        }

        // Image is valid - show preview
        horizontalPosterPreview.src = objectUrl;
        horizontalPosterPreview.style.display = "block";
        horizontalUploadText.style.display = "none";
        removeHorizontalPosterBtn.style.display = "inline-flex";

        showNotification("✓ Horizontal poster uploaded (" + width + "×" + height + ")", "success");
    };

    img.onerror = () => {
        showNotification("❌ Failed to load image", "error");
        horizontalPosterInput.value = "";
        URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
});

removeHorizontalPosterBtn?.addEventListener("click", function () {
    horizontalPosterInput.value = "";
    horizontalPosterPreview.src = "";
    horizontalPosterPreview.style.display = "none";
    horizontalUploadText.style.display = "block";
    this.style.display = "none";
    showNotification("Horizontal poster removed.", "info");
});