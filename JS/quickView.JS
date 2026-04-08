/* =======================================
   SCRIPT CHO QUICK VIEW MODAL (FINAL FIX)
   (File: JS/quickView.JS)
======================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy các thành phần của Popup Quick View
    const qvOverlay = document.getElementById('quick-view-overlay');
    const qvCloseBtn = document.getElementById('quick-view-close-btn');

    const qvImg = document.getElementById('qv-main-img');
    const qvTitle = document.getElementById('qv-title');
    const qvPrice = document.getElementById('qv-price');
    const qvModelList = document.getElementById('qv-model-list');
    const qvColorList = document.getElementById('qv-color-list');
    const qvModelText = document.getElementById('qv-selected-model');
    const qvColorText = document.getElementById('qv-selected-color');

    const qtyInput = document.getElementById('qv-input-qty');
    const btnMinus = document.getElementById('qv-qty-minus');
    const btnPlus = document.getElementById('qv-qty-plus');

    const btnAddToCart = document.getElementById('qv-add-to-cart');
    const btnViewDetails = document.getElementById('qv-view-details');

    let currentProduct = null;
    let selectedModel = '';
    let selectedColor = '';
    let currentPrice = 0;
    let quantity = 1;
    let qvImages = []; // Mảng chứa ảnh màu sắc mới thêm

    // 2. Bắt sự kiện bấm "THÊM NHANH" (Class cũ của bạn: quick-add-btn)
    document.body.addEventListener('click', async (e) => {
        // Hỗ trợ cả 2 trường hợp: Click thẳng vào nút hoặc click vào text/icon bên trong nút
        const btn = e.target.closest('.quick-add-btn') || e.target.closest('.reco-quick-add');
        if (btn) {
            e.preventDefault();
            const productId = btn.getAttribute('data-id');
            if (productId) {
                await openQuickView(productId);
            } else {
                alert("Lỗi: Nút này chưa được gắn ID sản phẩm (data-id)");
            }
        }
    });

    // 3. Hàm gọi API từ Database và hiển thị Popup
    async function openQuickView(id) {
        try {
            // Lôi dữ liệu từ Server
            const res = await fetch(`http://localhost:3000/api/products/${id}`);
            const product = await res.json();

            if (!product || product.error) {
                alert("Không tìm thấy thông tin sản phẩm này.");
                return;
            }

            // Ép kiểu an toàn (Bổ sung từ code mới)
            if (product.colors && typeof product.colors === 'string') {
                try { product.colors = JSON.parse(product.colors); } catch (err) { product.colors = []; }
            }
            if (product.models && typeof product.models === 'string') {
                try { product.models = JSON.parse(product.models); } catch (err) { product.models = []; }
            }

            currentProduct = product;

            // Reset dữ liệu về mặc định
            quantity = 1;
            qtyInput.value = quantity;
            qvTitle.innerText = product.name;
            btnViewDetails.href = `ProductDetail.HTML?id=${product.id}`;

            // Nạp mảng ảnh (Bổ sung từ code mới)
            qvImages = [];
            if (product.colors && product.colors.length > 0) {
                product.colors.forEach(c => {
                    let img = c.image || product.image;
                    if (img) qvImages.push(img.startsWith('../') ? img : '../' + img);
                });
            } else if (product.image) {
                qvImages.push(product.image.startsWith('../') ? product.image : '../' + product.image);
            }

            // Xử lý Danh sách Model (Cũ giữ nguyên)
            if (product.models && product.models.length > 0) {
                selectedModel = product.models[0].name;
                currentPrice = product.models[0].price;
                qvModelText.innerText = selectedModel;

                qvModelList.innerHTML = product.models.map((m, index) => `
                    <button class="model-btn option-btn ${index === 0 ? 'active' : ''}" 
                            data-name="${m.name}" data-price="${m.price}">${m.name}</button>
                `).join('');
            } else {
                selectedModel = 'Mặc định';
                currentPrice = product.price;
                qvModelText.innerText = '';
                qvModelList.innerHTML = '<span style="font-size:13px; color:#999;">Không có tuỳ chọn</span>';
            }

            // ==========================================
            // XỬ LÝ DANH SÁCH MÀU SẮC DẠNG ẢNH NHỎ
            // ==========================================
            if (product.colors && product.colors.length > 0) {
                selectedColor = product.colors[0].name;
                qvColorText.innerText = selectedColor;

                qvColorList.innerHTML = product.colors.map((c, index) => {
                    let imgSrc = c.image && c.image.startsWith('../') ? c.image : '../' + (c.image || product.image);
                    return `
                    <button class="color-variant-btn ${index === 0 ? 'active' : ''}" 
                            data-name="${c.name}" data-index="${index}" title="${c.name}">
                        <img src="${imgSrc}" alt="${c.name}">
                    </button>
                    `;
                }).join('');
            } else {
                selectedColor = 'Mặc định';
                qvColorText.innerText = '';
                qvColorList.innerHTML = '<span style="font-size:13px; color:#999;">Không có tuỳ chọn</span>';
            }

            // Hiển thị Ảnh chính và Giá tiền
            qvImg.src = qvImages[0] || '';
            updatePrice();

            // Kích hoạt tính năng click chọn màu/model (Gọi lại để gắn event cho các thẻ vừa tạo)
            bindOptionEvents();

            // Hiện Popup ra giữa màn hình
            qvOverlay.classList.add('active');

        } catch (error) {
            console.error("Lỗi tải dữ liệu Quick View:", error);
            alert("Lỗi kết nối Server! Vui lòng kiểm tra lại Node.js");
        }
    }

    // 4. Kịch bản khi người dùng bấm chọn Model hoặc Color
    function bindOptionEvents() {
        // Khách bấm chọn Model
        qvModelList.querySelectorAll('.model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                qvModelList.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                selectedModel = e.target.getAttribute('data-name');
                currentPrice = e.target.getAttribute('data-price');
                qvModelText.innerText = selectedModel;
                updatePrice();
            });
        });

        // ==========================================
        // KHÁCH BẤM CHỌN MÀU (DẠNG ẢNH)
        // ==========================================
        qvColorList.querySelectorAll('.color-variant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.color-variant-btn');
                if (!targetBtn) return;

                qvColorList.querySelectorAll('.color-variant-btn').forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');

                selectedColor = targetBtn.getAttribute('data-name');
                qvColorText.innerText = selectedColor;

                // Tự động đổi ảnh tương ứng với màu
                const idx = parseInt(targetBtn.getAttribute('data-index'));
                if (!isNaN(idx) && qvImages[idx]) {
                    qvImg.src = qvImages[idx];
                }
            });
        });
    }

    // 5. Hàm tính toán và hiển thị giá
    function updatePrice() {
        qvPrice.innerText = Number(currentPrice).toLocaleString('vi-VN') + ' Đ';
    }

    // 6. Nút tăng giảm số lượng
    if (btnMinus) btnMinus.addEventListener('click', () => { if (quantity > 1) { quantity--; qtyInput.value = quantity; } });
    if (btnPlus) btnPlus.addEventListener('click', () => { quantity++; qtyInput.value = quantity; });

    // 7. CHỐT ĐƠN - Gửi dữ liệu vào Giỏ hàng (Database)
    if (btnAddToCart) {
        btnAddToCart.addEventListener('click', async () => {
            if (!currentProduct) return;

            // --- BẮT ĐẦU FIX LỖI EMAIL: Lấy email động theo tài khoản đang đăng nhập ---
            let userEmail = null;
            try {
                const user = JSON.parse(localStorage.getItem('haru-current-user'));
                if (user && user.email) userEmail = user.email;
            } catch (e) { }

            // Backup phòng trường hợp
            if (!userEmail) userEmail = localStorage.getItem('user_email') || localStorage.getItem('email');

            // Chặn nếu chưa đăng nhập
            if (!userEmail) {
                if (typeof showToast === 'function') {
                    showToast("Vui lòng đăng nhập để mua hàng!", false);
                } else {
                    alert("Vui lòng đăng nhập để mua hàng!");
                }
                setTimeout(() => window.location.href = 'Login.HTML', 1500);
                return;
            }
            // --- KẾT THÚC FIX LỖI EMAIL ---

            const originalText = btnAddToCart.innerText;
            btnAddToCart.innerText = "ĐANG THÊM VÀO GIỎ...";
            btnAddToCart.style.opacity = "0.7";

            try {
                const response = await fetch('http://localhost:3000/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_email: userEmail, // SỬ DỤNG EMAIL ĐỘNG Ở ĐÂY
                        product_id: currentProduct.id,
                        quantity: quantity,
                        selected_model: selectedModel,
                        selected_color: selectedColor
                    })
                });
                const result = await response.json();

                if (result.success) {
                    qvOverlay.classList.remove('active'); // Tắt popup

                    let variantInfo = [];
                    if (selectedModel && selectedModel !== 'Mặc định') variantInfo.push(selectedModel);
                    if (selectedColor && selectedColor !== 'Mặc định') variantInfo.push(selectedColor);

                    let displayName = currentProduct.name;
                    if (variantInfo.length > 0) {
                        displayName += ` (${variantInfo.join(' - ')})`;
                    }

                    if (typeof showToast === 'function') {
                        showToast(`Đã thêm ${displayName} vào giỏ!`);
                    } else {
                        const toastContainer = document.getElementById('toast-container');
                        if (toastContainer) {
                            toastContainer.innerHTML = `<div class="toast success">Đã thêm ${displayName} vào giỏ hàng!</div>`;
                            setTimeout(() => toastContainer.innerHTML = '', 3000);
                        }
                    }

                    if (typeof loadCartFromDB === 'function') {
                        loadCartFromDB();
                    } else {
                        setTimeout(() => { window.location.reload(); }, 1000);
                    }
                }
            } catch (error) {
                console.error("Lỗi thêm vào giỏ:", error);
                if (typeof showToast === 'function') showToast("Lỗi kết nối khi thêm vào giỏ hàng!");
            } finally {
                btnAddToCart.innerText = originalText;
                btnAddToCart.style.opacity = "1";
            }
        });
    }

    // 8. Chức năng tắt Popup
    if (qvCloseBtn) qvCloseBtn.addEventListener('click', () => qvOverlay.classList.remove('active'));
    if (qvOverlay) qvOverlay.addEventListener('click', (e) => {
        if (e.target === qvOverlay) qvOverlay.classList.remove('active');
    });
});