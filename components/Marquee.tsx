import data from "@/data/route.json";

const ROUTE_ORDER = ["home", "redcrescent", "postoffice", "astermims", "medcollege"];

type Item = { no: string; date: string; place: string };

function buildItems(): Item[] {
  const items: Item[] = [];
  for (const day of data.timeline) {
    for (const ev of day.events) {
      const idx = ROUTE_ORDER.indexOf(ev.locationId);
      items.push({
        no: String(idx === -1 ? items.length + 1 : idx + 1).padStart(2, "0"),
        date: day.label,
        place: ev.place,
      });
    }
  }
  return items;
}

export default function Marquee() {
  const items = buildItems();
  // Duplicated track for a seamless loop.
  const track = [...items, ...items];

  return (
    <div className="marquee-bar" role="marquee" aria-label="Nipah route alert ticker">
      <div className="marquee-label">
        <span className="marquee-label-warn">⚠</span> NIPAH ROUTE
      </div>
      <div className="marquee-viewport">
        <div className="marquee-track">
          {track.map((it, i) => (
            <span className="marquee-item" key={i}>
              <span className="marquee-no">N&deg;{it.no}</span>
              <span className="marquee-date">{it.date}</span>
              <span className="marquee-place">{it.place}</span>
              <span className="marquee-sep" aria-hidden="true">
                ▲
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
