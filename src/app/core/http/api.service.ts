import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../config/environment';
import { ApiError, ApiMeta, ApiResponse } from '../models';

type ParamValue = string | number | boolean | undefined | null;

/**
 * Cliente HTTP del storefront. Desenvuelve la envoltura `{ success, data, meta }`
 * y normaliza cualquier error a `ApiError` (con el `message` en español que ya
 * manda el backend). Los servicios de features usan estos tres métodos.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** GET que devuelve solo `data`. */
  get<T>(path: string, params?: Record<string, ParamValue>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), { params: this.toParams(params) })
      .pipe(
        map((res) => res.data),
        catchError(this.normalizeError),
      );
  }

  /** GET de listados: devuelve `data` + `meta` (paginación). */
  getPaged<T>(
    path: string,
    params?: Record<string, ParamValue>,
  ): Observable<{ data: T; meta: ApiMeta | null }> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), { params: this.toParams(params) })
      .pipe(
        map((res) => ({ data: res.data, meta: res.meta })),
        catchError(this.normalizeError),
      );
  }

  /** POST que devuelve solo `data`. */
  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body ?? {})
      .pipe(
        map((res) => res.data),
        catchError(this.normalizeError),
      );
  }

  private url(path: string): string {
    return `${this.base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private toParams(params?: Record<string, ParamValue>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }

  private normalizeError = (err: HttpErrorResponse): Observable<never> => {
    // El backend manda el error dentro de la misma envoltura:
    // { success:false, message, statusCode, errors }
    const body = err.error as
      | { message?: string | null; statusCode?: number; errors?: string[] | null }
      | null
      | undefined;

    const message =
      body?.message ||
      (err.status === 0
        ? 'No pudimos conectar con la tienda. Revisa tu conexión.'
        : 'Ocurrió un error inesperado. Intenta de nuevo.');
    const statusCode = body?.statusCode ?? err.status ?? 0;
    const errors = body?.errors ?? null;

    return throwError(() => new ApiError(message, statusCode, errors));
  };
}
