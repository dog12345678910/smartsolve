import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(503).json({ error: "Stripe not configured" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: "Supabase service role not configured" });

  const userId = (req.body && req.body.user_id) || null;
  if (!userId) return res.status(400).json({ error: "Missing user_id" });

  try {
    const lookup = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const rows = await lookup.json();
    const customer = rows && rows[0] && rows[0].stripe_customer_id;
    if (!customer) return res.status(404).json({ error: "No subscription on file" });

    const origin = req.headers.origin || `https://${req.headers.host || "smartsolvepoker.com"}`;
    const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: origin,
    });
    return res.status(200).json({ url: portal.url });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Stripe error" });
  }
}
