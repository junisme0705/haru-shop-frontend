document.addEventListener('DOMContentLoaded', async () => {
    // TẠO TÊN KHO LƯU TRỮ DỰA TRÊN EMAIL ĐANG ĐĂNG NHẬP
    const userEmail = localStorage.getItem('user_email') || 'guest';
    const WISHLIST_KEY = 'wishlist_' + userEmail;

    let productMap = {};
    try {
        const res = await fetch('http://localhost:3000/api/products');
        const products = await res.json();
        products.forEach(p => {
            productMap[p.name] = p.id;
        });
    } catch (e) {
        console.log("Không tải được Database");
    }

    document.addEventListener('click', function (e) {
        const wishlistBtn = e.target.closest('.add-to-wishlist');

        if (wishlistBtn) {
            e.preventDefault();

            const productData = {
                id: wishlistBtn.dataset.id,
                name: wishlistBtn.dataset.name,
                price: wishlistBtn.dataset.price,
                image: wishlistBtn.dataset.image
            };

            let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

            const isExist = wishlist.some(item => item.name === productData.name);

            if (!isExist) {
                wishlist.push(productData);
                localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
                wishlistBtn.classList.add('active');
                showToast('Đã thêm vào yêu thích!');
            } else {
                wishlist = wishlist.filter(item => item.name !== productData.name);
                localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
                wishlistBtn.classList.remove('active');
                showToast('Đã xóa khỏi yêu thích!');
            }

            updateWishlistCount();
            if (document.getElementById('wishlist-grid')) {
                renderWishlistPage();
            }
        }
    });

    function showToast(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast show success';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function updateWishlistCount() {
        const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
        const countBadge = document.getElementById('wishlist-count');
        if (countBadge) {
            countBadge.innerText = wishlist.length;
        }
    }

    function renderWishlistPage() {
        const wishlistGrid = document.getElementById('wishlist-grid');
        const emptyMsg = document.getElementById('empty-wishlist-msg');

        if (!wishlistGrid) return;

        let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

        if (wishlist.length === 0) {
            wishlistGrid.style.display = 'none';
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        wishlistGrid.style.display = 'grid';
        wishlistGrid.innerHTML = '';

        wishlist.forEach(item => {
            const card = document.createElement('div');
            card.className = 'collection-product-card';

            const formattedPrice = isNaN(Number(item.price)) ? item.price : Number(item.price).toLocaleString('vi-VN') + ' Đ';

            let prodId = item.id;
            if (!prodId || prodId === 'undefined') {
                prodId = productMap[item.name] || '';
            }

            let imgSrc = item.image;
            if (imgSrc && !imgSrc.startsWith('../')) {
                imgSrc = '../' + imgSrc;
            }

            card.innerHTML = `
                <div class="card-image" style="position: relative; padding: 10px;">
                    <button class="add-to-wishlist active" data-id="${prodId}" data-name="${item.name}" data-price="${item.price}" data-image="${item.image}" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(255,255,255,0.8); border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">
                        <i class="fas fa-times" style="color: #333;"></i>
                    </button>
                    <button class="quick-add-btn btn-quick-view" data-id="${prodId}">THÊM NHANH</button>
                    <a href="ProductDetail.HTML?id=${prodId}" style="display: block;">
                        <img src="${imgSrc}" alt="${item.name}" style="width: 100%; height: auto; display: block;">
                    </a>
                </div>
                <div class="card-details" style="padding: 15px;">
                    <h4 class="card-title" style="margin: 0 0 10px 0; font-size: 16px;">
                        <a href="ProductDetail.HTML?id=${prodId}" style="color: #000; text-decoration: none;">${item.name}</a>
                    </h4>
                    <div class="card-price" style="font-weight: bold; font-size: 16px;">${formattedPrice}</div>
                </div>
            `;
            wishlistGrid.appendChild(card);
        });
    }

    updateWishlistCount();
    renderWishlistPage();
});