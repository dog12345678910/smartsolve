import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(503).json({ error: "Stripe not configured" });

  const body = req.body || {};
  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  const userId = body.user_id;
  const email = body.email;
  if (!userId) return res.status(400).json({ error: "Missing user_id" });

  const priceId = plan === "yearly"
    ? process.env.STRIPE_PRICE_YEARLY
    : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) return res.status(500).json({ error: `Price ID for ${plan} not set` });

  const origin = req.headers.origin || `https://${req.headers.host || "smartsolvepoker.com"}`;

  try {
    const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      subscription_data: {
        trial_period_days: 10,
        metadata: { user_id: userId },
      },
      metadata: { user_id: userId, plan },
      success_url: `${origin}/?subscribed=1`,
      cancel_url: `${origin}/?canceled=1`,
      allow_promotion_codes: true,
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Stripe error" });
  }
}
