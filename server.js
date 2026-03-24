const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
    BASE DE DATOS
========================= */
const pool = new Pool({
    connectionString: "postgresql://nexora_db_jyn4_user:WAGlTaFlr1fWZLLkHEmieAELYl39ocWv@dpg-d70up6ea2pns73epihfg-a/nexora_db_jyn4",
    ssl: { rejectUnauthorized: false }
});

/* =========================
    CREAR TABLAS
========================= */
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            email TEXT,
            action TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

initDB();

/* =========================
    HACER ADMIN (TEMPORAL)
========================= */
app.get("/make-admin", async (req, res) => {
    try {
        await pool.query(
            "UPDATE users SET role = 'admin' WHERE email = 'm80146577@gmail.com'"
        );

        res.send("🔥 Ahora eres admin");
    } catch (err) {
        console.error(err);
        res.send("Error: " + err.message);
    }
});

/* =========================
    REGISTRO
========================= */
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.json({ success: false, message: "Faltan datos" });
    }

    try {
        await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
            [username, email, password]
        );

        // LOG
        await pool.query(
            "INSERT INTO logs (email, action) VALUES ($1, $2)",
            [email, "register"]
        );

        res.json({ success: true });

    } catch (err) {
        res.json({ success: false, message: "Usuario ya existe" });
    }
});

/* =========================
    LOGIN
========================= */
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND password = $2",
            [email, password]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: "Datos incorrectos" });
        }

        // LOG
        await pool.query(
            "INSERT INTO logs (email, action) VALUES ($1, $2)",
            [email, "login"]
        );

        res.json({
            success: true,
            username: result.rows[0].username,
            role: result.rows[0].role
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

/* =========================
    VER USUARIOS
========================= */
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, email, role FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

/* =========================
    ADMIN: LISTA USUARIOS
========================= */
app.get("/admin/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, email, role FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

/* =========================
    ELIMINAR USUARIO
========================= */
app.post("/delete-user", async (req, res) => {
    const { id } = req.body;

    try {
        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        // LOG
        await pool.query(
            "INSERT INTO logs (email, action) VALUES ($1, $2)",
            ["ADMIN", "delete user id: " + id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

/* =========================
    VER LOGS (ACTIVIDAD)
========================= */
app.get("/admin/logs", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM logs ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

/* =========================
    RUTA PRINCIPAL
========================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* =========================
    SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Server funcionando");
});
