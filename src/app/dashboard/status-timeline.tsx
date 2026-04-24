"use client";

type TimelineState = "done" | "current" | "pending" | "blocked";

export type TimelineEvent = {
  key: string;
  title: string;
  description: string;
  timestamp?: string | null;
  state: TimelineState;
};

function getStateClasses(state: TimelineState) {
  if (state === "done") {
    return {
      dot: "border-emerald-500/40 bg-emerald-500",
      line: "bg-emerald-500/20",
      title: "text-[var(--app-text)]",
      description: "text-[var(--app-muted)]",
      time: "text-emerald-600 dark:text-emerald-400",
    };
  }

  if (state === "current") {
    return {
      dot: "border-[var(--app-accent-border)] bg-[var(--app-accent)]",
      line: "bg-[var(--app-border)]",
      title: "text-[var(--app-text)]",
      description: "text-[var(--app-text)] opacity-90",
      time: "text-[var(--app-accent)]",
    };
  }

  if (state === "blocked") {
    return {
      dot: "border-rose-500/40 bg-rose-500",
      line: "bg-[var(--app-border)]",
      title: "text-[var(--app-text)]",
      description: "text-[var(--app-muted)]",
      time: "text-rose-600 dark:text-rose-400",
    };
  }

  return {
    dot: "border-[var(--app-border)] bg-[var(--app-muted)]/30",
    line: "bg-[var(--app-border)]",
    title: "text-[var(--app-muted)]",
    description: "text-[var(--app-muted)]/70",
    time: "text-[var(--app-muted)]",
  };
}

function formatTimelineDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function StatusTimeline({
  title = "Status Timeline",
  subtitle = "Overall movement log from creation to closure.",
  events,
}: {
  title?: string;
  subtitle?: string;
  events: TimelineEvent[];
}) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6 backdrop-blur-xl shadow-2xl shadow-black/10">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[var(--app-text)] tracking-tight">{title}</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--app-muted)] font-bold">{subtitle}</p>
      </div>

      <div className="space-y-0">
        {events.map((event, index) => {
          const styles = getStateClasses(event.state);
          const formattedTime = formatTimelineDate(event.timestamp);
          const isLast = index === events.length - 1;
          const isCurrent = event.state === 'current';

          return (
            <div key={event.key} className="grid grid-cols-[24px_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <div className={`relative mt-1.5 h-3 w-3 rounded-full border-2 transition-all duration-500 ${styles.dot} ${isCurrent ? 'ring-4 ring-[var(--app-accent-soft)] scale-125' : ''}`}>
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-[var(--app-accent)] opacity-40"></span>
                  )}
                </div>
                {!isLast ? (
                  <div className={`mt-2 w-0.5 grow rounded-full transition-colors duration-500 ${styles.line}`} />
                ) : null}
              </div>

              <div className={`${!isLast ? "pb-8" : ""}`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={`text-sm font-bold tracking-tight transition-colors duration-300 ${styles.title}`}>
                      {event.title}
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed transition-colors duration-300 ${styles.description}`}>
                      {event.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className={`text-[13px] font-bold tracking-tight ${styles.time}`}>
                      {formattedTime?.split(',')[0] || "Awaiting"}
                    </p>
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${styles.time}`}>
                      {formattedTime?.split(',')[1]?.trim() || "Update"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
