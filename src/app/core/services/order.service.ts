import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Checkout, CheckoutResult, OrderTracking } from '../models';

const LAST_TOKEN_KEY = 'egeek_last_order';

/** Checkout + seguimiento del pedido (todo público, sin login). */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  /** Token del último pedido creado en este navegador (para "ver mi pedido"). */
  readonly lastToken = signal<string | null>(this.restoreLastToken());

  /** POST /store/orders — crea el pedido. El servidor calcula el total. */
  checkout(payload: Checkout): Observable<CheckoutResult> {
    return this.api.post<CheckoutResult>('/store/orders', payload).pipe(
      tap((result) => this.rememberToken(result.publicToken)),
    );
  }

  /** GET /store/orders/:token — seguimiento. */
  track(token: string): Observable<OrderTracking> {
    return this.api.get<OrderTracking>(`/store/orders/${encodeURIComponent(token)}`);
  }

  /** POST /store/orders/:token/whatsapp-sent — deja constancia (idempotente). */
  markWhatsappSent(token: string): Observable<{ ok: boolean }> {
    return this.api.post<{ ok: boolean }>(
      `/store/orders/${encodeURIComponent(token)}/whatsapp-sent`,
    );
  }

  /** URL pública de seguimiento del pedido (para compartir/guardar). */
  trackingUrl(token: string): string {
    return `${window.location.origin}/pedido/${token}`;
  }

  /**
   * Agrega el enlace de seguimiento al final del mensaje de WhatsApp, para que
   * quede guardado en el chat y el cliente no lo pierda. Devuelve la URL tal
   * cual si no hay WhatsApp, si no se puede parsear o si el link ya está.
   */
  whatsappUrlWithTracking(whatsappUrl: string | null, token: string): string | null {
    if (!whatsappUrl) return null;
    try {
      const url = new URL(whatsappUrl);
      const text = url.searchParams.get('text') ?? '';
      const link = this.trackingUrl(token);
      if (text.includes(link)) return whatsappUrl;
      url.searchParams.set('text', `${text}\n\nSigue tu pedido aquí:\n${link}`);
      return url.toString();
    } catch {
      return whatsappUrl;
    }
  }

  private rememberToken(token: string): void {
    this.lastToken.set(token);
    try {
      localStorage.setItem(LAST_TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  }

  private restoreLastToken(): string | null {
    try {
      return localStorage.getItem(LAST_TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
