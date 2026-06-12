import data from "@/data/route.json";

const ROUTE_ORDER = ["home", "redcrescent", "postoffice", "astermims", "medcollege"];

function markerNo(locId: string) {
  const i = ROUTE_ORDER.indexOf(locId);
  return i === -1 ? "•" : String(i + 1);
}

export default function Timeline() {
  return (
    <ol className="flex flex-col gap-0">
      {data.timeline.map((day, di) => (
        <li
          key={day.date}
          className="border-4 border-ink border-b-0 last:border-b-4 bg-paper"
        >
          <div className="flex items-stretch">
            {/* Date rail */}
            <div className="flex w-28 shrink-0 items-center justify-center border-r-4 border-ink bg-ink px-2 py-4 text-acid">
              <span className="text-lg font-bold tracking-tight">
                {day.label}
              </span>
            </div>

            {/* Events */}
            <div className="flex-1 divide-y-2 divide-dashed divide-ink">
              {day.events.map((ev, ei) => (
                <div
                  key={`${di}-${ei}`}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-ink bg-alert text-xs font-bold">
                    {markerNo(ev.locationId)}
                  </span>
                  <span className="w-44 shrink-0 text-sm font-bold uppercase">
                    {ev.time}
                  </span>
                  <span className="flex-1">
                    <span className="font-bold uppercase">{ev.place}</span>
                    <span className="block text-sm opacity-80">
                      {ev.detail}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
