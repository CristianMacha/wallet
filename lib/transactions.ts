import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Transaction {
  id: string;
  memberId: string | null; // null = cuenta propia del usuario
  memberName: string;
  type: "DEPOSIT" | "EXPENSE";
  amount: number;
  currency: "PEN" | "USD";
  description: string | null;
  date: Date;
  createdAt: Date;
}

interface FilterOptions {
  memberId?: string;
  type?: "DEPOSIT" | "EXPENSE";
  currency?: "PEN" | "USD";
  from?: string;
  to?: string;
}

async function queryTransactions(
  ref: FirebaseFirestore.CollectionReference,
  filters: FilterOptions
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  let query = ref
    .orderBy("date", "desc")
    .orderBy("createdAt", "desc") as FirebaseFirestore.Query;

  if (filters.type) query = query.where("type", "==", filters.type);
  if (filters.currency) query = query.where("currency", "==", filters.currency);
  if (filters.from) query = query.where("date", ">=", Timestamp.fromDate(new Date(filters.from)));
  if (filters.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.where("date", "<=", Timestamp.fromDate(toDate));
  }

  const snap = await query.get();
  return snap.docs;
}

function docToTransaction(
  doc: FirebaseFirestore.QueryDocumentSnapshot,
  memberId: string | null,
  memberName: string
): Transaction {
  const data = doc.data();
  return {
    id: doc.id,
    memberId,
    memberName,
    type: data.type as "DEPOSIT" | "EXPENSE",
    amount: data.amount as number,
    currency: data.currency as "PEN" | "USD",
    description: (data.description as string) || null,
    date: (data.date as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
  };
}

export async function getTransactions(
  userId: string,
  filters: FilterOptions = {}
): Promise<Transaction[]> {
  const userRef = adminDb.collection("users").doc(userId);
  const all: Transaction[] = [];

  // Si se filtra por un miembro específico, solo esa subcolección
  if (filters.memberId) {
    const memberDoc = await userRef.collection("members").doc(filters.memberId).get();
    const d = memberDoc.data();
    const memberName = d?.alias ? `${d.name} - ${d.alias}` : (d?.name as string) ?? "";
    const docs = await queryTransactions(
      userRef.collection("members").doc(filters.memberId).collection("transactions"),
      filters
    );
    all.push(...docs.map((d) => docToTransaction(d, filters.memberId!, memberName)));
  } else {
    // Transacciones de todos los miembros activos
    const membersSnap = await userRef.collection("members").where("isActive", "==", true).get();
    await Promise.all(
      membersSnap.docs.map(async (memberDoc) => {
        const md = memberDoc.data();
        const memberName = md.alias ? `${md.name} - ${md.alias}` : (md.name as string);
        const docs = await queryTransactions(
          userRef.collection("members").doc(memberDoc.id).collection("transactions"),
          filters
        );
        all.push(...docs.map((d) => docToTransaction(d, memberDoc.id, memberName)));
      })
    );
  }

  all.sort((a, b) => {
    const diff = b.date.getTime() - a.date.getTime();
    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime();
  });

  return all;
}

// Transacciones de la cuenta propia del usuario
export async function getUserTransactions(
  userId: string,
  userName: string,
  filters: FilterOptions = {}
): Promise<Transaction[]> {
  const ref = adminDb.collection("users").doc(userId).collection("transactions");
  const docs = await queryTransactions(ref, filters);
  return docs.map((d) => docToTransaction(d, null, userName));
}

export interface WeeklyActivity {
  week: string; // "Sem 1", "Sem 2", etc.
  depositos: number;
  gastos: number;
}

// Agrupa depósitos y gastos en PEN de los últimos 30 días por semana
export async function getWeeklyActivity(userId: string): Promise<WeeklyActivity[]> {
  const userRef = adminDb.collection("users").doc(userId);
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);

  const fromTs = Timestamp.fromDate(from);

  // Consultar todas las subcolecciones en paralelo
  const [membersSnap, userDocs] = await Promise.all([
    userRef.collection("members").where("isActive", "==", true).get(),
    userRef.collection("transactions").where("date", ">=", fromTs).get(),
  ]);

  const memberDocs = await Promise.all(
    membersSnap.docs.map((m) =>
      userRef.collection("members").doc(m.id).collection("transactions")
        .where("date", ">=", fromTs).get()
    )
  );

  const allDocs = [
    ...userDocs.docs,
    ...memberDocs.flatMap((s) => s.docs),
  ];

  // Inicializar 4 semanas (sem 1 = más antigua, sem 4 = más reciente)
  const weeks: WeeklyActivity[] = [
    { week: "Sem 1", depositos: 0, gastos: 0 },
    { week: "Sem 2", depositos: 0, gastos: 0 },
    { week: "Sem 3", depositos: 0, gastos: 0 },
    { week: "Sem 4", depositos: 0, gastos: 0 },
  ];

  for (const doc of allDocs) {
    const data = doc.data();
    if (data.currency !== "PEN") continue;
    const date = (data.date as Timestamp).toDate();
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.min(3, Math.floor(daysDiff / 7));
    const slot = weeks[3 - weekIdx]; // invertir: semana más reciente = índice 3
    if (data.type === "DEPOSIT") slot.depositos += data.amount as number;
    else slot.gastos += data.amount as number;
  }

  return weeks;
}
