import { useState, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { calculateDistance } from "../utils/distance";
import GoogleMapsModal from "../components/GoogleMapsModal";
import { useRoleGuard } from "../utils/useRoleGuard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DeliveryRequest {
  id: number;
  recipientName: string;
  address: string;
  packageInfo: string;
  lat: number;
  lng: number;
  status: "pending" | "done";
  distance?: number;
}

type DayKey = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
const DAYS: DayKey[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_LABELS: Record<DayKey, string> = {
  Monday: "Понеделник",
  Tuesday: "Вторник",
  Wednesday: "Сряда",
  Thursday: "Четвъртък",
  Friday: "Петък",
  Saturday: "Събота",
  Sunday: "Неделя",
};

const INITIAL_REQUESTS: DeliveryRequest[] = [
  { id: 1, recipientName: "Аптека Светлина", address: "бул. Витоша 89, София", packageInfo: "Медикаменти за домашна доставка", lat: 42.6830, lng: 23.3158, status: "pending" },
  { id: 2, recipientName: "Домашна грижа", address: "ул. Иван Вазов 12, София", packageInfo: "Пакет с рецепти и медицински консумативи", lat: 42.6908, lng: 23.3316, status: "pending" },
  { id: 3, recipientName: "Пункт Радост", address: "ул. Шипка 2, София", packageInfo: "Фармацевтична пратка със спешни лекарства", lat: 42.6927, lng: 23.3248, status: "pending" },
  { id: 4, recipientName: "Медицински офис", address: "ул. Оборище 10, София", packageInfo: "Доставка на ваксини и консумативи", lat: 42.6962, lng: 23.3294, status: "pending" },
];

const DRIVER_BASE = { lat: 42.6977, lng: 23.3219 };

function getApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  if (!key) {
    console.error("[InReach] VITE_GOOGLE_MAPS_API_KEY is undefined. Check your .env file and restart the dev server.");
  }
  return key ?? "";
}

const DEFAULT_SCHEDULE: Record<DayKey, { active: boolean; start: string; end: string }> = {
  Monday:    { active: true,  start: "08:00", end: "16:00" },
  Tuesday:   { active: true,  start: "08:00", end: "16:00" },
  Wednesday: { active: true,  start: "08:00", end: "16:00" },
  Thursday:  { active: true,  start: "08:00", end: "16:00" },
  Friday:    { active: true,  start: "08:00", end: "16:00" },
  Saturday:  { active: false, start: "10:00", end: "14:00" },
  Sunday:    { active: false, start: "10:00", end: "14:00" },
};

function optimizeRoute(pending: DeliveryRequest[], origin: { lat: number; lng: number }): DeliveryRequest[] {
  let cur = { ...origin };
  const remaining = [...pending];
  const sorted: DeliveryRequest[] = [];
  while (remaining.length > 0) {
    let ni = 0, min = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = calculateDistance(cur.lat, cur.lng, remaining[i].lat, remaining[i].lng);
      if (d < min) { min = d; ni = i; }
    }
    const [found] = remaining.splice(ni, 1);
    sorted.push({ ...found, distance: min });
    cur = { lat: found.lat, lng: found.lng };
  }
  return sorted;
}

function buildEmbedUrl(origin: { lat: number; lng: number }, stops: DeliveryRequest[]) {
  if (stops.length === 0) return "";
  const key = getApiKey();

  const dest = stops[stops.length - 1];
  const middleStops = stops.slice(0, -1);
  const waypoints = middleStops.slice(0, 3).map((s) => `${s.lat},${s.lng}`).join("|");

  const params = new URLSearchParams({
    key,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${dest.lat},${dest.lng}`,
    mode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);

  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

function buildSingleEmbedUrl(origin: { lat: number; lng: number }, stop: DeliveryRequest) {
  const key = getApiKey();
  const params = new URLSearchParams({
    key,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${stop.lat},${stop.lng}`,
    mode: "driving",
  });
  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

function buildExternalUrl(origin: { lat: number; lng: number }, stops: DeliveryRequest[]) {
  if (stops.length === 0) return "";
  const dest = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1).map((s) => `${s.lat},${s.lng}`).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${dest.lat},${dest.lng}`,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildSingleExternalUrl(origin: { lat: number; lng: number }, stop: DeliveryRequest) {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${stop.lat},${stop.lng}&travelmode=driving`;
}

export default function DriverHome() {
  const { isEasyMode } = useEasyMode();
  const { isLoading: authLoading } = useRoleGuard("DRIVER");

  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [requests, setRequests] = useState<DeliveryRequest[]>(INITIAL_REQUESTS);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [mapModal, setMapModal] = useState<{ embedUrl: string; externalUrl: string; title: string } | null>(null);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const done = useMemo(() => requests.filter((r) => r.status === "done"), [requests]);
  const activeReq = activeIndex !== null ? requests[activeIndex] : null;

  const handleStartRoute = useCallback(() => {
    const pendingReqs = requests.filter((r) => r.status === "pending");
    if (pendingReqs.length === 0) return;

    const sorted = optimizeRoute(pendingReqs, DRIVER_BASE);
    const doneReqs = requests.filter((r) => r.status === "done");
    setRequests([...sorted, ...doneReqs]);
    setRouteOptimized(true);
    setActiveIndex(0);

    setMapModal({
      embedUrl: buildEmbedUrl(DRIVER_BASE, sorted),
      externalUrl: buildExternalUrl(DRIVER_BASE, sorted),
      title: `Пълен маршрут — ${sorted.length} доставк${sorted.length !== 1 ? "и" : "а"}`,
    });
  }, [requests]);

  const handleOpenDeliveryMap = (req: DeliveryRequest, reqIndex: number) => {
    setActiveIndex(reqIndex);
    setMapModal({
      embedUrl: buildSingleEmbedUrl(DRIVER_BASE, req),
      externalUrl: buildSingleExternalUrl(DRIVER_BASE, req),
      title: `Навигация до ${req.recipientName}`,
    });
  };

  const handleMarkDone = () => {
    if (activeIndex === null) return;
    const updated = requests.map((r, i) => i === activeIndex ? { ...r, status: "done" as const } : r);
    setRequests(updated);
    setActiveIndex(null);
    setMapModal(null);
  };

  const toggleDay = (day: DayKey) => setSchedule((p) => ({ ...p, [day]: { ...p[day], active: !p[day].active } }));
  const updateTime = (day: DayKey, f: "start" | "end", v: string) => setSchedule((p) => ({ ...p, [day]: { ...p[day], [f]: v } }));

  function NormalDayCard({ day }: { day: DayKey }) {
    return (
      <div className={`rounded-lg border p-3 ${schedule[day].active ? "border-[var(--clr-accent)] bg-[var(--clr-accent-light)]/30" : "border-gray-100 bg-gray-50 opacity-60"}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            onClick={() => editingSchedule && toggleDay(day)}
            className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${schedule[day].active ? "bg-[var(--clr-primary)] border-[var(--clr-primary)]" : "border-gray-300"} ${editingSchedule ? "cursor-pointer" : "cursor-default"}`}
          >
            {schedule[day].active && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </button>
          <p className="text-xs font-bold text-gray-900">{DAY_LABELS[day].slice(0, 3)}</p>
        </div>
        {editingSchedule && schedule[day].active ? (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <input type="time" value={schedule[day].start} onChange={(e) => updateTime(day, "start", e.target.value)} className="w-full text-[10px] border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]" />
            <input type="time" value={schedule[day].end} onChange={(e) => updateTime(day, "end", e.target.value)} className="w-full text-[10px] border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]" />
          </div>
        ) : (
          <p className={`text-[10px] font-medium leading-tight text-center ${schedule[day].active ? "text-[var(--clr-primary)]" : "text-gray-400"}`}>
            {schedule[day].active ? `${schedule[day].start}–${schedule[day].end}` : "Почивка"}
          </p>
        )}
      </div>
    );
  }

  if (authLoading) return null;

  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <section className="em-card">
            <div className="flex justify-between items-center mb-4">
              <h1 className="em-heading" style={{ marginBottom: 0 }}>Седмичен график</h1>
              <button onClick={() => setEditingSchedule(!editingSchedule)} className="em-btn-primary" style={{ padding: "10px 20px", fontSize: "16px" }}>
                {editingSchedule ? "Запази" : "Редактирай"}
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4 py-3">
                  <button
                    type="button"
                    onClick={() => editingSchedule && toggleDay(day)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${schedule[day].active ? "bg-(--clr-primary) border-(--clr-primary)" : "border-gray-300"} ${editingSchedule ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {schedule[day].active && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className={`em-body w-36 font-semibold ${schedule[day].active ? "" : "text-gray-400"}`} style={{ marginBottom: 0 }}>{DAY_LABELS[day]}</span>
                  {editingSchedule && schedule[day].active ? (
                    <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                      <input type="time" value={schedule[day].start} onChange={(e) => updateTime(day, "start", e.target.value)} className="em-input" style={{ padding: "8px 12px", fontSize: "16px", width: "auto" }} />
                      <span className="em-body" style={{ marginBottom: 0 }}>–</span>
                      <input type="time" value={schedule[day].end} onChange={(e) => updateTime(day, "end", e.target.value)} className="em-input" style={{ padding: "8px 12px", fontSize: "16px", width: "auto" }} />
                    </div>
                  ) : (
                    <span className={`em-body ml-auto font-medium ${schedule[day].active ? "text-(--clr-primary)" : "text-gray-300"}`} style={{ marginBottom: 0 }}>
                      {schedule[day].active ? `${schedule[day].start} – ${schedule[day].end}` : "Почивка"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="em-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="em-subheading" style={{ marginBottom: 0 }}>Опашка за доставки ({pending.length})</h2>
              {pending.length > 0 && (
                <button onClick={handleStartRoute} className="em-btn-primary" style={{ padding: "10px 20px", fontSize: "16px" }}>
                  {routeOptimized ? "Рестартирай маршрута" : "Старт на маршрута"}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {requests.map((req, idx) => (
                <div
                  key={req.id}
                  className={`border-2 rounded-xl p-5 flex items-center gap-4 ${req.status === "done" ? "border-gray-100 bg-gray-50 opacity-50" : activeIndex === idx ? "border-(--clr-primary) bg-(--clr-accent-light)/30" : "border-(--clr-accent)"}`}
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="em-body font-bold" style={{ marginBottom: 0 }}>{req.recipientName}</span>
                      {req.status === "done"
                        ? <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        : req.distance ? <span className="em-body font-bold text-(--clr-primary)" style={{ marginBottom: 0 }}>{req.distance.toFixed(1)} км</span> : null}
                    </div>
                    <p className="em-body text-gray-500 line-clamp-1" style={{ marginBottom: 0 }}>{req.address}</p>
                  </div>
                  {req.status !== "done" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenDeliveryMap(req, idx)}
                        className="em-btn-primary" style={{ padding: "8px 16px", fontSize: "14px" }}
                      >
                        Навигация
                      </button>
                      {activeIndex === idx && (
                        <button
                          onClick={handleMarkDone}
                          className="em-btn-primary" style={{ padding: "8px 16px", fontSize: "14px", background: "var(--clr-accent-light)", color: "var(--clr-primary-hover)" }}
                        >
                          Завършено
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {done.length > 0 && (
              <p className="em-body text-green-600 font-bold mt-4" style={{ marginBottom: 0 }}>{done.length} доставка{done.length !== 1 ? "и" : "а"} завършен{done.length !== 1 ? "и" : "о"} днес</p>
            )}
          </section>
        </div>

        {mapModal && (
          <GoogleMapsModal
            isOpen
            onClose={() => setMapModal(null)}
            embedUrl={mapModal.embedUrl}
            externalUrl={mapModal.externalUrl}
            title={mapModal.title}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 pl-1">
          <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-1">Шофьорски панел</h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest opacity-60">Управлявайте графика си и списъка с доставки</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 font-bold">Наличност</p>
                <h2 className="text-xl font-bold text-gray-900">Седмичен график</h2>
              </div>
              <button
                onClick={() => setEditingSchedule(!editingSchedule)}
                className="bg-[var(--clr-primary)] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[var(--clr-primary-hover)] transition-colors duration-200"
              >
                {editingSchedule ? "Запази графика" : "Редактирай графика"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {DAYS.map((day) => <NormalDayCard key={day} day={day} />)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Днешни доставки</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {pending.length} чакащ{pending.length !== 1 ? "и" : "а"} доставк{pending.length !== 1 ? "и" : "а"}
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-grow">
              {done.length > 0 ? `${done.length} завършени днес. ` : ""}
              {pending.length > 0
                ? "Натиснете Старт на маршрута за оптимизиран многоетапен маршрут в Google Maps."
                : "Всички доставки за днес са завършени!"}
            </p>
            {pending.length > 0 && (
              <button
                onClick={handleStartRoute}
                className="block w-full bg-[var(--clr-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--clr-primary-hover)] transition-colors duration-200 text-center text-sm"
              >
                {routeOptimized ? "Рестартирай маршрута" : "Старт на маршрута"}
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Навигация</p>
            {activeReq ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{activeReq.recipientName}</h2>
                <p className="text-sm text-gray-600 mb-1">{activeReq.address}</p>
                <p className="text-xs text-gray-500 italic mb-4 flex-grow line-clamp-2">{activeReq.packageInfo}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenDeliveryMap(activeReq, activeIndex!)}
                    className="flex-1 bg-[var(--clr-primary)] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[var(--clr-primary-hover)] transition-colors duration-200 text-sm"
                  >
                    Отвори карта
                  </button>
                  <button
                    onClick={handleMarkDone}
                    className="flex-1 bg-(--clr-accent-light) text-(--clr-primary-hover) px-4 py-3 rounded-lg font-semibold hover:opacity-80 transition-colors duration-200 text-sm"
                  >
                    Завършено
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Няма активна доставка</h2>
                <p className="text-sm text-gray-600 flex-grow">
                  Натиснете <strong>Старт на маршрута</strong>, за да оптимизирате и започнете, или изберете доставка отдолу.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-wide">Опашка за доставки</h2>
            {routeOptimized && (
              <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">Маршрутът е оптимизиран</span>
            )}
          </div>
          <div className="space-y-3">
            {requests.map((req, idx) => (
              <div
                key={req.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors duration-150 ${
                  req.status === "done"
                    ? "bg-gray-50 border-gray-100 opacity-50"
                    : activeIndex === idx
                    ? "border-[var(--clr-primary)] bg-[var(--clr-accent-light)]/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">
                  {req.status === "done"
                    ? <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    : idx + 1}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{req.recipientName}</p>
                  <p className="text-xs text-gray-500 truncate">{req.address}</p>
                  {activeIndex === idx && req.status !== "done" && (
                    <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{req.packageInfo}</p>
                  )}
                </div>

                {req.distance !== undefined && (
                  <span className="text-xs font-bold text-gray-400 shrink-0">{req.distance.toFixed(1)} км</span>
                )}

                {req.status !== "done" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDeliveryMap(req, idx)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--clr-primary)] text-white hover:bg-[var(--clr-primary-hover)] transition-colors"
                    >
                      Навигация
                    </button>
                    {activeIndex === idx && (
                      <button
                        onClick={handleMarkDone}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-(--clr-accent-light) text-(--clr-primary-hover) hover:opacity-80 transition-colors"
                      >
                        Завършено
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {mapModal && (
        <GoogleMapsModal
          isOpen
          onClose={() => setMapModal(null)}
          embedUrl={mapModal.embedUrl}
          externalUrl={mapModal.externalUrl}
          title={mapModal.title}
        />
      )}
    </div>
  );
}
