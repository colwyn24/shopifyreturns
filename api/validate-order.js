export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Missing name or email" });
  }

  try {
    const token = process.env.SHOPIFY_TOKEN;
    const store = process.env.SHOPIFY_STORE;

    if (!token || !store) {
      throw new Error("Missing Shopify environment variables");
    }

    const response = await fetch(
      `https://${store}/admin/api/2026-01/orders.json?name=${encodeURIComponent(name)}`,
      {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    const order = data.orders?.[0];

    if (!order || order.email !== email) {
      return res.status(404).json({ valid: false });
    }

    return res.status(200).json({ valid: true, order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}