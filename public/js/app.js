let PRODUCTS = [];
let SETTINGS = {};

async function loadSite() {
  const [settingsRes, productsRes] = await Promise.all([fetch("/api/settings"), fetch("/api/products")]);
  SETTINGS = await settingsRes.json();
  PRODUCTS = await productsRes.json();

  document.getElementById("announcement").textContent = SETTINGS.announcement || "Pure. Traditional. Wholesome.";
  document.getElementById("aboutText").textContent = SETTINGS.about || "";
  const phone = SETTINGS.phone || "916374350956";
  const displayPhone = SETTINGS.displayPhone || "+91 63743 50956";
  document.getElementById("navCall").href = `tel:+${phone}`;
  document.getElementById("footerPhone").href = `tel:+${phone}`;
  document.getElementById("footerPhone").textContent = displayPhone;
  document.getElementById("footerInstagram").href = SETTINGS.instagram || "#";
  document.getElementById("heroWhatsapp").href = `https://wa.me/${phone}?text=${encodeURIComponent("Hello Vijayam Natural Oils, I would like to place an order.")}`;

  const grid = document.getElementById("productGrid");
  if (!PRODUCTS.length) {
    grid.innerHTML = '<div class="loading">Products will appear here soon.</div>';
    return;
  }
  grid.innerHTML = PRODUCTS.map(p => {
    const saving = Number(p.mrp) > Number(p.price) ? `<span class="mrp">MRP ₹${Number(p.mrp).toLocaleString("en-IN")}</span>` : "";
    return `<article class="product">
      ${p.offer ? `<span class="badge">${escapeHtml(p.offer)}</span>` : ""}
      <div class="product-img"><img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy"></div>
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.short || "")}</p>
        <span class="size">${escapeHtml(p.size || "")}</span>
        <div class="price-row">
          <div><div class="price">₹${Number(p.price).toLocaleString("en-IN")}</div>${saving}</div>
          <button class="buy" onclick="openOrder('${escapeAttr(p.id)}')">Order</button>
        </div>
      </div>
    </article>`;
  }).join("");

  const select = document.getElementById("orderProduct");
  select.innerHTML = PRODUCTS.map(p => `<option value="${escapeAttr(p.id)}">${escapeHtml(p.name)} — ₹${Number(p.price).toLocaleString("en-IN")}</option>`).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(value) { return escapeHtml(value); }

function openOrder(productId = "") {
  document.getElementById("orderModal").classList.add("open");
  document.getElementById("orderModal").setAttribute("aria-hidden", "false");
  if (productId) document.getElementById("orderProduct").value = productId;
}
function closeOrder() {
  document.getElementById("orderModal").classList.remove("open");
  document.getElementById("orderModal").setAttribute("aria-hidden", "true");
}
document.getElementById("orderModal").addEventListener("click", e => {
  if (e.target.id === "orderModal") closeOrder();
});

document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const product = PRODUCTS.find(p => p.id === form.get("productId"));
  const payload = Object.fromEntries(form.entries());
  payload.productName = product ? product.name : "";
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "Preparing WhatsApp...";
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to create order");
    window.open(data.whatsappUrl, "_blank", "noopener");
    closeOrder();
    e.target.reset();
    alert(`Order ${data.order.id} created. WhatsApp is ready — tap Send to deliver it to Vijayam.`);
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false; btn.textContent = "Continue to WhatsApp →";
  }
});
loadSite();
