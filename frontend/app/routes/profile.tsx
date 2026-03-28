import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { useEasyMode } from "../components/EasyModeContext";
import { useAuth } from "../components/AuthContext";
import { useRoleGuard } from "../utils/useRoleGuard";
import { api } from "../utils/api";

const MapComponent = lazy(() => import("../components/MapPicker"));

export function meta() {
  return [
    { title: "Редакция на профил - InReach" },
    { name: "description", content: "Обновете своя InReach профил" },
  ];
}

export default function Profile() {
  const { isEasyMode } = useEasyMode();
  const { user, token, isDoctor, refreshUser, registrationLocation, logout } = useAuth();
  const navigate = useNavigate();

  const { isLoading: authLoading } = useRoleGuard("any");

  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    address: registrationLocation?.address ?? "",
    description: user?.description ?? "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showMap, setShowMap] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number; address: string } | null>(
    registrationLocation ?? null
  );
  const [locating, setLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Новите пароли не съвпадат.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Паролата трябва да е поне 6 символа.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post("/users/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Неуспешна смяна на парола. Проверете текущата парола и опитайте отново.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setPickedLocation({ lat, lng, address });
    setFormData((prev) => ({ ...prev, address }));
  };

  const handleAutoLocate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        )
          .then((r) => r.json())
          .then((data) => {
            const addr =
              data.display_name ||
              `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            setPickedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: addr });
            setFormData((prev) => ({ ...prev, address: addr }));
          })
          .finally(() => setLocating(false));
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await api.patch("/users/me", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        telephone: formData.telephone || undefined,
        address: formData.address || undefined,
        description: isDoctor ? (formData.description || "") : undefined,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Неуспешно запазване на промените. Опитайте отново.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) return null;

  // ── EASY MODE ────────────────────────────────────────────────────────────────
  if (isEasyMode) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="em-page">
          <section className="em-card">
            <h1 className="em-heading">Редакция на профил</h1>
            <p className="em-body">Обновете личната си информация по-долу.</p>

            {success && (
              <div className="em-success">✓ Профилът е обновен успешно!</div>
            )}
            {error && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-xl font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="em-form-grid">
              <div>
                <label htmlFor="em-firstName" className="em-label">Име</label>
                <input
                  id="em-firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="em-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="em-lastName" className="em-label">Фамилия</label>
                <input
                  id="em-lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="em-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="em-email" className="em-label">Имейл адрес</label>
                <input
                  id="em-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="em-input"
                  required
                />
              </div>
              <div>
                <label htmlFor="em-telephone" className="em-label">Телефонен номер</label>
                <input
                  id="em-telephone"
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+359 88 000 0000"
                  className="em-input"
                />
              </div>
              <div className="em-full-width">
                <label className="em-label">Адрес / Локация</label>
                <LocationField isEasy />
              </div>
              {isDoctor && (
                <div className="em-full-width">
                  <label htmlFor="em-description" className="em-label">Професионално описание</label>
                  <textarea
                    id="em-description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Опишете вашия опит, специалност и подход към пациентите..."
                    className="em-input min-h-28 resize-y"
                  />
                </div>
              )}
              <div className="em-full-width">
                <button
                  type="submit"
                  className="em-btn-primary w-full disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? "Запазване..." : "Запази промените"}
                </button>
              </div>
            </form>

            {/* Password Reset in Easy Mode */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <h2 className="em-heading">Смяна на парола</h2>
              {passwordSuccess && (
                <div className="em-success">✓ Паролата е сменена успешно!</div>
              )}
              {passwordError && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-xl font-bold">
                  {passwordError}
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="em-form-grid">
                <div className="em-full-width">
                  <label htmlFor="em-oldPassword" className="em-label">Текуща парола</label>
                  <input
                    id="em-oldPassword"
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Въведете текущата си парола"
                    className="em-input"
                    required
                  />
                </div>
                <div className="em-full-width">
                  <label htmlFor="em-newPassword" className="em-label">Нова парола</label>
                  <input
                    id="em-newPassword"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Въведете нова парола (мин. 6 символа)"
                    className="em-input"
                    required
                  />
                </div>
                <div className="em-full-width">
                  <label htmlFor="em-confirmPassword" className="em-label">Потвърди нова парола</label>
                  <input
                    id="em-confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Потвърдете новата парола"
                    className="em-input"
                    required
                  />
                </div>
                <div className="em-full-width">
                  <button
                    type="submit"
                    className="em-btn-primary w-full disabled:opacity-50"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Смяна..." : "Смени паролата"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── Shared location field component ──────────────────────────────────────────
  function LocationField({ isEasy = false }: { isEasy?: boolean }) {
    const inputCls = isEasy
      ? "em-input border-0 focus:outline-none focus:ring-0 bg-white flex-1"
      : "flex-1 px-4 py-2 text-sm bg-white focus:outline-none focus:ring-0";

    return (
      <>
        {!showMap ? (
          <div className="flex items-center border-2 border-[var(--clr-accent)] rounded-lg overflow-hidden focus-within:border-[var(--clr-accent-muted)]">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Вашият адрес или град"
              className={inputCls}
            />
            {/* GPS button */}
            <button
              type="button"
              onClick={handleAutoLocate}
              disabled={locating}
              title="Използвай текущата локация"
              className="shrink-0 px-3 py-2 text-gray-500 hover:text-[var(--clr-primary)] border-l border-[var(--clr-accent)] transition-colors disabled:opacity-50"
            >
              {locating ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            {/* Map picker button */}
            <button
              type="button"
              onClick={() => setShowMap(true)}
              title="Избери от карта"
              className="shrink-0 px-3 py-2 text-gray-500 hover:text-[var(--clr-primary)] border-l border-[var(--clr-accent)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Suspense
              fallback={
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300">
                  Зареждане на карта...
                </div>
              }
            >
              <MapComponent selectedLocation={pickedLocation} onLocationSelect={handleLocationSelect} />
            </Suspense>
            {pickedLocation && (
              <p className="text-xs text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                ✓ {pickedLocation.address}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowMap(false); setPickedLocation(null); setFormData((p) => ({ ...p, address: "" })); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Изчисти
              </button>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="flex-1 bg-[var(--clr-primary)] text-white py-2 rounded-lg text-xs font-bold hover:bg-[var(--clr-primary-hover)] transition-colors"
              >
                Потвърди локация
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── NORMAL MODE ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--clr-primary)] transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-[var(--clr-primary)] flex items-center justify-center text-white text-2xl font-bold uppercase shrink-0">
              {formData.firstName.charAt(0) || user?.email?.charAt(0) || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Редакция на профил</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 animate-scale-in">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Профилът е обновен успешно!
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Име</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имейл адрес</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефонен номер</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+359 88 000 0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес / Локация</label>
              <p className="text-xs text-gray-400 mb-2">Използва се, за да ви показваме най-близките лекари.</p>
              <LocationField />
            </div>

            {isDoctor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Професионално описание</label>
                <p className="text-xs text-gray-400 mb-2">Това описание се показва на картите в панела с лекари.</p>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Опишете вашия опит, специалност и подход към пациентите..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] transition resize-y"
                />
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[var(--clr-primary)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--clr-primary-hover)] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {isSaving ? "Запазване..." : "Запази промените"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>

        {/* Password Reset Section */}
        <div className="mt-8 bg-white border border-blue-100 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[var(--clr-primary)] uppercase tracking-wide mb-3">Смяна на парола</h2>
          
          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Паролата е сменена успешно!
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текуща парола</label>
              <input
                type="password"
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                placeholder="Въведете текущата си парола"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-primary)] transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Нова парола</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Въведете нова парола (мин. 6 символа)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-primary)] transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Потвърди нова парола</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Потвърдете новата парола"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-primary)] transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full bg-[var(--clr-primary)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--clr-primary-hover)] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {isChangingPassword ? "Смяна..." : "Смени паролата"}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="mt-8 bg-white border border-red-100 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3">Профил</h2>
          <p className="text-sm text-gray-500 mb-4">Излизането ще прекрати текущата ви сесия.</p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Изход
          </button>
        </div>
      </div>
    </div>
  );
}
