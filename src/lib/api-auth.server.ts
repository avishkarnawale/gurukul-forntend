import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function authenticateBearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
