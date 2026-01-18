require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { readJson, writeJson } = require("./lib/store");

const app = express();
const PORT = process.env.PORT || 5000;
const INTERNAL_SECRET =
  process.env.INTERNAL_API_SECRET || "mania_internal_secret_123";

// ✅ CORS allowlist (local + deployed frontend)
const allowed = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/postman
      if (allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());


// app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());

// Helpers
const getUsers = () => readJson("users.json", []);
const saveUsers = (u) => writeJson("users.json", u);

const getProducts = () => readJson("products.json", []);
const saveProducts = (p) => writeJson("products.json", p);

app.get("/", (req, res) => {
  res.send("✅ Mania API is running. Try /api/health or /api/products");
});


// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "mania-api", time: new Date().toISOString() });
});

// ---------------- USERS ----------------

// Credentials auth for NextAuth
app.post("/api/auth/credentials", (req, res) => {
  const { email, password } = req.body || {};
  const users = getUsers();
  const u = users.find((x) => x.email === email && x.password === password);
  if (!u) return res.status(401).json({ message: "Invalid credentials" });

  return res.json({ id: u.id, name: u.name, email: u.email, role: u.role || "user" });
});

// Upsert Google users (called from NextAuth callback)
app.post("/api/users/upsert", (req, res) => {
  const { email, name, provider } = req.body || {};
  if (!email) return res.status(400).json({ message: "Email required" });

  const users = getUsers();
  let u = users.find((x) => x.email === email);

  if (!u) {
    u = {
      id: randomUUID(),
      name: name || email.split("@")[0],
      email,
      password: null,
      provider: provider || "google",
      role: "user"
    };
    users.push(u);
  } else {
    u.name = name || u.name;
    u.provider = provider || u.provider;
  }

  saveUsers(users);
  return res.json({ ok: true });
});

// Register (Credentials users)
app.post("/api/users/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, password required" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const users = getUsers();
  const exists = users.some((u) => u.email === email);
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const newUser = {
    id: randomUUID(),
    name,
    email,
    password,
    provider: "credentials",
    role: "user"
  };

  users.push(newUser);
  saveUsers(users);
  return res.status(201).json({ ok: true });
});

// ---------------- PRODUCTS ----------------

// Get all products (public)
app.get("/api/products", (req, res) => {
  res.json(getProducts());
});

// Get one product (public)
app.get("/api/products/:id", (req, res) => {
  const p = getProducts().find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
});

// Add product (private, used by Next.js /api/products route)
app.post("/api/products", (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== INTERNAL_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { name, price, shortDescription, longDescription, image } = req.body || {};
  if (!name || price === undefined || !shortDescription || !longDescription) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const products = getProducts();
  const newP = {
    id: randomUUID(),
    name,
    price: Number(price),
    shortDescription,
    longDescription,
    image:
      image ||
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&q=80"
  };

  products.unshift(newP);
  saveProducts(products);
  res.status(201).json(newP);
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`✅ Mania API running: http://localhost:${PORT}`);
  });
}

