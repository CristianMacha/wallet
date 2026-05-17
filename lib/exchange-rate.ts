import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface ExchangeRateResult {
  rate: number;
  date: Date;
  isToday: boolean;
}

export async function getLatestExchangeRate(userId: string): Promise<ExchangeRateResult | null> {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("exchangeRates")
    .orderBy("date", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;

  const data = snap.docs[0].data();
  const date = (data.date as Timestamp).toDate();
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return { rate: data.rate as number, date, isToday };
}
