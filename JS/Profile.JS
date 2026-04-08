document.addEventListener('DOMContentLoaded', async () => {
    // 1. Xử lý chuyển đổi qua lại giữa Tab Orders và Profile
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Xóa active cũ
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');

            // Set active mới
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).style.display = 'block';
        });
    });

    // 2. Lấy dữ liệu người dùng từ Database
    // Hiện tại dùng email tĩnh, sau này bạn lấy email từ LocalStorage khi đăng nhập
    const userEmail = localStorage.getItem('user_email') || 'linn70180@gmail.com';

    try {
        // GIẢ LẬP GỌI DATABASE (Thay url bằng API thực tế của bạn)
        // const response = await fetch(`http://localhost:3000/api/users/profile?email=${userEmail}`);
        // const userData = await response.json();

        // Dữ liệu giả lập mô phỏng Database trả về để lên form giống ATK
        const userData = {
            name: "Haru Lil",
            email: userEmail,
            country: "Việt Nam"
        };

        // Đổ dữ liệu vào giao diện Profile
        document.getElementById('profile-name').innerText = userData.name;
        document.getElementById('profile-email').innerText = userData.email;
        document.getElementById('address-name').innerText = userData.name;

        // Nếu muốn thay đổi tên trên header luôn:
        const headerName = document.getElementById('current-username');
        if (headerName) headerName.innerHTML = `<i class="fas fa-user-circle"></i> Chào, ${userData.name}`;

    } catch (error) {
        console.error("Lỗi lấy dữ liệu Profile:", error);
    }

    // 3. Xử lý tải danh sách đơn hàng từ Database
    try {
        // const orderRes = await fetch(`http://localhost:3000/api/orders?email=${userEmail}`);
        // const orders = await orderRes.json();

        const orders = []; // Giả lập chưa có đơn hàng nào

        const ordersContainer = document.getElementById('orders-container');

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <h3>Chưa có đơn hàng nào</h3>
                <p>Truy cập cửa hàng để đặt hàng.</p>
                <a href="Mice.HTML" class="go-shopping-btn">Đi đến cửa hàng</a>
            `;
        } else {
            // Nếu có đơn hàng, bạn code logic render bảng đơn hàng ở đây
            ordersContainer.classList.remove('empty-orders-card');
            ordersContainer.innerHTML = `<h3>Bạn có ${orders.length} đơn hàng.</h3>`;
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu Đơn hàng:", error);
    }
});