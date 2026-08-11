require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(ROOT, "public", "uploads");

for (const dir of [DATA, UPLOADS]) fs.mkdirSync(dir, { recursive: true });

const files = {
  products: path.join(DATA, "products.json"),
  orders: path.join(DATA, "orders.json"),
  settings: path.join(DATA, "settings.json")
};

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
};
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "Poo@123";
const sessionSecret = process.env.SESSION_SECRET || "change-this-session-secret";

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(express.static(path.join(ROOT, "public")));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|jpg)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or WEBP images are allowed."));
  }
});

function auth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "Unauthorized" });
}

app.get("/admin", (_req, res) => res.sendFile(path.join(ROOT, "views", "admin.html")));

app.get("/api/settings", (_req, res) => res.json(readJson(files.settings, {})));

app.get("/api/products", (_req, res) => {
  const products = readJson(files.products, []);
  res.json(products.filter(p => p.active !== false));
});

app.post("/api/orders", (req, res) => {
  const { customerName, phone, address, productId, productName, quantity, notes } = req.body;
  if (!customerName || !phone || !productName || !quantity) {
    return res.status(400).json({ error: "Please fill the required fields." });
  }

  const settings = readJson(files.settings, {});
  const order = {
    id: `VJ-${Date.now().toString().slice(-8)}`,
    customerName: String(customerName).trim(),
    phone: String(phone).trim(),
    address: String(address || "").trim(),
    productId: String(productId || ""),
    productName: String(productName).trim(),
    quantity: Number(quantity) || 1,
    notes: String(notes || "").trim(),
    status: "new",
    createdAt: new Date().toISOString()
  };

  const orders = readJson(files.orders, []);
  orders.unshift(order);
  writeJson(files.orders, orders.slice(0, 500));

  const text = [
    `🌿 *New Vijayam Natural Oils Order*`,
    ``,
    `Order ID: ${order.id}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Product: ${order.productName}`,
    `Quantity: ${order.quantity}`,
    order.address ? `Address: ${order.address}` : "",
    order.notes ? `Notes: ${order.notes}` : "",
    ``,
    `Please confirm availability and delivery.`
  ].filter(Boolean).join("\n");

  const whatsappUrl = `https://wa.me/${settings.phone}?text=${encodeURIComponent(text)}`;
  res.json({ success: true, order, whatsappUrl });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: "Invalid username or password." });
});

app.post("/api/admin/logout", auth, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/admin/status", (req, res) => res.json({ loggedIn: !!(req.session && req.session.admin) }));

app.get("/api/admin/products", auth, (_req, res) => {
  res.json(readJson(files.products, []));
});

app.post("/api/admin/products", auth, upload.single("image"), (req, res) => {
  const { name, short, price, mrp, size, offer, featured, active, imageUrl } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price are required." });

  const products = readJson(files.products, []);
  const image = req.file ? `/uploads/${req.file.filename}` : (imageUrl || "/assets/wood-pressed-banner.jpg");
  const product = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    short: String(short || "").trim(),
    price: Number(price),
    mrp: Number(mrp || price),
    size: String(size || "").trim(),
    image,
    offer: String(offer || "").trim(),
    featured: featured === "true",
    active: active !== "false"
  };
  products.push(product);
  writeJson(files.products, products);
  res.json(product);
});

app.put("/api/admin/products/:id", auth, upload.single("image"), (req, res) => {
  const products = readJson(files.products, []);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found." });

  const old = products[index];
  const image = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || old.image);
  products[index] = {
    ...old,
    name: String(req.body.name || old.name).trim(),
    short: String(req.body.short ?? old.short).trim(),
    price: Number(req.body.price || old.price),
    mrp: Number(req.body.mrp || old.mrp),
    size: String(req.body.size ?? old.size).trim(),
    image,
    offer: String(req.body.offer ?? old.offer).trim(),
    featured: req.body.featured === undefined ? old.featured : req.body.featured === "true",
    active: req.body.active === undefined ? old.active : req.body.active === "true"
  };
  writeJson(files.products, products);
  res.json(products[index]);
});

app.delete("/api/admin/products/:id", auth, (req, res) => {
  const products = readJson(files.products, []);
  const next = products.filter(p => p.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ error: "Product not found." });
  writeJson(files.products, next);
  res.json({ success: true });
});

app.get("/api/admin/orders", auth, (_req, res) => res.json(readJson(files.orders, [])));

app.patch("/api/admin/orders/:id", auth, (req, res) => {
  const orders = readJson(files.orders, []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  order.status = req.body.status || order.status;
  writeJson(files.orders, orders);
  res.json(order);
});

app.put("/api/admin/settings", auth, (req, res) => {
  const current = readJson(files.settings, {});
  const allowed = ["brand", "displayPhone", "instagram", "announcement", "about"];
  for (const key of allowed) if (req.body[key] !== undefined) current[key] = String(req.body[key]);
  writeJson(files.settings, current);
  res.json(current);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Something went wrong." });
});

app.listen(PORT, () => console.log(`Vijayam Natural Oils running at http://localhost:${PORT}`));
