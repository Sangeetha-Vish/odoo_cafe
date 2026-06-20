import ElapsedTimer from './ElapsedTimer';

const STATUS_STYLES = {
  TO_COOK:    { header: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-800 border-amber-200',   btn: 'bg-amber-600 hover:bg-amber-700',   label: 'Accept & Cook 👨‍🍳' },
  PREPARING:  { header: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-800 border-orange-200',  btn: 'bg-orange-600 hover:bg-orange-700',  label: 'Mark Completed ✓' },
  COMPLETED:  { header: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', btn: null, label: null },
};

export default function OrderTicket({ order, onAdvance, onToggleItem }) {
  const style = STATUS_STYLES[order.status] || STATUS_STYLES.TO_COOK;
  const items = order.orderItems || order.order_items || order.OrderItems || order.items || [];
  const allDone = items.every(i => i.completed);

  return (
    <div className="ticket-animate bg-white border border-stone-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[520px] hover:shadow-md transition-shadow duration-200">

      {/* ── Ticket Header ── */}
      <div className={`${style.header} px-4 py-3 border-b border-stone-100 flex justify-between items-start gap-2`}>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-0.5">
            Table {order.table_id || 'Bar'}
          </div>
          <h2 className="text-sm font-extrabold text-stone-900 truncate">
            Order #{order.id}
          </h2>
          <div className="mt-1">
            <ElapsedTimer createdAt={order.created_at} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Customer badge */}
          <span className={`text-[11px] font-semibold font-mono border px-2 py-0.5 rounded-md ${style.badge}`}>
            {order.customer_name}
          </span>
          {/* Status pill */}
          <span className={`text-[10px] uppercase tracking-wider font-bold border px-2 py-0.5 rounded-full ${style.badge}`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* ── Items List ── */}
      <div className="order-items-scroll overflow-y-auto flex-1 divide-y divide-stone-100/80 px-4">
        {items?.length === 0 && (
          <p className="py-6 text-center text-stone-400 text-sm italic">No items on this ticket.</p>
        )}

        {items?.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItem(item.id, item.completed)}
            className="py-3 flex items-center justify-between cursor-pointer select-none group"
            role="button"
            aria-label={`Toggle ${item.product?.name}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Quantity pill */}
              <span className={`
                shrink-0 font-mono font-bold text-xs px-2 py-1 rounded-md leading-none transition-colors duration-150
                ${item.completed ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-white'}
              `}>
                {item.quantity}×
              </span>

              {/* Item name */}
              <span className={`
                item-text text-sm font-medium truncate transition-all duration-150
                ${item.completed
                  ? 'line-through text-stone-400 italic decoration-stone-300'
                  : 'text-stone-800 group-hover:text-stone-600'}
              `}>
                {item.product?.name || 'Menu item'}
              </span>
            </div>

            {/* Completion circle */}
            <div className={`
              shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3
              transition-all duration-150
              ${item.completed
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-stone-300 group-hover:border-stone-500 group-active:scale-90'}
            `}>
              {item.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Footer ── */}
      {order.status !== 'COMPLETED' && (
        <div className="px-4 pb-4 pt-3 bg-stone-50/70 border-t border-stone-100">
          {allDone && order.status === 'PREPARING' && (
            <p className="text-[11px] text-emerald-600 font-semibold text-center mb-2">
              ✅ All items checked — ready to complete!
            </p>
          )}
          <button
            id={`advance-order-${order.id}`}
            onClick={() => onAdvance(order.id, order.status)}
            className={`
              action-btn w-full py-2.5 rounded-xl text-sm font-bold tracking-wide text-white
              shadow-sm transition-all duration-150 active:scale-[0.97]
              ${style.btn}
            `}
          >
            {style.label}
          </button>
        </div>
      )}

      {/* Completed stamp */}
      {order.status === 'COMPLETED' && (
        <div className="px-4 pb-4 pt-3 bg-emerald-50/60 border-t border-emerald-100 text-center">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
            ✓ Ready for Pickup
          </span>
        </div>
      )}
    </div>
  );
}
