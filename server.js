const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "publico")));

/* =========================
    BASE DE DATOS (RENDER)
========================= */
const pool = new Pool({
    connectionString: "postgresql://nexora_db_jyn4_user:WAGlTaFlr1fWZLLkHEmieAELYl39ocWv@dpg-d70up6ea2pns73epihfg-a/nexora_db_jyn4",
    ssl: { rejectUnauthorized: false }
});

// Crear tabla automáticamente
pool.query(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT
);
`);

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

        console.log("Usuario guardado en DB:", email);

        res.json({ success: true });

    } catch (err) {
        res.json({ success: false, message: "El usuario ya existe" });
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
        username: result.rows[0].username
    });
});

/* =========================
    RUTA PRINCIPAL
========================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "publico", "login.html"));
});

/* =========================
    SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Server con DB funcionando");
});
