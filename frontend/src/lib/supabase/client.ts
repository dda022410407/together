import { createBrowserClient } from "@supabase/ssr";
import {
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/supabase/env";

export function createClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
