let slideIndex = 1; // Bắt đầu từ slide đầu tiên

// Hàm hiển thị slide hiện tại
function showSlides(n) {
    const slides = document.querySelectorAll('.banner-slide'); // Lấy tất cả các slide
    const dots = document.querySelectorAll('.dot'); // Lấy tất cả các chấm điều hướng

    // Điều chỉnh slideIndex nếu vượt quá giới hạn
    if (n > slides.length) {
        slideIndex = 1; // Về slide đầu tiên nếu đi quá cuối
    }
    if (n < 1) {
        slideIndex = slides.length; // Về slide cuối cùng nếu đi quá đầu
    }

    // Ẩn tất cả các slide
    slides.forEach(slide => {
        slide.classList.remove('active');
    });

    // Bỏ trạng thái 'active' khỏi tất cả các chấm
    dots.forEach(dot => {
        dot.classList.remove('active');
    });

    // Hiển thị slide hiện tại và đánh dấu chấm tương ứng là 'active'
    slides[slideIndex - 1].classList.add('active'); // Mảng trong JS bắt đầu từ 0
    dots[slideIndex - 1].classList.add('active');
}

// Hàm điều khiển nút mũi tên (prev/next)
function plusSlides(n) {
    // Gọi hàm showSlides với slideIndex được cập nhật
    showSlides(slideIndex += n);
}

// Hàm điều khiển khi click vào chấm tròn
function currentSlide(n) {
    // Đặt slideIndex trực tiếp và gọi hàm showSlides
    showSlides(slideIndex = n);
}

// Chạy hàm showSlides lần đầu khi trang được tải để hiển thị slide đầu tiên
document.addEventListener('DOMContentLoaded', () => {
    showSlides(slideIndex);
});

// Tự động chuyển slide (Tùy chọn: nếu bạn không muốn tự động, có thể bỏ phần này)
let autoSlideInterval = setInterval(() => {
    plusSlides(1); // Chuyển slide tiếp theo
}, 5000); // Tự động chuyển sau mỗi 5 giây (5000ms)

// Dừng tự động chuyển slide khi người dùng tương tác (click nút/chấm)
// và khởi động lại sau một khoảng thời gian
function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
        plusSlides(1);
    }, 5000);
}

// Thêm sự kiện click cho các nút mũi tên và chấm tròn để reset auto-play
// (Bạn đã có onclick trong HTML, nhưng thêm vào JS để quản lý resetAutoSlide tốt hơn)
document.querySelectorAll('.prev, .next, .dot').forEach(element => {
    element.addEventListener('click', resetAutoSlide);
});