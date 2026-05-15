document.addEventListener('DOMContentLoaded', async () => {
    // Lấy ID sản phẩm từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.querySelector('.pdp-container').innerHTML = '<h2 style="text-align:center; margin-top:50px;">Không tìm thấy sản phẩm</h2>';
        return;
    }

    let productData = null;
    let selectedModel = '';
    let selectedColor = '';
    let currentPrice = 0;
    let quantity = 1;

    // Biến cho Gallery
    let galleryImages = [];
    let currentImageIndex = 0;

    // Thẻ HTML
    const titleEl = document.getElementById('product-title');
    const priceEl = document.getElementById('product-price');
    const oldPriceEl = document.getElementById('product-old-price');
    const descEl = document.getElementById('product-desc');
    const specsEl = document.getElementById('product-specs');
    const modelContainer = document.getElementById('model-selector');
    const colorContainer = document.getElementById('color-selector');
    const modelText = document.getElementById('selected-model-text');
    const colorText = document.getElementById('selected-color-text');
    const subtotalEl = document.getElementById('subtotal-price');
    const qtyInput = document.getElementById('input-qty');
    const mainImg = document.getElementById('main-product-img');

    // TẢI DỮ LIỆU
    try {
        const res = await fetch(`https://haru-shop-backend-production.up.railway.app/api/products/${productId}`);
        productData = await res.json();

        if (productData.colors && typeof productData.colors === 'string') {
            try {
                productData.colors = JSON.parse(productData.colors);
            } catch (e) {
                console.error("Lỗi đọc dữ liệu màu sắc:", e);
                productData.colors = [];
            }
        }

        renderProduct();
    } catch (err) {
        console.error("Lỗi kết nối Server:", err);
    }

    function renderProduct() {
        if (titleEl) titleEl.innerText = productData.name || 'Đang cập nhật...';

        if (descEl) {
            descEl.innerHTML = productData.description || '';
        }

        if (productData.specs && Array.isArray(productData.specs) && specsEl) {
            specsEl.innerHTML = productData.specs.map(s => `<li>${s}</li>`).join('');
        }

        // Vẽ Models
        if (productData.models && Array.isArray(productData.models) && productData.models.length > 0) {
            selectedModel = productData.models[0].name;
            currentPrice = productData.models[0].price;
            if (modelText) modelText.innerText = selectedModel;
            if (modelContainer) {
                modelContainer.innerHTML = productData.models.map((m, index) => `
                    <button class="model-btn ${index === 0 ? 'active' : ''}" data-name="${m.name}" data-price="${m.price}">
                        ${m.name}
                    </button>
                `).join('');
            }
        } else {
            currentPrice = productData.price || 0;
        }

        // ==========================================
        // VẼ MÀU SẮC DẠNG ẢNH NHỎ (CHUẨN WLMOUSE)
        // ==========================================
        if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
            selectedColor = productData.colors[0].name;
            if (colorText) colorText.innerText = selectedColor;
            if (colorContainer) {
                colorContainer.innerHTML = productData.colors.map((c, index) => `
                    <button class="color-variant-btn ${index === 0 ? 'active' : ''}" 
                            data-name="${c.name}" 
                            data-index="${index}"
                            title="${c.name}">
                        <img src="${c.image && c.image.startsWith('../') ? c.image : '../' + (c.image || productData.image)}" alt="${c.name}">
                    </button>
                `).join('');
            }
        }

        // Vẽ phần Thông tin mở rộng (Extended Info)
        const extendedWrapper = document.getElementById('extended-info-wrapper');
        if (extendedWrapper) {
            if (productData.extended_info) {
                let extInfo = productData.extended_info;
                if (typeof extInfo === 'string') {
                    try { extInfo = JSON.parse(extInfo); } catch (e) { extInfo = null; }
                }

                if (extInfo) {
                    let tableRows = '';
                    if (extInfo.tableSpecs && Array.isArray(extInfo.tableSpecs)) {
                        tableRows = extInfo.tableSpecs.map(spec => `<tr><td>${spec.label}</td><td>${spec.value}</td></tr>`).join('');
                    }

                    let highlightHTML = '';
                    if (extInfo.highlights && Array.isArray(extInfo.highlights)) {
                        highlightHTML = extInfo.highlights.map(hl => `
                            <div class="highlight-item">
                                <h3>${hl.value}</h3>
                                <p>${hl.label}</p>
                            </div>
                        `).join('');
                    }

                    extendedWrapper.innerHTML = `
                        <div class="extended-info-container">
                            <div class="extended-top">
                                <div class="extended-text">
                                    <h4 class="sub-title">${extInfo.subTitle || ''}</h4>
                                    <h2 class="main-title">${extInfo.mainTitle || ''}</h2>
                                    <p class="desc-text">${extInfo.description || ''}</p>
                                </div>
                                <div class="extended-specs-box">
                                    <table class="specs-table">
                                        <tbody>${tableRows}</tbody>
                                    </table>
                                    <div class="view-more-btn">Xem thêm <i class="fas fa-chevron-down"></i></div>
                                </div>
                            </div>
                            <div class="extended-highlights">
                                ${highlightHTML}
                            </div>
                        </div>
                    `;
                } else {
                    extendedWrapper.innerHTML = '';
                }
            } else {
                extendedWrapper.innerHTML = '';
            }
        }

        initImageGallery();
        updatePriceDisplay();
        bindEvents();
    }

    // LOGIC GALLERY
    function initImageGallery() {
        galleryImages = [];

        if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
            productData.colors.forEach(c => {
                let img = c.image || productData.image;
                if (img) {
                    galleryImages.push(img.startsWith('../') ? img : '../' + img);
                }
            });
        } else if (productData.image) {
            let img = productData.image;
            galleryImages.push(img.startsWith('../') ? img : '../' + img);
        }

        currentImageIndex = 0;
        updateGalleryUI();
    }

    function updateGalleryUI() {
        const galleryContainer = document.getElementById('thumbnail-gallery');

        if (!mainImg || galleryImages.length === 0) return;

        mainImg.style.opacity = 0.6;
        setTimeout(() => {
            mainImg.src = galleryImages[currentImageIndex];
            mainImg.style.opacity = 1;
        }, 150);

        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            galleryImages.forEach((imgUrl, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = imgUrl;
                imgEl.className = `thumb-img ${index === currentImageIndex ? 'active' : ''}`;

                imgEl.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateGalleryUI();
                });
                galleryContainer.appendChild(imgEl);
            });

            const activeThumb = galleryContainer.querySelector('.active');
            if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        syncColorSelection(currentImageIndex);
    }

    // ĐỒNG BỘ NÚT CHỌN MÀU BẰNG ẢNH
    function syncColorSelection(index) {
        const colorBtns = document.querySelectorAll('.color-variant-btn'); // Sử dụng class mới
        if (colorBtns.length > 0 && colorBtns[index]) {
            colorBtns.forEach(b => b.classList.remove('active'));
            colorBtns[index].classList.add('active');
            selectedColor = colorBtns[index].getAttribute('data-name');
            if (colorText) colorText.innerText = selectedColor;
        }
    }

    // CÁC SỰ KIỆN NÚT BẤM
    function updatePriceDisplay() {
        const formattedPrice = Number(currentPrice).toLocaleString('vi-VN');
        const oldPrice = Number(currentPrice * 1.2).toLocaleString('vi-VN');
        if (priceEl) priceEl.innerText = formattedPrice + ' Đ';
        if (oldPriceEl) oldPriceEl.innerText = oldPrice + ' Đ';
        const subtotal = Number(currentPrice) * quantity;
        if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString('vi-VN') + ' Đ';
    }

    function bindEvents() {
        document.getElementById('prev-img-btn')?.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
            updateGalleryUI();
        });
        document.getElementById('next-img-btn')?.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
            updateGalleryUI();
        });
        document.getElementById('prev-thumb-btn')?.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
            updateGalleryUI();
        });
        document.getElementById('next-thumb-btn')?.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
            updateGalleryUI();
        });

        document.querySelectorAll('.model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                selectedModel = e.target.getAttribute('data-name');
                currentPrice = e.target.getAttribute('data-price');
                if (modelText) modelText.innerText = selectedModel;
                updatePriceDisplay();
            });
        });

        // XỬ LÝ CLICK NÚT MÀU MỚI
        document.querySelectorAll('.color-variant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.color-variant-btn'); // Tìm đúng thẻ button
                if (!targetBtn) return;

                const targetIndex = parseInt(targetBtn.getAttribute('data-index'));
                if (!isNaN(targetIndex)) {
                    currentImageIndex = targetIndex;
                    updateGalleryUI();
                }
            });
        });

        document.getElementById('btn-qty-minus')?.addEventListener('click', () => {
            if (quantity > 1) { quantity--; if (qtyInput) qtyInput.value = quantity; updatePriceDisplay(); }
        });
        document.getElementById('btn-qty-plus')?.addEventListener('click', () => {
            quantity++; if (qtyInput) qtyInput.value = quantity; updatePriceDisplay();
        });

        document.getElementById('btn-add-to-cart')?.addEventListener('click', async () => {
            try {
                const response = await fetch('https://haru-shop-backend-production.up.railway.app/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_email: 'linn70180@gmail.com',
                        product_id: productId,
                        quantity: quantity,
                        selected_model: selectedModel,
                        selected_color: selectedColor
                    })
                });
                const result = await response.json();
                if (result.success) {
                    console.log(`Đã thêm ${productData.name} vào giỏ!`);
                }
            } catch (error) {
                console.error("Lỗi:", error);
            }
        });

        document.getElementById('btn-buy-now')?.addEventListener('click', () => {
            document.getElementById('btn-add-to-cart').click();
            setTimeout(() => { window.location.href = 'Checkout.HTML'; }, 500);
        });
    }
});

/* ==========================================
   XỬ LÝ ĐÁNH GIÁ SẢN PHẨM (REVIEWS)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Lấy ID sản phẩm từ trên thanh URL (Ví dụ: ?id=18)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const btnOpenReview = document.getElementById('btn-open-review');
    const reviewFormContainer = document.getElementById('review-form-container');
    const submitReviewBtn = document.getElementById('submit-review-btn');
    const reviewErrorMsg = document.getElementById('review-error-msg');

    if (productId) {
        fetchReviews(productId);
    }

    // 1. Hàm tạo số lượng ngôi sao HTML
    function generateStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) starsHtml += '<i class="fas fa-star" style="color: #f5c518;"></i>';
            else starsHtml += '<i class="far fa-star" style="color: #ccc;"></i>';
        }
        return starsHtml;
    }

    // 2. Hàm Tải danh sách đánh giá từ Server
    async function fetchReviews(id) {
        try {
            const res = await fetch(`https://haru-shop-backend-production.up.railway.app/api/products/${id}/reviews`);
            const data = await res.json();

            // Cập nhật điểm trung bình
            document.getElementById('avg-rating-text').innerText = `${data.averageRating}/5`;
            document.getElementById('total-reviews-text').innerText = `(${data.totalReviews} lượt đánh giá)`;
            document.getElementById('avg-stars').innerHTML = generateStars(Math.round(data.averageRating));

            // Render danh sách comment
            const listContainer = document.getElementById('reviews-list-container');
            if (data.reviews.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #777;">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>';
                return;
            }

            listContainer.innerHTML = data.reviews.map(rev => {
                const dateObj = new Date(rev.created_at);
                const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                return `
                    <div class="review-item" style="border-bottom: 1px solid #eaeaea; padding: 20px 0;">
                        <div class="review-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>${rev.username}</strong>
                            <span style="color: #999; font-size: 13px;">${formattedDate}</span>
                        </div>
                        <div class="stars">${generateStars(rev.rating)}</div>
                        <p style="margin-top: 10px; color: #555; line-height: 1.5;">${rev.comment}</p>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error("Lỗi tải đánh giá:", err);
        }
    }

    // HÀM LẤY EMAIL TỪ ĐÚNG KEY "haru-current-user"
    function getLoggedInEmail() {
        // 1. Lấy đúng cái cục dữ liệu từ kho chứa mà sếp đang dùng
        const userDataString = localStorage.getItem('haru-current-user');

        if (userDataString) {
            try {
                // 2. Dịch cái cục chuỗi đó thành Object để lấy ra email
                const userObj = JSON.parse(userDataString);
                return userObj.email; // Kết quả sẽ là babyjun0705@gmail.com
            } catch (error) {
                console.error("Lỗi đọc dữ liệu:", error);
            }
        }

        // 3. Nếu không có gì thì xác nhận là chưa đăng nhập
        return null;
    }

    // 3. Xử lý khi bấm nút "Viết đánh giá"
    btnOpenReview.addEventListener('click', () => {
        const userEmail = getLoggedInEmail();

        if (!userEmail) {
            // Thay vì alert, giờ mình gọi Modal xịn lên
            document.getElementById('login-modal').classList.add('active');
            return;
        }

        // Đã đăng nhập thì mở/đóng form
        reviewFormContainer.style.display = reviewFormContainer.style.display === 'none' ? 'block' : 'none';
    });

    // ------------------------------------------
    // XỬ LÝ 2 NÚT BẤM TRONG BẢNG THÔNG BÁO
    // ------------------------------------------
    document.getElementById('btn-cancel-login').addEventListener('click', () => {
        // Tắt Modal
        document.getElementById('login-modal').classList.remove('active');
    });

    // TẮT MODAL THÀNH CÔNG KHI BẤM NÚT
    document.getElementById('btn-close-success').addEventListener('click', () => {
        document.getElementById('success-modal').classList.remove('active');
    });

    document.getElementById('btn-go-to-login').addEventListener('click', () => {
        // Chuyển hướng sang trang đăng nhập
        window.location.href = 'Login.HTML';
    });


    // ==========================================
    // HIỆU ỨNG DI CHUỘT VÀ CHỌN SAO ĐÁNH GIÁ
    // ==========================================
    const starBtns = document.querySelectorAll('.star-btn');
    const ratingHiddenInput = document.getElementById('review-rating');
    const ratingTextDisplay = document.getElementById('rating-text-display');
    const ratingLabels = ["Tệ", "Không hài lòng", "Bình thường", "Rất tốt", "Tuyệt vời"];

    let selectedRating = 5; // Lưu điểm thực tế đã click chọn (mặc định 5)

    // Hàm tô màu sao từ 1 đến vị trí truyền vào
    function colorizeStars(count) {
        starBtns.forEach(star => {
            const starVal = parseInt(star.getAttribute('data-value'));
            if (starVal <= count) {
                star.classList.remove('far'); // Bỏ sao rỗng
                star.classList.add('fas');    // Thêm sao đặc
                star.style.color = '#f5c518'; // Màu vàng
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
                star.style.color = '#ccc';    // Màu xám
            }
        });
    }

    starBtns.forEach(star => {
        // 1. Khi chuột lướt ngang qua (Hover)
        star.addEventListener('mouseover', function () {
            const hoverValue = parseInt(this.getAttribute('data-value'));
            colorizeStars(hoverValue);
            ratingTextDisplay.innerText = ratingLabels[hoverValue - 1];
            this.style.transform = 'scale(1.2)'; // Phóng to nhẹ cho có tương tác
        });

        // Lướt qua xong thì thu nhỏ lại
        star.addEventListener('mouseout', function () {
            this.style.transform = 'scale(1)';
        });

        // 2. Khi chuột rời khỏi khu vực sao (Trả về trạng thái đã click)
        star.parentElement.addEventListener('mouseleave', function () {
            colorizeStars(selectedRating);
            ratingTextDisplay.innerText = ratingLabels[selectedRating - 1];
        });

        // 3. Khi bấm Click chốt sổ
        star.addEventListener('click', function () {
            selectedRating = parseInt(this.getAttribute('data-value'));
            ratingHiddenInput.value = selectedRating; // Lưu vào thẻ ẩn để gửi lên Server
            colorizeStars(selectedRating);
            ratingTextDisplay.innerText = ratingLabels[selectedRating - 1];
        });
    });

    // 4. Xử lý Gửi Đánh Giá lên Server (Nhớ update lại hàm getLoggedInEmail ở đây)
    submitReviewBtn.addEventListener('click', async () => {
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value.trim();
        const userEmail = getLoggedInEmail(); // <--- Đổi thành hàm getLoggedInEmail

        // ... (Giữ nguyên đoạn code kiểm tra và fetch gửi đánh giá bên dưới của sếp)
        if (!comment) {
            reviewErrorMsg.innerText = "Vui lòng nhập nội dung đánh giá!";
            reviewErrorMsg.style.display = 'block';
            return;
        }

        submitReviewBtn.disabled = true;
        submitReviewBtn.innerText = "Đang gửi...";
        reviewErrorMsg.style.display = 'none';

        try {
            const res = await fetch(`https://haru-shop-backend-production.up.railway.app/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, rating: rating, comment: comment })
            });
            const data = await res.json();

            if (data.success) {
                try {
                    const res = await fetch(`https://haru-shop-backend-production.up.railway.app/api/products/${productId}/reviews`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail, rating: ratingHiddenInput.value, comment: comment })
                    });
                    const data = await res.json();

                    if (data.success) {
                        // XÓA ALERT CŨ, GỌI MODAL XỊN LÊN
                        document.getElementById('success-modal').classList.add('active');

                        // Ẩn form và dọn dẹp sạch sẽ
                        reviewFormContainer.style.display = 'none';
                        document.getElementById('review-comment').value = '';
                        reviewErrorMsg.style.display = 'none'; // Đảm bảo giấu nhẹm cái chữ đỏ đi

                        // Trả dàn sao về lại 5 sao mặc định
                        selectedRating = 5;
                        ratingHiddenInput.value = 5;
                        colorizeStars(5);
                        ratingTextDisplay.innerText = "Tuyệt vời";

                        // Tải lại danh sách comment
                        fetchReviews(productId);
                    } else {
                        reviewErrorMsg.innerText = data.message;
                        reviewErrorMsg.style.display = 'block';
                    }
                } catch (err) {
                    reviewErrorMsg.innerText = "Lỗi kết nối Server!";
                    reviewErrorMsg.style.display = 'block';
                } finally {
                    submitReviewBtn.disabled = false;
                    submitReviewBtn.innerText = "Gửi đánh giá";
                }
            } else {
                reviewErrorMsg.innerText = data.message;
                reviewErrorMsg.style.display = 'block';
            }
        } catch (err) {
            reviewErrorMsg.innerText = "Lỗi kết nối Server!";
            reviewErrorMsg.style.display = 'block';
        } finally {
            submitReviewBtn.disabled = false;
            submitReviewBtn.innerText = "Gửi đánh giá";
        }
    });

    // 4. XỬ LÝ GỬI ĐÁNH GIÁ LÊN SERVER (BẢN CHỐT HẠ)
    submitReviewBtn.addEventListener('click', async () => {
        // Gom dữ liệu tại thời điểm bấm nút
        const ratingHiddenInput = document.getElementById('review-rating');
        const rating = ratingHiddenInput ? ratingHiddenInput.value : 5;
        const comment = document.getElementById('review-comment').value.trim();
        const userEmail = getLoggedInEmail(); // Gọi lại hàm tìm email 

        // Kiểm tra xem đã nhập chữ chưa
        if (!comment) {
            reviewErrorMsg.innerText = "Vui lòng nhập nội dung đánh giá!";
            reviewErrorMsg.style.display = 'block';
            return;
        }

        // Chặn lỗi "rớt" email trước khi gửi lên Server
        if (!userEmail) {
            reviewErrorMsg.innerText = "Lỗi nhận diện tài khoản. Sếp F5 tải lại trang nhé!";
            reviewErrorMsg.style.display = 'block';
            return;
        }

        // Thay đổi nút bấm cho sinh động
        submitReviewBtn.disabled = true;
        submitReviewBtn.innerText = "Đang gửi...";
        reviewErrorMsg.style.display = 'none';

        try {
            // Gửi thẳng lên Server
            const res = await fetch(`https://haru-shop-backend-production.up.railway.app/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, rating: rating, comment: comment })
            });
            const data = await res.json();

            if (data.success) {
                // XÓA ALERT, GỌI MODAL TICK XANH XỊN SÒ
                document.getElementById('success-modal').classList.add('active');

                // Ẩn form nhập liệu và dọn sạch chữ vừa nhập
                reviewFormContainer.style.display = 'none';
                document.getElementById('review-comment').value = '';
                reviewErrorMsg.style.display = 'none';

                // Trả dàn sao về lại 5 sao mặc định
                if (typeof colorizeStars === 'function') {
                    selectedRating = 5;
                    ratingHiddenInput.value = 5;
                    colorizeStars(5);
                    document.getElementById('rating-text-display').innerText = "Tuyệt vời";
                }

                // Tải lại danh sách comment để hiện ngay bình luận mới
                fetchReviews(productId);
            } else {
                // Nếu Server báo lỗi gì thì in ra chữ đỏ
                reviewErrorMsg.innerText = data.message;
                reviewErrorMsg.style.display = 'block';
            }
        } catch (err) {
            reviewErrorMsg.innerText = "Lỗi kết nối Server! Sếp kiểm tra lại Backend nhé.";
            reviewErrorMsg.style.display = 'block';
        } finally {
            // Khôi phục nút bấm
            submitReviewBtn.disabled = false;
            submitReviewBtn.innerText = "Gửi đánh giá";
        }
    });
});