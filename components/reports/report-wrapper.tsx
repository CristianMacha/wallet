"use client";

import { useRef } from "react";
import { MonthlyReport } from "./monthly-report";
import { PrintButton } from "./print-button";
import { WhatsAppShareButton } from "./whatsapp-share-button";
import type { Transaction } from "@/lib/transactions";
import type { Balance } from "@/lib/balance";

interface MemberReport {
  id: string;
  name: string;
  alias: string | null;
  monthBalance: Balance;
  cumulativeBalance: Balance;
  transactions: Transaction[];
}

interface ReportWrapperProps {
  month: string;
  members: MemberReport[];
}

export function ReportWrapper({ month, members }: ReportWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <WhatsAppShareButton month={month} members={members} />
        <PrintButton contentRef={contentRef} />
      </div>
      <div ref={contentRef} className="px-4 py-2">
        <MonthlyReport month={month} members={members} />
      </div>
    </div>
  );
}
