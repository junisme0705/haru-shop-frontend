document.addEventListener('DOMContentLoaded', () => {

    const cartOverlay = document.querySelector('.cart-overlay');
    const miniCart = document.getElementById('mini-cart');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const headerCartIcon = document.getElementById('header-cart-icon');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartCountBadge = document.getElementById('cart-count');
    const emptyMessage = document.querySelector('.cart-empty-message');

    // ==========================================
    // 1. MÁY QUÉT EMAIL THÔNG MINH (TRỊ LỖI MẤT TRÍ NHỚ)
    // ==========================================
    function getSafeUserEmail() {
        // 1. Tìm trực tiếp các tên phổ biến
        let directEmail = localStorage.getItem('user_email') || localStorage.getItem('email') || localStorage.getItem('userEmail');
        if (directEmail && !directEmail.startsWith('{')) return directEmail.replace(/['"]/g, '');

        // 2. Lục lọi bên trong các Object (như 'user', 'currentUser')
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            try {
                let data = JSON.parse(localStorage.getItem(key));
                if (data && typeof data === 'object' && data.email) {
                    return data.email;
                }
            } catch (e) { }
        }
        return null;
    }

    // ==========================================
    // 2. XỬ LÝ ĐÓNG / MỞ GIỎ HÀNG
    // ==========================================
    if (headerCartIcon) {
        headerCartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            miniCart.classList.add('open');
            if (cartOverlay) cartOverlay.classList.add('open');
            loadCartFromDB(); // Mỗi lần mở là lấy data mới nhất
        });
    }

    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', () => {
            miniCart.classList.remove('open');
            if (cartOverlay) cartOverlay.classList.remove('open');
        });
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => {
            miniCart.classList.remove('open');
            cartOverlay.classList.remove('open');
        });
    }

    // --- BẮT SỰ KIỆN: TĂNG/GIẢM SỐ LƯỢNG ---
    document.addEventListener('click', async function (e) {
        const btnQty = e.target.closest('.btn-qty');
        if (btnQty) {
            const id = btnQty.getAttribute('data-id');
            const currentQty = parseInt(btnQty.getAttribute('data-qty'));
            const action = btnQty.getAttribute('data-action');

            let newQty = action === 'plus' ? currentQty + 1 : currentQty - 1;

            if (newQty < 1) {
                await removeFromCartDB(id);
            } else {
                await updateQuantityDB(id, newQty);
            }
        }
    });

    // ==========================================
    // 3. CÁC HÀM GỌI API (ĐÃ NÂNG CẤP)
    // ==========================================
    window.addToCartDB = async function (productId, quantity = 1, selectedColor = 'Mặc định', selectedModel = 'Mặc định') {
        const userEmail = getSafeUserEmail(); // Quét lại email trước khi thêm
        if (!userEmail) {
            showToast("Vui lòng đăng nhập để mua hàng!");
            setTimeout(() => window.location.href = 'Login.HTML', 1500);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: userEmail,
                    product_id: productId,
                    quantity: quantity,
                    selected_color: selectedColor,
                    selected_model: selectedModel
                })
            });

            const result = await response.json();
            if (result.success) {
                showToast("Đã thêm vào giỏ hàng!");
                loadCartFromDB();
            } else {
                showToast("Lỗi khi thêm vào giỏ hàng!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    window.loadCartFromDB = async function () {
        const userEmail = getSafeUserEmail(); // Quét lại email mỗi lần tải
        if (!cartItemsList) return;
        if (!userEmail) {
            renderCartUI([]); // Nếu chưa đăng nhập thì hiện giỏ hàng trống
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/cart/${userEmail}`);
            const cartData = await response.json();
            renderCartUI(cartData);
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    async function updateQuantityDB(id, newQuantity) {
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });
            const result = await response.json();
            if (result.success) loadCartFromDB();
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    async function removeFromCartDB(id) {
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) loadCartFromDB();
        } catch (error) {
            console.error("Lỗi:", error);
        }
    }

    // ==========================================
    // 4. HÀM VẼ GIAO DIỆN GIỎ HÀNG
    // ==========================================
    function renderCartUI(cart) {
        if (!cart || cart.length === 0) {
            cartItemsList.innerHTML = '';
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (cartCountBadge) cartCountBadge.innerText = '0';
            if (cartTotalPrice) cartTotalPrice.innerText = '0 Đ';
            return;
        }

        if (emptyMessage) emptyMessage.style.display = 'none';

        cartItemsList.innerHTML = '';
        let total = 0;
        let count = 0;

        cart.forEach(item => {
            total += Number(item.product_price) * item.quantity;
            count += item.quantity;

            const li = document.createElement('li');
            li.className = 'cart-item';
            li.style.cssText = 'display: flex; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;';

            const formattedPrice = Number(item.product_price).toLocaleString('vi-VN');

            // --- ĐÃ BỌC LẠI CHỐNG LỖI JSON.PARSE CHO MÀU SẮC ---
            let finalImage = item.product_image;
            if (item.product_colors && item.selected_color && item.selected_color !== 'Mặc định') {
                try {
                    const colorsArray = typeof item.product_colors === 'string' ? JSON.parse(item.product_colors) : item.product_colors;
                    if (Array.isArray(colorsArray) && colorsArray.length > 0) {
                        const variantColorData = colorsArray.find(c => c.name === item.selected_color);
                        if (variantColorData && variantColorData.image) {
                            finalImage = variantColorData.image;
                        }
                    }
                } catch (e) {
                    console.error("Lỗi đọc màu sắc:", e);
                }
            }

            const imgSrc = finalImage.startsWith('../') ? finalImage : '../' + finalImage;

            let variantHTML = '';
            let textParts = [];
            if (item.selected_model && item.selected_model !== 'Mặc định' && item.selected_model !== 'undefined') textParts.push(item.selected_model);
            if (item.selected_color && item.selected_color !== 'Mặc định' && item.selected_color !== 'undefined') textParts.push(item.selected_color);
            if (textParts.length > 0) variantHTML = `<p class="item-variant" style="font-size: 12px; color: #777; margin: 0 0 5px 0;">${textParts.join(' - ')}</p>`;

            li.innerHTML = `
                <img src="${imgSrc}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px;">
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0 0 5px 0; font-size: 14px;">${item.product_name}</h4>
                    ${variantHTML} 
                    <div style="font-weight: bold; font-size: 14px; color: #d9534f;">${formattedPrice} Đ</div>
                    <div style="display: flex; align-items: center; margin-top: 8px; border: 1px solid #ddd; width: fit-content; border-radius: 4px; overflow: hidden;">
                        <button class="btn-qty" data-action="minus" data-id="${item.id}" data-qty="${item.quantity}" style="background: #f8f9fa; border: none; border-right: 1px solid #ddd; padding: 4px 10px; cursor: pointer;">-</button>
                        <span style="padding: 0 12px; font-size: 13px; font-weight: bold;">${item.quantity}</span>
                        <button class="btn-qty" data-action="plus" data-id="${item.id}" data-qty="${item.quantity}" style="background: #f8f9fa; border: none; border-left: 1px solid #ddd; padding: 4px 10px; cursor: pointer;">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" style="background: none; border: none; color: #ff4d4f; cursor: pointer; font-size: 16px; margin-left: 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItemsList.appendChild(li);
        });

        if (cartCountBadge) cartCountBadge.innerText = count;
        if (cartTotalPrice) cartTotalPrice.innerText = total.toLocaleString('vi-VN') + ' Đ';

        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                await removeFromCartDB(id);
            });
        });
    }

    window.showToast = function (message) {
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

    const btnThanhToan = document.querySelector('.btn-thanh-toan');
    if (btnThanhToan) {
        btnThanhToan.addEventListener('click', () => {
            if (!getSafeUserEmail()) {
                showToast("Vui lòng đăng nhập để thanh toán!");
                return;
            }
            window.location.href = 'Checkout.HTML';
        });
    }

    // Kích hoạt nạp dữ liệu khi vừa mở trang
    loadCartFromDB();
});