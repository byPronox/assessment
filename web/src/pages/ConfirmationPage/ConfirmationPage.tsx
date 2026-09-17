import { Link, useParams } from 'react-router';
import { orderById, useApiQuery } from '~/api';
import { formatUsd } from '~/lib/money';
import { Order } from '~/types';

/**
 * TODO (frontend)
 *
 * Load the confirmed order with useApiQuery and `orderById`:
 *
 *   const { data: order, isPending, isError } = useApiQuery<Order>(
 *     orderById,
 *     { id: orderId },
 *     { enabled: Boolean(orderId) },
 *   );
 *
 * Show event / ticket lines, buyer name and email, and total paid.
 * Handle loading and not-found states. Reuse formatUsd.
 */
export function ConfirmationPage() {
  const { orderId = '' } = useParams();

  const { data: order, isPending, isError } = useApiQuery<Order>(
    orderById,
    { id: orderId },
    { enabled: Boolean(orderId) },
  );

  if (isPending) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-ink/60">
        Cargando tu orden…
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>No encontramos esta orden.</p>
        <Link to="/" className="mt-8 inline-block text-accent">
          Volver a eventos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        ¡Gracias por tu compra{order.buyer ? `, ${order.buyer.name}` : ''}!
      </h1>
      <p className="mt-2 text-ink/70">
        Te enviamos la confirmación a {order.buyer?.email}.
      </p>

      <section className="mt-8 rounded-2xl bg-white p-6 text-left ring-1 ring-black/5">
        <ul className="divide-y divide-black/10">
          {order.items.map((item) => (
            <li
              key={item.ticketTypeId}
              className="flex justify-between py-2 text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatUsd(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-black/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatUsd(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Descuento</dt>
              <dd>-{formatUsd(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Cargo por servicio</dt>
            <dd>{formatUsd(order.feeCents)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{formatUsd(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <Link to="/" className="mt-8 inline-block text-accent">
        Volver a eventos
      </Link>
    </main>
  );
}
