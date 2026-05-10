const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",        // ← your MySQL username
    password: "priya15",        // ← your MySQL password
    database: "price_comparison"
});

db.connect((err) => {
    if (err) { console.error("❌ MySQL failed:", err.message); process.exit(1); }
    console.log("✅ MySQL connected successfully");
    runMigrations();
});

// Compatible with MySQL 5.x and 8.x — checks INFORMATION_SCHEMA before ALTER
function addColumnIfMissing(table, column, definition) {
    db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column],
        (err, rows) => {
            if (err) return;
            if (rows.length === 0) {
                db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (e) => {
                    if (e) console.warn(`Could not add ${column}:`, e.message);
                    else console.log(`✅ Added column: ${column}`);
                });
            }
        }
    );
}

function modifyColumn(table, column, definition) {
    db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column],
        (err, rows) => {
            if (err || !rows.length) return;
            db.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`, (e) => {
                if (e) console.warn(`Could not modify ${column}:`, e.message);
            });
        }
    );
}

function runMigrations() {
    // Users table
    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, err => { if (err) console.error("Users table:", err.message); else console.log("✅ Users table ready"); });

    // Widen existing products columns to prevent "Data too long"
    modifyColumn("products", "name",    "VARCHAR(500)");
    modifyColumn("products", "rating",  "VARCHAR(100)");
    modifyColumn("products", "price",   "VARCHAR(100)");

    // Add new columns only if they don't exist
    addColumnIfMissing("products", "description",    "TEXT");
    addColumnIfMissing("products", "original_price", "VARCHAR(100)");
    addColumnIfMissing("products", "discount",       "VARCHAR(100)");
    addColumnIfMissing("products", "review_count",   "VARCHAR(100)");
    addColumnIfMissing("products", "badge",          "VARCHAR(200)");

    console.log("✅ DB migrations running");
}

module.exports = db;