document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.querySelector('.product-grid-main') || document.querySelector('.collection-grid');
    const priceButton = document.querySelector('.btn-apply-price');
    const minPriceSlider = document.getElementById('price-min');
    const maxPriceSlider = document.getElementById('price-max');
    const minPriceVal = document.getElementById('price-min-val');
    const maxPriceVal = document.getElementById('price-max-val');
    const sliderTrack = document.querySelector('.slider-track');
    const sortSelect = document.querySelector('#sort-select');
    const paginationContainer = document.querySelector('.pagination');

    // --- PHẦN MỚI THÊM: Khai báo 2 checkbox Tình trạng ---
    const inStockCheckbox = document.getElementById('in-stock');
    const outOfStockCheckbox = document.getElementById('out-of-stock');

    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;

    // Nếu không ở trang danh sách thì dừng lại luôn cho nhẹ web
    if (!productGrid) return;

    // --- 1. GỌI API LẤY SẢN PHẨM TỪ DATABASE ---
    async function loadProductsFromDB() {
        productGrid.style.opacity = '0.5'; // Làm mờ lưới sản phẩm khi đang tải

        const path = window.location.pathname.toLowerCase();
        let category = '';
        if (path.includes('mice')) category = 'mice';
        else if (path.includes('keyboard')) category = 'keyboard';
        else if (path.includes('headphone')) category = 'headphone';
        else if (path.includes('accessories')) category = 'accessories';

        // Lấy giá trị bộ lọc (Dùng toán tử ?. gọn gàng hơn)
        const minPrice = minPriceSlider?.value || 0;
        const maxPrice = maxPriceSlider?.value || 15000000;
        const sortBy = sortSelect?.value || 'default';

        // --- PHẦN MỚI THÊM: Lấy giá trị checked của checkbox ---
        const inStock = inStockCheckbox?.checked ? 'true' : 'false';
        const outOfStock = outOfStockCheckbox?.checked ? 'true' : 'false';

        // --- CẬP NHẬT: Gắn thêm inStock và outOfStock vào chuỗi URL ---
        const url = `http://localhost:3000/api/products/filter?category=${category}&minPrice=${minPrice}&maxPrice=${maxPrice}&sortBy=${sortBy}&in_stock=${inStock}&out_of_stock=${outOfStock}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            renderProducts(data.products);
            renderPagination(data.totalPages);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Lỗi kết nối Server. Vui lòng thử lại.</p>';
        } finally {
            productGrid.style.opacity = '1'; // Sáng lại khi tải xong
        }
    }



    // --- 2. VẼ DANH SÁCH SẢN PHẨM & GẮN LINK ---
    function renderProducts(products) {
        if (!products || products.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; margin-top: 20px;">Không tìm thấy sản phẩm nào phù hợp.</p>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        productGrid.innerHTML = products.map(item => {
            // Xử lý link ảnh an toàn để không bị gãy hình
            const imagePath = item.image.startsWith('../') ? item.image : '../' + item.image;
            const formattedPrice = Number(item.price).toLocaleString('vi-VN');

            // TẠO ĐƯỜNG LINK TRUYỀN ID SẢN PHẨM
            const detailLink = `ProductDetail.HTML?id=${item.id}`;

            return `
                <div class="collection-product-card">
                    <div class="card-image">
                        <button class="add-to-wishlist" data-name="${item.name}" data-price="${item.price}" data-image="${imagePath}">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="quick-add-btn" data-id="${item.id}">THÊM NHANH</button>
                        
                        <a href="${detailLink}">
                            <img src="${imagePath}" alt="${item.name}">
                        </a>
                    </div>
                    <div class="card-details">
                        <h4 class="card-title">
                            <a href="${detailLink}">${item.name}</a>
                        </h4>
                        
                        <div class="card-rating">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <span>(10)</span>
                        </div>
                        <div class="card-price">${formattedPrice} Đ</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- 3. VẼ NÚT CHUYỂN TRANG ---
    function renderPagination(totalPages) {
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = ''; // Ẩn phân trang nếu chỉ có 1 trang
            return;
        }

        let html = `<a href="#" class="${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">&laquo;</a>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
        }
        html += `<a href="#" class="${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">&raquo;</a>`;

        paginationContainer.innerHTML = html;

        // Bắt sự kiện chuyển trang
        paginationContainer.querySelectorAll('a').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // Chặn click nếu nút đang bị mờ (disabled)
                if (btn.classList.contains('disabled')) return;

                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                    currentPage = page;
                    loadProductsFromDB();
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Tự cuộn lên đầu trang
                }
            });
        });
    }

    // Hàm cập nhật con số và vệt màu trên thanh kéo
    function updateSliderUI() {
        if (!minPriceSlider || !maxPriceSlider) return;

        let minVal = parseInt(minPriceSlider.value);
        let maxVal = parseInt(maxPriceSlider.value);

        // Chống lỗi kéo 2 nút chồng chéo qua mặt nhau (đổi thành 100k)
        if (maxVal - minVal < 100000) {
            if (this === minPriceSlider) {
                minPriceSlider.value = maxVal - 100000;
                minVal = parseInt(minPriceSlider.value);
            } else {
                maxPriceSlider.value = minVal + 100000;
                maxVal = parseInt(maxPriceSlider.value);
            }
        }

        // Cập nhật text hiển thị
        minPriceVal.innerText = minVal.toLocaleString('vi-VN') + ' Đ';
        maxPriceVal.innerText = maxVal.toLocaleString('vi-VN') + ' Đ';

        // Tính toán để vẽ vệt màu đen (slider track)
        const percent1 = (minVal / minPriceSlider.max) * 100;
        const percent2 = (maxVal / maxPriceSlider.max) * 100;

        if (sliderTrack) {
            sliderTrack.style.left = percent1 + "%";
            sliderTrack.style.width = (percent2 - percent1) + "%";
        }
    }

    // Lắng nghe sự kiện mỗi khi người dùng nắm chuột kéo
    if (minPriceSlider) minPriceSlider.addEventListener('input', updateSliderUI);
    if (maxPriceSlider) maxPriceSlider.addEventListener('input', updateSliderUI);

    // Chạy thử 1 lần lúc mới load web để vẽ vệt đen mặc định
    updateSliderUI();

    // --- 4. ÁP DỤNG BỘ LỌC ---
    function applyNewFilters() {
        currentPage = 1; // Reset về trang 1 mỗi khi lọc
        loadProductsFromDB();
    }

    if (priceButton) priceButton.addEventListener('click', applyNewFilters);
    if (sortSelect) sortSelect.addEventListener('change', applyNewFilters);

    // --- PHẦN MỚI THÊM: Lắng nghe sự kiện click từ checkbox ---
    if (inStockCheckbox) inStockCheckbox.addEventListener('change', applyNewFilters);
    if (outOfStockCheckbox) outOfStockCheckbox.addEventListener('change', applyNewFilters);

    // ==========================================
    // PHẦN TẢI THỐNG KÊ SỐ LƯỢNG KHO (CÓ PHÂN LOẠI)
    // ==========================================
    async function loadStockStats() {
        try {
            // Tự động nhận diện đang ở trang nào
            const path = window.location.pathname.toLowerCase();
            let category = '';
            if (path.includes('mice')) category = 'mice';
            else if (path.includes('keyboard')) category = 'keyboard';
            else if (path.includes('headphone')) category = 'headphone';
            else if (path.includes('accessories')) category = 'accessories';

            // Gắn thêm category vào URL để backend đếm đúng loại
            const response = await fetch(`http://localhost:3000/api/products/stock-stats?category=${category}`);
            const data = await response.json();

            const inStockSpan = document.getElementById('count-in-stock');
            const outOfStockSpan = document.getElementById('count-out-of-stock');

            // Gắn số lượng mới lấy từ DB vào HTML
            if (inStockSpan) inStockSpan.innerText = data.in_stock;
            if (outOfStockSpan) outOfStockSpan.innerText = data.out_of_stock;

        } catch (error) {
            console.error("Lỗi khi tải thống kê số lượng:", error);
        }
    }

    // Gọi hàm này chạy ngay khi mở trang web
    loadStockStats();

    // Bắt đầu chạy khi mở trang
    loadProductsFromDB();
});