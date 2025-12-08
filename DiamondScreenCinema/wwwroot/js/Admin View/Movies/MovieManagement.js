function showNotification(message, type) {
    type = type || 'info';
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.innerHTML =
        '<span class="notification-message">' + message + '</span>' +
        '<button class="notification-close">' +
        '<span class="material-symbols-outlined">close</span>' +
        '</button>';

    notification.style.cssText =
        'position: fixed;' +
        'top: 20px;' +
        'right: 20px;' +
        'background: ' + (type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6') + ';' +
        'color: white;' +
        'padding: 12px 16px;' +
        'border-radius: 8px;' +
        'box-shadow: 0 4px 12px rgba(0,0,0,0.15);' +
        'z-index: 10000;' +
        'display: flex;' +
        'align-items: center;' +
        'gap: 8px;' +
        'animation: slideInRight 0.3s ease;' +
        'font-family: var(--font);' +
        'font-weight: 500;';

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText =
        'background: none;' +
        'border: none;' +
        'color: white;' +
        'cursor: pointer;' +
        'padding: 4px;' +
        'border-radius: 4px;' +
        'display: flex;' +
        'align-items: center;';

    closeBtn.addEventListener('click', function () {
        notification.remove();
    });

    closeBtn.addEventListener('mouseenter', function () {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    closeBtn.addEventListener('mouseleave', function () {
        closeBtn.style.background = 'none';
    });

    setTimeout(function () {
        if (notification.parentElement) notification.remove();
    }, 5000);

    document.body.appendChild(notification);
}

if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent =
        '@keyframes slideInRight {' +
        '  from { transform: translateX(100%); opacity: 0; }' +
        '  to { transform: translateX(0); opacity: 1; }' +
        '}' +
        '.loader { text-align: center; padding: 40px; font-size: 18px; color: #666; }' +
        '.error-message { text-align: center; padding: 40px; color: #dc3545; }' +
        '.error-message i { font-size: 48px; margin-bottom: 16px; }' +
        '.retry-btn { margin-top: 16px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }' +
        '.retry-btn:hover { background: #c82333; }';
    document.head.appendChild(style);
}

let filters = {
    search: '',
    genreFilter: '',
    languageFilter: '',
    sortBy: 'title',
    statusFilter: 'all',
    page: 1,
    totalPages: 1
};

function initFiltersFromLocation() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.querySelector('.pagination');
    const totalPages = paginationContainer ? parseInt(paginationContainer.dataset.totalPages) || 1 : 1;
    const activeStatFilter = document.querySelector('.stat-filter.active');

    filters = {
        search: urlParams.get('search') || (searchInput ? searchInput.value.trim() : ''),
        genreFilter: urlParams.get('genreFilter') || '',
        languageFilter: urlParams.get('languageFilter') || '',
        sortBy: urlParams.get('sortBy') || 'title',
        statusFilter: urlParams.get('statusFilter') || (activeStatFilter ? activeStatFilter.dataset.filter : 'all'),
        page: parseInt(urlParams.get('page')) || 1,
        totalPages: totalPages
    };
}

function buildQueryStringFromFilters() {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.genreFilter) params.set('genreFilter', filters.genreFilter);
    if (filters.languageFilter) params.set('languageFilter', filters.languageFilter);
    if (filters.sortBy && filters.sortBy !== 'title') params.set('sortBy', filters.sortBy);
    if (filters.statusFilter && filters.statusFilter !== 'all') params.set('statusFilter', filters.statusFilter);
    if (filters.page && filters.page > 0) params.set('page', filters.page);
    return params.toString();
}

function updateBrowserURL() {
    const qs = buildQueryStringFromFilters();
    const newUrl = window.location.pathname + (qs ? '?' + qs : '');
    window.history.pushState({}, '', newUrl);
}

function loadMovies(params, options) {
    options = options || {};
    const skipPushState = !!options.skipPushState;
    const container = document.getElementById('movieListArea');
    if (!container) return;

    container.innerHTML = '<div class="loader">Loading...</div>';

    const url = '/Admin/MovieManagement?ajax=true&' + params;

    fetch(url)
        .then(function (response) {
            if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
            return response.text();
        })
        .then(function (html) {
            container.innerHTML = html;

            const paginationContainer = document.querySelector('.pagination');
            filters.totalPages = paginationContainer ? parseInt(paginationContainer.dataset.totalPages) || 1 : 1;

            attachPagination();
            updateSelectionButtons();
            if (!skipPushState) updateBrowserURL();
        })
        .catch(function () {
            container.innerHTML =
                '<div class="error-message">' +
                '<i class="fas fa-exclamation-triangle"></i>' +
                '<h3>Failed to load movies</h3>' +
                '<p>Please try again later</p>' +
                '<button onclick="location.reload()" class="retry-btn">' +
                '<i class="fas fa-redo"></i> Retry' +
                '</button>' +
                '</div>';
        });
}

function applyFilters() {
    filters.page = 1;
    const qs = buildQueryStringFromFilters();
    loadMovies(qs);
}

function updateMovieFilter(type, value) {
    filters.page = 1;

    if (type === "genre") filters.genreFilter = value;
    if (type === "language") filters.languageFilter = value;
    if (type === "sort") filters.sortBy = value;
    if (type === "status") filters.statusFilter = value;

    const qs = buildQueryStringFromFilters();

    loadMovies(qs);

    document.querySelectorAll(`.custom-dropdown[data-type="${type}"] .dropdown-item`)
        .forEach(i => i.classList.toggle("active", i.dataset.value == value));
}


function handleBatchDelete() {
    const selected = Array.from(document.querySelectorAll('.movie-card.selected'))
        .map(card => card.dataset.id);

    if (selected.length === 0) {
        showNotification('No movies selected for deletion', 'warning');
        return;
    }

    if (!confirm('Are you sure you want to delete ' + selected.length + ' movie(s)?')) return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/Admin/DeleteSelected';

    const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
    if (tokenInput) {
        const token = document.createElement('input');
        token.type = 'hidden';
        token.name = '__RequestVerificationToken';
        token.value = tokenInput.value;
        form.appendChild(token);
    }

    selected.forEach(function (id) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'selectedIds';
        input.value = id;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

function createBatchDeleteButton() {
    let btn = document.querySelector('.batch-delete-btn');
    if (btn) return btn;

    const selectAllBtn = document.getElementById('selectAllBtn');
    if (!selectAllBtn) return null;

    btn = document.createElement('button');
    btn.className = 'batch-delete-btn';
    btn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected';
    btn.style.display = 'none';

    const parent = selectAllBtn.parentNode;
    parent.insertBefore(btn, selectAllBtn);

    btn.addEventListener('click', handleBatchDelete);
    return btn;
}

function updateSelectionButtons() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (!selectAllBtn) return;

    const cards = document.querySelectorAll('.movie-card');
    const selectedCards = document.querySelectorAll('.movie-card.selected');
    const batchDeleteBtn = createBatchDeleteButton();

    const anySelected = selectedCards.length > 0;
    const allSelected = cards.length > 0 && selectedCards.length === cards.length;

    if (allSelected) {
        selectAllBtn.innerHTML = '<i class="fas fa-times"></i> Deselect All';
        selectAllBtn.classList.add('deselect-mode');
    } else {
        selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i> Select All';
        selectAllBtn.classList.remove('deselect-mode');
    }

    if (batchDeleteBtn) {
        if (anySelected) {
            batchDeleteBtn.style.display = 'inline-block';
            selectAllBtn.style.order = '2';
            batchDeleteBtn.style.order = '1';
        } else {
            batchDeleteBtn.style.display = 'none';
            selectAllBtn.style.order = '';
        }
    }
}

function handleStatusToggle(btn) {
    const card = btn.closest('.movie-card');
    const movieId = card.dataset.id;
    const currentStatus = btn.dataset.status;

    const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
    const token = tokenInput ? tokenInput.value : '';

    fetch('/Admin/UpdateStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': token
        },
        body: JSON.stringify({ id: movieId, status: currentStatus })
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (data.success) {
                if (data.warning) {
                    showNotification(data.warning, 'warning');
                } else {
                    showNotification('Status updated to ' + data.newStatus, 'success');
                }
                setTimeout(function () {
                    window.location.reload();
                }, 800);
            } else {
                showNotification(data.message || 'Failed to update status', 'error');
            }
        })
        .catch(function () {
            showNotification('Error updating status. Please try again.', 'error');
        });
}

function attachSearchAndStatusFilters() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && !searchBtn._bound) {
        searchBtn._bound = true;
        searchBtn.addEventListener('click', function () {
            filters.search = searchInput ? searchInput.value.trim() : '';
            applyFilters();
        });
    }

    if (searchInput && !searchInput._bound) {
        searchInput._bound = true;
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                filters.search = searchInput.value.trim();
                applyFilters();
            }
        });
    }

    const statFilters = document.querySelectorAll('.stat-filter');
    statFilters.forEach(function (filter) {
        if (filter._bound) return;
        filter._bound = true;
        filter.addEventListener('click', function () {
            statFilters.forEach(function (f) { f.classList.remove('active'); });
            filter.classList.add('active');
            updateMovieFilter('status', filter.dataset.filter);
        });
    });
}

function attachSelectAll() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (!selectAllBtn || selectAllBtn._bound) return;
    selectAllBtn._bound = true;

    selectAllBtn.addEventListener('click', function () {
        const cards = document.querySelectorAll('.movie-card');
        if (cards.length === 0) return;

        const allSelected = Array.from(cards).every(c => c.classList.contains('selected'));
        const newSelected = !allSelected;

        cards.forEach(c => c.classList.toggle('selected', newSelected));
        updateSelectionButtons();

        showNotification(
            newSelected ? 'All movies selected' : 'All movies deselected',
            newSelected ? 'success' : 'info'
        );
    });
}

function attachPagination() {
    const pageBtns = document.querySelectorAll('.page-btn');
    if (!pageBtns.length) return;

    const activeBtn = document.querySelector('.page-btn.active');
    const currentPage = activeBtn ? parseInt(activeBtn.textContent) || 1 : 1;

    pageBtns.forEach(function (btn) {
        btn.onclick = null;
        btn.addEventListener('click', function () {
            let targetPage = currentPage;

            if (btn.classList.contains('prev')) {
                targetPage = currentPage - 1;
            } else if (btn.classList.contains('next')) {
                targetPage = currentPage + 1;
            } else {
                targetPage = parseInt(btn.textContent) || currentPage;
            }

            if (targetPage < 1 || targetPage > filters.totalPages || targetPage === currentPage) return;

            filters.page = targetPage;
            const qs = buildQueryStringFromFilters();
            loadMovies(qs);
        });
    });
}

function initMovieDropdownFilters() {
    if (window.__dropdown_fix_applied) return;
    window.__dropdown_fix_applied = true;

    document.addEventListener("click", function (e) {
        const hdr = e.target.closest(".custom-dropdown.movie-filter .dropdown-header");

        if (hdr) {
            const dd = hdr.closest(".custom-dropdown.movie-filter");
            const list = dd.querySelector(".dropdown-list");

            document.querySelectorAll(".dropdown-list.active").forEach(l => {
                if (l !== list) l.classList.remove("active");
            });

            document.querySelectorAll(".dropdown-header.active").forEach(h => {
                if (h !== hdr) h.classList.remove("active");
            });

            hdr.classList.toggle("active");
            list.classList.toggle("active");
            return;
        }

        const item = e.target.closest(".custom-dropdown.movie-filter .dropdown-item");

        if (item) {
            const dd = item.closest(".custom-dropdown.movie-filter");
            const hdr = dd.querySelector(".dropdown-header");
            const label = hdr.querySelector(".selected-value");
            const list = dd.querySelector(".dropdown-list");

            label.textContent = item.innerText.trim();

            list.querySelectorAll(".dropdown-item")
                .forEach(i => i.classList.remove("active"));

            item.classList.add("active");

            list.classList.remove("active");
            hdr.classList.remove("active");

            updateMovieFilter(dd.dataset.type, item.dataset.value || "");
            return;
        }

        document.querySelectorAll(".dropdown-list.active").forEach(el => el.classList.remove("active"));
        document.querySelectorAll(".dropdown-header.active").forEach(el => el.classList.remove("active"));
    });
}

function attachMovieListDelegates() {
    const area = document.getElementById('movieListArea');
    if (!area || area._bound) return;
    area._bound = true;

    area.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.delete-single');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = deleteBtn.dataset.id;
            if (confirm('Are you sure you want to delete this movie?')) {
                window.location.href = '/Admin/DeleteMovie/' + id;
            }
            return;
        }

        const statusBtn = e.target.closest('.status-btn');
        if (statusBtn) {
            e.preventDefault();
            e.stopPropagation();
            handleStatusToggle(statusBtn);
            return;
        }

        if (e.target.closest('.view-btn') || e.target.closest('.update-btn')) return;
        if (e.target.closest('.custom-dropdown')) return;

        // Only allow selection when clicking the poster-wrapper area
        const posterWrapper = e.target.closest('.poster-wrapper');
        if (posterWrapper) {
            const card = posterWrapper.closest('.movie-card');
            if (card) {
                card.classList.toggle('selected');
                updateSelectionButtons();
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initFiltersFromLocation();

    const searchInput = document.getElementById('searchInput');
    if (searchInput && filters.search) searchInput.value = filters.search;

    attachSearchAndStatusFilters();
    attachSelectAll();
    attachMovieListDelegates();
    attachPagination();
    initMovieDropdownFilters();
    updateSelectionButtons();

    window.addEventListener('popstate', function () {
        initFiltersFromLocation();
        const qs = window.location.search.startsWith('?')
            ? window.location.search.substring(1)
            : window.location.search;
        loadMovies(qs, { skipPushState: true });
    });
});