// POST /api/checkout  { items: [{ id, qty }] }  ->  { url }  (Stripe Checkout page)
// Prices and stock are read from products.json on the server, never trusted from the browser.
// Needs the env var STRIPE_SECRET_KEY set in Cloudflare Pages.

export async function onRequestPost(ctx) {
  try { return await checkout(ctx); }
  catch (e) { return new Response(e.message, { status: 400 }); }
}

async function checkout({ request, env }) {
  const { items } = await request.json();
  const origin = new URL(request.url).origin;
  const { items: products, shipping } = await (await env.ASSETS.fetch(origin + "/products.json")).json();

  const p = new URLSearchParams();
  let subtotal = 0;

  items.forEach(({ id, qty }, i) => {
    const prod = products.find(x => x.id === id);
    if (!prod || !prod.stock) throw new Error(`${id} is sold out`);
    const q = Math.min(qty, prod.stock);
    subtotal += prod.price * q;
    p.append(`line_items[${i}][quantity]`, q);
    p.append(`line_items[${i}][price_data][currency]`, "cad");
    p.append(`line_items[${i}][price_data][unit_amount]`, Math.round(prod.price * 100));
    p.append(`line_items[${i}][price_data][tax_behavior]`, "exclusive");
    p.append(`line_items[${i}][price_data][product_data][name]`, prod.name);
    p.append(`line_items[${i}][price_data][product_data][description]`, prod.note);
  });

  const shipCost = subtotal >= shipping.freeOver ? 0 : shipping.flat;
  const rates = [
    [shipCost ? "Shipping" : "Free shipping", shipCost],
    [shipping.pickup, 0],
  ];
  rates.forEach(([name, amount], i) => {
    p.append(`shipping_options[${i}][shipping_rate_data][type]`, "fixed_amount");
    p.append(`shipping_options[${i}][shipping_rate_data][display_name]`, name);
    p.append(`shipping_options[${i}][shipping_rate_data][fixed_amount][amount]`, Math.round(amount * 100));
    p.append(`shipping_options[${i}][shipping_rate_data][fixed_amount][currency]`, "cad");
    p.append(`shipping_options[${i}][shipping_rate_data][tax_behavior]`, "exclusive");
  });
  shipping.countries.forEach((c, i) => p.append(`shipping_address_collection[allowed_countries][${i}]`, c));

  p.append("automatic_tax[enabled]", "true"); // Stripe Tax: GST/QST/HST by buyer's province
  p.append("custom_text[submit][message]", "Expédition au moins 2 semaines après la commande. / Orders ship at least 2 weeks after purchase.");
  p.append("mode", "payment");
  p.append("locale", "auto");
  p.append("phone_number_collection[enabled]", "true");
  p.append("success_url", origin + "/merci.html");
  p.append("cancel_url", origin + "/#store");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: p,
  });
  const session = await res.json();
  if (!res.ok) return new Response(session.error?.message || "Payment error", { status: 500 });
  return Response.json({ url: session.url });
}
