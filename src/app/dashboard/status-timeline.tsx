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
      dot: "border-emerald-500/30 bg-emerald-400",
      line: "bg-emerald-500/20",
      title: "text-slate-100",
      description: "text-slate-400",
      time: "text-emerald-300",
    };
  }

  if (state === "current") {
    return {
      dot: "border-indigo-500/30 bg-indigo-400",
      line: "bg-white/10",
      title: "text-slate-100",
      description: "text-slate-300",
      time: "text-indigo-300",
    };
  }

  if (state === "blocked") {
    return {
      dot: "border-rose-500/30 bg-rose-400",
      line: "bg-white/10",
      title: "text-slate-100",
      description: "text-slate-400",
      time: "text-rose-300",
    };
  }

  return {
    dot: "border-white/10 bg-slate-700",
    line: "bg-white/10",
    title: "text-slate-400",
    description: "text-slate-500",
    time: "text-slate-500",
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
    <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="space-y-0">
        {events.map((event, index) => {
          const styles = getStateClasses(event.state);
          const formattedTime = formatTimelineDate(event.timestamp);
          const isLast = index === events.length - 1;

          return (
            <div key={event.key} className="grid grid-cols-[20px_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 h-3.5 w-3.5 rounded-full border ${styles.dot}`}
                />
                {!isLast ? (
                  <span className={`mt-2 h-full w-px ${styles.line}`} />
                ) : null}
              </div>

              <div className={`${!isLast ? "pb-6" : ""}`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`text-sm font-semibold ${styles.title}`}>
                    {event.title}
                  </p>
                  <p className={`text-xs uppercase tracking-[0.18em] ${styles.time}`}>
                    {formattedTime || "Awaiting update"}
                  </p>
                </div>
                <p className={`mt-1 text-sm ${styles.description}`}>
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
