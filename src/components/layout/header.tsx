import { Search, Bell, Settings, Menu } from "lucide-react";

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /** Current user info from NextAuth session */
  user: {
    name?: string | null;
    email?: string | null;
  };
  /** Sidebar width in px — determines header left offset */
  sidebarWidth: number;
  /** Callback to open mobile sidebar */
  onOpenMobileSidebar: () => void;
  /** Header height in px */
  height: number;
}

/**
 * Top header bar for the dashboard.
 * Uses Tailwind for spacing, inline style for dynamic `left` + `height`.
 */
export function Header({ user, sidebarWidth, onOpenMobileSidebar, height }: HeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 bg-[#0B0F19]/85 backdrop-blur-md border-b border-[#1E2535] transition-all duration-300"
      style={{ left: sidebarWidth, height }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onOpenMobileSidebar}
        className="lg:hidden p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-white/5 mr-3"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 border border-[#1E2535] rounded-xl leading-5 bg-[#111827] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
            placeholder="Search agents, tasks, or ask a question..."
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-4">
        <button
          className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-white/5"
          aria-label="Notifications"
        >
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0B0F19]" />
          <Bell className="w-5 h-5" />
        </button>
        <button
          className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-white/5"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-[#1E2535] mx-2" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition-colors">
              {user.name || "Owner"}
            </p>
            <p className="text-xs text-gray-500">{user.email || "admin@openclaw.dev"}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all">
            {user.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
