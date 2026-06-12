"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import data from "@/data/route.json";

type Loc = (typeof data.locations)[number];
type Waypoint = {
  lat: number;
  lng: number;
  stamp: string;
  place: string;
  locationId: string;
};

// Order in which the patient visited the locations (for the base markers).
const ROUTE_ORDER = ["home", "redcrescent", "postoffice", "astermims", "medcollege"];

const DWELL_MS = 700; // time passing at the same place
const FOLLOW_ZOOM = 15; // default zoom while following the beacon
const MS_PER_METRE = 0.35; // travel pace -> constant speed across legs
const MIN_TRAVEL_MS = 1100;
const MAX_TRAVEL_MS = 4200;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Smooth acceleration / deceleration, like a camera easing into a move.
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Rough great-circle distance in metres.
function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const la1 = a.lat * toRad;
  const la2 = b.lat * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Closer for short hops, wider for long legs so the move stays readable.
function zoomForDistance(m: number) {
  if (m < 1200) return 15;
  if (m < 5000) return 14;
  return 13;
}

export default function RouteMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const beaconRef = useRef<Marker | null>(null);
  const travelLineRef = useRef<Polyline | null>(null);
  const baseLineRef = useRef<Polyline | null>(null);
  const locMarkersRef = useRef<Map<string, Marker>>(new Map());
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const waypointsRef = useRef<Waypoint[]>([]);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [stamp, setStamp] = useState("");
  const [place, setPlace] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const locById = new Map<string, Loc>(data.locations.map((l) => [l.id, l]));

      // Build the chronological waypoint list from the timeline.
      const wps: Waypoint[] = [];
      for (const day of data.timeline) {
        for (const ev of day.events) {
          const l = locById.get(ev.locationId);
          if (!l) continue;
          wps.push({
            lat: l.lat,
            lng: l.lng,
            stamp: `${day.label} · ${ev.time}`,
            place: ev.place,
            locationId: ev.locationId,
          });
        }
      }
      waypointsRef.current = wps;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            "&copy; OpenStreetMap &copy; CARTO — indicative landmarks, not official",
          maxZoom: 19,
        }
      ).addTo(map);

      // Base route line (visit order of distinct locations).
      const orderedPts = ROUTE_ORDER.map((id) => locById.get(id))
        .filter(Boolean)
        .map((l) => [l!.lat, l!.lng] as [number, number]);

      baseLineRef.current = L.polyline(orderedPts, {
        color: "#0a0a0a",
        weight: 4,
        dashArray: "2 10",
        lineCap: "square",
      }).addTo(map);

      // Numbered brutalist markers (kept in a ref so they can be hidden/revealed).
      ROUTE_ORDER.forEach((id, idx) => {
        const l = locById.get(id);
        if (!l) return;
        const icon = L.divIcon({
          className: "",
          html: `<div class="brutal-marker ${l.type}" style="width:30px;height:30px;font-size:14px;">${idx + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const marker = L.marker([l.lat, l.lng], { icon }).bindPopup(
          `${idx + 1}. ${l.name}`
        );
        marker.addTo(map);
        locMarkersRef.current.set(id, marker);
      });

      map.fitBounds(L.latLngBounds(orderedPts).pad(0.25));

      // Repaint tiles on container/viewport changes (mobile orientation,
      // dynamic browser toolbars, late layout) so the map never shows blank.
      map.invalidateSize();
      window.setTimeout(() => map.invalidateSize(), 250);
      if (containerRef.current) {
        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(containerRef.current);
        roRef.current = ro;
      }

      // Initial timestamp = first waypoint.
      if (wps[0]) {
        setStamp(wps[0].stamp);
        setPlace(wps[0].place);
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      roRef.current?.disconnect();
      roRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      beaconRef.current = null;
      travelLineRef.current = null;
      baseLineRef.current = null;
      locMarkersRef.current.clear();
    };
  }, []);

  // Hide every static marker + the base route line (used at the start of playback).
  function hideStatic() {
    const map = mapRef.current;
    if (!map) return;
    if (baseLineRef.current && map.hasLayer(baseLineRef.current)) {
      map.removeLayer(baseLineRef.current);
    }
    locMarkersRef.current.forEach((m) => {
      if (map.hasLayer(m)) map.removeLayer(m);
    });
  }

  // Pop a single milestone marker in as the beacon reaches it.
  function revealMarker(id: string) {
    const map = mapRef.current;
    const m = locMarkersRef.current.get(id);
    if (map && m && !map.hasLayer(m)) {
      m.addTo(map);
      const el = m.getElement()?.querySelector<HTMLElement>(".brutal-marker");
      if (el) {
        el.classList.remove("pop-in");
        // restart the pop animation
        void el.offsetWidth;
        el.classList.add("pop-in");
      }
    }
  }

  // Bring the base route line back (after playback finishes).
  function showBaseLine() {
    const map = mapRef.current;
    if (map && baseLineRef.current && !map.hasLayer(baseLineRef.current)) {
      baseLineRef.current.addTo(map);
    }
  }

  function ensureAnimators() {
    const L = LRef.current;
    const map = mapRef.current;
    const wp0 = waypointsRef.current[0];
    if (!L || !map || !wp0) return;

    if (!travelLineRef.current) {
      travelLineRef.current = L.polyline([[wp0.lat, wp0.lng]], {
        color: "#ff2d2d",
        weight: 6,
        lineCap: "square",
      }).addTo(map);
    } else {
      travelLineRef.current.setLatLngs([[wp0.lat, wp0.lng]]);
    }

    if (!beaconRef.current) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="moving-dot"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      beaconRef.current = L.marker([wp0.lat, wp0.lng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      beaconRef.current.setLatLng([wp0.lat, wp0.lng]);
    }
  }

  function animateSegment(i: number) {
    const wps = waypointsRef.current;
    if (i >= wps.length - 1) {
      const last = wps[wps.length - 1];
      revealMarker(last.locationId);
      setStamp(last.stamp);
      setPlace(last.place);
      setPlaying(false);
      setDone(true);
      // Zoom back out to reveal the whole route + base line.
      const L = LRef.current;
      const map = mapRef.current;
      if (L && map) {
        showBaseLine();
        const pts = wps.map((w) => [w.lat, w.lng] as [number, number]);
        map.flyToBounds(L.latLngBounds(pts).pad(0.25), { duration: 0.8 });
      }
      return;
    }

    const from = wps[i];
    const to = wps[i + 1];
    const same = from.lat === to.lat && from.lng === to.lng;
    const dist = same ? 0 : distanceM(from, to);
    // Constant travel speed -> long legs take longer, so nothing whips by.
    const dur = same
      ? DWELL_MS
      : Math.min(MAX_TRAVEL_MS, Math.max(MIN_TRAVEL_MS, dist * MS_PER_METRE));
    const legZoom = same
      ? mapRef.current?.getZoom() ?? FOLLOW_ZOOM
      : zoomForDistance(dist);
    const start = performance.now();
    const completed = wps
      .slice(0, i + 1)
      .map((w) => [w.lat, w.lng] as [number, number]);

    // The beacon is sitting on `from` right now -> reveal that milestone.
    revealMarker(from.locationId);
    setStamp(from.stamp);
    setPlace(from.place);

    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / dur);
      const t = same ? raw : easeInOut(raw);
      const lat = lerp(from.lat, to.lat, t);
      const lng = lerp(from.lng, to.lng, t);
      beaconRef.current?.setLatLng([lat, lng]);
      travelLineRef.current?.setLatLngs([...completed, [lat, lng]]);
      // Keep the camera centred on the beacon while it travels.
      mapRef.current?.setView([lat, lng], legZoom, { animate: false });

      if (raw >= 1) {
        revealMarker(to.locationId);
        setStamp(to.stamp);
        setPlace(to.place);
        animateSegment(i + 1);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  function handlePlay() {
    if (playing || !ready) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ensureAnimators();
    // Clear the map: hide all milestone markers + base line; they reappear
    // one by one as the beacon reaches each stop.
    hideStatic();
    setDone(false);
    setPlaying(true);

    const map = mapRef.current;
    const wp0 = waypointsRef.current[0];
    if (map && wp0) {
      // Zoom in to the start, then begin following the beacon.
      map.flyTo([wp0.lat, wp0.lng], FOLLOW_ZOOM, { duration: 0.8 });
      window.setTimeout(() => {
        if (mapRef.current) animateSegment(0);
      }, 850);
    } else {
      animateSegment(0);
    }
  }

  const btnLabel = playing
    ? "● PLAYING…"
    : done
      ? "↻ REPLAY ROUTE"
      : "▶ PLAY ROUTE";

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[58vh] min-h-[320px] w-full border-4 border-ink sm:h-[60vh] sm:min-h-[380px]"
        aria-label="Map of Nipah patient route in Kozhikode"
      />

      {/* Timestamp readout */}
      <div className="pointer-events-none absolute right-2 top-2 z-[500] sm:right-3 sm:top-3">
        <div className="pointer-events-auto border-2 border-ink bg-acid px-2 py-1.5 shadow-brutalSm sm:border-4 sm:px-3 sm:py-2">
          <div className="text-[9px] font-bold uppercase tracking-widest opacity-70 sm:text-[10px]">
            Timestamp
          </div>
          <div className="text-sm font-bold uppercase leading-none sm:text-lg">
            {stamp || "—"}
          </div>
          <div className="mt-1 max-w-[8.5rem] text-[10px] font-bold uppercase leading-tight sm:max-w-[12rem] sm:text-[11px]">
            {place}
          </div>
        </div>
      </div>

      {/* Play / Replay control */}
      <div className="absolute bottom-2 left-1/2 z-[500] -translate-x-1/2 sm:bottom-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={playing || !ready}
          className="pointer-events-auto whitespace-nowrap border-4 border-ink bg-ink px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-acid shadow-brutalSm transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-70 sm:px-5 sm:py-3 sm:text-base"
        >
          {ready ? btnLabel : "LOADING…"}
        </button>
      </div>
    </div>
  );
}
