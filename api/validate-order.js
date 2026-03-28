// /api/validate-order.js
export default async function handler(req, res) {
  // ✅ Set CORS headers for Shopify
  res.setHeader("Access-Control-Allow-Origin", "*"); // replace "*" with your Shopify domain for production
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name: order_number, email } = req.body;

  // Validate request
  if (!order_number || !email) {
    return res.status(400).json({ error: "Missing order number or email" });
  }

  try {
    // Shopify environment variables
    const token = process.env.SHOPIFY_TOKEN;
    const store = process.env.SHOPIFY_STORE;

    if (!token || !store) {
      throw new Error("Missing Shopify environment variables");
    }

    // Prepend "#" if missing
    const formattedOrderNumber = order_number.startsWith("#") ? order_number : `#${order_number}`;

    // Build query: search by order number and email across all orders
    const query = `name:${formattedOrderNumber} email:${email}`;

    // Call Shopify Admin API
    const response = await fetch(
      `https://${store}/admin/api/2026-01/orders.json?query=${encodeURIComponent(query)}&status=any&limit=1`,
      {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    const order = data.orders?.[0];

    if (!order) {
      return res.status(404).json({ valid: false, error: "Order not found or email mismatch" });
    }
    // Enrich each line item with product image
    for (let i = 0; i < order.line_items.length; i++) {
      const item = order.line_items[i];
      if (item.variant_id) {
        const variantRes = await fetch(
          `https://${store}/admin/api/2026-01/variants/${item.variant_id}.json`,
          {
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json",
            },
          }
        );
        const variantData = await variantRes.json();
        item.image = variantData.variant.image || null; // may be null
      } else {
        item.image = null;
      }
    }
    return res.status(200).json({ valid: true, order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}