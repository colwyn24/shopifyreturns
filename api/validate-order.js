// /api/validate-order.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name: order_number, email } = req.body;

  // Validate request body
  if (!order_number || !email) {
    return res.status(400).json({ error: "Missing order number or email" });
  }

  try {
    // Get environment variables
    const token = process.env.SHOPIFY_TOKEN;
    const store = process.env.SHOPIFY_STORE;

    if (!token || !store) {
      throw new Error("Missing Shopify environment variables");
    }

    // Build query: search by order number and email across all orders
    const query = `name:${order_number} email:${email}`;

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

    // Parse JSON response
    const data = await response.json();

    // Grab the first matching order (should only be 1)
    const order = data.orders?.[0];

    if (!order) {
      return res.status(404).json({ valid: false, error: "Order not found or email mismatch" });
    }

    // Return success
    return res.status(200).json({ valid: true, order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}