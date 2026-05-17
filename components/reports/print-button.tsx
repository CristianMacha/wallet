"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export function PrintButton({ contentRef }: PrintButtonProps) {
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Reporte FamilyWallet",
  });

  return (
    <Button size="sm" variant="outline" onClick={() => handlePrint()}>
      <Printer className="h-4 w-4 mr-1.5" />
      Imprimir
    </Button>
  );
}
