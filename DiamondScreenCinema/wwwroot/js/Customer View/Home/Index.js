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

// Image optimization function
function optimizeImage(imgElement, size = 'original') {
    const src = imgElement.src;
    if (src.includes('themoviedb.org')) {
        const newSrc = src.replace('/t/p/original/', `/t/p/${size}/`);
        imgElement.src = newSrc;
    }
    imgElement.onerror = function () {
        this.src = 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=90';
        this.onerror = null;
    };
}

// ========================================
// COMPLETE TRAILER FUNCTIONALITY
// ========================================

// Trailer Hover Functionality
let trailerHoverTimer;
let trailerLeaveTimer;
let currentTrailerSlide = null;
let isTrailerPlaying = false;
let isHovering = false;

function setupTrailerHover() {
    const slides = document.querySelectorAll('.slide');

    slides.forEach((slide, slideIndex) => {
        const trailerFileName = slide.getAttribute('data-trailer');
        if (!trailerFileName) return;

        const timerBar = slide.querySelector('.trailer-timer-bar');

        // Mouse enter - start 1.3s countdown ONLY if this is the active slide
        slide.addEventListener('mouseenter', function () {
            // CHECK: Is this the currently active slide?
            if (!slide.classList.contains('active')) {
                return; // Not active, ignore hover
            }

            isHovering = true;
            clearTimeout(trailerLeaveTimer);

            if (isTrailerPlaying) return;

            clearTimeout(trailerHoverTimer);

            // Animate timer bar
            timerBar.style.transition = 'none';
            timerBar.style.transform = 'scaleX(0)';
            setTimeout(() => {
                timerBar.style.transition = 'transform 1.3s linear';
                timerBar.style.transform = 'scaleX(1)';
            }, 10);

            trailerHoverTimer = setTimeout(() => {
                // Double-check still active and hovering
                if (isHovering && slide.classList.contains('active')) {
                    showTrailer(slide, trailerFileName);
                }
            }, 1300);
        });

        // Mouse leave - start 5s countdown if trailer playing
        slide.addEventListener('mouseleave', function () {
            isHovering = false;
            clearTimeout(trailerHoverTimer);

            // If trailer playing, auto-close after 5 seconds
            if (isTrailerPlaying) {
                trailerLeaveTimer = setTimeout(() => {
                    if (!isHovering && isTrailerPlaying) {
                        hideTrailer(slide);
                    }
                }, 5000);
                return;
            }

            // Reset timer bar
            timerBar.style.transition = 'none';
            timerBar.style.transform = 'scaleX(0)';
        });

        // Close button
        const overlay = slide.querySelector('.trailer-overlay');
        const closeBtn = overlay.querySelector('.close-trailer');
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            hideTrailer(slide);
        });
    });
}

function showTrailer(slide, trailerFileName) {
    // CRITICAL: Verify slide is still active
    if (!slide.classList.contains('active')) {
        return;
    }

    isTrailerPlaying = true;

    // STOP SLIDER COMPLETELY
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }

    // Hide other trailers
    document.querySelectorAll('.trailer-overlay').forEach(overlay => {
        overlay.classList.remove('show');
    });
    document.querySelectorAll('.slide-content').forEach(content => {
        content.classList.remove('hide-for-trailer');
    });

    // Stop all OTHER videos
    const currentSlide = slide;
    document.querySelectorAll('.slide').forEach(s => {
        if (s !== currentSlide) {
            const v = s.querySelector('.trailer-video video');
            if (v) {
                v.pause();
                v.currentTime = 0;
                v.src = '';
            }
        }
    });

    const trailerUrl = getTrailerUrl(trailerFileName);
    if (!trailerUrl) {
        isTrailerPlaying = false;
        return;
    }

    const overlay = slide.querySelector('.trailer-overlay');
    const iframe = overlay.querySelector('.trailer-iframe');
    const videoContainer = slide.querySelector('.trailer-video');
    const video = videoContainer.querySelector('video');
    const slideContent = slide.querySelector('.slide-content');

    const isVideoFile = trailerFileName &&
        (trailerFileName.toLowerCase().endsWith('.mp4') ||
            trailerFileName.toLowerCase().endsWith('.webm') ||
            trailerFileName.toLowerCase().endsWith('.ogg'));

    const youtubeId = getYouTubeId(trailerUrl);

    if (isVideoFile && videoContainer && video) {
        iframe.style.display = 'none';
        videoContainer.style.display = 'block';

        let videoType = 'video/mp4';
        if (trailerFileName.toLowerCase().endsWith('.webm')) videoType = 'video/webm';
        else if (trailerFileName.toLowerCase().endsWith('.ogg')) videoType = 'video/ogg';
        else if (trailerFileName.toLowerCase().endsWith('.mov')) videoType = 'video/quicktime';

        video.src = trailerUrl;
        video.type = videoType;
        video.loop = true;

        // Enable sound
        video.muted = false;
        video.volume = 1.0;
        video.defaultMuted = false;

        // Enable subtitles
        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = 'showing';
        }

        // Autoplay with sound, with fallback for browser restrictions
        video.load();

        video.muted = false;
        video.volume = 1.0;
        video.defaultMuted = false;

        video.play()
            .then(() => {
                // Allowed with sound
                video.muted = false;
                video.volume = 1.0;
            })
            .catch(() => {
                // Browser blocked autoplay → play muted first
                video.muted = true;

                video.play().then(() => {
                    // After muted playback starts, unmute smoothly
                    setTimeout(() => {
                        video.muted = false;
                        video.volume = 1.0;
                    }, 300);
                });
            });

    } else if (youtubeId) {
        videoContainer.style.display = 'none';
        iframe.style.display = 'block';
        iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0&cc_load_policy=1`;
    } else {
        isTrailerPlaying = false;
        return;
    }

    slideContent.classList.add('hide-for-trailer');
    overlay.classList.add('show');
    currentTrailerSlide = slide;
}

function hideTrailer(slide) {
    const overlay = slide.querySelector('.trailer-overlay');
    const iframe = overlay.querySelector('.trailer-iframe');
    const videoContainer = slide.querySelector('.trailer-video');
    const video = videoContainer.querySelector('video');
    const slideContent = slide.querySelector('.slide-content');

    overlay.classList.remove('show');
    slideContent.classList.remove('hide-for-trailer');

    if (iframe) iframe.src = '';
    if (video) {
        video.pause();
        video.currentTime = 0;
        video.src = '';
    }

    currentTrailerSlide = null;
    isTrailerPlaying = false;
    isHovering = false;
    clearTimeout(trailerLeaveTimer);

    // Wait 1 sec, THEN advance to next slide
    if (slides && slides.length > 1) {
        setTimeout(() => {
            nextSlide();

            // Start auto-advance timer
            if (!slideInterval) {
                slideInterval = setInterval(nextSlide, 6000);
            }
        }, 1000);
    }
}

// Scroll detection
let scrollTimeout;
window.addEventListener('scroll', function () {
    if (isTrailerPlaying && currentTrailerSlide) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (isTrailerPlaying && currentTrailerSlide) {
                hideTrailer(currentTrailerSlide);
            }
        }, 300);
    }
});

// Hero Slider functionality
const slider = document.getElementById('slider');
const slides = document.querySelectorAll('.slide');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const dotsContainer = document.getElementById('dots');
let index = 0;
let slideInterval;

if (slides.length > 1) {
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => moveToSlide(i));
        dotsContainer.appendChild(dot);
    });
    const dots = document.querySelectorAll('.dot');

    function moveToSlide(i) {
        // Close trailer if open
        if (currentTrailerSlide) {
            const overlay = currentTrailerSlide.querySelector('.trailer-overlay');
            const video = currentTrailerSlide.querySelector('.trailer-video video');
            const iframe = currentTrailerSlide.querySelector('.trailer-iframe');
            const slideContent = currentTrailerSlide.querySelector('.slide-content');

            overlay.classList.remove('show');
            slideContent.classList.remove('hide-for-trailer');
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.src = '';
            }
            if (iframe) iframe.src = '';

            currentTrailerSlide = null;
            isTrailerPlaying = false;
        }

        // Remove active class from all slides
        slides.forEach(s => s.classList.remove('active'));

        // Add active class to new slide
        slides[i].classList.add('active');

        index = i;
        slider.style.transform = `translateX(-${index * 100}%)`;
        updateDots();
    }

    function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function nextSlide() {
        if (isTrailerPlaying) return;
        index = (index + 1) % slides.length;
        moveToSlide(index);
    }

    function prevSlide() {
        if (isTrailerPlaying) return;
        index = (index - 1 + slides.length) % slides.length;
        moveToSlide(index);
    }

    if (next) next.onclick = nextSlide;
    if (prev) prev.onclick = prevSlide;

    // START: 6 seconds
    slideInterval = setInterval(nextSlide, 6000);

    // Pause on hover
    slider.parentElement.addEventListener('mouseenter', () => {
        if (!isTrailerPlaying && slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    });

    // Resume on leave
    slider.parentElement.addEventListener('mouseleave', () => {
        if (!isTrailerPlaying && !isHovering && !slideInterval) {
            slideInterval = setInterval(nextSlide, 6000);
        }
    });

    // Touch support
    let startX = 0;
    slider.addEventListener('touchstart', e => {
        if (isTrailerPlaying) return;
        startX = e.touches[0].clientX;
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    });

    slider.addEventListener('touchend', e => {
        if (isTrailerPlaying) return;
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) nextSlide();
        if (endX - startX > 50) prevSlide();
        if (!slideInterval) {
            slideInterval = setInterval(nextSlide, 6000);
        }
    });

    setTimeout(setupTrailerHover, 100);
} else if (slides.length === 1) {
    setTimeout(setupTrailerHover, 100);
}

// Top 3 Slider
const top3Slider = document.getElementById('top3Slider');
const prevTop3 = document.getElementById('prevTop3');
const nextTop3 = document.getElementById('nextTop3');
const top3Cards = document.querySelectorAll('.top3-card');

if (top3Cards.length > 3 && prevTop3 && nextTop3) {
    let currentTop3Index = 0;
    const cardWidth = top3Cards[0].offsetWidth + 25;
    const visibleCards = 3;

    function updateTop3Slider() {
        const maxIndex = top3Cards.length - visibleCards;
        if (currentTop3Index > maxIndex) currentTop3Index = maxIndex;
        if (currentTop3Index < 0) currentTop3Index = 0;
        top3Slider.style.transform = `translateX(-${currentTop3Index * cardWidth}px)`;
    }

    nextTop3.addEventListener('click', () => {
        const maxIndex = top3Cards.length - visibleCards;
        if (currentTop3Index < maxIndex) {
            currentTop3Index++;
            updateTop3Slider();
        }
    });

    prevTop3.addEventListener('click', () => {
        if (currentTop3Index > 0) {
            currentTop3Index--;
            updateTop3Slider();
        }
    });

    window.addEventListener('resize', updateTop3Slider);
    updateTop3Slider();
}

// Tab functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Movie sliders functionality
function makeSlider(containerId, prevBtnId, nextBtnId) {
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const movies = container.querySelectorAll('.movie-slide');
    let currentIndex = 0;

    function getVisibleCount() {
        const movieWidth = movies[0].offsetWidth + 20;
        return Math.floor(container.offsetWidth / movieWidth);
    }

    function updateSlider() {
        const movieWidth = movies[0].offsetWidth + 20;
        container.style.transform = `translateX(-${currentIndex * movieWidth}px)`;
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const visible = getVisibleCount();
            if (currentIndex < movies.length - visible) currentIndex++;
            else currentIndex = 0;
            updateSlider();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const visible = getVisibleCount();
            if (currentIndex > 0) currentIndex--;
            else currentIndex = movies.length - visible;
            updateSlider();
        });
    }

    let startX = 0;
    container.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    container.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 50 && nextBtn) nextBtn.click();
        if (endX - startX > 50 && prevBtn) prevBtn.click();
    });

    window.addEventListener('resize', updateSlider);
    updateSlider();
}

if (document.getElementById('nowShowingPrev') && document.getElementById('nowShowingNext')) {
    makeSlider('nowShowingSlider', 'nowShowingPrev', 'nowShowingNext');
}

if (document.getElementById('comingSoonPrev') && document.getElementById('comingSoonNext')) {
    makeSlider('comingSoonSlider', 'comingSoonPrev', 'comingSoonNext');
}

// Apply image optimization on page load
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.slide-img').forEach(img => {
        optimizeImage(img, 'w1920');
    });

    document.querySelectorAll('.top3-card img').forEach(img => {
        optimizeImage(img, 'w500');
    });

    document.querySelectorAll('.movie img').forEach(img => {
        optimizeImage(img, 'w300');
    });
});

// Movie Info Modal Functionality
const movieModal = document.getElementById('movieModal');
const modalClose = document.querySelector('.movie-modal-close');
const modalBody = document.getElementById('movieModalBody');

function showMovieInfoModal(movieId) {
    modalBody.innerHTML = `
                <div class="modal-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading movie details...</p>
                </div>
            `;

    movieModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    fetch(`/Home/GetMovieInfoPartial?id=${movieId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load movie details');
            }
            return response.text();
        })
        .then(html => {
            modalBody.innerHTML = html;
            initializeModalContent();
        })
        .catch(error => {
            modalBody.innerHTML = `
                        <div class="modal-error">
                            <h3>Error Loading Movie</h3>
                            <p>Unable to load movie information. Please try again.</p>
                            <button onclick="window.location.href='/Home/MovieInfo/${movieId}'" class="btn btn-primary">
                                View Full Info Page
                            </button>
                        </div>
                    `;
        });
}

function initializeModalContent() {
    const trailerUrl = modalBody.querySelector('#modalTrailerUrl')?.value;
    const trailerContainer = modalBody.querySelector('.modal-trailer-container');

    if (trailerUrl && trailerContainer) {
        const isYouTube = trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be');

        if (isYouTube) {
            const youtubeId = getYouTubeId(trailerUrl);
            if (youtubeId) {
                trailerContainer.innerHTML = `
                            <iframe width="100%" height="315"
                                    src="https://www.youtube.com/embed/${youtubeId}"
                                    frameborder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowfullscreen>
                            </iframe>
                        `;
            }
        } else {
            trailerContainer.innerHTML = `
                        <video controls width="100%" height="315">
                            <source src="/MovieUpload/trailer/${trailerUrl}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    `;
        }
    }
}

function closeMovieModal() {
    movieModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    modalBody.innerHTML = '';
}

modalClose.addEventListener('click', closeMovieModal);

window.addEventListener('click', (event) => {
    if (event.target === movieModal) {
        closeMovieModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeMovieModal();
    }
});

document.addEventListener('click', function (e) {
    if (e.target.closest('.show-movie-info')) {
        e.preventDefault();
        const movieId = e.target.closest('.show-movie-info').getAttribute('data-movie-id');
        if (movieId) {
            showMovieInfoModal(movieId);
        }
    }
});