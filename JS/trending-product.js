document.addEventListener('DOMContentLoaded', function () {
    const filterItems = document.querySelectorAll('.trending-filters .filter-item');
    const sections = document.querySelectorAll('.product-section-wrapper');

    // Hàm chuyển đổi nội dung
    function switchTab(targetId) {
        // Ẩn tất cả các sections và loại bỏ class active khỏi các nút lọc
        sections.forEach(section => {
            section.style.display = 'none';
        });
        filterItems.forEach(item => {
            item.classList.remove('active');
        });

        // Hiển thị section mục tiêu và thêm class active cho nút lọc tương ứng
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        const activeFilter = document.querySelector(`[data-target="${targetId}"]`);
        if (activeFilter) {
            activeFilter.classList.add('active');
        }
    }

    // Thiết lập mặc định hiển thị Top Gears
    switchTab('top-gears-content');


    // Lắng nghe sự kiện click
    filterItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ <a>

            // Lấy ID mục tiêu từ thuộc tính data-target
            const targetId = this.getAttribute('data-target');
            switchTab(targetId);
        });
    });
});