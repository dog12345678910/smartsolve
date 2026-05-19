import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

async function upsertSubscription(row) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;
  await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }

  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whSecret) return res.status(503).end("Stripe not configured");

  const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e) {
    return res.status(400).end(`Webhook Error: ${e.message}`);
  }

  try {
    const obj = event.data && event.data.object;
    if (event.type === "checkout.session.completed" && obj && obj.subscription && obj.customer) {
      const userId = (obj.metadata && obj.metadata.user_id) || null;
      const plan = (obj.metadata && obj.metadata.plan) || null;
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      if (userId) {
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: obj.customer,
          stripe_subscription_id: sub.id,
          status: sub.status,
          plan,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        });
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = obj;
      const userId = (sub.metadata && sub.metadata.user_id) || null;
      if (userId) {
        await upsertSubscription({
          user_id: userId,
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
          plan: (sub.metadata && sub.metadata.plan) || null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    return res.status(500).end(`Handler error: ${e.message}`);
  }

  return res.status(200).end("ok");
}
