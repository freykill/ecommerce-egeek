/**
 * Configuración del storefront. Cambia SOLO estos dos valores para apuntar
 * a tu backend y a tu tienda (multi-tenant).
 *
 *  - apiBaseUrl: prefijo global del backend (termina en /api, sin slash final).
 *  - tenantSlug: identifica la tienda. Se manda en cada request como header
 *                `X-Tenant-Slug`. Lo define el dueño de la plataforma.
 *
 * Nota CORS: al apuntar a un host distinto (ej. localhost:3000 desde :4200) el
 * backend debe permitir el origen y el header `X-Tenant-Slug`. Si prefieres
 * evitar CORS, usa un proxy de dev y deja apiBaseUrl = '/api'.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
  tenantSlug: 'default',
};
