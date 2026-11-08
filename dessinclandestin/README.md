# dessinclandestin.com

Static site on Cloudflare Pages, deployed from GitHub. Checkout through Stripe. No database, no monthly fees.

```
index.html              landing + store (store is at /#store)
merci.html              page shown after a successful payment
gallery/                drop images and videos here
products.json           store items, prices, stock, shipping
products/               store item images (optional)
assets/                 stickers, cursor, about photo
build.js                turns gallery/ into gallery.json on each deploy
functions/api/checkout.js   creates the Stripe Checkout session
```

## Adding work to the gallery

Name the file `DATE_TITLE_MEDIUM.ext`, using dashes for spaces:

```
2025-03-14_Cuisine-nuit_Painting.jpg
2026-02-01_Heures-volees_Zine.mp4
```

Shows as **Cuisine nuit** · Painting · 2025-03-14. Newest first.
Images: jpg, png, webp, gif. Video: mp4 or webm (plays muted, looped). Max 25 MB per file on Cloudflare Pages.

Commit and push. The site rebuilds in about a minute.

## Store

Edit `products.json`. `price` in CAD. Set `stock` to `0` to show "Sold out".
After an original sells, set its stock to 0 and push. Stock does not update itself.
For a photo, put it in `products/` and set `"image": "products/file.jpg"`.

## Setup (once)

1. **GitHub**: create a repo `dessinclandestin`, push this folder.
2. **Cloudflare Pages**: Workers & Pages → Create → Pages → Connect to Git → pick the repo.
   - Framework preset: None
   - Build command: `node build.js`
   - Build output directory: `/`
3. **Stripe**: create an account at stripe.com (Canada). Developers → API keys → copy the secret key.
   In Cloudflare: the Pages project → Settings → Variables and Secrets → add `STRIPE_SECRET_KEY` (type: Secret). Redeploy.
   **Taxes**: Stripe dashboard → Tax → set your business address (Montréal), add your GST and QST registrations,
   and set the default product tax code to "General – Tangible Goods". Checkout then adds GST/QST/HST based on the buyer's province.
   Stripe Tax costs 0.5% of each sale (no monthly fee).
   Use the `sk_test_…` key first and pay with card `4242 4242 4242 4242`; switch to `sk_live_…` when it works.
4. **Domain**: register `dessinclandestin.com` (Cloudflare → Domain Registration sells at cost), then
   Pages project → Custom domains → add `dessinclandestin.com` and `www.dessinclandestin.com`.

Orders arrive as email from Stripe and in the Stripe dashboard (Payments), with the shipping address.

## Local preview

```
node build.js && npx wrangler pages dev .
```
