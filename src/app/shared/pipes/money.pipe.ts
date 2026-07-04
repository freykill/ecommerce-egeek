import { Pipe, PipeTransform, inject } from '@angular/core';
import { StoreContextService } from '../../core/services/store-context.service';

/**
 * Formatea un monto con el símbolo de moneda de la tienda (currencySymbol de
 * /store/settings, ej. "S/"). Uso: {{ variant.finalPrice | money }}.
 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  private readonly store = inject(StoreContextService);

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const symbol = this.store.currencySymbol();
    return `${symbol} ${value.toFixed(2)}`;
  }
}
