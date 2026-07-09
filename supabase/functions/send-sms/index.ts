// Send SMS Hook for Supabase Auth — MSG91 integration
// Deploy: supabase functions deploy send-sms --no-verify-jwt

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.text();

    const base64Secret = (Deno.env.get("SEND_SMS_HOOK_SECRET") ?? "")
      .replace("v1,whsec_", "");

    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(base64Secret);

    const { user, sms } = wh.verify(payload, headers) as {
      user: { phone: string };
      sms: { otp: string };
    };

    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    const templateId = Deno.env.get("MSG91_TEMPLATE_ID");
    const senderId = Deno.env.get("MSG91_SENDER_ID") ?? "RASORI";

    if (!authKey) {
      return new Response(
        JSON.stringify({
          error: { http_code: 500, message: "MSG91_AUTH_KEY not configured" },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const phone = user.phone.replace(/^\+91/, "").replace(/^0+/, "");

    const url = new URL("https://api.msg91.com/api/v5/otp");
    url.searchParams.set("authkey", authKey);
    url.searchParams.set("mobile", phone);
    url.searchParams.set("otp", sms.otp);
    url.searchParams.set("sender", senderId);
    if (templateId) url.searchParams.set("template_id", templateId);

    const res = await fetch(url.toString(), { method: "POST" });
    const result = await res.json();

    if (result.type !== "success") {
      return new Response(
        JSON.stringify({
          error: {
            http_code: 500,
            message: `MSG91 error: ${result.message ?? "unknown"}`,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: { http_code: 500, message: `Hook error: ${err.message}` },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
