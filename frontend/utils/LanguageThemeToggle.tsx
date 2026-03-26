import { useTheme } from "./ThemeContext";
import type { Language } from "./i18n";

export function LanguageThemeToggle() {
  const { language, setLanguage, isDarkMode, setIsDarkMode } = useTheme();

  return (
    <div className="fixed top-4 right-4 flex gap-2 z-50">
      {/* Language Toggle */}
      <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded p-1">
        <button
          onClick={() => setLanguage("en" as Language)}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            language === "en"
              ? "bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("bg" as Language)}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            language === "bg"
              ? "bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          }`}
        >
          БГ
        </button>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
