import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 space-y-4 text-center">
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">
        La página que buscas no existe o el enlace no es válido.
      </p>
      <Link href="/dashboard">
        <Button variant="outline">Ir al inicio</Button>
      </Link>
    </div>
  );
}
