document.addEventListener('DOMContentLoaded', () => {

    // --- 1. HÀM TẢI DANH SÁCH SẢN PHẨM LÊN BẢNG ---
    async function loadAdminProducts() {
        const tbody = document.getElementById('admin-product-list');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải dữ liệu...</td></tr>';

        try {
            const response = await fetch('http://localhost:3000/api/products');
            const products = await response.json();

            tbody.innerHTML = products.map(p => {
                const imgPath = p.image.startsWith('../') ? p.image : '../' + p.image;
                const statusHtml = p.stock > 0
                    ? `<span class="status-badge status-in">Còn hàng</span>`
                    : `<span class="status-badge status-out">Hết hàng</span>`;

                return `
                    <tr>
                        <td>${p.id}</td>
                        <td><img src="${imgPath}" class="img-preview" alt="img"></td>
                        <td style="font-weight: bold;">${p.name}</td>
                        <td style="color: red; font-weight: bold;">${Number(p.price).toLocaleString('vi-VN')} Đ</td>
                        <td style="text-transform: uppercase;">${p.category}</td>
                        <td>
                            <input type="number" class="stock-input" id="stock-${p.id}" value="${p.stock}" min="0">
                            <br>
                            ${statusHtml}
                        </td>
                        <td>
                            <button class="btn btn-update" onclick="updateStock(${p.id})">Lưu Kho</button>
                            <button class="btn btn-zero" onclick="setOutOfStock(${p.id})">Hết Hàng</button>
                            <button class="btn btn-delete" style="margin-top: 5px;" onclick="deleteProduct(${p.id})">Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error("Lỗi:", error);
            tbody.innerHTML = '<tr><td colspan="7">Lỗi kết nối Server!</td></tr>';
        }
    }

    // --- 2A. HÀM THÊM Ô NHẬP MODEL MỚI ---
    document.getElementById('btn-add-model').addEventListener('click', () => {
        const list = document.getElementById('model-list');
        const div = document.createElement('div');
        div.className = 'model-item';
        div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
        div.innerHTML = `
            <input type="text" class="model-name" placeholder="Tên model (VD: Extreme)">
            <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });

    // --- 2B. HÀM THÊM Ô NHẬP MÀU SẮC MỚI ---
    document.getElementById('btn-add-color').addEventListener('click', () => {
        const list = document.getElementById('color-list');
        const div = document.createElement('div');
        div.className = 'color-item';
        div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
        div.innerHTML = `
            <input type="color" class="color-hex" value="#ffffff" style="height: 38px; width: 50px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px;" title="Chọn mã màu">
            <input type="text" class="color-name" placeholder="Tên màu (VD: White)" required>
            <input type="text" class="color-img" placeholder="Link ảnh (VD: IMG/trang.png)" required>
            <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });

    // --- 2C. HÀM THÊM Ô NHẬP THÔNG SỐ (SPECS) ---
    document.getElementById('btn-add-spec').addEventListener('click', () => {
        const list = document.getElementById('spec-list');
        const div = document.createElement('div');
        div.className = 'spec-item';
        div.style.cssText = 'display: flex; gap: 15px; margin-bottom: 15px; align-items: center;';
        div.innerHTML = `
            <input type="text" class="spec-label" placeholder="Tên thông số (VD: Trọng lượng)">
            <input type="text" class="spec-value" placeholder="Giá trị (VD: 48g)">
            <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });

    // --- 3. XỬ LÝ KHI BẤM NÚT "THÊM SẢN PHẨM" ---
    document.getElementById('add-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 3A. Gom dữ liệu Model (Vì model là tùy chọn nên có thể rỗng)
        const modelItems = document.querySelectorAll('.model-item');
        let modelsArray = [];
        modelItems.forEach(item => {
            const mName = item.querySelector('.model-name').value.trim();
            if (mName) {
                modelsArray.push({ name: mName });
            }
        });

        // 3B. Gom dữ liệu Màu sắc
        const colorItems = document.querySelectorAll('.color-item');
        let colorsArray = [];
        colorItems.forEach(item => {
            const cHex = item.querySelector('.color-hex').value;
            const cName = item.querySelector('.color-name').value.trim();
            const cImg = item.querySelector('.color-img').value.trim();
            if (cName && cImg) {
                colorsArray.push({ hex: cHex, name: cName, image: cImg });
            }
        });

        if (colorsArray.length === 0) {
            alert("Vui lòng thêm ít nhất 1 màu sắc và hình ảnh!");
            return;
        }

        const mainImage = colorsArray[0].image;

        // 3C. Gom dữ liệu Specs (Thông số kỹ thuật)
        const specItems = document.querySelectorAll('.spec-item');
        let specsObject = {};
        let hasSpecs = false;
        specItems.forEach(item => {
            const sLabel = item.querySelector('.spec-label').value.trim();
            const sValue = item.querySelector('.spec-value').value.trim();
            if (sLabel && sValue) {
                specsObject[sLabel] = sValue;
                hasSpecs = true;
            }
        });

        // 3D. Lấy dữ liệu Mô tả
        const descriptionValue = document.getElementById('add-description').value.trim();

        // Đóng gói sản phẩm mới
        const newProduct = {
            name: document.getElementById('add-name').value,
            price: document.getElementById('add-price').value,
            stock: document.getElementById('add-stock').value,
            category: document.getElementById('add-category').value,
            image: mainImage,
            colors: colorsArray,
            models: modelsArray.length > 0 ? modelsArray : null,
            specs: hasSpecs ? specsObject : null,
            description: descriptionValue ? descriptionValue : null
        };

        try {
            const res = await fetch('http://localhost:3000/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });
            const data = await res.json();
            if (data.success) {
                alert("Thêm sản phẩm thành công!");
                document.getElementById('add-form').reset();

                // Khôi phục lại 1 ô nhập màu trống
                document.getElementById('color-list').innerHTML = `
                    <div class="color-item" style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="color" class="color-hex" value="#000000" style="height: 38px; width: 50px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px;" title="Chọn mã màu">
                        <input type="text" class="color-name" placeholder="Tên màu (VD: Black)" required>
                        <input type="text" class="color-img" placeholder="Link ảnh (VD: IMG/den.png)" required>
                        <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
                    </div>`;

                // Khôi phục lại 1 ô nhập model trống
                document.getElementById('model-list').innerHTML = `
                    <div class="model-item" style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" class="model-name" placeholder="Tên model (VD: Ultimate, Pro Max...)">
                        <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
                    </div>`;

                // Khôi phục lại 1 ô nhập Specs trống
                document.getElementById('spec-list').innerHTML = `
                    <div class="spec-item" style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center;">
                        <input type="text" class="spec-label" placeholder="Tên thông số (VD: Cảm biến)">
                        <input type="text" class="spec-value" placeholder="Giá trị (VD: PAW 3950HS)">
                        <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
                    </div>`;

                // Xóa trắng ô nhập mô tả
                document.getElementById('add-description').value = '';

                loadAdminProducts();
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch (err) {
            console.error(err);
        }
    });

    // --- 4. CÁC HÀM XỬ LÝ TRONG BẢNG (GẮN VÀO WINDOW) ---
    window.updateStock = async (id) => {
        const newStock = document.getElementById(`stock-${id}`).value;
        try {
            const res = await fetch(`http://localhost:3000/api/admin/products/${id}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
            });
            if (res.ok) {
                alert("Cập nhật kho thành công!");
                loadAdminProducts();
            }
        } catch (err) {
            alert("Cập nhật thất bại!");
        }
    };

    window.setOutOfStock = async (id) => {
        if (confirm("Xác nhận đổi sản phẩm này thành Hết hàng?")) {
            try {
                const res = await fetch(`http://localhost:3000/api/admin/products/${id}/stock`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: 0 })
                });
                if (res.ok) loadAdminProducts();
            } catch (err) {
                alert("Thao tác thất bại!");
            }
        }
    };

    window.deleteProduct = async (id) => {
        if (confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa hẳn sản phẩm này khỏi Shop không?")) {
            try {
                const res = await fetch(`http://localhost:3000/api/admin/products/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    alert("Đã xóa sản phẩm!");
                    loadAdminProducts();
                }
            } catch (err) {
                alert("Xóa thất bại!");
            }
        }
    };


    // ==========================================
    // 5. TẢI VÀ HIỂN THỊ DANH SÁCH ĐƠN HÀNG
    // ==========================================
    async function loadAdminOrders() {
        const tbody = document.getElementById('admin-orders-list');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải đơn hàng...</td></tr>';

        try {
            const response = await fetch('http://localhost:3000/api/admin/orders');
            const orders = await response.json();

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Chưa có đơn hàng nào.</td></tr>';
                return;
            }

            tbody.innerHTML = orders.map(o => {
                // 5.1. Bóc tách từng món đồ khách mua ra thành HTML
                const itemsHtml = o.items.map(item => {
                    let variant = [];
                    if (item.selected_model && item.selected_model !== 'Mặc định') variant.push(item.selected_model);
                    if (item.selected_color && item.selected_color !== 'Mặc định') variant.push(item.selected_color);
                    let variantStr = variant.length > 0 ? `<span style="color:#6366f1;">(${variant.join(' - ')})</span>` : '';

                    let imgSrc = item.product_image;
                    imgSrc = imgSrc && imgSrc.startsWith('../') ? imgSrc : '../' + (imgSrc || 'IMG/default.png');

                    return `
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                            <img src="${imgSrc}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px; background: #f8fafc; border: 1px solid #e2e8f0;">
                            <div style="font-size: 13px;">
                                <b>${item.product_name}</b> ${variantStr} <br>
                                Số lượng: <b style="color: #ef4444;">${item.quantity}</b> | Giá: ${Number(item.price).toLocaleString('vi-VN')} Đ
                            </div>
                        </div>`;
                }).join('');

                // 5.2. Đổi màu huy hiệu Trạng thái cho đẹp
                let statusColor = '#f59e0b'; // Màu Cam: Pending (Chờ xử lý)
                let statusText = 'Chờ xử lý';
                if (o.status === 'Shipping') { statusColor = '#3b82f6'; statusText = 'Đang giao'; }
                if (o.status === 'Completed') { statusColor = '#10b981'; statusText = 'Hoàn thành'; }
                if (o.status === 'Cancelled') { statusColor = '#ef4444'; statusText = 'Đã hủy'; }

                // 5.3. Định dạng ngày giờ
                const dateObj = new Date(o.created_at);
                const timeString = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + dateObj.toLocaleDateString('vi-VN');

                return `
                    <tr>
                        <td style="font-weight: 800; color: #111827;">#${o.id}<br><span style="font-size:11px; color:#9ca3af; font-weight:normal;">${timeString}</span></td>
                        <td style="font-size: 14px;">
                            <b style="color: #111827;">${o.customer_name}</b><br>
                            <i class="fas fa-phone-alt" style="color: #9ca3af; font-size: 12px; width:15px;"></i> ${o.phone}<br>
                            <i class="fas fa-map-marker-alt" style="color: #9ca3af; font-size: 12px; width:15px;"></i> ${o.address}, ${o.city}
                        </td>
                        <td>${itemsHtml}</td>
                        <td style="font-size: 15px;">
                            <b style="color: #ef4444;">${Number(o.total_amount).toLocaleString('vi-VN')} Đ</b><br>
                            <span style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase;">${o.payment_method}</span>
                        </td>
                        <td>
                            <span style="background-color: ${statusColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block;">
                                ${statusText}
                            </span>
                        </td>
                        <td>
                            <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding: 6px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; outline: none; cursor: pointer; background: #f9fafb;">
                                <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Chờ xử lý</option>
                                <option value="Shipping" ${o.status === 'Shipping' ? 'selected' : ''}>Đang giao</option>
                                <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Hoàn thành</option>
                                <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Hủy đơn</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
            tbody.innerHTML = '<tr><td colspan="6">Lỗi kết nối đến máy chủ!</td></tr>';
        }
    }

    // ==========================================
    // 6. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
    // ==========================================
    window.updateOrderStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Tải lại bảng ngay lập tức để cập nhật huy hiệu màu
                loadAdminOrders();
            } else {
                alert("Cập nhật thất bại!");
            }
        } catch (e) {
            alert("Lỗi kết nối khi cập nhật!");
        }
    }

    // GỌI HÀM NÀY LÚC LOAD TRANG ĐỂ HIỆN BẢNG
    loadAdminOrders();

    // ==========================================
    // 7. LOGIC CHUYỂN TAB (DASHBOARD MENU)
    // ==========================================
    const menuItems = document.querySelectorAll('.menu-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Gỡ viền sáng ở tất cả các nút Menu
            menuItems.forEach(m => m.classList.remove('active'));
            // 2. Ẩn tất cả các màn hình Nội dung
            tabPanes.forEach(t => t.classList.remove('active'));

            // 3. Đánh dấu nút Menu vừa bấm
            item.classList.add('active');

            // 4. Mở màn hình Nội dung tương ứng (dựa vào data-target)
            const targetId = item.getAttribute('data-target');
            const targetTab = document.getElementById(targetId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    loadAdminProducts();
});