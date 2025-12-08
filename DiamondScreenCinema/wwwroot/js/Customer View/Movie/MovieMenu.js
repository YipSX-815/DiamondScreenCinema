// Tab Switching
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(link => {
    link.addEventListener('click', function () {
        const tabId = this.getAttribute('data-tab');

        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Filter Panel Toggle
const filterToggle = document.getElementById('filterToggle');
const filterPanel = document.getElementById('filterPanel');

filterToggle.addEventListener('click', function () {
    filterPanel.classList.toggle('active');
    this.classList.toggle('active');
});

// Search Functionality
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

searchInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    clearSearch.style.display = searchTerm ? 'flex' : 'none';
    filterMovies();
});

clearSearch.addEventListener('click', function () {
    searchInput.value = '';
    this.style.display = 'none';
    filterMovies();
});

// Filter Functionality
const genreFilter = document.getElementById('genreFilter');
const languageFilter = document.getElementById('languageFilter');
const classificationFilter = document.getElementById('classificationFilter');
const releaseDateFilter = document.getElementById('releaseDateFilter');
const durationFilter = document.getElementById('durationFilter');
const applyFilters = document.getElementById('applyFilters');
const resetFilters = document.getElementById('resetFilters');

applyFilters.addEventListener('click', function () {
    filterMovies();
    filterPanel.classList.remove('active');
    filterToggle.classList.remove('active');
});

resetFilters.addEventListener('click', function () {
    genreFilter.value = '';
    languageFilter.value = '';
    classificationFilter.value = '';
    releaseDateFilter.value = '';
    durationFilter.value = '';
    searchInput.value = '';
    clearSearch.style.display = 'none';
    filterMovies();
});

// Pagination
const itemsPerPage = 15;
let currentPage = 1;

function setupPagination(tabId) {
    const grid = document.querySelector(`#${tabId} .movies-grid`);
    if (!grid) return;

    const allCards = Array.from(grid.querySelectorAll('.movie-card'));
    const visibleCards = allCards.filter(card => card.style.display !== 'none');
    const totalPages = Math.ceil(visibleCards.length / itemsPerPage);

    // Hide all cards first
    allCards.forEach(card => card.classList.add('paginated-hide'));

    // Show only current page cards
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    visibleCards.slice(start, end).forEach(card => {
        card.classList.remove('paginated-hide');
    });

    // Update pagination buttons
    const paginationContainer = document.querySelector(`#${tabId} .pagination`);
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';

    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '←';
        prevBtn.onclick = () => {
            currentPage--;
            setupPagination(tabId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        paginationContainer.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                setupPagination(tabId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            paginationContainer.appendChild(pageBtn);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }

    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = '→';
        nextBtn.onclick = () => {
            currentPage++;
            setupPagination(tabId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        paginationContainer.appendChild(nextBtn);
    }
}

// Helper function to calculate months difference
function getMonthsDifference(date1, date2) {
    const year1 = date1.getFullYear();
    const month1 = date1.getMonth();
    const year2 = date2.getFullYear();
    const month2 = date2.getMonth();
    return (year1 - year2) * 12 + (month1 - month2);
}

// Update pagination when filters change
function filterMovies() {
    const activeTab = document.querySelector('.tab-content.active');
    const movieCards = activeTab.querySelectorAll('.movie-card');
    const searchTerm = searchInput.value.toLowerCase();
    const genre = genreFilter.value;
    const language = languageFilter.value;
    const classification = classificationFilter.value;
    const releaseDate = releaseDateFilter.value;
    const duration = durationFilter.value;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    movieCards.forEach(card => {
        const title = card.getAttribute('data-title');
        const cardGenre = card.getAttribute('data-genre');
        const cardLanguage = card.getAttribute('data-language');
        const cardClassification = card.getAttribute('data-classification');
        const cardReleaseDate = new Date(card.getAttribute('data-release-date'));
        const cardDuration = parseInt(card.getAttribute('data-duration'));

        let show = true;

        // Search filter
        if (searchTerm && !title.includes(searchTerm)) {
            show = false;
        }

        // Genre filter
        if (genre && cardGenre !== genre) {
            show = false;
        }

        // Language filter - case insensitive comparison with trim
        if (language) {
            const filterLang = language.trim().toLowerCase();
            const cardLang = (cardLanguage || '').trim().toLowerCase();
            if (cardLang !== filterLang) {
                show = false;
            }
        }

        // Classification filter
        if (classification && cardClassification !== classification) {
            show = false;
        }

        // Release date filter (MONTH-BASED)
        if (releaseDate) {
            const monthsDiff = getMonthsDifference(now, cardReleaseDate);

            if (releaseDate === 'this-month') {
                // Same year and same month
                if (cardReleaseDate.getFullYear() !== currentYear ||
                    cardReleaseDate.getMonth() !== currentMonth) {
                    show = false;
                }
            } else if (releaseDate === 'last-month') {
                // Exactly 1 month ago
                if (monthsDiff !== 1) {
                    show = false;
                }
            } else if (releaseDate === 'last-3-months') {
                // Within last 3 months (0-3 months ago)
                if (monthsDiff < 0 || monthsDiff > 3) {
                    show = false;
                }
            } else if (releaseDate === 'last-6-months') {
                // Within last 6 months (0-6 months ago)
                if (monthsDiff < 0 || monthsDiff > 6) {
                    show = false;
                }
            } else if (releaseDate === 'older') {
                // More than 6 months ago
                if (monthsDiff <= 6) {
                    show = false;
                }
            }
        }

        // Duration filter
        if (duration) {
            if (duration === '0-90' && cardDuration >= 90) show = false;
            if (duration === '90-120' && (cardDuration < 90 || cardDuration > 120)) show = false;
            if (duration === '120-150' && (cardDuration < 120 || cardDuration > 150)) show = false;
            if (duration === '150+' && cardDuration <= 150) show = false;
        }

        card.style.display = show ? 'flex' : 'none';
    });

    // Reset to page 1 and update pagination
    currentPage = 1;
    setupPagination(activeTab.id);
}

// Initialize pagination on page load
setupPagination('showing-now');

// Update pagination when switching tabs
tabLinks.forEach(link => {
    link.addEventListener('click', function () {
        const tabId = this.getAttribute('data-tab');
        currentPage = 1;
        setTimeout(() => setupPagination(tabId), 10);
    });
});