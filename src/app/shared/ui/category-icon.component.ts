import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

/**
 * Cada categoría del backend puede traer un `icon` (clase de PrimeIcons como
 * "pi pi-key", o un emoji como "🎧") y un `color`. Este componente lo resuelve
 * a un glifo del set propio del storefront —sin cargar fuentes externas— y, si
 * el backend no manda ícono, lo infiere del nombre/slug. El color lo pone quien
 * lo usa (el glifo hereda `currentColor`); los emojis conservan su color propio.
 *
 *   <app-category-icon [icon]="cat.icon" [name]="cat.name" [slug]="cat.slug" />
 */

/** Clase de PrimeIcons → ícono del set propio. */
const PRIME_ICON_MAP: Record<string, IconName> = {
  'pi-tag': 'tag',
  'pi-tags': 'tag',
  'pi-heart': 'heart',
  'pi-align-justify': 'menu',
  'pi-bars': 'menu',
  'pi-shield': 'shield',
  'pi-star': 'star',
  'pi-sparkles': 'sparkles',
  'pi-mobile': 'phone',
  'pi-phone': 'phone',
  'pi-home': 'store',
  'pi-building': 'store',
  'pi-shop': 'store',
  'pi-bolt': 'bolt',
  'pi-gift': 'gift',
  'pi-box': 'box',
  'pi-truck': 'truck',
  'pi-clock': 'clock',
  'pi-credit-card': 'card',
  'pi-wallet': 'card',
  'pi-shopping-bag': 'cart',
  'pi-shopping-cart': 'cart',
  'pi-envelope': 'mail',
  'pi-map-marker': 'pin',
  'pi-search': 'search',
  // Tecnología (típico en tiendas gamer/PC)
  'pi-key': 'keyboard',
  'pi-keyboard': 'keyboard',
  'pi-desktop': 'monitor',
  'pi-tablet': 'monitor',
  'pi-microchip': 'cpu',
  'pi-server': 'box',
  'pi-database': 'box',
  'pi-headphones': 'headset',
  'pi-volume-up': 'headset',
  'pi-camera': 'box',
  'pi-video': 'monitor',
};

/**
 * Inferencia por texto (nombre/slug) cuando el backend no trae ícono. Es un
 * fallback: si nada coincide, cae en `tag`, así que nunca empeora el resultado.
 */
const KEYWORD_ICONS: readonly (readonly [RegExp, IconName])[] = [
  [/audifon|auricular|headset|headphone|casco/, 'headset'],
  [/teclad|keyboard/, 'keyboard'],
  [/mouse|rat[oó]n/, 'mouse'],
  [/procesador|micro|\bcpu\b/, 'cpu'],
  [/gabinet|chasis|\bcase\b|torre/, 'box'],
  [/monitor|pantalla|display/, 'monitor'],
  [/laptop|notebook|port[aá]til/, 'laptop'],
  [/mother|placa|tarjeta madre|mainboard/, 'cpu'],
  [/memoria|\bram\b|\bssd\b|disco|almacen/, 'box'],
  [/fuente|\bpower\b|energ/, 'bolt'],
  [/silla|escritorio|mueble/, 'store'],
  [/gpu|\bvga\b|gr[aá]fic|video/, 'bolt'],
  [/celular|m[oó]vil|smartphone|tel[eé]fono/, 'phone'],
  [/c[aá]mara|webcam/, 'box'],
  [/regalo|promo|oferta|combo/, 'gift'],
];

type ResolvedIcon = { readonly kind: 'emoji'; readonly value: string } | { readonly kind: 'svg'; readonly name: IconName };

/** Un valor es "emoji" si contiene algún pictograma (no una clase `pi-*`). */
function looksLikeEmoji(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value);
}

/** Resuelve icono de categoría: emoji → clase PrimeIcons → nombre/slug → `tag`. */
export function resolveCategoryIcon(
  icon: string | null | undefined,
  name = '',
  slug = '',
): ResolvedIcon {
  const raw = (icon ?? '').trim();

  if (raw && looksLikeEmoji(raw)) {
    return { kind: 'emoji', value: raw };
  }

  const token = raw.split(/\s+/).find((c) => c.startsWith('pi-'));
  if (token && PRIME_ICON_MAP[token]) {
    return { kind: 'svg', name: PRIME_ICON_MAP[token] };
  }

  const text = `${slug} ${name}`.toLowerCase();
  for (const [pattern, iconName] of KEYWORD_ICONS) {
    if (pattern.test(text)) return { kind: 'svg', name: iconName };
  }

  return { kind: 'svg', name: 'tag' };
}

@Component({
  selector: 'app-category-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (emoji(); as value) {
      <span class="emoji" [style.fontSize.px]="size()" role="img" [attr.aria-label]="name() || null">{{ value }}</span>
    } @else {
      <app-icon [name]="svgName()" [size]="size()" />
    }
  `,
  styles: [':host { display: inline-flex; line-height: 0; } .emoji { line-height: 1; }'],
})
export class CategoryIconComponent {
  readonly icon = input<string | null>(null);
  readonly name = input('');
  readonly slug = input('');
  readonly size = input(18);

  private readonly resolved = computed(() =>
    resolveCategoryIcon(this.icon(), this.name(), this.slug()),
  );
  protected readonly emoji = computed(() => {
    const r = this.resolved();
    return r.kind === 'emoji' ? r.value : '';
  });
  protected readonly svgName = computed<IconName>(() => {
    const r = this.resolved();
    return r.kind === 'svg' ? r.name : 'tag';
  });
}
