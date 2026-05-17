import { PageHeader } from "@/components/layout/page-header";
import { MemberForm } from "@/components/members/member-form";
import { createMember } from "@/actions/member-actions";

export default function NuevoMiembroPage() {
  return (
    <>
      <PageHeader title="Nuevo miembro" backHref="/miembros" />
      <MemberForm onSubmit={createMember} submitLabel="Crear miembro" />
    </>
  );
}
