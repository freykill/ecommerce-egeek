import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CartService } from '../core/services/cart.service';
import { CatalogService } from '../core/services/catalog.service';
import { StoreContextService } from '../core/services/store-context.service';
import { IconComponent } from '../shared/ui/icon.component';

/** Encabezado global: barra utilitaria, marca, buscador, carrito y categorías. */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <!-- Aviso de mantenimiento (bloquea pedidos) -->
    @if (store.maintenanceMode()) {
      <div
        class="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center font-mono text-[0.72rem] font-medium uppercase tracking-[0.08em] text-white"
      >
        <app-icon name="alert" [size]="14" />
        Tienda en mantenimiento · Los pedidos están pausados
      </div>
    }

    <!-- Barra utilitaria (estática, sin ruido) -->
    <div class="bg-ink text-white/75">
      <div
        class="surface-page flex h-8 items-center justify-between font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em]"
      >
        <span class="inline-flex items-center gap-2">
          <app-icon name="whatsapp" [size]="13" />
          Pedido por WhatsApp
        </span>
        <div class="hidden items-center gap-6 sm:flex">
          @if (store.settings()?.allowDelivery) {
            <span class="inline-flex items-center gap-2">
              <app-icon name="truck" [size]="13" /> Delivery
            </span>
          }
          @if (store.settings()?.allowPickup) {
            <span class="inline-flex items-center gap-2">
              <app-icon name="store" [size]="13" /> Retiro en tienda
            </span>
          }
          <span class="inline-flex items-center gap-2">
            <app-icon name="shield" [size]="13" /> Compra segura
          </span>
        </div>
      </div>
    </div>

    <header
      class="sticky top-0 z-40 border-b border-line bg-surface transition-shadow duration-200"
      [class.shadow-xs]="scrolled()"
    >
      <div class="surface-page flex h-[4.25rem] items-center gap-4">
        <!-- Marca -->
        <a
          routerLink="/"
          class="flex shrink-0 items-center gap-2.5"
          [attr.aria-label]="store.storeName()"
        >
          @if (store.logoUrl()) {
            <img
              [src]="store.logoUrl()"
              [alt]="store.storeName()"
              class="h-8 w-auto max-w-[160px] object-contain"
            />
          } @else {
            <span
              class="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-brand text-brand-contrast"
            >
              <app-icon name="store" [size]="16" />
            </span>
            <span class="text-[1.05rem] font-semibold tracking-tight text-ink">
              {{ store.storeName() }}
            </span>
          }
        </a>

        <!-- Buscador (desktop) -->
        <form class="mx-auto hidden w-full max-w-md md:block" (submit)="search($event)">
          <div class="relative">
            <span
              class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
            >
              <app-icon name="search" [size]="16" />
            </span>
            <input
              class="input h-10 border-transparent bg-surface-muted pl-10 pr-4 text-sm focus:bg-surface"
              type="search"
              name="q"
              [value]="term()"
              (input)="term.set($any($event.target).value)"
              placeholder="Buscar productos…"
              aria-label="Buscar productos"
            />
          </div>
        </form>

        <div class="ml-auto flex items-center gap-1 md:ml-0">
          <!-- Buscar (móvil) -->
          <button
            type="button"
            class="icon-btn md:hidden"
            (click)="mobileSearch.set(!mobileSearch())"
            aria-label="Buscar"
          >
            <app-icon name="search" [size]="20" />
          </button>

          <!-- Carrito -->
          <a routerLink="/carrito" class="icon-btn relative" aria-label="Ver carrito">
            <app-icon name="cart" [size]="20" />
            @if (cart.count() > 0) {
              <span
                class="absolute -right-0.5 -top-0.5 grid h-[1.1rem] min-w-[1.1rem] animate-in place-items-center rounded-[0.3rem] bg-brand px-1 font-mono text-[0.62rem] font-medium text-brand-contrast"
              >
                {{ cart.count() }}
              </span>
            }
          </a>
        </div>
      </div>

      <!-- Buscador (móvil, desplegable) -->
      @if (mobileSearch()) {
        <div class="surface-page animate-in pb-3 md:hidden">
          <form (submit)="search($event)">
            <div class="relative">
              <span
                class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
              >
                <app-icon name="search" [size]="16" />
              </span>
              <input
                class="input h-11 border-transparent bg-surface-muted pl-10 text-sm focus:bg-surface"
                type="search"
                name="q"
                [value]="term()"
                (input)="term.set($any($event.target).value)"
                placeholder="Buscar productos…"
                aria-label="Buscar productos"
                autofocus
              />
            </div>
          </form>
        </div>
      }

      <!-- Categorías: tabs subrayados -->
      @if (categories().length) {
        <nav class="border-t border-line">
          <div
            class="surface-page no-scrollbar -mb-px flex items-center gap-6 overflow-x-auto"
          >
            <a routerLink="/" class="nav-link" [attr.data-active]="!activeCategory()">
              Todo
            </a>
            @for (cat of categories(); track cat.slug) {
              <a
                routerLink="/"
                [queryParams]="{ category: cat.slug }"
                class="nav-link"
                [attr.data-active]="activeCategory() === cat.slug"
              >
                {{ cat.name }}
              </a>
            }
          </div>
        </nav>
      }
    </header>
  `,
  styles: [
    `
      .nav-link {
        flex-shrink: 0;
        padding: 0.7rem 0.1rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--ink-soft);
        text-decoration: none;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        transition:
          color 0.15s ease,
          border-color 0.15s ease;
      }
      .nav-link:hover {
        color: var(--ink);
      }
      .nav-link[data-active='true'] {
        color: var(--ink);
        border-bottom-color: var(--brand-primary);
      }
    `,
  ],
})
export class HeaderComponent {
  protected readonly store = inject(StoreContextService);
  protected readonly cart = inject(CartService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly term = signal('');
  protected readonly mobileSearch = signal(false);
  protected readonly scrolled = signal(false);

  protected readonly categories = toSignal(
    this.catalog.getCategories().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  /** Slug de categoría activa (para resaltar el tab en la barra). */
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: null,
  });
  protected readonly activeCategory = computed(
    () => this.queryParams()?.get('category') ?? null,
  );

  @HostListener('window:scroll')
  protected onScroll(): void {
    const next = window.scrollY > 8;
    if (next !== this.scrolled()) this.scrolled.set(next);
  }

  protected search(event: Event): void {
    event.preventDefault();
    const value = this.term().trim();
    this.mobileSearch.set(false);
    this.router.navigate(['/'], {
      queryParams: { search: value || null, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
