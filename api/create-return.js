// api/create-return.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order_id, items } = req.body;

  if (!order_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing order_id or items" });
  }

  try {
    const token = process.env.SHOPIFY_TOKEN;
    const store = process.env.SHOPIFY_STORE;

    if (!token || !store) {
      throw new Error("Missing Shopify environment variables");
    }

    // Prepare line items for refund
    const refundLineItems = items.map(item => ({
      id: item.line_item_id, // Shopify line item ID
      quantity: item.quantity
    }));

    // Prepare refund payload
    const refundPayload = {
      refund: {
        notify: true, // send email to customer
        shipping: { full_refund: false },
        refund_line_items: refundLineItems
      }
    };

    // Trigger refund via Shopify API
    const response = await fetch(`https://${store}/admin/api/2026-01/orders/${order_id}/refunds.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(refundPayload)
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({ error: "Shopify error", details: data.errors });
    }

    return res.status(200).json({
      success: true,
      refund: data.refund
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}