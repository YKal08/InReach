import { useState, useMemo, useCallback, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { calculateDistance } from "../utils/distance";
import GoogleMapsModal from "../components/GoogleMapsModal";
import { useRoleGuard } from "../utils/useRoleGuard";
import { api } from "../utils/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface VisitRequest {
  id: number;
  patientName: string;
  address: string;
  situation: string;
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

const DAY_TO_NUMBER: Record<DayKey, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

const NUMBER_TO_DAY: Record<number, DayKey> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

interface DoctorScheduleResponse {
  id: string;
  dayOfWeek: number;
  specificDate: string | null;
  workStart: string | null;
  workEnd: string | null;
  acceptingRequests: boolean | null;
  updatedAt: string | null;
}

interface DoctorScheduleRequest {
  dayOfWeek: number;
  workStart: string | null;
  workEnd: string | null;
  acceptingRequests: boolean;
}

const INITIAL_REQUESTS: VisitRequest[] = [
  { id: 1, patientName: "Иван Иванов",    address: "Пловдив",        situation: "Висока температура и кашлица от 3 дни, температура 39.5°C.",     lat: 42.1352, lng: 24.7452, status: "pending" },
  { id: 2, patientName: "Елена Петрова",  address: "ул. Оборище 15, София",    situation: "Внезапна остра болка в кръста, затруднено ходене.",         lat: 42.6953, lng: 23.3401, status: "pending" },
  { id: 3, patientName: "Георги Ангелов", address: "бул. Витоша 20, София",     situation: "Алергична реакция след започване на ново лекарство вчера.", lat: 42.6912, lng: 23.3198, status: "pending" },
  { id: 4, patientName: "Мария Николова", address: "ул. Граф Игнатиев 5, София", situation: "Педиатричен контролен преглед на 6 месеца.",                                lat: 42.6895, lng: 23.3245, status: "pending" },
];

const DOCTOR_BASE = { lat: 42.6977, lng: 23.3219 };

/** Vite replaces import.meta.env.VAR at build time — must use exact dot-access, no optional chaining */
function getApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  if (!key) {
    console.error("[InReach] VITE_GOOGLE_MAPS_API_KEY is undefined. Check your .env file and restart the dev server.");
  }
  return key ?? "";
}

const DEFAULT_SCHEDULE: Record<DayKey, { active: boolean; start: string; end: string }> = {
  Monday:    { active: true,  start: "09:00", end: "17:00" },
  Tuesday:   { active: true,  start: "09:00", end: "17:00" },
  Wednesday: { active: true,  start: "09:00", end: "17:00" },
  Thursday:  { active: true,  start: "09:00", end: "17:00" },
  Friday:    { active: true,  start: "09:00", end: "17:00" },
  Saturday:  { active: false, start: "10:00", end: "14:00" },
  Sunday:    { active: false, start: "10:00", end: "14:00" },
};

const EMPTY_SCHEDULE: Record<DayKey, { active: boolean; start: string; end: string }> = {
  Monday:    { active: false, start: "09:00", end: "17:00" },
  Tuesday:   { active: false, start: "09:00", end: "17:00" },
  Wednesday: { active: false, start: "09:00", end: "17:00" },
  Thursday:  { active: false, start: "09:00", end: "17:00" },
  Friday:    { active: false, start: "09:00", end: "17:00" },
  Saturday:  { active: false, start: "10:00", end: "14:00" },
  Sunday:    { active: false, start: "10:00", end: "14:00" },
};

function toTimeInput(value: string | null | undefined): string {
  if (!value) return "09:00";
  return value.slice(0, 5);
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

// ── Route helpers ─────────────────────────────────────────────────────────────

/** Nearest-neighbor optimization — returns a new ordered array */
function optimizeRoute(pending: VisitRequest[], origin: { lat: number; lng: number }): VisitRequest[] {
  let cur = { ...origin };
  const remaining = [...pending];
  const sorted: VisitRequest[] = [];
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

/**
 * Google Maps Embed API — Directions mode
 * Embed limit: up to 3 waypoints (4 total stops).
 * For more stops we fall back to showing each lat/lng as a search query.
 */
function buildEmbedUrl(
  origin: { lat: number; lng: number },
  stops: VisitRequest[]
): string {
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

  const url = `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  console.log("[InReach] Full route embed URL:", url);
  return url;
}

/** Embed URL for a single stop */
function buildSingleEmbedUrl(
  origin: { lat: number; lng: number },
  stop: VisitRequest
): string {
  const key = getApiKey();
  const params = new URLSearchParams({
    key,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${stop.lat},${stop.lng}`,
    mode: "driving",
  });
  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

/**
 * External Google Maps URL — no API key needed, no stop limit.
 * Opens the native app / website with all stops as waypoints.
 */
function buildExternalUrl(
  origin: { lat: number; lng: number },
  stops: VisitRequest[]
): string {
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

function buildSingleExternalUrl(origin: { lat: number; lng: number }, stop: VisitRequest): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${stop.lat},${stop.lng}&travelmode=driving`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DoctorHome() {
  const { isEasyMode } = useEasyMode();

  // Doctor-only guard — redirects patients to /home, guests to /login
  const { isLoading: authLoading } = useRoleGuard("DOCTOR");

  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [originalSchedule, setOriginalSchedule] = useState(EMPTY_SCHEDULE);
  const [scheduleEntryIds, setScheduleEntryIds] = useState<Partial<Record<DayKey, string>>>({});
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [requests, setRequests] = useState<VisitRequest[]>(INITIAL_REQUESTS);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [routeOptimized, setRouteOptimized] = useState(false);

  // Map modal state
  const [mapModal, setMapModal] = useState<{ embedUrl: string; externalUrl: string; title: string } | null>(null);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const done    = useMemo(() => requests.filter((r) => r.status === "done"),    [requests]);
  const activeReq = activeIndex !== null ? requests[activeIndex] : null;

  useEffect(() => {
    const loadSchedule = async () => {
      setIsScheduleLoading(true);
      setScheduleError(null);

      try {
        const entries = await api.get<DoctorScheduleResponse[]>("/schedule/doctor/get");

        const latestByDay = new Map<DayKey, DoctorScheduleResponse>();
        for (const entry of entries) {
          if (entry.specificDate) continue;
          const day = NUMBER_TO_DAY[entry.dayOfWeek];
          if (!day) continue;

          const existing = latestByDay.get(day);
          const entryDate = entry.updatedAt ? new Date(entry.updatedAt).getTime() : 0;
          const existingDate = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          if (!existing || entryDate >= existingDate) {
            latestByDay.set(day, entry);
          }
        }

        const nextSchedule: Record<DayKey, { active: boolean; start: string; end: string }> = { ...EMPTY_SCHEDULE };
        const nextIds: Partial<Record<DayKey, string>> = {};

        for (const day of DAYS) {
          const entry = latestByDay.get(day);
          if (!entry) continue;

          nextIds[day] = entry.id;
          nextSchedule[day] = {
            active: Boolean(entry.acceptingRequests) && Boolean(entry.workStart) && Boolean(entry.workEnd),
            start: toTimeInput(entry.workStart),
            end: toTimeInput(entry.workEnd),
          };
        }

        setSchedule(nextSchedule);
        setOriginalSchedule(nextSchedule);
        setScheduleEntryIds(nextIds);
      } catch (error) {
        console.error("Failed to load schedule:", error);
        setScheduleError("Неуспешно зареждане на графика.");
      } finally {
        setIsScheduleLoading(false);
      }
    };

    loadSchedule();
  }, []);

  // ── Route actions ────────────────────────────────────────────────────────────

  /** Optimize + open full multi-stop route in-app modal */
  const handleStartRoute = useCallback(() => {
    const pendingReqs = requests.filter((r) => r.status === "pending");
    if (pendingReqs.length === 0) return;

    const sorted = optimizeRoute(pendingReqs, DOCTOR_BASE);
    const doneReqs = requests.filter((r) => r.status === "done");
    setRequests([...sorted, ...doneReqs]);
    setRouteOptimized(true);
    setActiveIndex(0);

    setMapModal({
      embedUrl: buildEmbedUrl(DOCTOR_BASE, sorted),
      externalUrl: buildExternalUrl(DOCTOR_BASE, sorted),
      title: `Пълен маршрут — ${sorted.length} спирк${sorted.length !== 1 ? "и" : "а"}`,
    });
  }, [requests]);

  /** Open a single patient stop in the modal */
  const handleOpenPatientMap = (req: VisitRequest, reqIndex: number) => {
    setActiveIndex(reqIndex);
    setMapModal({
      embedUrl: buildSingleEmbedUrl(DOCTOR_BASE, req),
      externalUrl: buildSingleExternalUrl(DOCTOR_BASE, req),
      title: `Навигация до ${req.patientName}`,
    });
  };

  const handleMarkDone = () => {
    if (activeIndex === null) return;
    const updated = requests.map((r, i) => i === activeIndex ? { ...r, status: "done" as const } : r);
    setRequests(updated);
    
    // Just mark as done and close the map — don't auto-open the next one
    setActiveIndex(null);
    setMapModal(null);
  };

  const toggleDay = (day: DayKey) => setSchedule((p) => ({ ...p, [day]: { ...p[day], active: !p[day].active } }));
  const updateTime = (day: DayKey, f: "start" | "end", v: string) => setSchedule((p) => ({ ...p, [day]: { ...p[day], [f]: v } }));

  const handleScheduleAction = async () => {
    if (isScheduleSaving || isScheduleLoading) return;

    if (!editingSchedule) {
      setScheduleSuccess(null);
      setScheduleError(null);
      setEditingSchedule(true);
      return;
    }

    setIsScheduleSaving(true);
    setScheduleError(null);
    setScheduleSuccess(null);

    try {
      const nextIds: Partial<Record<DayKey, string>> = { ...scheduleEntryIds };
      const dayFailures: string[] = [];

      for (const day of DAYS) {
        const dayConfig = schedule[day];
        const previousConfig = originalSchedule[day];
        const existingId = nextIds[day];

        const changed =
          dayConfig.active !== previousConfig.active ||
          dayConfig.start !== previousConfig.start ||
          dayConfig.end !== previousConfig.end;

        if (!changed) {
          continue;
        }

        try {
          if (dayConfig.active) {
            const payload: DoctorScheduleRequest = {
              dayOfWeek: DAY_TO_NUMBER[day],
              workStart: toApiTime(dayConfig.start),
              workEnd: toApiTime(dayConfig.end),
              acceptingRequests: true,
            };

            if (existingId) {
              await api.put<DoctorScheduleResponse>(`/schedule/doctor/update/${existingId}`, payload);
            } else {
              const created = await api.post<DoctorScheduleResponse>("/schedule/doctor/create", payload);
              nextIds[day] = created.id;
            }
          } else if (existingId) {
            // Keep the entry and only stop accepting requests to avoid orphaned inactive rows.
            await api.put<DoctorScheduleResponse>(`/schedule/doctor/update/${existingId}`, {
              dayOfWeek: DAY_TO_NUMBER[day],
              acceptingRequests: false,
            });
          }
        } catch (error: any) {
          dayFailures.push(`${DAY_LABELS[day]}: ${error?.message || "Request failed"}`);
        }
      }

      setScheduleEntryIds(nextIds);
      setOriginalSchedule(schedule);
      if (dayFailures.length > 0) {
        setScheduleError(`Проблем при запазване: ${dayFailures.join(" | ")}`);
        setScheduleSuccess(null);
        return;
      }

      setEditingSchedule(false);
      setScheduleSuccess("Графикът е запазен успешно.");
    } catch (error: any) {
      console.error("Failed to save schedule:", error);
      if (error?.status === 403) {
        setScheduleError("Нямате права за тази операция (403). Проверете дали сте в Doctor профил.");
      } else {
        setScheduleError(error?.message || "Неуспешно запазване на графика.");
      }
    } finally {
      setIsScheduleSaving(false);
    }
  };

  // ── Schedule day card ────────────────────────────────────────────────────────
  function NormalDayCard({ day }: { day: DayKey }) {
    return (
      <div className={`rounded-lg border p-3 ${schedule[day].active ? "border-(--clr-accent) bg-(--clr-accent-light)/30" : "border-gray-100 bg-gray-50 opacity-60"}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <button
            type="button"
            onClick={() => editingSchedule && toggleDay(day)}
            className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${schedule[day].active ? "bg-(--clr-primary) border-(--clr-primary)" : "border-gray-300"} ${editingSchedule ? "cursor-pointer" : "cursor-default"}`}
          >
            {schedule[day].active && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </button>
          <p className="text-xs font-bold text-gray-900">{DAY_LABELS[day].slice(0, 3)}</p>
        </div>
        {editingSchedule && schedule[day].active ? (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <input type="time" value={schedule[day].start} onChange={(e) => updateTime(day, "start", e.target.value)} className="w-full text-[10px] border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-(--clr-accent)" />
            <input type="time" value={schedule[day].end} onChange={(e) => updateTime(day, "end", e.target.value)} className="w-full text-[10px] border border-gray-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-(--clr-accent)" />
          </div>
        ) : (
          <p className={`text-[10px] font-medium leading-tight text-center ${schedule[day].active ? "text-(--clr-primary)" : "text-gray-400"}`}>
            {schedule[day].active ? `${schedule[day].start}–${schedule[day].end}` : "Почивка"}
          </p>
        )}
      </div>
    );
  }

  if (authLoading) return null;

  // ── EASY MODE ──────────────────────────────────────────────────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">

          {/* Schedule */}
          <section className="em-card">
            <div className="flex justify-between items-center mb-4">
              <h1 className="em-heading" style={{ marginBottom: 0 }}>Седмичен график</h1>
              <button
                onClick={() => void handleScheduleAction()}
                disabled={isScheduleSaving || isScheduleLoading}
                className="em-btn-primary disabled:opacity-60"
                style={{ padding: "10px 20px", fontSize: "16px" }}
              >
                {isScheduleSaving ? "Запазване..." : editingSchedule ? "Запази" : "Редактирай"}
              </button>
            </div>
            {isScheduleLoading && <p className="em-body text-gray-500 mb-3">Зареждане на графика...</p>}
            {scheduleError && <p className="em-body text-red-600 mb-3">{scheduleError}</p>}
            {scheduleSuccess && <p className="em-body text-green-600 mb-3">{scheduleSuccess}</p>}
            <div className="divide-y divide-gray-100">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4 py-3">
                  <button
                    type="button"
                    onClick={() => editingSchedule && !isScheduleSaving && !isScheduleLoading && toggleDay(day)}
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

          {/* Visit Queue */}
          <section className="em-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="em-subheading" style={{ marginBottom: 0 }}>Опашка за посещения ({pending.length})</h2>
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
                  <div className="grow">
                    <div className="flex justify-between items-center">
                      <span className="em-body font-bold" style={{ marginBottom: 0 }}>{req.patientName}</span>
                      {req.status === "done"
                        ? <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        : req.distance ? <span className="em-body font-bold text-(--clr-primary)" style={{ marginBottom: 0 }}>{req.distance.toFixed(1)} км</span> : null}
                    </div>
                    <p className="em-body text-gray-500 line-clamp-1" style={{ marginBottom: 0 }}>{req.address}</p>
                  </div>
                  {req.status !== "done" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenPatientMap(req, idx)}
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
              <p className="em-body text-green-600 font-bold mt-4" style={{ marginBottom: 0 }}>{done.length} посещени{done.length !== 1 ? "я" : "е"} завършен{done.length !== 1 ? "и" : "о"} днес</p>
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

  // ── NORMAL MODE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 pl-1">
          <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-1">Лекарски панел</h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest opacity-60">Управлявайте графика си и опашката за посещения</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Schedule */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1 font-bold">Наличност</p>
                <h2 className="text-xl font-bold text-gray-900">Седмичен график</h2>
              </div>
              <button
                onClick={() => void handleScheduleAction()}
                disabled={isScheduleSaving || isScheduleLoading}
                className="bg-(--clr-primary) text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-(--clr-primary-hover) transition-colors duration-200 disabled:opacity-60"
              >
                {isScheduleSaving ? "Запазване..." : editingSchedule ? "Запази графика" : "Редактирай графика"}
              </button>
            </div>
            {isScheduleLoading && <p className="text-sm text-gray-500 mb-3">Зареждане на графика...</p>}
            {scheduleError && <p className="text-sm text-red-600 mb-3">{scheduleError}</p>}
            {scheduleSuccess && <p className="text-sm text-green-600 mb-3">{scheduleSuccess}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {DAYS.map((day) => <NormalDayCard key={day} day={day} />)}
            </div>
          </div>

          {/* Queue summary */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Днешни посещения</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {pending.length} чакащ{pending.length !== 1 ? "и" : "а"} заявк{pending.length !== 1 ? "и" : "а"}
            </h2>
            <p className="text-sm text-gray-600 mb-4 grow">
              {done.length > 0 ? `${done.length} завършени днес. ` : ""}
              {pending.length > 0
                ? "Натиснете Старт на маршрута за оптимизиран многоетапен маршрут в Google Maps."
                : "Всички посещения за днес са завършени!"}
            </p>
            {pending.length > 0 && (
              <button
                onClick={handleStartRoute}
                className="block w-full bg-(--clr-primary) text-white px-6 py-3 rounded-lg font-semibold hover:bg-(--clr-primary-hover) transition-colors duration-200 text-center text-sm"
              >
                {routeOptimized ? "Рестартирай маршрута" : "Старт на маршрута"}
              </button>
            )}
          </div>

          {/* Active nav card */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 font-bold">Навигация</p>
            {activeReq ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{activeReq.patientName}</h2>
                <p className="text-sm text-gray-600 mb-1">{activeReq.address}</p>
                <p className="text-xs text-gray-500 italic mb-4 grow line-clamp-2">{activeReq.situation}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenPatientMap(activeReq, activeIndex!)}
                    className="flex-1 bg-(--clr-primary) text-white px-4 py-3 rounded-lg font-semibold hover:bg-(--clr-primary-hover) transition-colors duration-200 text-sm"
                  >
                    Отвори карта
                  </button>
                  <button
                    onClick={handleMarkDone}
                    className="flex-1 bg-(--clr-accent-light) text-(--clr-primary-hover) px-4 py-3 rounded-lg font-semibold hover:opacity-80 transition-colors duration-200 text-sm"
                  >
                    Маркирай като завършено
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Няма активна спирка</h2>
                <p className="text-sm text-gray-600 grow">
                  Натиснете <strong>Старт на маршрута</strong>, за да оптимизирате и започнете, или изберете посещение отдолу.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Queue list */}
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700 uppercase tracking-wide">Опашка за посещения</h2>
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
                    ? "border-(--clr-primary) bg-(--clr-accent-light)/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Stop number / done check */}
                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">
                  {req.status === "done"
                    ? <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    : idx + 1}
                </div>

                {/* Info */}
                <div className="grow min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{req.patientName}</p>
                  <p className="text-xs text-gray-500 truncate">{req.address}</p>
                  {activeIndex === idx && req.status !== "done" && (
                    <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{req.situation}</p>
                  )}
                </div>

                {/* Distance badge */}
                {req.distance !== undefined && (
                  <span className="text-xs font-bold text-gray-400 shrink-0">{req.distance.toFixed(1)} км</span>
                )}

                {/* Actions */}
                {req.status !== "done" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenPatientMap(req, idx)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-(--clr-primary) text-white hover:bg-(--clr-primary-hover) transition-colors"
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
