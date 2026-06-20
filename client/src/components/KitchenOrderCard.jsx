export default function KitchenOrderCard({
  order,
  index,
  isArchived,
  onMoveStage,
  onToggleItem,
}) {
  const headerBg =
    order.status === 'TO_COOK'
      ? 'bg-amber-50/40'
      : order.status === 'PREPARING'
        ? 'bg-orange-50/30'
        : 'bg-emerald-50/20';

  const formattedTime = order.created_at
    ? new Date(order.created_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden group ${
        isArchived ? 'border-stone-200 opacity-95' : 'border-stone-200'
      }`}
    >
      <div>
        <div className={`p-4 border-b border-stone-100 flex justify-between items-start ${headerBg}`}>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                Table {order.table_id || 'N/A'}
              </span>
              {!isArchived && index === 0 && (
                <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded uppercase">
                  FIFO NEXT
                </span>
              )}
              {isArchived && (
                <span className="text-[9px] bg-stone-200 text-stone-600 font-bold px-1.5 py-0.5 rounded uppercase">
                  Archived
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">Order #{order.id}</h3>
            {formattedTime && (
              <p className="text-[10px] text-stone-400 mt-0.5">{formattedTime}</p>
            )}
          </div>
          <span className="text-xs font-semibold bg-stone-100 border border-stone-200 px-2 rounded-md text-stone-700">
            {order.customer_name || 'Guest'}
          </span>
        </div>

        {order.notes && (
          <div className="mx-3 mt-3 px-3 py-2.5 bg-amber-100 border-2 border-amber-400 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                ⚠ Order Notes
              </span>
            </div>
            <p className="text-sm font-bold text-amber-950 leading-snug">{order.notes}</p>
          </div>
        )}

        <div className="p-4 divide-y divide-stone-100 max-h-[240px] overflow-y-auto">
          {order.items.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                !isArchived &&
                order.status === 'PREPARING' &&
                onToggleItem(order, item.id, item.completed)
              }
              className={`py-2.5 flex items-center justify-between select-none ${
                !isArchived && order.status === 'PREPARING'
                  ? 'cursor-pointer'
                  : 'pointer-events-none'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span
                  className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                    item.completed || isArchived
                      ? 'bg-stone-100 text-stone-400'
                      : 'bg-stone-900 text-[#FDFBF7]'
                  }`}
                >
                  {item.quantity}x
                </span>
                <span
                  className={`text-xs font-medium truncate ${
                    item.completed || isArchived
                      ? 'line-through text-stone-400 italic'
                      : 'text-stone-800'
                  }`}
                >
                  {item.product?.name || 'Café Item'}
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  item.completed || isArchived
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-stone-300'
                }`}
              >
                {(item.completed || isArchived) && (
                  <span className="text-white text-[9px] font-bold">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-stone-50/50 border-t border-stone-100">
        {isArchived ? (
          <div className="text-center py-2 text-stone-600 text-xs font-bold bg-stone-100 rounded-xl border border-stone-200 flex items-center justify-center gap-1.5">
            <span className="text-emerald-600">✓</span>
            Served / Archived
          </div>
        ) : order.status === 'TO_COOK' ? (
          <button
            onClick={() => onMoveStage(order.id, order.status)}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all"
          >
            Accept & Start Cooking 👨‍🍳
          </button>
        ) : order.status === 'PREPARING' ? (
          <button
            onClick={() => onMoveStage(order.id, order.status)}
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all"
          >
            Mark as Completed ✓
          </button>
        ) : (
          <div className="text-center py-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
            ✓ Ready at Pickup Counter
          </div>
        )}
      </div>
    </div>
  );
}
