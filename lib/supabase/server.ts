import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseServerConfigurationError extends Error {
  constructor() {
    super("Supabase server credentials are not configured.");
    this.name = "SupabaseServerConfigurationError";
  }
}

let adminClient: SupabaseClient | undefined;

function readServerCredentials() {
  const url = (
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.trim();
  const secretKey = (
    process.env.SUPABASE_SECRET_KEY ||
    // Temporary compatibility with legacy projects. New projects should use a
    // scoped sb_secret_ key instead of the JWT-based service_role key.
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  return { url, secretKey };
}

export function isSupabaseServerConfigured(): boolean {
  const { url, secretKey } = readServerCredentials();
  return Boolean(url && secretKey);
}

/**
 * Returns the privileged server-only client used by checkout and webhooks.
 * Never import this module from a Client Component: the secret key bypasses RLS.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const { url, secretKey } = readServerCredentials();
  if (!url || !secretKey) throw new SupabaseServerConfigurationError();

  adminClient = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
    global: {
      headers: { "X-Client-Info": "je-tiki-server" },
    },
  });

  return adminClient;
}
