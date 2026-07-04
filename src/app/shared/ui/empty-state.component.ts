import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

/**
 * Estado vacío / error / sin resultados. Proyecta acciones opcionales:
 *   <app-empty-state icon="box" title="Sin productos" message="...">
 *     <a routerLink="/" class="btn btn-dark">Ver todo</a>
 *   </app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="flex flex-col items-center justify-center px-4 py-20 text-center">
      <span
        class="mb-5 grid h-14 w-14 place-items-center rounded-[var(--radius)] border"
        [style.background]="
          tone === 'danger'
            ? 'color-mix(in srgb, var(--danger) 6%, white)'
            : 'var(--surface-muted)'
        "
        [style.borderColor]="
          tone === 'danger' ? 'color-mix(in srgb, var(--danger) 25%, white)' : 'var(--line)'
        "
        [style.color]="tone === 'danger' ? 'var(--danger)' : 'var(--ink-soft)'"
      >
        <app-icon [name]="icon" [size]="26" />
      </span>
      <h3 class="text-lg font-semibold tracking-tight text-ink">{{ title }}</h3>
      @if (message) {
        <p class="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{{ message }}</p>
      }
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon: IconName = 'box';
  @Input({ required: true }) title = '';
  @Input() message: string | null = null;
  @Input() tone: 'default' | 'danger' = 'default';
}
