const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config(); // <--- GỌI KÉT SẮT RA

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const seedProducts = async () => {
    // ... (Đoạn code ở dưới sếp giữ nguyên 100%, không cần sửa gì cả)
    try {
        const data = JSON.parse(fs.readFileSync('./products.json', 'utf8'));

        console.log("Đang bắt đầu đổ dữ liệu...");

        // Dòng này sẽ xóa sạch dữ liệu cũ và reset ID về 1
        await pool.query('TRUNCATE TABLE products RESTART IDENTITY');
        for (let p of data) {
            await pool.query(
                'INSERT INTO products (name, price, image, category) VALUES ($1, $2, $3, $4)',
                [p.name, p.price, p.image, p.category]
            );
            console.log(`Đã thêm: ${p.name}`);
        }

        console.log("--- HOÀN TẤT ĐỔ DỮ LIỆU ---");
        process.exit();
    } catch (err) {
        console.error("Lỗi khi đổ dữ liệu:", err);
        process.exit(1);
    }
};

seedProducts();