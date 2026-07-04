/** GET /api/public/branding — lo más liviano, para tematizar antes de todo. */
export interface Branding {
  storeName: string | null;
  logoUrl: string | null;
  primaryColor: string | null; // ej. "#0ea5e9"
  secondaryColor: string | null;
}
