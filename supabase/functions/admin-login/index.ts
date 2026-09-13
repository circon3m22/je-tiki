import { createClient } from "@supabase/supabase-js";

// Resolve the store owner's alias on the server without publishing their email.
const adminUserId = "295632ed-18a6-4c23-9bbf-f9de2bf11cb9";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
const denied = () => reply({ error: "invalid_credentials" }, 401);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  try {
    const payload = await req.json();
    if (typeof payload?.login !== "string" || typeof payload?.password !== "string"
      || payload.login.trim().toLowerCase() !== "jetiki"
      || !payload.password || payload.password.length > 1024) return denied();

    const url = Deno.env.get("SUPABASE_URL")!;
    const options = { auth: { persistSession: false, autoRefreshToken: false } };
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, options);
    const { data: profile, error: profileError } = await admin.from("admin_profiles")
      .select("user_id").eq("user_id", adminUserId).maybeSingle();
    if (profileError) return reply({ error: "temporarily_unavailable" }, 503);
    if (!profile) return denied();
    const { data: account, error: accountError } = await admin.auth.admin.getUserById(adminUserId);
    if (accountError || !account.user?.email) return denied();

    // Supabase Auth validates the password and applies its authentication limits.
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, options);
    const { data, error } = await auth.auth.signInWithPassword({
      email: account.user.email,
      password: payload.password,
    });
    if (error || !data.session || data.user?.id !== adminUserId) {
      return error?.status === 429 ? reply({ error: "too_many_attempts" }, 429) : denied();
    }
    return reply({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return reply({ error: "request_failed" }, 400);
  }
});
