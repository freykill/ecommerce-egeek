import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../core/models';
import { MoneyPipe } from '../pipes/money.pipe';
import { IconComponent } from './icon.component';

/**
 * Tarjeta de producto para la grilla del catálogo: tile de imagen con
 * hairline + texto debajo. Toda la tarjeta enlaza al detalle (donde se
 * elige la variante y se agrega al carrito).
 */
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MoneyPipe, IconComponent],
  template: `
    <a
      [routerLink]="['/producto', product.slug]"
      class="group flex h-full flex-col focus:outline-none"
    >
      <!-- Imagen -->
      <div
        class="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-surface-muted"
      >
        @if (product.mainImage) {
          <img
            [src]="product.mainImage"
            [alt]="product.name"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            [class.opacity-40]="!product.inStock"
            [class.grayscale]="!product.inStock"
          />
        } @else {
          <div class="flex h-full w-full items-center justify-center text-ink-mute">
            <app-icon name="box" [size]="40" />
          </div>
        }

        @if (product.isFeatured && product.inStock) {
          <span class="pill absolute left-3 top-3 bg-ink text-white">Destacado</span>
        }
        @if (!product.inStock) {
          <span class="pill absolute left-3 top-3 border border-line bg-surface text-ink-soft">
            Agotado
          </span>
        }
      </div>

      <!-- Cuerpo: bloque compacto pegado a la imagen -->
      <div class="flex flex-col pt-2.5">
        <span class="meta">
          {{ product.category.name }}@if (product.brand) {<span class="text-ink-mute"> · {{ product.brand.name }}</span>}
        </span>
        <h3
          class="mt-1 line-clamp-2 text-[0.95rem] font-medium leading-snug text-ink transition-colors group-hover:text-brand"
        >
          {{ product.name }}
        </h3>
        @if (product.priceFrom !== null) {
          <span class="mt-1 text-[1.02rem] font-semibold tracking-tight text-ink tabular-nums">
            {{ product.priceFrom | money }}
          </span>
        } @else {
          <span class="mt-1 text-sm text-ink-soft">Precio a consultar</span>
        }
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductCard;
}
