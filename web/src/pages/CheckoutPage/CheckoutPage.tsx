import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import * as yup from 'yup';
import { confirmOrder, createOrder, useApiMutation } from '~/api';
import type { ConfirmOrderBody } from '~/api/endpoints/orders/confirmOrder';
import type { CreateOrderBody } from '~/api/endpoints/orders/createOrder';
import { feeFromSubtotal, formatUsd } from '~/lib/money';
import { CheckoutState, Order } from '~/types';

/**
 * TODO (frontend)
 *
 * Wire this page up. You already receive the selected tickets in
 * `location.state` (see CheckoutState).
 *
 * 1. Validate name + email with react-hook-form (Yup is already a dependency).
 * 2. Show a summary with the same 10% fee as the event page (`feeFromSubtotal`).
 * 3. On submit: useApiMutation with `createOrder`, then `confirmOrder`.
 * 4. Surface API errors (sold out, validation) and a submitting state.
 *
 * Suggested route after success: `/orders/:orderId`
 *
 *   const { mutateAsync: create } = useApiMutation<Order, Record<string, never>, CreateOrderBody>(createOrder);
 *   const { mutateAsync: confirm } = useApiMutation<Order, { id: string }, ConfirmOrderBody>(confirmOrder, { id });
*/

const checkoutSchema = yup.object({
  name: yup.string().trim().required('Ingresa tu nombre'),
  email: yup
    .string()
    .trim()
    .email('Ingresa un correo válido')
    .required('Ingresa tu correo'),
});

type CheckoutFormValues = yup.InferType<typeof checkoutSchema>;

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selection = location.state as CheckoutState | null;

  
  const [orderId, setOrderId] = useState<string | null>(null);
  const [buyerInfo, setBuyerInfo] = useState<ConfirmOrderBody | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: yupResolver(checkoutSchema),
  });

  const { mutateAsync: createOrderRequest, isPending: isCreating } =
    useApiMutation<Order, Record<string, never>, CreateOrderBody>(createOrder);

  
  const { mutateAsync: confirmOrderRequest, isPending: isConfirming } =
    useApiMutation<Order, { id: string }, ConfirmOrderBody>(confirmOrder, {
      id: orderId ?? '',
    });

  

  useEffect(() => {
    if (!orderId || !buyerInfo) return;

    confirmOrderRequest(buyerInfo)
      .then((confirmedOrder) => {
        navigate(`/orders/${confirmedOrder.id}`);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  }, [orderId, buyerInfo]);

  if (!selection?.items.length) {
    return <Navigate to="/" replace />;
  }

  const subtotalCents = selection.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const feeCents = feeFromSubtotal(subtotalCents);
  const totalCents = subtotalCents + feeCents;
  const isSubmitting = isCreating || isConfirming;

  const onSubmit = async (values: CheckoutFormValues) => {
    setErrorMessage(null);

    try {
      const order = await createOrderRequest({
        eventId: selection.eventId,
        items: selection.items.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        })),
      });

      setBuyerInfo(values);
      setOrderId(order.id);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_280px]">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold tracking-tight">Tus datos</h1>
        <p className="mt-2 text-sm text-ink/70">
          Completa el checkout para <strong>{selection.eventTitle}</strong>.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Correo
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {isSubmitting ? 'Procesando…' : 'Pagar'}
          </button>
        </form>
      </section>
      <aside className="h-max rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="font-semibold">Resumen</h2>
        <ul className="mt-3 space-y-1 text-sm text-ink/70">
          {selection.items.map((item) => (
            <li key={item.ticketTypeId} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatUsd(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-black/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatUsd(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Cargo por servicio</dt>
            <dd>{formatUsd(feeCents)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{formatUsd(totalCents)}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}
