document.addEventListener('DOMContentLoaded', function () {
    initDropdowns();
    initSalesChart();
    observeDarkMode();
    initShortcuts();
});

function initDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown, .chart-dropdown');

    dropdowns.forEach(dropdown => {
        const header = dropdown.querySelector('.dropdown-header');
        const list = dropdown.querySelector('.dropdown-list');
        const items = dropdown.querySelectorAll('.dropdown-item');
        const selectedValue = dropdown.querySelector('.selected-value');

        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = list.classList.contains('active');

            document.querySelectorAll('.dropdown-list.active').forEach(activeList => {
                if (activeList !== list) {
                    activeList.classList.remove('active');
                    activeList.previousElementSibling.classList.remove('active');
                }
            });

            list.classList.toggle('active', !isActive);
            header.classList.toggle('active', !isActive);
        });

        items.forEach(item => {
            item.addEventListener('click', () => {
                const value = item.getAttribute('data-value');
                const text = item.querySelector('.item-text').textContent;

                selectedValue.textContent = text;

                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                list.classList.remove('active');
                header.classList.remove('active');

                handleDropdownSelection(dropdown.classList.contains('chart-dropdown') ? 'chart' : 'timeframe', value);
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-list.active').forEach(list => {
            list.classList.remove('active');
            list.previousElementSibling.classList.remove('active');
        });
    });
}

function initSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');

    const isDarkMode =
        document.body.classList.contains('dark') ||
        document.documentElement.classList.contains('dark');

    const fontFamily = getComputedStyle(document.documentElement)
        .getPropertyValue('--font').trim() || 'sans-serif';

    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Revenue',
            data: [32000, 28000, 35000, 42000, 39000, 45000, 48000, 52000, 49000, 55000, 58000, 62000],
            borderColor: '#22c55e',
            backgroundColor: isDarkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: isDarkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                titleColor: isDarkMode ? '#ffffff' : '#1f2937',
                bodyColor: '#22c55e',
                titleFont: { family: fontFamily, size: 14, weight: '500' },
                bodyFont: { family: fontFamily, size: 12, weight: '400' },
                borderColor: 'rgba(59,183,229,0.3)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `Revenue: $${context.parsed.y.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: isDarkMode ? '#888888' : 'rgba(0,0,0,0.1)' },
                ticks: {
                    color: isDarkMode ? '#f8f8f8' : '#666666',
                    font: { family: fontFamily, size: 12, weight: '500' }
                }
            },
            y: {
                grid: { color: isDarkMode ? '#888888' : 'rgba(0,0,0,0.1)' },
                ticks: {
                    color: isDarkMode ? '#f8f8f8' : '#666666',
                    font: { family: fontFamily, size: 12, weight: '500' },
                    callback: function (value) { return '$' + (value / 1000) + 'k'; }
                }
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    if (window.salesChart instanceof Chart) window.salesChart.destroy();

    window.salesChart = new Chart(ctx, { type: 'line', data, options });
}

function observeDarkMode() {
    const updateChartTheme = () => {
        const dark = document.body.classList.contains('dark') ||
            document.documentElement.classList.contains('dark');

        console.log(dark);

        const gridColor = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)';
        const textColor = dark ? '#ffffff' : '#666666';

        salesChart.options.scales.x.grid.color = gridColor;
        salesChart.options.scales.y.grid.color = gridColor;

        salesChart.options.scales.x.ticks.color = textColor;
        salesChart.options.scales.y.ticks.color = textColor;

        salesChart.update();
    };

    new MutationObserver(updateChartTheme)
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });

    new MutationObserver(updateChartTheme)
        .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

function initShortcuts() {
    const shortcutArea = document.getElementById('shortcut-area');

    if (!shortcutArea) {
        console.warn('Shortcut area not found');
        return;
    }

    const moduleIcons = {
        "Dashboard": "dashboard",
        "Booking Records": "local_activity",
        "Refund Requests": "assignment_return",
        "Cinema Management": "theaters",
        "Hall Management": "meeting_room",
        "Seat Management": "event_seat",
        "Movie Management": "movie",
        "Showtime Management": "schedule",
        "Food and Beverages": "restaurant",
        "Promotion Management": "sell",
        "Reward Management": "card_giftcard",
        "View Report": "bar_chart",
        "User Management": "person",
        "Staff Management": "groups",
        "Admin Management": "admin_panel_settings"
    };

    const placeholder = shortcutArea.querySelector('.placeholder-content');

    setupSidebarDragAndDrop();

    shortcutArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        shortcutArea.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'copy';
    });

    shortcutArea.addEventListener('dragleave', () => {
        shortcutArea.classList.remove('drag-over');
    });

    shortcutArea.addEventListener('drop', (e) => {
        e.preventDefault();
        shortcutArea.classList.remove('drag-over');

        const moduleName = e.dataTransfer.getData('text/plain');
        const iconName = e.dataTransfer.getData('text/icon');

        if (!moduleName) return;

        const existingShortcuts = shortcutArea.querySelectorAll('.shortcut-item');
        const alreadyExists = Array.from(existingShortcuts).some(el =>
            el.dataset.module === moduleName
        );

        if (alreadyExists) {
            showNotification(`"${moduleName}" is already in your shortcuts!`, 'warning');
            return;
        }

        if (existingShortcuts.length >= 6) {
            showNotification('Maximum 6 shortcuts allowed!', 'warning');
            return;
        }

        const icon = iconName || moduleIcons[moduleName] || "bookmark";

        const shortcut = document.createElement('div');
        shortcut.classList.add('shortcut-item');
        shortcut.dataset.module = moduleName;

        shortcut.innerHTML = `
            <div class="shortcut-icon">
                <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div class="shortcut-title">${moduleName}</div>
            <button class="remove-shortcut" title="Remove shortcut">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;

        shortcut.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-shortcut')) {
                navigateToModule(moduleName);
            }
        });

        const removeBtn = shortcut.querySelector('.remove-shortcut');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shortcut.remove();
            updatePlaceholderVisibility();
            showNotification(`"${moduleName}" removed from shortcuts`, 'info');
        });

        shortcutArea.appendChild(shortcut);
        updatePlaceholderVisibility();
        showNotification(`"${moduleName}" added to shortcuts!`, 'success');
    });

    function setupSidebarDragAndDrop() {
        setTimeout(() => {
            const sidebarSubmenus = document.querySelectorAll('.sidebar .submenu ul li a');

            sidebarSubmenus.forEach(menuItem => {
                menuItem.setAttribute('draggable', 'true');
                menuItem.classList.add('draggable-menu-item');

                const moduleName = menuItem.textContent.trim();
                menuItem.dataset.moduleName = moduleName;

                const parentMenu = menuItem.closest('.menu');
                const menuIcon = parentMenu ? parentMenu.querySelector('.menu-title .material-symbols-outlined') : null;
                const iconName = menuIcon ? menuIcon.textContent.trim() : 'bookmark';

                menuItem.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', moduleName);
                    e.dataTransfer.setData('text/icon', iconName);
                    e.dataTransfer.effectAllowed = 'copy';
                    menuItem.classList.add('dragging');
                });

                menuItem.addEventListener('dragend', () => {
                    menuItem.classList.remove('dragging');
                });
            });

            console.log(`Setup drag and drop for ${sidebarSubmenus.length} menu items`);
        }, 1000);
    }

    function navigateToModule(moduleName) {
        const sidebarItems = document.querySelectorAll('.sidebar .submenu ul li a');
        const targetItem = Array.from(sidebarItems).find(item =>
            item.textContent.trim() === moduleName
        );

        if (targetItem) {
            targetItem.click();
            showNotification(`Navigating to ${moduleName}...`, 'info');
        } else {
            showNotification(`Would navigate to: ${moduleName}`, 'info');
        }
    }

    function updatePlaceholderVisibility() {
        const hasShortcuts = shortcutArea.querySelectorAll('.shortcut-item').length > 0;
        if (hasShortcuts) {
            placeholder.classList.add('hidden');
        } else {
            placeholder.classList.remove('hidden');
        }
    }
}

function handleDropdownSelection(type, value) {
    console.log(`${type} selection changed to:`, value);
    // Add your logic here to handle dropdown selections
}