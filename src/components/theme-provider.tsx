/**
 * ThemeProvider — theme management for dark/light mode.
 *
 * ThemeManager: pure logic (testable without DOM).
 * ThemeProvider: React component wrapper (for Phase 22+).
 *
 * Features:
 * - Dark mode default
 * - localStorage persistence (key: "ae-theme")
 * - System preference detection (prefers-color-scheme)
 * - [data-theme] attribute on documentElement
 *
 * @module components/theme-provider
 */

/** Valid theme values */
export type Theme = "dark" | "light";

/**
 * ThemeManager — pure theme logic, no DOM dependency.
 * Used directly in tests and wrapped by React ThemeProvider.
 */
export class ThemeManager {
  static readonly STORAGE_KEY = "ae-theme";
  private theme: Theme = "dark";

  constructor(initialTheme?: Theme) {
    if (initialTheme && (initialTheme === "dark" || initialTheme === "light")) {
      this.theme = initialTheme;
    }
  }

  /**
   * Get current theme.
   *
   * @returns Current theme ("dark" | "light")
   */
  getTheme(): Theme {
    return this.theme;
  }

  /**
   * Set theme explicitly.
   *
   * @param theme - Theme to set (dark or light)
   */
  setTheme(theme: Theme): void {
    if (theme === "dark" || theme === "light") {
      this.theme = theme;
    }
  }

  /**
   * Toggle between dark and light.
   */
  toggle(): void {
    this.theme = this.theme === "dark" ? "light" : "dark";
  }

  /**
   * Load theme from localStorage (browser only).
   *
   * @returns Loaded theme or default "dark"
   */
  static loadFromStorage(): Theme {
    if (typeof window === "undefined") return "dark";
    try {
      const saved = localStorage.getItem(ThemeManager.STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // localStorage unavailable
    }
    // Check system preference
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  /**
   * Save current theme to localStorage.
   */
  saveToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ThemeManager.STORAGE_KEY, this.theme);
    } catch {
      // localStorage unavailable
    }
  }

  /**
   * Apply theme to document element.
   */
  applyToDOM(): void {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", this.theme);
  }
}
