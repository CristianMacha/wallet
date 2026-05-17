import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";

interface Member {
  id: string;
  name: string;
  alias: string | null;
  isActive: boolean;
}

async function getMembers(userId: string): Promise<Member[]> {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("members")
    .orderBy("createdAt")
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    alias: doc.data().alias ?? null,
    isActive: doc.data().isActive,
  }));
}

export default async function MiembrosPage() {
  const userId = await getCurrentUserId();
  const members = await getMembers(userId);
  const active = members.filter((m) => m.isActive);
  const inactive = members.filter((m) => !m.isActive);

  return (
    <>
      <PageHeader
        title="Miembros"
        action={
          <Link href="/miembros/nuevo">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-6">
        {members.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            Aún no hay miembros. Agrega el primero.
          </p>
        )}

        {active.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Activos
            </h2>
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {active.map((m) => (
                <li key={m.id} className="flex items-center bg-card">
                  <Link
                    href={`/miembros/${m.id}`}
                    className="flex items-center gap-3 flex-1 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      {m.alias && (
                        <p className="text-xs text-muted-foreground">{m.alias}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {inactive.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inactivos
            </h2>
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {inactive.map((m) => (
                <li key={m.id} className="flex items-center bg-card opacity-60">
                  <Link
                    href={`/miembros/${m.id}`}
                    className="flex items-center gap-3 flex-1 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      {m.alias && (
                        <p className="text-xs text-muted-foreground">{m.alias}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
