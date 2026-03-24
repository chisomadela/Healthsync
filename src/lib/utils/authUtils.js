import { db } from "../config/supabase.js";

async function userExists(email) {
  const { data, error } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking user existence:", error);
    throw error;
  }

  return !!data;
}

export { userExists };