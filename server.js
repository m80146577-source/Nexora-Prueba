const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let users = [];

// REGISTRO
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.json({ success: false, message: "Faltan datos" });
    }

    const exist = users.find(u => u.email === email);
    if (exist) {
        return res.json({ success: false, message: "Ya existe" });
    }

    users.push({ username, email, password });

    console.log("Usuario creado:", email);

    res.json({ success: true });
});

// LOGIN
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.json({ success: false, message: "Datos incorrectos" });
    }

    res.json({ success: true, username: user.username });
});

// RUTA PRINCIPAL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(10000, () => {
    console.log("🚀 Server funcionando en http://localhost:10000");
});
