import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ ok: false, error: "Méthode non autorisée." }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ ok: false, error: "Connexion requise." }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const expectedCode = Deno.env.get("COMMUNITY_MEMBER_CODE");
  if (!expectedCode) return json({ ok: false, error: "Le code membre n'est pas configuré." }, 500);

  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ ok: false, error: "Session invalide." }, 401);

  const body = await req.json().catch(() => null);
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (code !== expectedCode) return json({ ok: false, error: "Code membre incorrect." }, 403);
  if (nickname.length < 2 || nickname.length > 32 || /[<>]/.test(nickname))
    return json({ ok: false, error: "Pseudonyme invalide (2 à 32 caractères)." }, 400);

  const admin = createClient(url, service);
  const { data: existing } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = existing?.role === "admin" ? "admin" : "member";
  const { error } = await admin.from("profiles").upsert({ id: user.id, nickname, role }, { onConflict: "id" });
  if (error) return json({ ok: false, error: "Impossible d'enregistrer le profil." }, 500);
  return json({ ok: true, nickname, role });
});
