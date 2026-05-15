const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); //khóa bảo mật


// CẤU HÌNH BƯU TÁ GỬI MAIL OTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Lấy từ két sắt .env
        pass: process.env.EMAIL_PASS  // Lấy từ két sắt .env
    }
});

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Bắt buộc phải có dòng này để chạy trên Railway
    }
});

pool.connect((err) => {
    if (err) {
        console.error('❌ Lỗi kết nối Database:', err.stack);
    } else {
        console.log('✅ Đã kết nối Database Railway thành công!');
    }
});

// ==========================================
// API LẤY TẤT CẢ SẢN PHẨM (DÙNG CHO TÌM KIẾM)
// ==========================================
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách sản phẩm:", err);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// ==========================================
// API LỌC TỔNG HỢP (DANH MỤC, GIÁ, TÌNH TRẠNG, SẮP XẾP, PHÂN TRANG)
// ==========================================
app.get('/api/products/filter', async (req, res) => {
    try {
        // Nhận thêm in_stock và out_of_stock từ frontend gửi lên
        let { category, minPrice, maxPrice, sortBy, in_stock, out_of_stock, page, limit } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 8;
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (category) {
            whereClauses.push(`category = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }
        if (minPrice && minPrice > 0) {
            whereClauses.push(`price >= $${paramIndex}`);
            queryParams.push(minPrice);
            paramIndex++;
        }
        if (maxPrice && maxPrice > 0) {
            whereClauses.push(`price <= $${paramIndex}`);
            queryParams.push(maxPrice);
            paramIndex++;
        }

        // --- PHẦN LOGIC MỚI: Lọc theo Tình trạng kho ---
        if (in_stock === 'true' && out_of_stock !== 'true') {
            whereClauses.push(`stock > 0`);
        } else if (out_of_stock === 'true' && in_stock !== 'true') {
            whereClauses.push(`stock <= 0`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        let orderString = 'ORDER BY id ASC';
        if (sortBy === 'price-asc') orderString = 'ORDER BY price ASC';
        if (sortBy === 'price-desc') orderString = 'ORDER BY price DESC';
        if (sortBy === 'name-asc') orderString = 'ORDER BY name ASC';
        if (sortBy === 'name-desc') orderString = 'ORDER BY name DESC';

        const countQuery = `SELECT COUNT(*) FROM products ${whereString}`;
        const countRes = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const dataQuery = `SELECT * FROM products ${whereString} ${orderString} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(dataQuery, queryParams);

        res.json({
            products: result.rows,
            totalPages: totalPages,
            currentPage: page
        });

    } catch (err) {
        console.error("❌ LỖI LỌC SẢN PHẨM:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API ĐẾM SỐ LƯỢNG TỒN KHO (TÌNH TRẠNG) - CÓ LỌC THEO DANH MỤC
// ==========================================
app.get('/api/products/stock-stats', async (req, res) => {
    try {
        const { category } = req.query; // Nhận category từ Frontend gửi lên

        let query = `
            SELECT 
                COUNT(CASE WHEN stock > 0 THEN 1 END) AS in_stock_count,
                COUNT(CASE WHEN stock <= 0 THEN 1 END) AS out_of_stock_count
            FROM products
        `;
        let queryParams = [];

        // Nếu có truyền category (ví dụ đang ở trang keyboard), thì đếm riêng keyboard
        if (category) {
            query += ` WHERE category = $1`;
            queryParams.push(category);
        }

        const result = await pool.query(query, queryParams);

        res.json({
            in_stock: parseInt(result.rows[0].in_stock_count) || 0,
            out_of_stock: parseInt(result.rows[0].out_of_stock_count) || 0
        });
    } catch (err) {
        console.error("❌ LỖI ĐẾM SỐ LƯỢNG KHO:", err.message);
        res.status(500).json({ error: "Lỗi đếm số lượng" });
    }
});

// ==========================================
// API LẤY SẢN PHẨM CHO TRANG CHỦ (TỰ ĐỘNG)
// URL: /api/homepage-products?section=top_gear
// ==========================================
app.get('/api/homepage-products', async (req, res) => {
    const section = req.query.section;
    let queryColumn = '';

    // Xác định xem section đó tương ứng với cột nào trong DB
    switch (section) {
        case 'top_gear': queryColumn = 'is_top_gear'; break;
        case 'best_seller': queryColumn = 'is_best_seller'; break;
        case 'new_release': queryColumn = 'is_new'; break;
        default: return res.status(400).json({ message: 'Mục không hợp lệ!' });
    }

    try {
        // Lấy 5 món bất kỳ đã được đánh dấu TRUE
        const result = await pool.query(
            `SELECT * FROM products WHERE ${queryColumn} = TRUE LIMIT 5`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ LỖI TẢI SẢN PHẨM TRANG CHỦ:', err.message);
        res.status(500).json({ message: 'Lỗi Server!' });
    }
});

// API lấy chi tiết 1 sản phẩm
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// API LẤY DANH SÁCH ĐÁNH GIÁ CỦA SẢN PHẨM
// ==========================================
app.get('/api/products/:id/reviews', async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy bình luận kèm tên người dùng
        const query = `
            SELECT r.id, r.rating, r.comment, r.created_at, u.username 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC
        `;
        const result = await pool.query(query, [id]);

        const reviews = result.rows;
        const totalReviews = reviews.length;

        // Tính điểm trung bình (Ví dụ: 4.5)
        const averageRating = totalReviews > 0
            ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews).toFixed(1)
            : 0;

        res.json({ reviews, totalReviews, averageRating });
    } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// ==========================================
// API THÊM ĐÁNH GIÁ MỚI
// ==========================================
app.post('/api/products/:id/reviews', async (req, res) => {
    const { id } = req.params; // ID sản phẩm
    const { email, rating, comment } = req.body;

    try {
        // 1. Kiểm tra xem user có tồn tại không
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh giá!' });
        const userId = userRes.rows[0].id;

        // 2. (Tùy chọn) Chặn spam: Mỗi user chỉ đánh giá 1 lần cho 1 sản phẩm
        const checkRes = await pool.query('SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2', [id, userId]);
        if (checkRes.rows.length > 0) return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi!' });

        // 3. Lưu vào Database
        await pool.query(
            'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)',
            [id, userId, rating, comment]
        );
        res.json({ success: true, message: 'Đã gửi đánh giá thành công!' });
    } catch (err) {
        console.error("Lỗi lưu đánh giá:", err);
        res.status(500).json({ success: false, message: 'Lỗi Server' });
    }
});

// API Thêm vào giỏ hàng
app.post('/api/cart', async (req, res) => {
    const { user_email, product_id, quantity, selected_model, selected_color } = req.body;
    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [user_email]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
        const userId = userRes.rows[0].id;

        await pool.query(
            `INSERT INTO cart (user_id, product_id, quantity, selected_model, selected_color) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (user_id, product_id, selected_model, selected_color) 
             DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity`,
            [userId, product_id, quantity || 1, selected_model || 'Mặc định', selected_color || 'Mặc định']
        );
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI THÊM VÀO GIỎ:", err.message);
        res.status(500).json({ success: false });
    }
});

// API Lấy toàn bộ giỏ hàng của User
app.get('/api/cart/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.json([]);
        const userId = userRes.rows[0].id;

        const cartRes = await pool.query(`
            SELECT c.id, c.product_id, c.quantity, c.selected_model, c.selected_color,
                   p.name AS product_name, p.price AS product_price, p.image AS product_image,
                   p.colors AS product_colors
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.id ASC
        `, [userId]);

        res.json(cartRes.rows);
    } catch (err) {
        console.error("❌ LỖI TẢI GIỎ HÀNG:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// API Cập nhật số lượng
app.put('/api/cart/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        await pool.query('UPDATE cart SET quantity = $1 WHERE id = $2', [quantity, id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI SQL KHI CẬP NHẬT SỐ LƯỢNG:", err.message);
        res.status(500).json({ success: false });
    }
});

// API Xóa sản phẩm khỏi giỏ
app.delete('/api/cart/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cart WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI SQL KHI XÓA KHỎI GIỎ:", err.message);
        res.status(500).json({ success: false });
    }
});

// API XÓA TOÀN BỘ GIỎ HÀNG
app.delete('/api/cart/clear/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false });
        const userId = userRes.rows[0].id;

        await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI DỌN GIỎ HÀNG:", err.message);
        res.status(500).json({ success: false });
    }
});


// ==========================================
// API KIỂM TRA MÃ GIẢM GIÁ
// ==========================================
app.post('/api/coupons/check', async (req, res) => {
    const { code } = req.body;
    try {
        // Tìm mã trong Database
        const result = await pool.query('SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE', [code.toUpperCase()]);

        if (result.rows.length > 0) {
            const coupon = result.rows[0];
            res.json({
                success: true,
                discount_percent: coupon.discount_percent,
                is_freeship: coupon.is_freeship,
                message: "Áp dụng mã thành công!"
            });
        } else {
            res.json({ success: false, message: "Mã giảm giá không tồn tại hoặc đã hết hạn!" });
        }
    } catch (err) {
        console.error("❌ LỖI KIỂM TRA MÃ GIẢM GIÁ:", err.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ!" });
    }
});

// ==========================================
// API CHỐT ĐƠN HÀNG (Tạo Order -> Tạo Items -> Xóa Cart)
// ==========================================
app.post('/api/orders', async (req, res) => {
    // 1. Lấy cục kết nối riêng để làm Transaction (để lỡ lỗi thì quay xe)
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // BẮT ĐẦU GIAO DỊCH

        // Lấy dữ liệu từ Frontend gửi lên
        const { email, lastname, address, city, phone, shipping_fee, total_amount, payment_method } = req.body;

        // 2. Tìm ID của user dựa vào email
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) throw new Error('Không tìm thấy tài khoản');
        const userId = userRes.rows[0].id;

        // 3. Lấy toàn bộ sản phẩm trong giỏ hàng của user đó ra
        const cartRes = await client.query(`
            SELECT c.product_id, c.quantity, c.selected_model, c.selected_color, p.price 
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
        `, [userId]);

        if (cartRes.rows.length === 0) throw new Error('Giỏ hàng trống!');

        // 4. Tạo Đơn hàng mới (INSERT VÀO BẢNG orders)
        const orderQuery = `
            INSERT INTO orders (user_id, email, customer_name, address, city, phone, shipping_fee, total_amount, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
        `;
        const orderResult = await client.query(orderQuery, [
            userId, email, lastname, address, city, phone, shipping_fee, total_amount, payment_method
        ]);
        const newOrderId = orderResult.rows[0].id;

        // 5. Thêm chi tiết từng món đồ vào (INSERT VÀO BẢNG order_items) VÀ TRỪ KHO
        for (let item of cartRes.rows) {
            // 5.1 Lưu vào chi tiết đơn hàng
            await client.query(`
                INSERT INTO order_items (order_id, product_id, quantity, price, selected_model, selected_color)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [newOrderId, item.product_id, item.quantity, item.price, item.selected_model, item.selected_color]);

            // 5.2 Tự động trừ số lượng trong kho (Dùng GREATEST để lỡ kho lỗi cũng không bị số âm)
            await client.query(`
                UPDATE products 
                SET stock = GREATEST(stock - $1, 0) 
                WHERE id = $2
            `, [item.quantity, item.product_id]);
        }

        // 6. Dọn sạch giỏ hàng (DELETE TỪ BẢNG cart)
        await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

        await client.query('COMMIT'); // CHỐT LƯU DỮ LIỆU
        res.json({ success: true, orderId: newOrderId });

    } catch (err) {
        await client.query('ROLLBACK'); // CÓ LỖI LÀ QUAY XE LẠI TỪ ĐẦU, KHÔNG LƯU GÌ HẾT
        console.error('Lỗi tạo đơn hàng:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release(); // Trả lại kết nối cho hệ thống
    }
});

// ==========================================
// API ĐĂNG KÝ VÀ ĐĂNG NHẬP BẰNG EMAIL
// ==========================================

// API Đăng ký
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Kiểm tra xem email đã tồn tại chưa
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email đã được sử dụng!' });
        }

        // Thêm user mới vào DB
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, password]
        );
        res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (err) {
        console.error("❌ LỖI ĐĂNG KÝ:", err.message);
        res.status(500).json({ success: false, message: 'Lỗi Server!' });
    }
});

// API Đăng nhập
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRes = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (userRes.rows.length > 0) {
            // Đăng nhập thành công
            res.json({
                success: true,
                user: {
                    username: userRes.rows[0].username,
                    email: userRes.rows[0].email,
                    role: userRes.rows[0].role // <--- SẾP QUÊN DÒNG NÀY NÈ !!!
                }
            });
        } else {
            // Sai thông tin
            res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu!' });
        }
    } catch (err) {
        console.error("❌ LỖI ĐĂNG NHẬP:", err.message);
        res.status(500).json({ success: false, message: 'Lỗi Server!' });
    }
});

// ==========================================
// XỬ LÝ SỰ KIỆN KHI NGẮT KẾT NỐI (Ctrl + C)
// ==========================================
process.on('SIGINT', async () => {
    console.log('\n⚠️ Đang đóng các kết nối Database...');
    try {
        await pool.end();
        console.log('🛑 Server Haru đã tắt an toàn. Hẹn gặp lại sếp!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi khi đóng Server:', err.stack);
        process.exit(1);
    }
});

// ==========================================
// API ADMIN: QUẢN LÝ SẢN PHẨM
// ==========================================

// 1. Thêm sản phẩm mới
app.post('/api/admin/products', async (req, res) => {
    // Lấy thêm description và specs
    const { name, price, stock, image, category, colors, models, description, specs } = req.body;
    try {
        // Cập nhật SQL có 9 biến
        const query = `
            INSERT INTO products (name, price, stock, image, category, colors, models, description, specs) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `;
        const result = await pool.query(query, [
            name,
            price,
            stock || 0,
            image || 'IMG/default.png',
            category,
            JSON.stringify(colors),
            models ? JSON.stringify(models) : null,
            description || null,           // Lưu văn bản mô tả (Cho phép null)
            specs ? JSON.stringify(specs) : null // Lưu JSONB thông số (Cho phép null)
        ]);
        res.json({ success: true, product: result.rows[0] });
    } catch (err) {
        console.error("❌ LỖI THÊM SẢN PHẨM:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Cập nhật số lượng kho (Lưu kho / Hết hàng)
app.put('/api/admin/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    try {
        await pool.query('UPDATE products SET stock = $1 WHERE id = $2', [stock, id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI CẬP NHẬT KHO:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Xóa sản phẩm
app.delete('/api/admin/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI XÓA SẢN PHẨM:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// API ADMIN: QUẢN LÝ ĐƠN HÀNG
// ==========================================

// 1. Lấy danh sách tất cả đơn hàng (Kèm chi tiết từng món đồ bên trong)
// 1. Lấy danh sách tất cả đơn hàng (Kèm chi tiết từng món đồ bên trong)
app.get('/api/admin/orders', async (req, res) => {
    try {
        // Lệnh SQL này cực kỳ xịn: Nó lôi Đơn hàng ra, sau đó gom tất cả đồ trong đơn đó thành 1 mảng JSON (json_agg)
        const query = `
            SELECT o.*, 
                   COALESCE(json_agg(
                       json_build_object(
                           'product_id', oi.product_id,
                           'quantity', oi.quantity,
                           'price', oi.price,
                           'selected_model', oi.selected_model,
                           'selected_color', oi.selected_color,
                           'product_name', p.name,
                           'product_image', p.image,
                           'product_colors', p.colors
                       )
                   ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ LỖI TẢI DANH SÁCH ĐƠN HÀNG:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// Lấy lịch sử đơn hàng CỦA RIÊNG MỘT USER (Trang Profile)
// ==========================================
app.get('/api/user/orders/:email', async (req, res) => {
    const { email } = req.params;
    try {
        // 1. Tìm ID của user dựa vào email
        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.json([]);
        const userId = userRes.rows[0].id;

        // 2. Lấy đơn hàng của user này (kèm mảng colors y như Admin)
        const query = `
            SELECT o.*, 
                   COALESCE(json_agg(
                       json_build_object(
                           'product_id', oi.product_id,
                           'quantity', oi.quantity,
                           'price', oi.price,
                           'selected_model', oi.selected_model,
                           'selected_color', oi.selected_color,
                           'product_name', p.name,
                           'product_image', p.image,
                           'product_colors', p.colors
                       )
                   ) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ LỖI TẢI LỊCH SỬ ĐƠN HÀNG USER:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Cập nhật trạng thái đơn hàng (Pending -> Shipping -> Completed)
app.put('/api/admin/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ LỖI CẬP NHẬT TRẠNG THÁI ĐƠN:", err.message);
        res.status(500).json({ success: false });
    }
});

// ==========================================
// API GỬI MÃ OTP QUÊN MẬT KHẨU
// ==========================================
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký!' });

        // Tạo mã OTP ngẫu nhiên 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 15 * 60000); // Hết hạn sau 15 phút

        // Lưu OTP vào Database
        await pool.query('UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3', [otp, expiry, email]);

        // Nội dung Email
        const mailOptions = {
            from: '"Haru Shop" <linn70180@gmail.com>',
            to: email,
            subject: 'Khôi phục mật khẩu - Haru Shop',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                    <h2 style="color: #333;">Xin chào!</h2>
                    <p>Bạn vừa yêu cầu khôi phục mật khẩu tại Haru Shop.</p>
                    <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #6366f1; letter-spacing: 2px;">${otp}</strong></p>
                    <p style="color: #666; font-size: 13px;">Mã này sẽ hết hạn trong 15 phút. Vui lòng không chia sẻ cho bất kỳ ai.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Đã gửi mã OTP đến email!' });
    } catch (err) {
        console.error("LỖI GỬI EMAIL:", err);
        res.status(500).json({ success: false, message: 'Lỗi Server không thể gửi mail!' });
    }
});

// ==========================================
// API XÁC NHẬN OTP VÀ ĐỔI MẬT KHẨU
// ==========================================
app.post('/api/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User không tồn tại!' });

        const user = userRes.rows[0];
        const now = new Date();

        // Kiểm tra OTP
        if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Mã OTP không chính xác!' });
        if (now > user.otp_expiry) return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn!' });

        // Đổi pass & Xóa OTP
        await pool.query('UPDATE users SET password = $1, otp = NULL, otp_expiry = NULL WHERE email = $2', [newPassword, email]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error("LỖI ĐỔI MẬT KHẨU:", err);
        res.status(500).json({ success: false, message: 'Lỗi Server!' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--- SERVER ĐANG CHẠY TẠI CỔNG ${PORT} ---`);
});