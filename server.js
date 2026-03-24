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

// Crear tabla usuarios
pool.query(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT
);
`);

/* =========================
    AGREGAR ROLE (TEMPORAL)
========================= */
app.get("/add-role", async (req, res) => {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        res.send("✅ Columna 'role' creada");
    } catch (err) {
        res.send("⚠️ Puede que ya exista");
    }
});

/* =========================
    VER USUARIOS
========================= */
app.get("/users", async (req, res) => {
    const result = await pool.query("SELECT id, username, email, role FROM users");
    res.json(result.rows);
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

        console.log("Usuario guardado:", email);

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

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND password = $2",
        [email, password]
    );

    if (result.rows.length === 0) {
        return res.json({ success: false, message: "Datos incorrectos" });
    }

    res.json({
        success: true,
        username: result.rows[0].username,
        role: result.rows[0].role
    });
});

/* =========================
    ADMIN: LISTA USUARIOS
========================= */
app.get("/admin/users", async (req, res) => {
    const result = await pool.query(
        "SELECT id, username, email, role FROM users"
    );

    res.json(result.rows);
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
