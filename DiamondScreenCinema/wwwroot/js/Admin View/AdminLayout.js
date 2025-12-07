$(document).ready(function () {
    var pathSegments = window.location.pathname.split('/');
    var currentPage = (pathSegments[pathSegments.length - 1] || '').toLowerCase();

    $('.menu, .menu-dashboard').each(function () {
        var page = ($(this).data('page') || '').toLowerCase();
        if (page && currentPage.includes(page)) {
            $(this).addClass('active active-by-url');
        }
    });

    $('.submenu ul').hide();
    $('.submenu .loader').hide();

    $('.menu').on('click', function (e) {
        if ($(e.target).closest('.submenu').length) return;

        var $this = $(this);
        var $submenu = $this.find('.submenu ul');
        var $loader = $this.find('.loader');

        if ($submenu.is(':visible')) {
            if ($this.hasClass('active-by-url')) {
                closeCurrentPageSubmenu($this, $submenu);
            } else {
                closeSubmenuWithAnimation($this, $submenu);
            }
        } else {
            if ($loader.length) $loader.css('display', 'flex');

            $submenu.hide().removeClass('hiding').addClass('showing');
            setTimeout(function () {
                if ($loader.length) $loader.hide();
                $submenu.stop(true, true).slideDown(250, function () {
                    $(this).removeClass('showing');
                });
            }, 250);

            $this.addClass('active');

            $('.menu').not($this).each(function () {
                var $otherSubmenu = $(this).find('.submenu ul');
                if ($otherSubmenu.is(':visible')) {
                    if ($(this).hasClass('active-by-url')) {
                        closeCurrentPageSubmenu($(this), $otherSubmenu);
                    } else {
                        closeSubmenuWithAnimation($(this), $otherSubmenu);
                    }
                }
            });
        }
    });

    function closeSubmenuWithAnimation($menu, $submenu) {
        $submenu.removeClass('showing').addClass('hiding');
        $menu.addClass('closing-menu');

        $submenu.stop(true, true).animate({
            opacity: 0
        }, 200, function () {
            $(this).slideUp(150, function () {
                $(this).removeClass('hiding').css('opacity', '1').hide();
                $menu.removeClass('closing-menu active');
            });
        });

        $menu.find('.loader').hide();
    }

    function closeCurrentPageSubmenu($menu, $submenu) {
        $submenu.removeClass('showing').addClass('hiding');

        $submenu.stop(true, true).animate({
            opacity: 0.7
        }, 150, function () {
            $(this).slideUp(100, function () {
                $(this).removeClass('hiding').css('opacity', '1').hide();
            });
        });

        $menu.find('.loader').hide();
    }

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.menu').length && !$(e.target).closest('.submenu').length) {
            $('.menu').each(function () {
                var $submenu = $(this).find('.submenu ul');
                if ($submenu.is(':visible') && !$(this).hasClass('active-by-url')) {
                    closeSubmenuWithAnimation($(this), $submenu);
                }
            });
        }
    });

    $('.theme-toggle').click(function () {
        $('body').toggleClass('dark');

        let icon = $('.theme-icon');

        if ($('body').hasClass('dark')) {
            icon.text('dark_mode');
            localStorage.setItem("theme", "dark");
        } else {
            icon.text('clear_day');
            localStorage.setItem("theme", "light");
        }
    });

    if (localStorage.getItem("theme") === "dark") {
        $('body').addClass('dark');
        $('.theme-icon').text('dark_mode');
    }
});

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
            background: ${type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
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

    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
    });

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);

    document.body.appendChild(notification);
}