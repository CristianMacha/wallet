import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { getMemberBalance } from "@/lib/balance";
import { getTransactions } from "@/lib/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { EditMemberForm } from "@/components/members/edit-member-form";
import { MemberLinkPanel } from "@/components/members/member-link-panel";
import { ToggleActiveButton } from "@/components/members/toggle-active-button";
import { BalanceDisplay } from "@/components/shared/balance-display";
import { TransactionItem } from "@/components/transactions/transaction-item";

interface Member {
  id: string;
  name: string;
  alias: string | null;
  note: string | null;
  accessToken: string;
  isActive: boolean;
}

async function getMember(userId: string, id: string): Promise<Member | null> {
  const doc = await adminDb
    .collection("users").doc(userId)
    .collection("members").doc(id)
    .get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    alias: data.alias ?? null,
    note: data.note ?? null,
    accessToken: data.accessToken,
    isActive: data.isActive,
  };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  const { id } = await params;

  const [member, balance, transactions] = await Promise.all([
    getMember(userId, id),
    getMemberBalance(userId, id),
    getTransactions(userId, { memberId: id }),
  ]);

  if (!member) notFound();

  return (
    <>
      <PageHeader title={member.name} backHref="/miembros" />
      <div className="px-4 py-4 space-y-6">
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo actual</h2>
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <BalanceDisplay balance={balance} size="lg" />
            {member.note && (
              <p className="text-sm text-muted-foreground border-t border-border pt-3">{member.note}</p>
            )}
          </div>
        </section>

        {transactions.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Movimientos recientes</h2>
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {transactions.slice(0, 20).map((tx) => (
                <TransactionItem key={tx.id} {...tx} showMember={false} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Editar datos</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <EditMemberForm
              memberId={member.id}
              defaultValues={{ name: member.name, alias: member.alias ?? undefined, note: member.note ?? undefined }}
            />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enlace de acceso</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <MemberLinkPanel memberId={member.id} accessToken={member.accessToken} />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado del miembro</h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <ToggleActiveButton memberId={member.id} isActive={member.isActive} />
          </div>
        </section>
      </div>
    </>
  );
}
