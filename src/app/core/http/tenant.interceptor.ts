import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../config/environment';

/**
 * Multi-tenant OBLIGATORIO: añade `X-Tenant-Slug` a cada request al backend.
 * Sin esto, ningún endpoint del storefront responde.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiCall =
    req.url.startsWith(environment.apiBaseUrl) || req.url.startsWith('/api');

  if (isApiCall) {
    req = req.clone({
      setHeaders: { 'X-Tenant-Slug': environment.tenantSlug },
    });
  }

  return next(req);
};
