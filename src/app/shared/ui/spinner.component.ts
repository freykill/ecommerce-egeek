import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Spinner de carga. <app-spinner [size]="28" /> */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="spinner"
      role="status"
      aria-label="Cargando"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.borderWidth.px]="size >= 28 ? 3 : 2"
    ></span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .spinner {
        display: inline-block;
        border-radius: 9999px;
        border-style: solid;
        border-color: color-mix(in srgb, var(--brand-primary) 22%, transparent);
        border-top-color: var(--brand-primary);
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SpinnerComponent {
  @Input() size = 24;
}
