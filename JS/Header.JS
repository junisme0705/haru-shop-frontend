/* =======================================
   SCRIPT CHO HEADER (MENU, CUỘN TRANG, HIỂN THỊ USER, SEARCH)
   (File: JS/Header.JS)
   ======================================= */

// --- KHAI BÁO BIẾN TOÀN CỤC ---
const body = document.body;
const cartIcon = document.getElementById('header-cart-icon');
const miniCart = document.getElementById('mini-cart');
const cartClose = document.getElementById('cart-close-btn');
const cartOverlay = document.querySelector('.cart-overlay');
const searchIcon = document.getElementById('header-search-icon');
const searchOverlay = document.getElementById('search-overlay');
const searchClose = document.getElementById('search-close-btn');

// --- CHẠY MỌI THỨ SAU KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {

    // 1. STICKY HEADER
    const header = document.querySelector('.main-header');
    const stickyThreshold = 80;
    window.addEventListener('scroll', () => {
        if (window.scrollY > stickyThreshold) {
            if (header) header.classList.add('sticky');
        } else {
            if (header) header.classList.remove('sticky');
        }
    });

    // 2. MOBILE NAVIGATION
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.header-nav');
    const navClose = document.querySelector('.nav-close-btn');
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        body.appendChild(overlay);
    }

    function closeMobileMenu() {
        if (nav) nav.classList.remove('nav-active');
        if (overlay) overlay.classList.remove('active');
        body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (nav) nav.classList.add('nav-active');
            if (overlay) overlay.classList.add('active');
            body.style.overflow = 'hidden';
        });
    }
    if (navClose) navClose.addEventListener('click', closeMobileMenu);
    if (overlay) overlay.addEventListener('click', closeMobileMenu);
    if (nav) {
        const navLinks = nav.querySelectorAll('a:not(.nav-item-dropdown > a)');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // 3. MOBILE SUBMENU TOGGLE
    const dropdownParentLink = document.querySelector('.nav-item-dropdown > a');
    if (dropdownParentLink) {
        dropdownParentLink.addEventListener('click', function (e) {
            const isMobileMenuOpen = document.querySelector('.header-nav.nav-active');
            if (isMobileMenuOpen) {
                e.preventDefault();
                e.stopPropagation();
                const submenu = this.nextElementSibling;
                if (submenu) {
                    if (submenu.style.display === 'flex') {
                        submenu.style.display = 'none';
                        this.querySelector('.dropdown-arrow').style.transform = 'rotate(0deg)';
                    } else {
                        submenu.style.display = 'flex';
                        this.querySelector('.dropdown-arrow').style.transform = 'rotate(180deg)';
                    }
                }
            }
        });
    }

    // ==========================================
    // 4. HIỂN THỊ TRẠNG THÁI & LOGIC ĐĂNG XUẤT (ĐÃ NÂNG CẤP)
    // ==========================================
    const loggedOutMenu = document.getElementById('user-menu-logged-out');
    const loggedInMenu = document.getElementById('user-menu-logged-in');

    // Lấy thông tin user từ LocalStorage
    const currentUserJSON = localStorage.getItem('haru-current-user');

    if (currentUserJSON) {
        try {
            const currentUser = JSON.parse(currentUserJSON);
            if (loggedOutMenu) loggedOutMenu.style.display = 'none';
            if (loggedInMenu) loggedInMenu.style.display = 'block';

            const usernameElement = document.getElementById('current-username');
            if (usernameElement && currentUser.username) {
                usernameElement.innerText = `Chào, ${currentUser.username}`;
                usernameElement.style.fontSize = '16px';
                usernameElement.style.fontWeight = 'bold';
            }

            // ==========================================
            // LOGIC PHÂN QUYỀN ADMIN (CHỈ CHỦ SHOP MỚI THẤY NÚT QUẢN TRỊ)
            // ==========================================
            const adminEmail = 'linn70180@gmail.com'; // Sếp điền đúng email Chủ shop của sếp vào đây nhé

            if (currentUser.email === adminEmail) {
                const dropdownMenu = document.querySelector('#user-menu-logged-in .user-dropdown-menu');

                // Kiểm tra để tránh tạo 2 nút nếu lỡ script chạy 2 lần
                if (dropdownMenu && !document.getElementById('admin-link-btn')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'Admin.HTML';
                    adminLink.className = 'dropdown-item';
                    adminLink.id = 'admin-link-btn';
                    adminLink.innerHTML = '<i class="fas fa-cogs" style="margin-right: 8px;"></i> Quản trị Shop';
                    adminLink.style.color = '#ef4444'; // Tô màu đỏ cho nó quyền lực
                    adminLink.style.fontWeight = 'bold';

                    // Chèn cái nút này lên đầu tiên trong cái menu thả xuống
                    dropdownMenu.insertBefore(adminLink, dropdownMenu.firstChild);
                }
            }

            // Gắn sự kiện Xóa sạch sành sanh cho nút Đăng xuất
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Dọn rác toàn diện để không bị kẹt giỏ hàng
                    localStorage.removeItem('haru-current-user');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('email');
                    localStorage.removeItem('userEmail');

                    // Tải lại trang để về trạng thái khách
                    window.location.href = 'Index.HTML';
                });
            }
        } catch (e) {
            console.error("Lỗi đọc dữ liệu người dùng:", e);
        }
    } else {
        if (loggedInMenu) loggedInMenu.style.display = 'none';
        if (loggedOutMenu) loggedOutMenu.style.display = 'block';
    }
});

// --- CÁC HÀM TOÀN CỤC (TOAST, CART, SEARCH) ---
function showToast(message, isSuccess = true, duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${isSuccess ? 'success' : 'removed'}`;
    toast.innerHTML = `<i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toastContainer.contains(toast)) toastContainer.removeChild(toast); }, 500);
    }, duration);
}

function openMiniCart() {
    if (!miniCart || !cartOverlay) return;
    miniCart.classList.add('active');
    cartOverlay.classList.add('active');
    body.classList.add('cart-open');
}

function closeMiniCart() {
    if (!miniCart || !cartOverlay) return;
    miniCart.classList.remove('active');
    cartOverlay.classList.remove('active');
    body.classList.remove('cart-open');
}

if (cartIcon) cartIcon.addEventListener('click', (e) => { e.preventDefault(); openMiniCart(); });
if (cartClose) cartClose.addEventListener('click', (e) => { e.preventDefault(); closeMiniCart(); });
if (cartOverlay) cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) closeMiniCart(); });

document.addEventListener('cart:added', (event) => {
    const emptyMsg = miniCart.querySelector('.cart-empty-message');
    if (emptyMsg) emptyMsg.style.display = 'none';
    openMiniCart();
});

function openSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('active');
    setTimeout(() => {
        const input = searchOverlay.querySelector('.search-overlay-input');
        if (input) input.focus();
    }, 400);
}

function closeSearchOverlay() {
    if (searchOverlay) searchOverlay.classList.remove('active');
}

if (searchIcon) searchIcon.addEventListener('click', (e) => { e.preventDefault(); openSearchOverlay(); });
if (searchClose) searchClose.addEventListener('click', (e) => { e.preventDefault(); closeSearchOverlay(); });

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('active')) {
        closeSearchOverlay();
    }
});

/* =======================================
   TÍNH NĂNG LIVE SEARCH (BẢN CLEAN CHÍNH THỨC)
   ======================================= */
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-overlay-input');
    const searchForm = document.querySelector('.search-overlay-form');

    if (!searchInput || !searchForm) return;

    let allProducts = [];

    // 1. Tạo khung Dropdown thả xuống
    let resultsContainer = document.getElementById('live-search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'live-search-results';
        resultsContainer.style.cssText = "display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 50vh; overflow-y: auto; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 0 0 8px 8px; z-index: 999; border: 1px solid #eee; border-top: none; text-align: left;";

        searchForm.style.position = 'relative';
        searchForm.appendChild(resultsContainer);
    }

    // 2. Lọc và hiển thị kết quả
    searchInput.addEventListener('input', async (e) => {
        const keyword = e.target.value.toLowerCase().trim();

        if (keyword.length === 0) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
            return;
        }

        resultsContainer.style.display = 'block';

        // Gọi Server ngầm, nếu lỗi thì bỏ qua không in ra màn hình
        if (allProducts.length === 0) {
            try {
                const res = await fetch('http://localhost:3000/api/products');
                if (res.ok) {
                    const data = await res.json();
                    allProducts = Array.isArray(data) ? data : (data.products || data.data || []);
                }
            } catch (err) {
                console.log("Không tải được dữ liệu tìm kiếm.");
                return;
            }
        }

        const filtered = allProducts.filter(p => p.name && p.name.toLowerCase().includes(keyword));

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 15px; color: #666; text-align: center;">Không tìm thấy sản phẩm nào phù hợp.</div>';
            return;
        }

        const isHomePage = window.location.pathname.toLowerCase().includes('index.html') || window.location.pathname.endsWith('/');

        resultsContainer.innerHTML = filtered.map(p => {
            let imgSrc = p.image || '';
            if (imgSrc && !imgSrc.startsWith('../')) imgSrc = '../' + imgSrc;
            if (isHomePage) imgSrc = imgSrc.replace('../', '');

            return `
                <a href="ProductDetail.HTML?id=${p.id}" style="display: flex; align-items: center; gap: 15px; padding: 12px 20px; text-decoration: none; color: #333; border-bottom: 1px solid #f9f9f9; transition: background 0.2s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                    <img src="${imgSrc}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: contain; flex-shrink: 0;">
                    <div style="flex-grow: 1;">
                        <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 500;">${p.name}</h4>
                        <span style="color: #d32f2f; font-weight: bold; font-size: 14px;">${Number(p.price).toLocaleString('vi-VN')} Đ</span>
                    </div>
                </a>
            `;
        }).join('');
    });

    // 3. Đóng khung
    const searchCloseBtn = document.getElementById('search-close-btn');
    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', () => {
            searchInput.value = '';
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
        });
    }

    // 4. Chặn tải lại trang
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });
});