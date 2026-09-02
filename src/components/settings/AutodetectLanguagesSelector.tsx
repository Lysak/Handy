import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../ui/SettingContainer";
import { ResetButton } from "../ui/ResetButton";
import { useSettings } from "../../hooks/useSettings";
import {
  getLanguageLabel,
  MODEL_CAPABILITY_LANGUAGES,
  supportsLanguageCode,
} from "../../lib/constants/languages";

interface AutodetectLanguagesSelectorProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
  supportedLanguages?: string[];
}

// Multi-select allow-list for whisper language auto-detection. Empty = the
// model's full autodetect (stock behaviour). Non-empty constrains detection
// to the chosen codes via `allowed_languages` -> TRANSCRIBE_WHISPER_ALLOWED_LANGS.
// Only meaningful while the Language selector is on "Auto Detect".
export const AutodetectLanguagesSelector: React.FC<
  AutodetectLanguagesSelectorProps
> = ({ descriptionMode = "tooltip", grouped = false, supportedLanguages }) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, resetSetting, isUpdating } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = getSetting("allowed_languages") ?? [];
  const updating = isUpdating("allowed_languages");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const availableLanguages = useMemo(() => {
    if (!supportedLanguages || supportedLanguages.length === 0)
      return MODEL_CAPABILITY_LANGUAGES;
    return MODEL_CAPABILITY_LANGUAGES.filter((lang) =>
      supportsLanguageCode(supportedLanguages, lang.value),
    );
  }, [supportedLanguages]);

  const filteredLanguages = useMemo(
    () =>
      availableLanguages.filter((language) =>
        language.label.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, availableLanguages],
  );

  const summary =
    selected.length === 0
      ? t("settings.general.autodetectLanguages.all")
      : selected
          .map((code) => getLanguageLabel(code) ?? code)
          .join(", ");

  const toggleLanguage = async (code: string) => {
    if (updating) return;
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    await updateSetting("allowed_languages", next);
  };

  return (
    <SettingContainer
      title={t("settings.general.autodetectLanguages.title")}
      description={t("settings.general.autodetectLanguages.description")}
      descriptionMode={descriptionMode}
      grouped={grouped}
    >
      <div className="flex items-center space-x-1">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className={`px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded min-w-[200px] max-w-[280px] text-start flex items-center justify-between transition-all duration-150 ${
              updating
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-logo-primary/10 cursor-pointer hover:border-logo-primary"
            }`}
            onClick={() => !updating && setIsOpen(!isOpen)}
            disabled={updating}
          >
            <span className="truncate">{summary}</span>
            <svg
              className={`w-4 h-4 ms-2 shrink-0 transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen && !updating && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-mid-gray/80 rounded shadow-lg z-50 max-h-60 overflow-hidden">
              <div className="p-2 border-b border-mid-gray/80">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder={t("settings.general.language.searchPlaceholder")}
                  className="w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/40 rounded focus:outline-none focus:ring-1 focus:ring-logo-primary focus:border-logo-primary"
                />
              </div>

              <div className="max-h-48 overflow-y-auto">
                {filteredLanguages.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-mid-gray text-center">
                    {t("settings.general.language.noResults")}
                  </div>
                ) : (
                  filteredLanguages.map((language) => {
                    const checked = selected.includes(language.value);
                    return (
                      <button
                        key={language.value}
                        type="button"
                        className={`w-full px-2 py-1 text-sm text-start hover:bg-logo-primary/10 transition-colors duration-150 flex items-center gap-2 ${
                          checked ? "text-logo-primary font-semibold" : ""
                        }`}
                        onClick={() => toggleLanguage(language.value)}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={checked}
                          className="accent-logo-primary pointer-events-none"
                        />
                        <span className="truncate">{language.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        <ResetButton
          onClick={() => resetSetting("allowed_languages")}
          disabled={updating}
        />
      </div>
    </SettingContainer>
  );
};
