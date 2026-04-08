const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'haru_shop',
    password: '123456',
    port: 5432,
});

const seedProducts = async () => {
    try {
        // 1. Đọc file JSON sản phẩm
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