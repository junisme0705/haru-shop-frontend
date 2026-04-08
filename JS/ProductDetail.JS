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
        const res = await fetch(`http://localhost:3000/api/products/${productId}`);
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
                const response = await fetch('http://localhost:3000/api/cart', {
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