import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

/**
 * Página del carrito (/carrito). No consulta al backend: lee el estado del
 * CartService (signals). El total real lo confirma la tienda en el checkout.
 */
@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, EmptyStateComponent, MoneyPipe],
  template: `
    <section class="surface-page py-10">
      @if (cart.isEmpty()) {
        <app-empty-state
          icon="cart"
          title="Tu carrito está vacío"
          message="Aún no agregaste productos. Explora el catálogo y arma tu pedido."
        >
          <a routerLink="/" class="btn btn-dark btn-lg">Explorar productos</a>
        </app-empty-state>
      } @else {
        <!-- Encabezado -->
        <div class="mb-8 border-b border-line pb-5">
          <h1 class="page-title">Tu carrito</h1>
          <p class="meta mt-2">
            {{ cart.count() }} productos · {{ cart.lineCount() }} líneas
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3 lg:gap-12">
          <!-- Columna izquierda: lista de ítems -->
          <div class="lg:col-span-2">
            <ul class="divide-y divide-line border-b border-line">
              @for (item of cart.items(); track item.idVariant) {
                <li class="flex gap-4 py-5 first:pt-0">
                  <!-- Imagen -->
                  <a
                    [routerLink]="['/producto', item.productSlug]"
                    class="shrink-0"
                    [attr.aria-label]="item.productName"
                  >
                    @if (item.image) {
                      <img
                        [src]="item.image"
                        [alt]="item.productName"
                        class="h-20 w-20 rounded-[var(--radius-sm)] border border-line object-cover sm:h-24 sm:w-24"
                        loading="lazy"
                      />
                    } @else {
                      <span
                        class="grid h-20 w-20 place-items-center rounded-[var(--radius-sm)] border border-line bg-surface-muted text-ink-mute sm:h-24 sm:w-24"
                      >
                        <app-icon name="box" [size]="28" />
                      </span>
                    }
                  </a>

                  <!-- Detalle -->
                  <div class="flex min-w-0 flex-1 flex-col">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <a
                          [routerLink]="['/producto', item.productSlug]"
                          class="block truncate font-medium text-ink transition-colors hover:text-brand"
                        >
                          {{ item.productName }}
                        </a>
                        <p class="meta mt-1 truncate normal-case">{{ item.variantName }}</p>
                        <p class="mt-1.5 text-sm text-ink-soft tabular-nums">
                          {{ item.unitPrice | money }} c/u
                        </p>
                      </div>

                      <!-- Eliminar -->
                      <button
                        type="button"
                        class="icon-btn h-9 w-9 shrink-0 text-ink-mute hover:text-danger"
                        (click)="cart.remove(item.idVariant)"
                        [attr.aria-label]="'Quitar ' + item.productName"
                      >
                        <app-icon name="trash" [size]="17" />
                      </button>
                    </div>

                    <!-- Stepper + subtotal de línea -->
                    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div
                        class="inline-flex items-center rounded-[var(--radius-sm)] border border-line bg-surface"
                      >
                        <button
                          type="button"
                          class="grid h-9 w-9 place-items-center text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                          (click)="cart.decrement(item.idVariant)"
                          [disabled]="item.quantity <= 1"
                          aria-label="Quitar una unidad"
                        >
                          <app-icon name="minus" [size]="15" />
                        </button>
                        <span
                          class="w-8 text-center text-sm font-semibold tabular-nums text-ink"
                          aria-live="polite"
                        >
                          {{ item.quantity }}
                        </span>
                        <button
                          type="button"
                          class="grid h-9 w-9 place-items-center text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                          (click)="cart.increment(item.idVariant)"
                          [disabled]="item.quantity >= item.stock"
                          aria-label="Agregar una unidad"
                        >
                          <app-icon name="plus" [size]="15" />
                        </button>
                      </div>

                      <span class="font-semibold text-ink tabular-nums">
                        {{ item.unitPrice * item.quantity | money }}
                      </span>
                    </div>

                    @if (item.quantity >= item.stock) {
                      <p class="meta mt-2 text-warning">
                        Máximo disponible: {{ item.stock }}
                      </p>
                    }
                  </div>
                </li>
              }
            </ul>

            <div class="mt-5 flex items-center justify-between gap-3">
              <a routerLink="/" class="link-arrow">
                <app-icon name="chevron-left" [size]="15" /> Seguir comprando
              </a>
              <button
                type="button"
                class="btn btn-ghost btn-sm text-ink-mute hover:text-danger"
                (click)="cart.clear()"
              >
                <app-icon name="trash" [size]="15" /> Vaciar carrito
              </button>
            </div>
          </div>

          <!-- Columna derecha: resumen -->
          <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="card p-6">
              <h2 class="meta">Resumen del pedido</h2>

              <dl class="mt-4 space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <dt class="text-ink-soft">{{ cart.count() }} productos</dt>
                  <dd class="font-medium text-ink tabular-nums">{{ cart.subtotal() | money }}</dd>
                </div>
                <div class="flex items-center justify-between border-t border-line pt-3">
                  <dt class="font-semibold text-ink">Subtotal</dt>
                  <dd class="text-xl font-semibold text-ink tabular-nums">
                    {{ cart.subtotal() | money }}
                  </dd>
                </div>
              </dl>

              <p class="mt-3 text-[0.82rem] leading-relaxed text-ink-soft">
                El total final (envío, descuentos e impuestos) lo confirma la tienda al cerrar
                tu pedido por WhatsApp.
              </p>

              @if (store.maintenanceMode()) {
                <div class="notice notice-warning mt-4">
                  <app-icon name="alert" [size]="17" />
                  <span>La tienda está en mantenimiento; los pedidos están pausados.</span>
                </div>
              }

              <a
                routerLink="/checkout"
                class="btn btn-dark btn-lg mt-5 w-full"
                [class.pointer-events-none]="store.maintenanceMode()"
                [class.opacity-45]="store.maintenanceMode()"
                [attr.aria-disabled]="store.maintenanceMode() || null"
                [attr.tabindex]="store.maintenanceMode() ? -1 : null"
              >
                Continuar al pedido <app-icon name="arrow-right" [size]="17" />
              </a>
            </div>

            <!-- Fila de confianza -->
            <ul class="mt-5 space-y-2.5 px-1 text-sm text-ink-soft">
              <li class="flex items-center gap-2.5">
                <app-icon name="truck" [size]="15" class="shrink-0 text-brand" />
                Delivery / retiro coordinado
              </li>
              <li class="flex items-center gap-2.5">
                <app-icon name="whatsapp" [size]="15" class="shrink-0 text-brand" />
                Cierras por WhatsApp
              </li>
              <li class="flex items-center gap-2.5">
                <app-icon name="shield" [size]="15" class="shrink-0 text-brand" />
                Precios confirmados por la tienda
              </li>
            </ul>
          </aside>
        </div>
      }
    </section>
  `,
})
export class CartPage {
  protected readonly cart = inject(CartService);
  protected readonly store = inject(StoreContextService);
}
