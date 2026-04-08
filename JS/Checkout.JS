document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. MÁY QUÉT EMAIL TỰ ĐỘNG & THIẾT LẬP
    // ==========================================
    function getSafeUserEmail() {
        try {
            const currentUserJSON = localStorage.getItem('haru-current-user');
            if (currentUserJSON) {
                const currentUser = JSON.parse(currentUserJSON);
                if (currentUser && currentUser.email) {
                    return currentUser.email;
                }
            }
        } catch (e) {
            console.error("Lỗi đọc user");
        }
        return localStorage.getItem('user_email') || localStorage.getItem('email');
    }

    const currentUserEmail = getSafeUserEmail();

    // Nếu lọt vào đây mà chưa đăng nhập thì đuổi ra trang Login ngay
    if (!currentUserEmail) {
        alert("Vui lòng đăng nhập để thanh toán!");
        window.location.href = 'Login.HTML';
        return;
    }

    const checkoutForm = document.getElementById('checkout-form');
    const cartItemsContainer = document.querySelector('.checkout-cart-items');

    // Tự động điền email vào form cho khách hàng đỡ mất công gõ
    const emailInputBox = document.getElementById('email');
    if (emailInputBox) {
        emailInputBox.value = currentUserEmail;
    }

    // Các thẻ hiển thị tiền
    const costRows = document.querySelectorAll('.cost-row');
    const subtotalElement = costRows[0].querySelector('span:nth-child(2)');
    const shippingElement = costRows[1].querySelector('span:nth-child(2)');
    const totalElement = document.querySelector('.total-price');
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');

    let subtotal = 0;
    let shippingCost = 30000;

    // ==========================================
    // 2. HÀM KIỂM TRA LỖI FORM (VALIDATION)
    // ==========================================
    function validateField(inputId, groupId) {
        const input = document.getElementById(inputId);
        const group = document.getElementById(groupId);
        if (!input || !group) return true;

        if (input.value.trim() === "") {
            input.classList.add('input-error');
            group.classList.add('has-error');
            return false;
        } else {
            input.classList.remove('input-error');
            group.classList.remove('has-error');
            return true;
        }
    }

    // Tự động xóa viền đỏ khi bắt đầu gõ
    const allInputs = document.querySelectorAll('#checkout-form input');
    allInputs.forEach(input => {
        input.addEventListener('input', function () {
            this.classList.remove('input-error');
            const group = this.closest('.input-group');
            if (group) group.classList.remove('has-error');
        });
    });

    // ==========================================
    // 3. XỬ LÝ KHI BẤM NÚT "THANH TOÁN NGAY" (CÓ MOMO/BANK)
    // ==========================================
    const paymentModal = document.getElementById('payment-modal');
    const closePaymentBtn = document.getElementById('close-payment-btn');
    const btnConfirmPaid = document.getElementById('btn-confirm-paid');
    let pendingOrderData = null; // Biến lưu tạm dữ liệu đơn hàng chờ quét mã xong mới gửi

    // Tắt modal khi bấm nút X
    if (closePaymentBtn) closePaymentBtn.addEventListener('click', () => paymentModal.classList.remove('active'));

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Kiểm tra các trường bắt buộc
            const isEmailOk = validateField('email', 'group-email');
            const isLastNameOk = validateField('lastname', 'group-lastname');
            const isProvinceOk = validateField('province', 'group-province');
            const isDistrictOk = validateField('district', 'group-district');
            const isWardOk = validateField('ward', 'group-ward');
            const isAddressOk = validateField('address', 'group-address');
            const isPhoneOk = validateField('phone', 'group-phone');

            if (isEmailOk && isLastNameOk && isProvinceOk && isDistrictOk && isWardOk && isAddressOk && isPhoneOk) {
                const submitBtn = document.querySelector('.btn-pay-now');

                // Gom dữ liệu
                const fullAddress = `${document.getElementById('address').value.trim()}, ${document.getElementById('ward').value}, ${document.getElementById('district').value}`;
                const cityName = document.getElementById('province').value;
                const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
                const finalTotal = (subtotal - (subtotal * discountPercent / 100)) + shippingCost;

                pendingOrderData = {
                    email: currentUserEmail,
                    lastname: document.getElementById('lastname').value.trim(),
                    address: fullAddress,
                    city: cityName,
                    phone: document.getElementById('phone').value.trim(),
                    shipping_fee: shippingCost,
                    total_amount: finalTotal,
                    payment_method: paymentMethod
                };

                // KIỂM TRA PHƯƠNG THỨC THANH TOÁN
                if (paymentMethod === 'cod') {
                    // Nếu là Tiền mặt -> Xử lý lưu DB luôn
                    submitBtn.innerText = 'Đang xử lý đơn hàng...';
                    submitBtn.disabled = true;
                    await processOrderToServer(pendingOrderData, submitBtn);
                } else {
                    // Nếu là MoMo hoặc Ngân hàng -> Bật bảng QR Code lên
                    const title = document.getElementById('payment-modal-title');
                    const appName = document.getElementById('payment-app-name');

                    if (paymentMethod === 'momo') {
                        title.innerHTML = 'Thanh toán <span style="color:#d82d8b">MoMo</span>';
                        appName.innerText = 'MoMo';
                    } else {
                        title.innerHTML = 'Thanh toán <span style="color:#3b82f6">Ngân Hàng</span>';
                        appName.innerText = 'App Ngân Hàng';
                    }

                    // Hiện số tiền lên bảng
                    document.getElementById('payment-amount-display').innerText = finalTotal.toLocaleString('vi-VN') + ' Đ';

                    // Tạo mã giao dịch ngẫu nhiên cho ngầu (Ví dụ: HARU_17382)
                    document.getElementById('payment-memo').innerText = 'HARU_' + Math.floor(Math.random() * 90000 + 10000);

                    // Mở modal lên
                    paymentModal.classList.add('active');
                }
            } else {
                window.scrollTo({ top: 100, behavior: 'smooth' });
            }
        });
    }

    // Khi khách bấm "TÔI ĐÃ CHUYỂN KHOẢN" trên bảng QR Code
    if (btnConfirmPaid) {
        btnConfirmPaid.addEventListener('click', async () => {
            const originalText = btnConfirmPaid.innerHTML;
            btnConfirmPaid.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác nhận...';
            btnConfirmPaid.disabled = true;

            // Giả vờ chờ 2 giây cho giống đang check hệ thống ngân hàng thật
            setTimeout(async () => {
                const submitBtn = document.querySelector('.btn-pay-now');
                await processOrderToServer(pendingOrderData, submitBtn);

                // Nếu thành công thì web tự chuyển trang rồi, nếu lỗi thì trả lại nút
                btnConfirmPaid.innerHTML = originalText;
                btnConfirmPaid.disabled = false;
                paymentModal.classList.remove('active');
            }, 2000);
        });
    }

    // Hàm gọi API lưu vào Database (Tách ra để xài chung cho cả COD và MoMo)
    async function processOrderToServer(orderData, submitBtn) {
        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();

            if (result.success) {
                alert(`🎉 Đặt hàng thành công! Mã đơn: #${result.orderId}\nHaru Shop sẽ đóng gói và giao đến bạn sớm nhất.`);
                window.location.href = 'Index.HTML';
            } else {
                alert("Lỗi hệ thống: " + result.message);
                if (submitBtn) { submitBtn.innerText = 'Thanh toán ngay'; submitBtn.disabled = false; }
            }
        } catch (error) {
            console.error("Lỗi khi chốt đơn:", error);
            alert("Mất kết nối với máy chủ!");
            if (submitBtn) { submitBtn.innerText = 'Thanh toán ngay'; submitBtn.disabled = false; }
        }
    }

    // ==========================================
    // 4. LẤY DỮ LIỆU TỪ DATABASE VÀ VẼ RA CỘT BÊN PHẢI
    // ==========================================
    async function loadCheckoutCart() {
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${currentUserEmail}`);
            const cartData = await response.json();
            renderCheckoutItems(cartData);
        } catch (error) {
            console.error("Lỗi tải giỏ hàng thanh toán:", error);
        }
    }

    function renderCheckoutItems(cart) {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        subtotal = 0;

        if (!cart || cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="font-size: 14px; color: #737373;">Giỏ hàng của bạn đang trống.</p>';
            updateCosts();
            return;
        }

        cart.forEach(item => {
            subtotal += Number(item.product_price) * item.quantity;
            const formattedPrice = Number(item.product_price).toLocaleString('vi-VN');

            // --- BỌC LẠI BẰNG TRY-CATCH CHO AN TOÀN NHƯ FILE CART.JS ---
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

            // Đảm bảo không bị gãy link ảnh
            let imgSrc = '../IMG/default.png';
            if (finalImage) {
                imgSrc = finalImage.startsWith('../') ? finalImage : '../' + finalImage;
            }

            // --- XỬ LÝ TEXT PHIÊN BẢN / MÀU SẮC ---
            let variantHTML = '';
            let textParts = [];

            if (item.selected_model && item.selected_model !== 'Mặc định' && item.selected_model !== 'undefined') {
                textParts.push(item.selected_model);
            }
            if (item.selected_color && item.selected_color !== 'Mặc định' && item.selected_color !== 'undefined') {
                textParts.push(item.selected_color);
            }

            if (textParts.length > 0) {
                variantHTML = `<p style="font-size: 12px; color: #737373; margin-top: 4px;">${textParts.join(' / ')}</p>`;
            }

            // Gắn HTML
            const itemHTML = `
                <div class="checkout-item">
                    <div class="item-image-wrapper">
                        <img src="${imgSrc}" alt="${item.product_name}">
                        <span class="item-quantity">${item.quantity}</span>
                    </div>
                    <div class="item-info">
                        <h4>${item.product_name}</h4>
                        ${variantHTML} 
                    </div>
                    <div class="item-price">
                        <span style="font-weight: 500;">${formattedPrice} Đ</span>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        updateCosts();
    }

    // ==========================================
    // 5. CẬP NHẬT TỔNG TIỀN VÀ PHÍ VẬN CHUYỂN
    // ==========================================
    function updateCosts() {
        const total = subtotal + shippingCost;
        if (subtotalElement) subtotalElement.innerText = subtotal.toLocaleString('vi-VN') + ' Đ';
        if (shippingElement) shippingElement.innerText = shippingCost.toLocaleString('vi-VN') + ' Đ';
        if (totalElement) totalElement.innerHTML = `<small>VNĐ</small> ${total.toLocaleString('vi-VN')} Đ`;
    }

    shippingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            shippingCost = Number(e.target.value);
            updateCosts();
        });
    });

    // ==========================================
    // 6. XỬ LÝ MÃ GIẢM GIÁ (CALL API TỪ BACKEND)
    // ==========================================
    const btnApplyDiscount = document.querySelector('.btn-apply-discount');
    const discountInput = document.querySelector('.discount-section input');

    let discountPercent = 0;
    let isFreeship = false;
    let appliedCouponCode = null; // Lưu lại mã để mốt gửi lên server lúc đặt hàng nếu cần

    if (btnApplyDiscount && discountInput) {
        btnApplyDiscount.addEventListener('click', async () => {
            const code = discountInput.value.trim().toUpperCase();

            if (code === '') {
                alert('Vui lòng nhập mã giảm giá!');
                return;
            }

            const originalBtnText = btnApplyDiscount.innerText;
            btnApplyDiscount.innerText = "...";
            btnApplyDiscount.disabled = true;

            try {
                // Hỏi Server xem mã này có thật không
                const response = await fetch('http://localhost:3000/api/coupons/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code })
                });

                const data = await response.json();

                if (data.success) {
                    discountPercent = data.discount_percent;
                    isFreeship = data.is_freeship;
                    appliedCouponCode = code;

                    if (isFreeship) {
                        alert('Áp dụng thành công! Bạn được miễn phí vận chuyển.');
                    } else {
                        alert(`Áp dụng thành công! Mã giảm ${discountPercent}% tổng đơn hàng.`);
                    }
                } else {
                    alert(data.message); // Báo lỗi "Mã không tồn tại"
                    discountPercent = 0;
                    isFreeship = false;
                    appliedCouponCode = null;
                }

                updateCosts(); // Cập nhật lại giao diện tính tiền
            } catch (error) {
                console.error("Lỗi kiểm tra mã:", error);
                alert("Lỗi kết nối đến máy chủ!");
            } finally {
                btnApplyDiscount.innerText = originalBtnText;
                btnApplyDiscount.disabled = false;
            }
        });
    }

    // Cập nhật lại Hàm updateCosts (Giữ nguyên y hệt như cũ)
    function updateCosts() {
        const currentShippingMethod = document.querySelector('input[name="shipping"]:checked');
        shippingCost = isFreeship ? 0 : Number(currentShippingMethod.value);

        const discountAmount = (subtotal * discountPercent) / 100;
        const total = (subtotal - discountAmount) + shippingCost;

        if (subtotalElement) subtotalElement.innerText = subtotal.toLocaleString('vi-VN') + ' Đ';

        if (shippingElement) {
            if (isFreeship) {
                shippingElement.innerHTML = '<span style="color: #28a745; font-weight: bold;">Miễn phí</span>';
            } else {
                shippingElement.innerText = shippingCost.toLocaleString('vi-VN') + ' Đ';
            }
        }

        if (totalElement) {
            totalElement.innerHTML = `
                ${discountAmount > 0 ? `<div style="font-size: 14px; color: #e74c3c; margin-bottom: 5px;">- Giảm giá: ${discountAmount.toLocaleString('vi-VN')} Đ</div>` : ''}
                <small>VNĐ</small> ${total.toLocaleString('vi-VN')} Đ
            `;
        }
    }


    // ==========================================
    // 7. GỌI API TỈNH/THÀNH PHỐ VIỆT NAM
    // ==========================================
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    if (provinceSelect && districtSelect && wardSelect) {
        let localData = [];

        // Lấy dữ liệu từ API miễn phí
        fetch('https://provinces.open-api.vn/api/?depth=3')
            .then(res => res.json())
            .then(data => {
                localData = data;
                data.forEach(p => {
                    provinceSelect.innerHTML += `<option value="${p.name}" data-code="${p.code}">${p.name}</option>`;
                });
            })
            .catch(err => console.error("Lỗi tải dữ liệu tỉnh thành:", err));

        // Khi khách chọn Tỉnh/Thành
        provinceSelect.addEventListener('change', function () {
            districtSelect.innerHTML = '<option value="">Chọn Quận / Huyện *</option>';
            wardSelect.innerHTML = '<option value="">Chọn Phường / Xã *</option>';
            wardSelect.disabled = true;

            const selectedCode = this.options[this.selectedIndex].getAttribute('data-code');
            if (selectedCode) {
                const province = localData.find(p => p.code == selectedCode);
                province.districts.forEach(d => {
                    districtSelect.innerHTML += `<option value="${d.name}" data-code="${d.code}">${d.name}</option>`;
                });
                districtSelect.disabled = false;
            } else {
                districtSelect.disabled = true;
            }
        });

        // Khi khách chọn Quận/Huyện
        districtSelect.addEventListener('change', function () {
            wardSelect.innerHTML = '<option value="">Chọn Phường / Xã *</option>';

            const selectedCode = this.options[this.selectedIndex].getAttribute('data-code');
            if (selectedCode) {
                const provCode = provinceSelect.options[provinceSelect.selectedIndex].getAttribute('data-code');
                const province = localData.find(p => p.code == provCode);
                const district = province.districts.find(d => d.code == selectedCode);

                district.wards.forEach(w => {
                    wardSelect.innerHTML += `<option value="${w.name}">${w.name}</option>`;
                });
                wardSelect.disabled = false;
            } else {
                wardSelect.disabled = true;
            }
        });
    }

    // Khởi chạy khi vừa vào trang Checkout
    loadCheckoutCart();
});