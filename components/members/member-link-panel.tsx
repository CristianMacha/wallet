"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { regenerateMemberToken } from "@/actions/member-actions";
import { Copy, RefreshCw, Check } from "lucide-react";

interface MemberLinkPanelProps {
  memberId: string;
  accessToken: string;
}

export function MemberLinkPanel({ memberId, accessToken: initialToken }: MemberLinkPanelProps) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/m/${token}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setConfirming(false);
    const result = await regenerateMemberToken(memberId);
    if (result.ok && result.accessToken) {
      setToken(result.accessToken);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Comparte este enlace con el miembro para que vea su saldo.
      </p>

      <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2">
        <span className="text-xs text-foreground truncate flex-1 font-mono">{link}</span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Copiar enlace"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {confirming ? (
        <div className="space-y-2">
          <p className="text-xs text-destructive">
            El enlace anterior dejará de funcionar. ¿Continuar?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRegenerate}
              disabled={loading}
            >
              Sí, regenerar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRegenerate}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {loading ? "Regenerando..." : "Regenerar enlace"}
        </Button>
      )}
    </div>
  );
}
