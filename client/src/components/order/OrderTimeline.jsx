const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const BASE_LINEAR_STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    description: "Your order has been received.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "Order has been confirmed by the seller.",
  },
  {
    key: "processing",
    label: "Processing",
    description: "Order is being prepared for dispatch.",
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "Package handed over to delivery partner.",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    description: "Courier is on the way to your address.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Order delivered successfully.",
  },
];

const PACKED_STEP = {
  key: "packed",
  label: "Packed",
  description: "Items have been packed and are ready for pickup.",
};

const EXCEPTION_STEP_META = {
  cancelled: {
    label: "Cancelled",
    description: "Order was cancelled.",
    variant: "danger",
  },
  return_requested: {
    label: "Return Requested",
    description: "Customer requested a return.",
    variant: "warning",
  },
  return_approved: {
    label: "Return Approved",
    description: "Return request approved.",
    variant: "primary",
  },
  return_rejected: {
    label: "Return Rejected",
    description: "Return request rejected.",
    variant: "danger",
  },
  returned: {
    label: "Returned",
    description: "Returned items received.",
    variant: "primary",
  },
  refund_pending: {
    label: "Refund Pending",
    description: "Refund is being processed.",
    variant: "warning",
  },
  refunded: {
    label: "Refunded",
    description: "Refund completed.",
    variant: "success",
  },
};

const EXCEPTION_KEYS = Object.keys(EXCEPTION_STEP_META);

const formatTimestamp = (event) => {
  if (!event) return "";
  if (event.date || event.time) {
    return `${event.date || ""} ${event.time || ""}`.trim();
  }

  const rawDate = event.timestamp || event.createdAt || event.updatedAt;
  if (!rawDate) return "";

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return String(rawDate);

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildLinearPipeline = (hasPacked) => {
  if (!hasPacked) return BASE_LINEAR_STEPS;
  return [
    ...BASE_LINEAR_STEPS.slice(0, 3),
    PACKED_STEP,
    ...BASE_LINEAR_STEPS.slice(3),
  ];
};

const OrderTimeline = ({
  status,
  order = null,
  events = [],
  timeline = [],
}) => {
  const rawEvents =
    (Array.isArray(events) && events.length > 0 && events) ||
    (Array.isArray(timeline) && timeline.length > 0 && timeline) ||
    (Array.isArray(order?.timeline) && order.timeline.length > 0 && order.timeline) ||
    (Array.isArray(order?.statusHistory) && order.statusHistory.length > 0 && order.statusHistory) ||
    (Array.isArray(order?.history) && order.history.length > 0 && order.history) ||
    [];

  const lastEventStatus =
    rawEvents.length > 0
      ? rawEvents[rawEvents.length - 1]?.status || rawEvents[rawEvents.length - 1]?.key
      : undefined;

  const normalizedCurrent =
    normalizeStatus(status || order?.orderStatus || order?.status || lastEventStatus || "pending") ||
    "pending";

  const eventMap = new Map();
  rawEvents.forEach((ev) => {
    const key = normalizeStatus(ev?.key || ev?.status);
    if (!key) return;
    // Keep the latest recorded entry for a milestone so tracking/note updates reflect cleanly
    eventMap.set(key, ev);
  });

  const hasPacked = normalizedCurrent === "packed" || eventMap.has("packed");
  const linearSteps = buildLinearPipeline(hasPacked);
  const linearIndex = linearSteps.findIndex((s) => s.key === normalizedCurrent);

  let highestForwardInHistory = -1;
  linearSteps.forEach((step, idx) => {
    if (eventMap.has(step.key)) {
      highestForwardInHistory = idx;
    }
  });

  const isException = EXCEPTION_KEYS.includes(normalizedCurrent);
  const isCancelled = normalizedCurrent === "cancelled";

  let stepsToRender = [];

  if (!isException) {
    const resolvedCurrentIndex = linearIndex >= 0 ? linearIndex : Math.max(highestForwardInHistory, 0);
    stepsToRender = linearSteps.map((step, idx) => {
      const ev = eventMap.get(step.key);
      const explicitCompleted = ev?.completed ?? ev?.isCompleted;
      const isCompleted =
        typeof explicitCompleted === "boolean"
          ? explicitCompleted
          : idx <= resolvedCurrentIndex;

      return {
        key: step.key,
        label: ev?.label || step.label,
        description: ev?.note || ev?.description || ev?.message || step.description,
        timestampText:
          formatTimestamp(ev) ||
          (step.key === "pending" && order?.createdAt ? formatTimestamp({ timestamp: order.createdAt }) : "") ||
          (step.key === "delivered" && order?.deliveredAt
            ? formatTimestamp({ timestamp: order.deliveredAt })
            : ""),
        completed: isCompleted,
        isCurrent: idx === resolvedCurrentIndex,
        variant: step.key === "delivered" && isCompleted ? "success" : "primary",
      };
    });
  } else if (isCancelled) {
    // Show reached steps (at least Order Placed) followed by Cancelled
    const reachedForward = linearSteps.filter(
      (step, idx) => eventMap.has(step.key) || (idx === 0 && (order?.createdAt || rawEvents.length === 0))
    );
    stepsToRender = reachedForward.map((step) => {
      const ev = eventMap.get(step.key);
      return {
        key: step.key,
        label: ev?.label || step.label,
        description: ev?.note || ev?.description || ev?.message || step.description,
        timestampText:
          formatTimestamp(ev) ||
          (step.key === "pending" && order?.createdAt ? formatTimestamp({ timestamp: order.createdAt }) : ""),
        completed: true,
        isCurrent: false,
        variant: "primary",
      };
    });

    const cancelEv = eventMap.get("cancelled");
    stepsToRender.push({
      key: "cancelled",
      label: cancelEv?.label || EXCEPTION_STEP_META.cancelled.label,
      description:
        cancelEv?.note ||
        cancelEv?.description ||
        order?.cancellation?.reason ||
        EXCEPTION_STEP_META.cancelled.description,
      timestampText:
        formatTimestamp(cancelEv) ||
        (order?.cancellation?.cancelledAt ? formatTimestamp({ timestamp: order.cancellation.cancelledAt }) : ""),
      completed: true,
      isCurrent: true,
      variant: "danger",
    });
  } else {
    // Return / refund lifecycle after fulfillment
    const maxForwardIdx =
      highestForwardInHistory >= 0 ? highestForwardInHistory : linearSteps.length - 1;
    const forwardPortion = linearSteps.slice(0, maxForwardIdx + 1).map((step) => {
      const ev = eventMap.get(step.key);
      return {
        key: step.key,
        label: ev?.label || step.label,
        description: ev?.note || ev?.description || ev?.message || step.description,
        timestampText:
          formatTimestamp(ev) ||
          (step.key === "pending" && order?.createdAt ? formatTimestamp({ timestamp: order.createdAt }) : "") ||
          (step.key === "delivered" && order?.deliveredAt
            ? formatTimestamp({ timestamp: order.deliveredAt })
            : ""),
        completed: true,
        isCurrent: false,
        variant: step.key === "delivered" ? "success" : "primary",
      };
    });

    const seenExceptionKeys = [];
    rawEvents.forEach((ev) => {
      const k = normalizeStatus(ev?.key || ev?.status);
      if (EXCEPTION_KEYS.includes(k) && !seenExceptionKeys.includes(k)) {
        seenExceptionKeys.push(k);
      }
    });
    if (!seenExceptionKeys.includes(normalizedCurrent)) {
      seenExceptionKeys.push(normalizedCurrent);
    }

    const exceptionPortion = seenExceptionKeys.map((key) => {
      const ev = eventMap.get(key);
      const meta = EXCEPTION_STEP_META[key] || {
        label: key.replace(/_/g, " "),
        description: "",
        variant: "primary",
      };
      return {
        key,
        label: ev?.label || meta.label,
        description: ev?.note || ev?.description || ev?.message || meta.description,
        timestampText: formatTimestamp(ev),
        completed: true,
        isCurrent: key === normalizedCurrent,
        variant: meta.variant,
      };
    });

    stepsToRender = [...forwardPortion, ...exceptionPortion];
  }

  const trackingNumber =
    order?.tracking?.trackingNumber || order?.trackingNumber || order?.shipment?.trackingNumber;
  const trackingCarrier =
    order?.tracking?.carrier || order?.carrier || order?.shipment?.carrier;

  return (
    <div className="space-y-4">
      {stepsToRender.map((step, index) => {
        const isLast = index === stepsToRender.length - 1;

        const isDanger = step.variant === "danger" && step.completed;
        const isSuccess = step.variant === "success" && step.completed;
        const isWarning = step.variant === "warning" && step.completed;

        let dotStyle = "border-[var(--line)] bg-white text-[var(--muted)]";
        if (isDanger) {
          dotStyle = "border-[var(--red)] bg-[var(--red)] text-white";
        } else if (isSuccess) {
          dotStyle = "border-[var(--green)] bg-[var(--green)] text-white";
        } else if (isWarning) {
          dotStyle = "border-[var(--amber)] bg-[var(--amber)] text-white";
        } else if (step.completed) {
          dotStyle = "border-[var(--primary)] bg-[var(--primary)] text-white";
        }

        const lineColor = step.completed
          ? isDanger
            ? "bg-[var(--red)] opacity-35"
            : isSuccess
              ? "bg-[var(--green)] opacity-35"
              : "bg-[var(--primary)] opacity-35"
          : "bg-[var(--line)]";

        return (
          <div key={step.key} className="relative flex gap-4">
            {/* Step Circle & Vertical Connector */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${dotStyle} ${
                  step.isCurrent ? "ring-4 ring-[var(--soft)]" : ""
                }`}
              >
                {step.completed ? (
                  isDanger ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )
                ) : (
                  index + 1
                )}
              </div>

              {!isLast && <div className={`mt-1.5 h-8 w-0.5 ${lineColor}`} />}
            </div>

            {/* Step Content */}
            <div className="min-w-0 flex-1 pb-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-sm font-semibold ${
                      step.completed ? "text-[var(--text)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {step.label}
                  </h4>

                  {step.isCurrent && (
                    <span className="inline-flex items-center rounded-full bg-[var(--soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                      Current
                    </span>
                  )}
                </div>

                {step.timestampText && (
                  <span className="text-xs font-medium text-[var(--muted)]">
                    {step.timestampText}
                  </span>
                )}
              </div>

              {step.description && (
                <p className="mt-0.5 text-xs text-[var(--muted)]">{step.description}</p>
              )}

              {step.key === "shipped" && step.completed && (trackingNumber || trackingCarrier) && (
                <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 rounded-md bg-[var(--soft)]/60 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                  {trackingCarrier && <span>{trackingCarrier}</span>}
                  {trackingCarrier && trackingNumber && <span>·</span>}
                  {trackingNumber && <span>Tracking: {trackingNumber}</span>}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
