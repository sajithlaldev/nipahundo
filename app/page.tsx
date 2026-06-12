import dynamic from "next/dynamic";
import data from "@/data/route.json";
import Timeline from "@/components/Timeline";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] min-h-[380px] w-full items-center justify-center border-4 border-ink bg-paper text-lg font-bold uppercase">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const { meta, patient, contacts, helpline, locations } = data;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8 pt-20 sm:px-6">
      {/* ===== HEADER ===== */}
      <header className="border-4 border-ink bg-acid shadow-brutal">
        <div className="border-b-4 border-ink px-5 py-2 text-xs font-bold uppercase tracking-widest">
          {meta.district} · Reported {meta.reportedOn}
        </div>
        <h1 className="px-5 py-6 text-4xl font-bold uppercase leading-none sm:text-6xl">
          {meta.title}
        </h1>
        <div className="border-t-4 border-ink bg-alert px-5 py-2 text-sm font-bold uppercase text-paper">
          ⚠ Confirmed Nipah case · Public-awareness route map
        </div>
      </header>

      {/* ===== STAT GRID ===== */}
      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Stat label="Patient" value={`${patient.age} / ${patient.gender}`} sub={patient.place} />
        <Stat label="Contacts traced" value={String(contacts.total)} sub={`${contacts.healthcareWorkers} health · ${contacts.family} family`} accent />
        <Stat label="Status" value="CRITICAL" sub={patient.facility} alert />
      </section>

      <p className="mt-4 border-l-4 border-ink bg-sick px-4 py-2 text-sm font-bold uppercase">
        {contacts.note}
      </p>

      {/* ===== MAP ===== */}
      <section className="mt-10">
        <SectionTitle>Route Map</SectionTitle>
        <RouteMap />
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {locations.map((l, i) => (
            <li
              key={l.id}
              className="flex items-center gap-3 border-2 border-ink bg-paper px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-ink bg-alert text-sm font-bold">
                {i + 1}
              </span>
              <span className="font-bold uppercase">{l.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="mt-10">
        <SectionTitle>Movement Timeline</SectionTitle>
        <Timeline />
      </section>

      {/* ===== HELPLINE ===== */}
      <section className="mt-10 border-4 border-ink bg-ink p-5 text-paper shadow-brutal">
        <h2 className="text-2xl font-bold uppercase text-acid">Helpline / Control Room</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {helpline.map((h) => (
            <a
              key={h.number}
              href={`tel:${h.number.replace(/\s/g, "")}`}
              className="border-2 border-acid bg-acid px-4 py-3 text-lg font-bold text-ink shadow-brutalSm transition-transform hover:-translate-y-0.5"
            >
              ☎ {h.number}
            </a>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="mt-10 border-t-4 border-ink pt-4 text-xs uppercase leading-relaxed">
        <p className="font-bold">Source: {meta.source}</p>
        <p className="mt-1 opacity-80">{meta.disclaimer}</p>
        <a
          href={meta.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block break-all underline"
        >
          {meta.sourceUrl}
        </a>
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  alert?: boolean;
}) {
  const bg = alert ? "bg-alert text-paper" : accent ? "bg-sick" : "bg-paper";
  return (
    <div className={`border-4 border-ink ${bg} p-4 shadow-brutalSm`}>
      <div className="text-xs font-bold uppercase tracking-widest opacity-80">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold uppercase leading-none">{value}</div>
      {sub && <div className="mt-2 text-sm font-bold uppercase">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 inline-block border-4 border-ink bg-ink px-4 py-2 text-2xl font-bold uppercase text-acid shadow-brutalSm">
      {children}
    </h2>
  );
}
