import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import * as yup from 'yup';
import { confirmOrder, createOrder, useApiMutation } from '~/api';
import type { ConfirmOrderBody } from '~/api/endpoints/orders/confirmOrder';
import type { CreateOrderBody } from '~/api/endpoints/orders/createOrder';
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

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_280px]">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold tracking-tight">Tus datos</h1>
        <p className="mt-2 text-sm text-ink/70">
          Completa el checkout para <strong>{selection.eventTitle}</strong>.
          Esta pantalla es tuya: el formulario todavía no envía nada.
        </p>
        <p className="mt-8 rounded-xl bg-paper px-4 py-3 text-sm text-ink/70">
          Implementa el formulario aquí. Revisa <code>README.md</code>,{' '}
          <code>useApiMutation</code> y los endpoints en <code>~/api</code>.
        </p>
      </section>
      <aside className="h-max rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="font-semibold">Resumen</h2>
        <p className="mt-3 text-sm text-ink/60">
          Muestra localidades, cargo por servicio y total.
        </p>
      </aside>
    </main>
  );
}
