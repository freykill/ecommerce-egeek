import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ApiError,
  Checkout,
  CheckoutResult,
  PAYMENT_LABELS,
  PaymentMethod,
} from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { SpinnerComponent } from '../../shared/ui/spinner.component';

type DeliveryMethod = 'pickup' | 'delivery';

/** Teléfono flexible: dígitos, espacios, guiones, paréntesis y un + inicial. */
const PHONE_PATTERN = /^\+?[\d][\d\s()-]{5,}$/;

/**
 * Página de checkout (/checkout). Arma el pedido con los ítems del carrito
 * (CartService) + los datos del cliente y lo envía a OrderService.checkout().
 * El total real lo confirma el servidor; el cierre se hace por WhatsApp.
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    EmptyStateComponent,
    SpinnerComponent,
    MoneyPipe,
  ],
  template: `
    <section class="surface-page py-10">
      @if (cart.isEmpty() && !submitted()) {
        <app-empty-state
          icon="cart"
          title="Tu carrito está vacío"
          message="Agrega productos al carrito antes de finalizar tu pedido."
        >
          <a routerLink="/" class="btn btn-dark btn-lg">Explorar productos</a>
        </app-empty-state>
      } @else {
        <!-- Encabezado -->
        <div class="mb-8 border-b border-line pb-5">
          <a
            routerLink="/carrito"
            class="mb-3 inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em] text-ink-mute transition-colors hover:text-ink"
          >
            <app-icon name="chevron-left" [size]="14" /> Volver al carrito
          </a>
          <h1 class="page-title">Finalizar pedido</h1>
          <p class="mt-2 text-ink-soft">
            Completa tus datos y confirma el pedido por WhatsApp.
          </p>
        </div>

        <!-- Banner: mantenimiento -->
        @if (maintenanceMode()) {
          <div class="notice notice-warning mb-6" role="status">
            <app-icon name="alert" [size]="18" />
            <p class="font-medium">La tienda no está recibiendo pedidos en este momento.</p>
          </div>
        }

        <!-- Banner: error de envío -->
        @if (submitError(); as err) {
          <div
            class="notice mb-6"
            [class.notice-warning]="err.maintenance"
            [class.notice-danger]="!err.maintenance"
            role="alert"
            aria-live="assertive"
          >
            <app-icon name="alert" [size]="18" />
            <p class="font-medium">{{ err.message }}</p>
          </div>
        }

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
          class="grid gap-8 lg:grid-cols-3 lg:gap-12"
        >
          <!-- Columna izquierda: formulario -->
          <div class="space-y-6 lg:col-span-2">
            <!-- Datos del cliente -->
            <fieldset class="card p-6">
              <legend class="sr-only">Tus datos</legend>
              <h2 class="meta">01 · Tus datos</h2>

              <div class="mt-5 space-y-5">
                <!-- Nombre -->
                <div>
                  <label class="label" for="customerName">Nombre completo *</label>
                  <input
                    id="customerName"
                    type="text"
                    class="input"
                    [class.input-invalid]="invalid(form.controls.customerName)"
                    formControlName="customerName"
                    autocomplete="name"
                    placeholder="Ej. María Pérez"
                    maxlength="100"
                  />
                  @if (hasError(form.controls.customerName, 'required')) {
                    <p class="field-error">Ingresa tu nombre.</p>
                  } @else if (hasError(form.controls.customerName, 'maxlength')) {
                    <p class="field-error">Máximo 100 caracteres.</p>
                  }
                </div>

                <!-- Teléfono -->
                <div>
                  <label class="label" for="customerPhone">Teléfono / WhatsApp *</label>
                  <input
                    id="customerPhone"
                    type="tel"
                    class="input"
                    [class.input-invalid]="invalid(form.controls.customerPhone)"
                    formControlName="customerPhone"
                    autocomplete="tel"
                    inputmode="tel"
                    placeholder="Ej. +51 987 654 321"
                    maxlength="30"
                  />
                  @if (hasError(form.controls.customerPhone, 'required')) {
                    <p class="field-error">Ingresa tu teléfono.</p>
                  } @else if (hasError(form.controls.customerPhone, 'maxlength')) {
                    <p class="field-error">Máximo 30 caracteres.</p>
                  } @else if (hasError(form.controls.customerPhone, 'pattern')) {
                    <p class="field-error">
                      Ingresa un teléfono válido (solo números, espacios y +).
                    </p>
                  }
                </div>

                <!-- Email (opcional) -->
                <div>
                  <label class="label" for="customerEmail">Correo (opcional)</label>
                  <input
                    id="customerEmail"
                    type="email"
                    class="input"
                    [class.input-invalid]="invalid(form.controls.customerEmail)"
                    formControlName="customerEmail"
                    autocomplete="email"
                    inputmode="email"
                    placeholder="tucorreo@ejemplo.com"
                    maxlength="100"
                  />
                  @if (hasError(form.controls.customerEmail, 'email')) {
                    <p class="field-error">Ingresa un correo válido.</p>
                  } @else if (hasError(form.controls.customerEmail, 'maxlength')) {
                    <p class="field-error">Máximo 100 caracteres.</p>
                  }
                </div>
              </div>
            </fieldset>

            <!-- Entrega -->
            <fieldset class="card p-6">
              <legend class="sr-only">Entrega</legend>
              <h2 class="meta">02 · Entrega</h2>

              @if (showDeliveryChoice()) {
                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border p-4 transition-colors"
                    [class.border-ink]="deliveryValue() === 'pickup'"
                    [class.bg-surface-muted]="deliveryValue() === 'pickup'"
                    [class.border-line-strong]="deliveryValue() !== 'pickup'"
                  >
                    <input
                      type="radio"
                      class="sr-only"
                      formControlName="deliveryMethod"
                      value="pickup"
                    />
                    <span
                      class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-xs)]"
                      [class.bg-ink]="deliveryValue() === 'pickup'"
                      [class.text-surface]="deliveryValue() === 'pickup'"
                      [class.bg-surface-muted]="deliveryValue() !== 'pickup'"
                      [class.text-ink-soft]="deliveryValue() !== 'pickup'"
                    >
                      <app-icon name="store" [size]="18" />
                    </span>
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-ink">Retiro en tienda</span>
                      <span class="block text-sm text-ink-soft">Recoges tu pedido</span>
                    </span>
                  </label>

                  <label
                    class="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border p-4 transition-colors"
                    [class.border-ink]="deliveryValue() === 'delivery'"
                    [class.bg-surface-muted]="deliveryValue() === 'delivery'"
                    [class.border-line-strong]="deliveryValue() !== 'delivery'"
                  >
                    <input
                      type="radio"
                      class="sr-only"
                      formControlName="deliveryMethod"
                      value="delivery"
                    />
                    <span
                      class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-xs)]"
                      [class.bg-ink]="deliveryValue() === 'delivery'"
                      [class.text-surface]="deliveryValue() === 'delivery'"
                      [class.bg-surface-muted]="deliveryValue() !== 'delivery'"
                      [class.text-ink-soft]="deliveryValue() !== 'delivery'"
                    >
                      <app-icon name="truck" [size]="18" />
                    </span>
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-ink">
                        Delivery a domicilio
                      </span>
                      <span class="block text-sm text-ink-soft">Te lo llevamos</span>
                    </span>
                  </label>
                </div>
              } @else {
                <div
                  class="mt-5 flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-muted p-4"
                >
                  <span
                    class="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-xs)] bg-ink text-surface"
                  >
                    <app-icon
                      [name]="deliveryValue() === 'delivery' ? 'truck' : 'store'"
                      [size]="18"
                    />
                  </span>
                  <span class="text-sm font-semibold text-ink">
                    {{ deliveryValue() === 'delivery' ? 'Delivery a domicilio' : 'Retiro en tienda' }}
                  </span>
                </div>
              }

              <!-- Dirección (solo delivery) -->
              @if (showAddress()) {
                <div class="mt-5">
                  <label class="label" for="customerAddress">Dirección de entrega *</label>
                  <textarea
                    id="customerAddress"
                    class="input"
                    [class.input-invalid]="invalid(form.controls.customerAddress)"
                    formControlName="customerAddress"
                    rows="2"
                    autocomplete="street-address"
                    placeholder="Calle, número, referencia, distrito…"
                    maxlength="255"
                  ></textarea>
                  @if (hasError(form.controls.customerAddress, 'required')) {
                    <p class="field-error">Ingresa la dirección para el delivery.</p>
                  } @else if (hasError(form.controls.customerAddress, 'maxlength')) {
                    <p class="field-error">Máximo 255 caracteres.</p>
                  }
                </div>
              }
            </fieldset>

            <!-- Método de pago (opcional) -->
            <fieldset class="card p-6">
              <legend class="sr-only">Método de pago</legend>
              <h2 class="meta">03 · Método de pago <span class="text-ink-mute">(opcional)</span></h2>

              <div class="mt-5 flex flex-wrap gap-2">
                @for (method of paymentOptions(); track method) {
                  <button
                    type="button"
                    class="chip"
                    [attr.data-active]="paymentValue() === method"
                    [attr.aria-pressed]="paymentValue() === method"
                    (click)="togglePayment(method)"
                  >
                    @if (paymentValue() === method) {
                      <app-icon name="check" [size]="15" />
                    }
                    {{ paymentLabels[method] }}
                  </button>
                }
              </div>
              <p class="mt-3 text-sm text-ink-soft">
                Puedes coordinar el pago con la tienda al confirmar el pedido.
              </p>
            </fieldset>

            <!-- Notas (opcional) -->
            <fieldset class="card p-6">
              <legend class="sr-only">Notas</legend>
              <h2 class="meta">04 · Notas <span class="text-ink-mute">(opcional)</span></h2>
              <div class="mt-5">
                <textarea
                  id="notes"
                  class="input"
                  [class.input-invalid]="invalid(form.controls.notes)"
                  formControlName="notes"
                  rows="3"
                  placeholder="¿Algo que debamos saber? Horario, referencias, etc."
                  maxlength="255"
                ></textarea>
                @if (hasError(form.controls.notes, 'maxlength')) {
                  <p class="field-error">Máximo 255 caracteres.</p>
                }
              </div>
            </fieldset>
          </div>

          <!-- Columna derecha: resumen del pedido -->
          <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="card p-6">
              <h2 class="meta">Resumen del pedido</h2>

              <ul class="mt-4 space-y-3">
                @for (item of cart.items(); track item.idVariant) {
                  <li class="flex items-center gap-3">
                    @if (item.image) {
                      <img
                        [src]="item.image"
                        [alt]="item.productName"
                        class="h-12 w-12 shrink-0 rounded-[var(--radius-xs)] border border-line object-cover"
                        loading="lazy"
                      />
                    } @else {
                      <span
                        class="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-xs)] border border-line bg-surface-muted text-ink-mute"
                      >
                        <app-icon name="box" [size]="18" />
                      </span>
                    }
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-ink">{{ item.productName }}</p>
                      <p class="truncate text-xs text-ink-soft">
                        {{ item.variantName }} · x{{ item.quantity }}
                      </p>
                    </div>
                    <span class="shrink-0 text-sm font-semibold text-ink tabular-nums">
                      {{ item.unitPrice * item.quantity | money }}
                    </span>
                  </li>
                }
              </ul>

              <dl class="mt-4 space-y-3 border-t border-line pt-4">
                <div class="flex items-center justify-between">
                  <dt class="font-semibold text-ink">Subtotal</dt>
                  <dd class="text-xl font-semibold text-ink tabular-nums">
                    {{ cart.subtotal() | money }}
                  </dd>
                </div>
              </dl>

              <p class="mt-3 text-[0.82rem] leading-relaxed text-ink-soft">
                El total final lo confirma la tienda; puede incluir envío, descuentos o
                impuestos.
              </p>

              <button
                type="submit"
                class="btn btn-wa btn-lg mt-5 w-full"
                [disabled]="submitDisabled()"
              >
                @if (submitting()) {
                  <app-spinner [size]="20" />
                  Enviando…
                } @else {
                  <app-icon name="whatsapp" [size]="19" /> Confirmar por WhatsApp
                }
              </button>

              @if (form.invalid && !submitting()) {
                <p class="mt-2.5 text-center text-xs text-ink-soft">
                  Completa los campos requeridos para continuar.
                </p>
              }
            </div>

            <!-- Confianza -->
            <ul class="mt-5 space-y-2.5 px-1 text-sm text-ink-soft">
              <li class="flex items-center gap-2.5">
                <app-icon name="whatsapp" [size]="15" class="shrink-0 text-brand" />
                Cierras y coordinas por WhatsApp
              </li>
              <li class="flex items-center gap-2.5">
                <app-icon name="shield" [size]="15" class="shrink-0 text-brand" />
                Sin pagos por adelantado en la web
              </li>
            </ul>
          </aside>
        </form>
      }
    </section>
  `,
})
export class CheckoutPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly orders = inject(OrderService);
  protected readonly cart = inject(CartService);
  private readonly store = inject(StoreContextService);

  private readonly settings = this.store.settings;
  protected readonly maintenanceMode = this.store.maintenanceMode;

  protected readonly paymentLabels = PAYMENT_LABELS;

  // Flags con defaults sensatos si /store/settings no respondió.
  protected readonly allowPickup = computed(() => this.settings()?.allowPickup ?? true);
  protected readonly allowDelivery = computed(() => this.settings()?.allowDelivery ?? true);
  private readonly acceptCash = computed(() => this.settings()?.acceptCash ?? true);
  private readonly acceptBankTransfer = computed(
    () => this.settings()?.acceptBankTransfer ?? true,
  );

  /** Se muestran radios solo si ambos modos están habilitados. */
  protected readonly showDeliveryChoice = computed(
    () => this.allowPickup() && this.allowDelivery(),
  );

  /** Opciones de pago válidas (CARD siempre disponible). */
  protected readonly paymentOptions = computed<PaymentMethod[]>(() => {
    const opts: PaymentMethod[] = [];
    if (this.acceptCash()) opts.push('CASH');
    if (this.acceptBankTransfer()) opts.push('TRANSFER');
    opts.push('CARD');
    return opts;
  });

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly submitError = signal<{ message: string; maintenance: boolean } | null>(
    null,
  );

  protected readonly form = this.fb.group({
    customerName: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    customerPhone: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(30),
      Validators.pattern(PHONE_PATTERN),
    ]),
    customerEmail: this.fb.nonNullable.control('', [
      Validators.email,
      Validators.maxLength(100),
    ]),
    deliveryMethod: this.fb.nonNullable.control<DeliveryMethod>(this.initialDelivery()),
    customerAddress: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    paymentMethod: this.fb.control<PaymentMethod | null>(null),
    notes: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
  });

  /** Refleja cambios de valor/estado/touched del form en la vista (OnPush/zoneless). */
  private readonly formEvents = toSignal(this.form.events);

  constructor() {
    const address = this.form.controls.customerAddress;
    const syncAddress = (method: DeliveryMethod): void => {
      address.setValidators(
        method === 'delivery'
          ? [Validators.required, Validators.maxLength(255)]
          : [Validators.maxLength(255)],
      );
      address.updateValueAndValidity({ emitEvent: false });
    };

    syncAddress(this.form.controls.deliveryMethod.value);
    this.form.controls.deliveryMethod.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(syncAddress);
  }

  /** Valor actual del modo de entrega (reactivo en plantilla). */
  protected deliveryValue(): DeliveryMethod {
    this.formEvents();
    return this.form.controls.deliveryMethod.value;
  }

  /** Valor actual del método de pago (reactivo en plantilla). */
  protected paymentValue(): PaymentMethod | null {
    this.formEvents();
    return this.form.controls.paymentMethod.value;
  }

  /** ¿Mostrar el campo de dirección? Solo cuando la entrega es delivery. */
  protected showAddress(): boolean {
    return this.deliveryValue() === 'delivery';
  }

  /** ¿El campo está tocado y es inválido? (para clase input-invalid). */
  protected invalid(control: AbstractControl): boolean {
    this.formEvents();
    return control.touched && control.invalid;
  }

  /** ¿El campo tocado tiene un error concreto? (para el mensaje específico). */
  protected hasError(control: AbstractControl, code: string): boolean {
    this.formEvents();
    return control.touched && control.hasError(code);
  }

  /** El botón de envío se deshabilita si el form es inválido, se envía o hay mantenimiento. */
  protected submitDisabled(): boolean {
    this.formEvents();
    return this.form.invalid || this.submitting() || this.maintenanceMode();
  }

  /** Chip de pago: alterna la selección (se puede dejar sin seleccionar). */
  protected togglePayment(method: PaymentMethod): void {
    const control = this.form.controls.paymentMethod;
    control.setValue(control.value === method ? null : method);
    control.markAsDirty();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.submitDisabled() || this.cart.isEmpty()) return;

    const raw = this.form.getRawValue();
    const clean = (value: string): string | undefined => {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const payload: Checkout = {
      customerName: raw.customerName.trim(),
      customerPhone: raw.customerPhone.trim(),
      customerEmail: clean(raw.customerEmail),
      customerAddress: clean(raw.customerAddress),
      paymentMethod: raw.paymentMethod ?? undefined,
      notes: clean(raw.notes),
      items: this.cart.toCheckoutItems(),
    };

    this.submitError.set(null);
    this.submitting.set(true);

    this.orders.checkout(payload).subscribe({
      next: (result) => this.onSuccess(result),
      error: (err) => this.onError(err),
    });
  }

  private onSuccess(result: CheckoutResult): void {
    this.submitted.set(true);
    this.cart.clear();

    const whatsappUrl = this.orders.whatsappUrlWithTracking(
      result.whatsappUrl,
      result.publicToken,
    );
    if (whatsappUrl) {
      try {
        window.open(whatsappUrl, '_blank');
      } catch {
        /* popup bloqueado: la página de seguimiento igual muestra el botón. */
      }
    }

    // Deja constancia (best-effort; ignoramos errores).
    this.orders.markWhatsappSent(result.publicToken).subscribe({ error: () => {} });

    this.router.navigate(['/pedido', result.publicToken]);
  }

  private onError(err: unknown): void {
    this.submitting.set(false);
    const apiError = err instanceof ApiError ? err : null;
    this.submitError.set({
      message: apiError?.message ?? 'No pudimos crear tu pedido. Intenta de nuevo.',
      maintenance: apiError?.statusCode === 503,
    });
  }

  /** Modo de entrega inicial según lo que ofrezca la tienda. */
  private initialDelivery(): DeliveryMethod {
    const pickup = this.settings()?.allowPickup ?? true;
    const delivery = this.settings()?.allowDelivery ?? true;
    return delivery && !pickup ? 'delivery' : 'pickup';
  }
}
