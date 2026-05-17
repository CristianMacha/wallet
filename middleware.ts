import { NextRequest, NextResponse } from "next/server";

// El middleware solo verifica que exista la cookie — la validación real
// ocurre en el layout del servidor con Firebase Admin SDK (Node.js runtime).
export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transaction/:path*",
    "/historial/:path*",
    "/miembros/:path*",
    "/reportes/:path*",
    "/prestamos/:path*",
    "/mi-cuenta/:path*",
  ],
};
