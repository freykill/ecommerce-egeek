import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <section class="surface-page py-16">
      <app-empty-state
        icon="search"
        title="Página no encontrada"
        message="La página que buscas no existe o el enlace ya no está disponible."
      >
        <a routerLink="/" class="btn btn-dark">Ir al catálogo</a>
      </app-empty-state>
    </section>
  `,
})
export class NotFoundPage {}
