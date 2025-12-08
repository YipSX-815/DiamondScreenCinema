// Function to get trailer URL
function getTrailerUrl(trailerFileName) {
    if (!trailerFileName) return null;
    if (trailerFileName.includes('youtube.com') || trailerFileName.includes('youtu.be')) {
        return trailerFileName;
    }
    return `/MovieUpload/trailer/${trailerFileName}`;
}

// Function to get YouTube ID from URL
function getYouTubeId(url) {
    if (!url) return null;
    if (url.toLowerCase().endsWith('.mp4') ||
        url.toLowerCase().endsWith('.webm') ||
        url.toLowerCase().endsWith('.ogg') ||
        url.toLowerCase().endsWith('.mov') ||
        url.toLowerCase().endsWith('.avi')) {
        return null;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ========================================
// TRAILER SECTION FUNCTIONALITY (HOVER TO PLAY)
// ========================================

let trailerSectionHoverTimer;
let isTrailerSectionPlaying = false;
let isTrailerSectionHovering = false;

function setupTrailerSection() {
    const trailerContainer = document.getElementById('trailerContainer');
    const trailerPlaceholder = document.getElementById('trailerPlaceholder');
    const trailerPlayer = document.getElementById('trailerPlayer');
    const trailerCloseBtn = document.getElementById('trailerCloseBtn');
    const trailerIframe = document.getElementById('trailerIframe');
    const trailerVideo = document.getElementById('trailerVideo');
    const timerBar = trailerPlaceholder?.querySelector('.trailer-timer-bar');

    if (!trailerContainer || !trailerPlaceholder || !trailerPlayer) return;

    // Hover to play functionality
    trailerPlaceholder.addEventListener('mouseenter', function () {
        if (isTrailerSectionPlaying) return;

        isTrailerSectionHovering = true;
        clearTimeout(trailerSectionHoverTimer);

        // Animate timer bar
        if (timerBar) {
            timerBar.style.transition = 'none';
            timerBar.style.transform = 'scaleX(0)';
            setTimeout(() => {
                timerBar.style.transition = 'transform 2s linear';
                timerBar.style.transform = 'scaleX(1)';
            }, 10);
        }

        trailerSectionHoverTimer = setTimeout(() => {
            if (isTrailerSectionHovering) {
                playTrailer();
            }
        }, 2000);
    });

    trailerPlaceholder.addEventListener('mouseleave', function () {
        isTrailerSectionHovering = false;
        clearTimeout(trailerSectionHoverTimer);

        // Reset timer bar
        if (timerBar) {
            timerBar.style.transition = 'none';
            timerBar.style.transform = 'scaleX(0)';
        }
    });

    // Close button functionality
    if (trailerCloseBtn) {
        trailerCloseBtn.addEventListener('click', function () {
            stopTrailer();
        });
    }

    function playTrailer() {
        isTrailerSectionPlaying = true;
        trailerPlaceholder.style.display = 'none';
        trailerPlayer.style.display = 'block';

        // Load and play the trailer
        if (trailerIframe) {
            const src = trailerIframe.getAttribute('data-src');
            trailerIframe.src = src;
        } else if (trailerVideo) {
            trailerVideo.play();
        }
    }

    function stopTrailer() {
        isTrailerSectionPlaying = false;
        trailerPlayer.style.display = 'none';
        trailerPlaceholder.style.display = 'block';

        // Stop the trailer
        if (trailerIframe) {
            trailerIframe.src = '';
        } else if (trailerVideo) {
            trailerVideo.pause();
            trailerVideo.currentTime = 0;
        }
    }

    // Expose playTrailer for external calls
    window.playTrailerSection = playTrailer;
}

// ========================================
// PLAY TRAILER BUTTON FUNCTIONALITY
// ========================================

const playTrailerBtn = document.getElementById('playTrailerBtn');
const trailerContainer = document.getElementById('trailerContainer');

if (playTrailerBtn) {
    playTrailerBtn.addEventListener('click', function () {
        // Scroll to trailer section
        trailerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Wait for scroll, then play trailer
        setTimeout(() => {
            if (window.playTrailerSection) {
                window.playTrailerSection();
            }
        }, 800);
    });
}



// ========================================
// INITIALIZE
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    setupTrailerSection();
});
