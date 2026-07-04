/** Envoltura estándar de TODAS las respuestas del backend. */
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  meta: ApiMeta | null;
}

/** Paginación (solo en listados). */
export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Forma del cuerpo de error del backend (success:false). */
export interface ApiErrorBody {
  success: false;
  message: string | null;
  statusCode: number;
  errors: string[] | null;
}

/**
 * Error normalizado que lanzan los servicios. Los componentes solo necesitan
 * leer `message` (ya en español desde el backend) y opcionalmente `statusCode`
 * / `errors` (lista de errores de validación cuando el 400 viene del body).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: string[] | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
