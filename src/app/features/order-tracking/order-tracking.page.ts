import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { ORDER_STATUS, OrderTracking, PAYMENT_LABELS } from '../../core/models';
import { OrderService } from '../../core/services/order.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { IconComponent, IconName } from '../../shared/ui/icon.component';
import { SpinnerComponent } from '../../shared/ui/spinner.component';

interface TrackingVm {
  status: 'loading' | 'ok' | 'error';
  order: OrderTracking | null;
  message?: string;
}

/** Tono del estado → color de acento (fondo suave + texto del mismo color). */
type StatusTone = 'pending' | 'active' | 'success' | 'danger' | 'muted';

@Component({
  selector: 'app-order-tracking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, EmptyStateComponent, SpinnerComponent, MoneyPipe],
  template: `
    <section class="surface-page py-10">
      <div class="mx-auto max-w-3xl">
        <!-- Volver al catálogo -->
        <a
          routerLink="/"
          class="mb-5 inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em] text-ink-mute transition-colors hover:text-ink"
        >
          <app-icon name="chevron-left" [size]="14" /> Seguir comprando
        </a>

        @switch (vm().status) {
          @case ('loading') {
            <div class="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
              <app-spinner [size]="32" />
              <p class="text-sm">Cargando tu pedido…</p>
            </div>
          }

          @case ('error') {
            <app-empty-state
              icon="alert"
              tone="danger"
              title="No pudimos mostrar el pedido"
              [message]="vm().message ?? 'Revisa el enlace e intenta de nuevo.'"
            >
              <button type="button" class="btn btn-dark" (click)="retry()">Reintentar</button>
              <a routerLink="/" class="btn btn-outline">Ir a la tienda</a>
            </app-empty-state>
          }

          @case ('ok') {
            @if (vm().order; as order) {
              <div class="space-y-5">
                <!-- Cabecera del pedido -->
                <div class="card p-6 sm:p-7">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                      <p class="meta">Pedido</p>
                      <h1
                        class="mt-1 font-mono text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl"
                      >
                        {{ order.orderNumber }}
                      </h1>
                    </div>
                    @if (statusMeta(); as sm) {
                      <span
                        class="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3.5 py-2 font-mono text-[0.75rem] font-medium uppercase tracking-[0.08em]"
                        [style.background]="softBg(sm.color)"
                        [style.color]="sm.color"
                      >
                        <app-icon [name]="sm.icon" [size]="15" />
                        {{ sm.label }}
                      </span>
                    }
                  </div>

                  <div
                    class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-ink-soft"
                  >
                    <span class="inline-flex items-center gap-1.5">
                      <app-icon name="store" [size]="15" /> {{ order.customerName }}
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <app-icon name="clock" [size]="15" /> {{ formatDate(order.createdAt) }}
                    </span>
                  </div>
                </div>

                <!-- Avisos -->
                <div class="space-y-3">
                  <div class="notice">
                    <span class="mt-0.5 shrink-0 text-brand">
                      <app-icon name="shield" [size]="17" />
                    </span>
                    <p>Guarda este enlace para volver a ver el estado de tu pedido.</p>
                  </div>

                  @if (order.expiresAt && order.status === 'PN') {
                    <div class="notice notice-warning">
                      <span class="mt-0.5 shrink-0"><app-icon name="clock" [size]="17" /></span>
                      <p class="font-medium">
                        Reserva válida hasta {{ formatDate(order.expiresAt) }}
                      </p>
                    </div>
                  }
                </div>

                <!-- Botón WhatsApp -->
                @if (whatsappUrl(); as waUrl) {
                  <a class="btn btn-wa btn-lg w-full" [href]="waUrl" target="_blank" rel="noopener">
                    <app-icon name="whatsapp" [size]="19" /> Abrir WhatsApp con la tienda
                  </a>
                }

                <!-- Ítems -->
                <div class="card p-6">
                  <h2 class="meta mb-3">Tu pedido</h2>
                  <ul class="divide-y divide-line">
                    @for (item of order.items; track $index) {
                      <li class="flex items-start justify-between gap-4 py-3.5">
                        <div class="min-w-0">
                          <p class="font-medium text-ink">{{ item.productName }}</p>
                          @if (item.variantName) {
                            <p class="text-sm text-ink-soft">{{ item.variantName }}</p>
                          }
                          @if (item.sku) {
                            <p class="meta mt-0.5 normal-case">SKU {{ item.sku }}</p>
                          }
                          <p class="mt-1 text-sm text-ink-soft tabular-nums">
                            {{ item.quantity }} × {{ item.unitPrice | money }}
                          </p>
                        </div>
                        <p class="shrink-0 font-semibold text-ink tabular-nums">
                          {{ item.totalPrice | money }}
                        </p>
                      </li>
                    }
                  </ul>
                </div>

                <!-- Totales -->
                <div class="card p-6">
                  <h2 class="meta mb-3">Totales</h2>
                  <dl class="space-y-2.5 text-sm">
                    <div class="flex items-center justify-between">
                      <dt class="text-ink-soft">Subtotal</dt>
                      <dd class="font-medium text-ink tabular-nums">
                        {{ order.subtotal | money }}
                      </dd>
                    </div>
                    @if (order.discount > 0) {
                      <div class="flex items-center justify-between">
                        <dt class="text-ink-soft">Descuento</dt>
                        <dd class="font-medium text-success tabular-nums">
                          −{{ order.discount | money }}
                        </dd>
                      </div>
                    }
                    @if (order.taxTotal > 0) {
                      <div class="flex items-center justify-between">
                        <dt class="text-ink-soft">Impuestos</dt>
                        <dd class="font-medium text-ink tabular-nums">
                          {{ order.taxTotal | money }}
                        </dd>
                      </div>
                    }
                    <div class="flex items-center justify-between">
                      <dt class="text-ink-soft">Envío</dt>
                      <dd class="font-medium text-ink tabular-nums">
                        @if (order.shippingCost > 0) {
                          {{ order.shippingCost | money }}
                        } @else {
                          <span class="text-success">Gratis</span>
                        }
                      </dd>
                    </div>

                    <div class="mt-1 flex items-center justify-between border-t border-line pt-3">
                      <dt class="text-base font-semibold text-ink">Total</dt>
                      <dd class="text-xl font-semibold text-ink tabular-nums">
                        {{ order.total | money }}
                      </dd>
                    </div>
                  </dl>

                  @if (paymentLabel(); as pay) {
                    <p class="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                      <app-icon name="card" [size]="15" /> Método de pago:
                      <span class="font-medium text-ink">{{ pay }}</span>
                    </p>
                  }
                </div>

                <!-- Línea de tiempo -->
                @if (history().length) {
                  <div class="card p-6">
                    <h2 class="meta mb-5">Seguimiento</h2>
                    <ol>
                      @for (h of history(); track $index; let first = $first; let last = $last) {
                        <li class="relative flex gap-4 pb-5 last:pb-0">
                          @if (!last) {
                            <span
                              class="absolute left-[5px] top-4 bottom-0 w-px bg-line"
                              aria-hidden="true"
                            ></span>
                          }
                          <span
                            class="relative z-10 mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2"
                            [style.background]="first ? statusColor(h.status) : 'var(--surface)'"
                            [style.borderColor]="statusColor(h.status)"
                            aria-hidden="true"
                          ></span>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-semibold text-ink">
                              {{ statusLabel(h.status) }}
                            </p>
                            @if (h.comment) {
                              <p class="text-sm text-ink-soft">{{ h.comment }}</p>
                            }
                            <p class="meta mt-1 normal-case">{{ formatDate(h.createdAt) }}</p>
                          </div>
                        </li>
                      }
                    </ol>
                  </div>
                }

                <!-- Volver -->
                <div class="pt-2 text-center">
                  <a routerLink="/" class="link-arrow">
                    Seguir comprando <app-icon name="arrow-right" [size]="15" />
                  </a>
                </div>
              </div>
            }
          }
        }
      </div>
    </section>
  `,
})
export class OrderTrackingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly orders = inject(OrderService);

  private readonly reload$ = new Subject<void>();

  /** Token del pedido tomado de la ruta (/pedido/:token). */
  private readonly token = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('token') ?? '')),
    { initialValue: '' },
  );

  private readonly toneColors: Record<StatusTone, string> = {
    pending: 'var(--warning)',
    active: '#2563eb',
    success: 'var(--success)',
    danger: 'var(--danger)',
    muted: 'var(--ink-soft)',
  };

  private readonly toneIcons: Record<StatusTone, IconName> = {
    pending: 'clock',
    active: 'truck',
    success: 'check',
    danger: 'x',
    muted: 'box',
  };

  protected readonly vm = toSignal(
    combineLatest([
      this.route.paramMap,
      this.reload$.pipe(startWith(undefined)),
    ]).pipe(
      map(([params]) => params.get('token') ?? ''),
      switchMap((token) =>
        this.orders.track(token).pipe(
          map((order): TrackingVm => ({ status: 'ok', order })),
          startWith({ status: 'loading', order: null } as TrackingVm),
          catchError((err) =>
            of<TrackingVm>({ status: 'error', order: null, message: err?.message }),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading', order: null } as TrackingVm },
  );

  /** Estado principal del pedido (label + tono + color + ícono). */
  protected readonly statusMeta = computed(() => {
    const order = this.vm().order;
    if (!order) return null;
    const tone = this.resolveTone(order.status);
    return {
      label: this.statusLabel(order.status),
      color: this.toneColors[tone],
      icon: this.toneIcons[tone],
    };
  });

  /** URL de WhatsApp con el enlace de seguimiento añadido (para no perderlo). */
  protected readonly whatsappUrl = computed(() =>
    this.orders.whatsappUrlWithTracking(this.vm().order?.whatsappUrl ?? null, this.token()),
  );

  /** Método de pago traducido (o crudo si no coincide). */
  protected readonly paymentLabel = computed(() => {
    const pm = this.vm().order?.paymentMethod;
    if (!pm) return null;
    return (PAYMENT_LABELS as Record<string, string>)[pm] ?? pm;
  });

  /** Historial de más reciente a más antiguo (copia, sin mutar el original). */
  protected readonly history = computed(() => {
    const order = this.vm().order;
    if (!order) return [];
    return [...order.statusHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  protected retry(): void {
    this.reload$.next();
  }

  protected statusLabel(code: string): string {
    return ORDER_STATUS[code]?.label ?? code;
  }

  protected statusColor(code: string): string {
    return this.toneColors[this.resolveTone(code)];
  }

  /** Fondo suave del color de acento (para pills y avisos). */
  protected softBg(color: string): string {
    return `color-mix(in srgb, ${color} 10%, white)`;
  }

  protected formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  }

  private resolveTone(code: string): StatusTone {
    return ORDER_STATUS[code]?.tone ?? 'muted';
  }
}
