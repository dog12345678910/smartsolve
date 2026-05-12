export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const message = (body.message || "").toString().trim();
  if (!message) return res.status(400).json({ error: "Message required" });
  if (message.length > 5000) return res.status(400).json({ error: "Message too long" });

  const rating = body.rating || null;
  const page = body.page || null;
  const email = body.email || null;
  const userId = body.user_id || null;
  const userAgent = body.user_agent || req.headers["user-agent"] || null;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          message,
          rating,
          page,
          email,
          user_id: userId,
          user_agent: userAgent,
        }),
      });
    } catch (e) {
      // continue — emailing is more important than logging
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "cameronimpemba@gmail.com";
  const fromAddress = process.env.FEEDBACK_FROM || "feedback@smartsolvepoker.com";

  if (resendKey) {
    const ratingMap = { love: "🔥 Love it", good: "👍 Good", meh: "😐 Meh", bad: "👎 Broken" };
    const ratingLabel = ratingMap[rating] || "(no rating)";
    const subject = `[SmartSolve feedback] ${ratingLabel}${email ? ` — ${email}` : ""}`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
        <div style="font-size:12px;letter-spacing:0.08em;color:#888;text-transform:uppercase;font-weight:700;margin-bottom:6px;">SmartSolve Feedback</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:18px;">${escapeHtml(ratingLabel)}</div>
        <div style="background:#f6f6f4;border-left:3px solid #d4a72c;padding:16px 18px;border-radius:6px;font-size:15px;line-height:1.55;white-space:pre-wrap;margin-bottom:18px;">${escapeHtml(message)}</div>
        <table style="font-size:13px;color:#555;border-collapse:collapse;">
          <tr><td style="padding:3px 12px 3px 0;color:#888;">From</td><td>${escapeHtml(email || "anonymous")}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#888;">Page</td><td>${escapeHtml(page || "—")}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#888;">Agent</td><td style="font-family:monospace;font-size:11px;">${escapeHtml((userAgent || "").slice(0, 200))}</td></tr>
        </table>
      </div>
    `;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: `SmartSolve <${fromAddress}>`,
          to: [adminEmail],
          subject,
          html,
          reply_to: email || undefined,
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        return res.status(200).json({ ok: true, email_warning: text });
      }
    } catch (e) {
      return res.status(200).json({ ok: true, email_warning: e.message });
    }
  }

  return res.status(200).json({ ok: true });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
