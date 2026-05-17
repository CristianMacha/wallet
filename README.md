# FamilyWallet

Aplicación web para gestionar dinero en custodia entre miembros de una familia. Reemplaza el cuaderno físico con un sistema digital accesible desde el celular.

## Funcionalidades

- **Dashboard** — saldos actuales de todos los miembros en soles (S/.) y dólares ($)
- **Movimientos** — registrar depósitos y gastos por miembro, con historial filtrable
- **Cambio de moneda** — registrar cambios S/. ↔ $ con tipo de cambio implícito calculado automáticamente
- **Préstamos** — préstamos entre miembros o a personas externas, con seguimiento de estado (pendiente / devuelto)
- **Historial** — filtros por miembro, tipo, moneda, rango de fechas y búsqueda por descripción
- **Reportes mensuales** — resumen por miembro con opción de imprimir o compartir por WhatsApp
- **Vista de miembro** — enlace único de solo lectura para que cada miembro vea su saldo sin necesitar cuenta
- **Tipo de cambio** — registro del TC del día visible en el dashboard
- **Dark mode** — toggle desde el menú de navegación

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| Base de datos | Firebase Firestore |
| Autenticación | Firebase Auth (email/password) |
| Mutaciones | Server Actions |
| Validación | zod v3 + react-hook-form |
| Hosting | Vercel |

## Requisitos previos

- Node.js 18+
- pnpm
- Proyecto en [Firebase Console](https://console.firebase.google.com) con Firestore y Authentication habilitados

## Instalación

```bash
pnpm install
```

## Variables de entorno

Crea un archivo `.env.local` en la raíz con las siguientes variables:

```env
# Email del administrador — único usuario con acceso al panel admin
ADMIN_EMAIL=tu@correo.com

# Firebase cliente (se exponen al browser, van con NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (solo servidor, NUNCA exponer al cliente)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Las credenciales de Firebase las encuentras en:
- **Cliente** → Firebase Console → Configuración del proyecto → Tus apps → SDK de Firebase
- **Admin** → Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada

## Desarrollo local

```bash
pnpm dev
```

La app estará disponible en `http://localhost:3000`.

## Deploy en Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Agrega todas las variables de entorno del `.env.local` en la configuración del proyecto
3. Vercel detecta Next.js automáticamente — el deploy es automático en cada push

> **Importante:** La variable `FIREBASE_PRIVATE_KEY` contiene saltos de línea (`\n`). En Vercel pégala tal cual — Vercel la maneja correctamente.

## Índices requeridos en Firestore

La app necesita índices compuestos. Firestore los solicita automáticamente con un enlace en la consola la primera vez que se ejecuta cada consulta:

| Colección | Campos |
|---|---|
| `members` | `isActive ASC`, `createdAt ASC` |
| `members/{id}/transactions` | `date DESC`, `createdAt DESC` |
| `members/{id}/transactions` | `type ASC`, `date DESC`, `createdAt DESC` |
| `members/{id}/transactions` | `currency ASC`, `date DESC`, `createdAt DESC` |

## Estructura del proyecto

```
app/
├── (auth)/login/         # Pantalla de login
├── (admin)/              # Rutas protegidas (requieren sesión)
│   ├── dashboard/        # Saldos generales
│   ├── transaction/new/  # Nuevo movimiento (depósito, gasto, cambio, préstamo)
│   ├── historial/        # Historial con filtros y paginación
│   ├── miembros/         # Lista y perfiles de miembros
│   ├── reportes/         # Reportes mensuales imprimibles
│   └── prestamos/        # Gestión de préstamos
└── m/[token]/            # Vista pública de miembro (solo lectura)

actions/                  # Server Actions (mutaciones)
components/               # Componentes React
lib/                      # Utilidades, consultas Firestore, validaciones
```

## Seguridad

- Solo el email definido en `ADMIN_EMAIL` puede acceder al panel admin
- Los enlaces de miembro (`/m/[token]`) son de solo lectura y no requieren autenticación
- Al regenerar el enlace de un miembro, el anterior queda inválido de inmediato
- Las cookies de sesión son HttpOnly y duran 5 días
- Las credenciales del Admin SDK nunca se exponen al cliente
