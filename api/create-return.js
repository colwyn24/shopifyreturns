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

    // Build the return payload
    const returnPayload = {
      return: {
        order_id: order_id,
        items: items.map(item => ({
          quantity: item.quantity,
          reason: item.reason,
          type: item.type,
          variant_id: item.variant_id
        }))
      }
    };

    // NOTE: Shopify does not have a direct 'create return' REST endpoint.
    // Normally you would integrate with Shopify Fulfillment API or a custom app
    // Here, we'll just simulate return creation and generate an ID
    const simulatedReturnId = `RET-${Math.floor(Math.random() * 1000000)}`;

    // Respond with success
    return res.status(200).json({
      success: true,
      return: {
        return_id: simulatedReturnId,
        order_id,
        items
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}