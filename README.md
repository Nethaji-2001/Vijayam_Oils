# Vijayam Natural Wood Pressed Oils — Website

A clean, nature-inspired Node.js website for Vijayam Natural Oils.

## Included

- Customer-facing responsive website
- Product cards for Coconut, Groundnut, Gingelly and Family Pack offers
- Customer can call directly using the phone button
- Customer order form
- Order is saved in `data/orders.json`
- After order submission, WhatsApp opens with a pre-filled message to **+91 63743 50956**
- Admin dashboard at `/admin`
- Admin can add, edit, hide/show and delete products
- Admin can upload new product images
- Admin can update prices, MRP, offer badges and sizes
- Admin can update website announcement, About text and Instagram URL
- Admin can view and update order status
- Uploaded promotional images are already included

## Run locally

1. Install Node.js 18+.
2. Open this project folder in Terminal.
3. Run:

```bash
npm install
npm start
```

4. Open:
   - Website: http://localhost:3000
   - Admin: http://localhost:3000/admin

### Default admin login

Username: `admin`
Password: `ChangeMe@123`

**Change the password before putting the site online.**

Copy `.env.example` to `.env` and set:

```text
PORT=3000
SESSION_SECRET=use-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-new-password
```

## WhatsApp order flow

The website uses the WhatsApp click-to-chat mechanism. The customer fills the order form, the server records the order, then WhatsApp opens with the order details addressed to:

**+91 63743 50956**

The customer must tap **Send** in WhatsApp.

For fully automatic WhatsApp Business API messages (without the customer tapping Send), connect the site to the WhatsApp Business Cloud API.

## Deployment

This is a normal Express/Node application and can be deployed to Railway, Render, a VPS, or another Node.js host.

Important: the current version stores products/orders/settings in local JSON files. On hosts with an ephemeral filesystem, use a persistent volume or replace the JSON storage with MongoDB/PostgreSQL before production.

## Folder structure

```text
vijayam-natural-oils-website/
├── data/
│   ├── products.json
│   ├── orders.json
│   └── settings.json
├── public/
│   ├── assets/
│   │   ├── family-pack.jpg
│   │   ├── groundnut-offer.jpg
│   │   ├── oil-prices.jpg
│   │   └── wood-pressed-banner.jpg
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   ├── uploads/
│   └── index.html
├── views/
│   └── admin.html
├── .env.example
├── package.json
├── README.md
└── server.js
```
