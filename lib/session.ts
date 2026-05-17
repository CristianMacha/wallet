import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) throw new Error("No session");
  const decoded = await adminAuth.verifySessionCookie(session, true);
  return decoded.uid;
}
