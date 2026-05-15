// ==========================================
// FILE: JS/HomeApi.JS
// CHỨC NĂNG: GỌI API & VẼ SẢN PHẨM TỰ ĐỘNG LÊN TRANG CHỦ
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Định nghĩa các mục cần lấy dữ liệu (ID khung và tên mục trên Server)
    const homepageSections = [
        { gridId: 'top-gears-grid', serverSection: 'top_gear' },
        { gridId: 'best-sellers-grid', serverSection: 'best_seller' },
        { gridId: 'new-releases-grid', serverSection: 'new_release' }
    ];

    // 2. Chạy vòng lặp, gọi API cho từng mục
    homepageSections.forEach(section => {
        loadHomepageProducts(section.gridId, section.serverSection);
    });
});

// Hàm chính để gọi API và vẽ
async function loadHomepageProducts(gridId, serverSection) {
    const gridContainer = document.getElementById(gridId);

    // Kiểm tra nếu không tìm thấy khung thì nghỉ luôn
    if (!gridContainer) return;

    // Hiện thông báo đang tải 
    gridContainer.innerHTML = '<p style="text-align:center; width:100%; padding: 20px;">Đang tải sản phẩm...</p>';

    try {
        // A. GỌI API XUỐNG SERVER (ĐÃ FIX LỖI THIẾU LOCALHOST:3000)
        const response = await fetch(`https://haru-shop-backend-production.up.railway.app/api/homepage-products?section=${serverSection}`);
        const products = await response.json();

        // B. XỬ LÝ KẾT QUẢ
        if (products.length === 0) {
            gridContainer.innerHTML = '<p style="text-align:center; width:100%; padding: 20px;">Hiện chưa có sản phẩm nào trong mục này.</p>';
            return;
        }

        // C. XÓA THÔNG BÁO ĐANG TẢI & VẼ HTML
        gridContainer.innerHTML = '';

        products.forEach(product => {
            // 1. Định dạng giá tiền
            const formattedPrice = new Intl.NumberFormat('vi-VN').format(product.price) + ' Đ';

            // 2. Xử lý đường dẫn ảnh đồng nhất (FIX LỖI MẤT ẢNH)
            // Loại bỏ '../' nếu có trong DB, sau đó tự gắn lại '../' cho chuẩn xác thư mục
            const imagePath = product.image.startsWith('../') ? product.image.replace('../', '') : product.image;

            // 3. TẠO KHỐI HTML CHO 1 SẢN PHẨM 
            const productCardHTML = `
                <div class="collection-product-card">
                    <div class="card-image">
                        <button class="add-to-wishlist" 
                                data-name="${product.name}" 
                                data-price="${product.price}" 
                                data-image="../${imagePath}">
                            <i class="far fa-heart"></i>
                        </button>
                        
                        <button class="quick-add-btn" data-id="${product.id}">THÊM NHANH</button>
                        
                        <a href="ProductDetail.HTML?id=${product.id}">
                            <img src="../${imagePath}" alt="${product.name}">
                        </a>
                    </div>
                    <div class="card-details">
                        <h4 class="card-title"><a href="ProductDetail.HTML?id=${product.id}">${product.name}</a></h4>
                        
                        <div class="card-rating">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i> 
                            <span>(99+)</span>
                        </div>
                        
                        <div class="card-price">${formattedPrice}</div>
                    </div>
                </div>
            `;

            // Bơm HTML vào khung
            gridContainer.insertAdjacentHTML('beforeend', productCardHTML);
        });

    } catch (err) {
        console.error(`Lỗi tải mục ${serverSection}:`, err);
        gridContainer.innerHTML = '<p style="text-align:center; width:100%; color:red; padding: 20px;">Lỗi tải dữ liệu. Vui lòng thử lại!</p>';
    }
}