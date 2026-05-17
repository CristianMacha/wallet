"use client";

import { MemberForm } from "./member-form";
import { updateMember } from "@/actions/member-actions";
import type { MemberFormData } from "@/lib/validations/member";

interface EditMemberFormProps {
  memberId: string;
  defaultValues: MemberFormData;
}

export function EditMemberForm({ memberId, defaultValues }: EditMemberFormProps) {
  return (
    <MemberForm
      defaultValues={defaultValues}
      onSubmit={(data) => updateMember(memberId, data)}
      submitLabel="Guardar cambios"
    />
  );
}
