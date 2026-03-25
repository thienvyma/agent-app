"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  DollarSign,
  MessageSquare,
  BookOpen,
  ClipboardCheck,
  Activity,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

/**
 * Navigation items for the dashboard sidebar.
 */
const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Agents", href: "/agents", icon: Users },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Budget", href: "/budget", icon: DollarSign },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Approvals", href: "/approvals", icon: ClipboardCheck },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Scheduling", href: "/scheduling", icon: Clock },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Props for Sidebar component */
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  /** Sidebar width in px controlled by parent */
  width: number;
}

/**
 * Sidebar navigation with collapse + mobile overlay.
 * Width uses inline style (dynamic). Spacing uses Tailwind classes.
 */
export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile, width }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#1E2535] justify-between">
        <Link href="/" className="flex items-center gap-3 overflow-hidden no-underline">
          <svg className="w-7 h-7 shrink-0 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && (
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-300 whitespace-nowrap">
              Agentic OS
            </span>
          )}
        </Link>
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden flex items-center justify-center w-7 h-7 text-gray-500 hover:text-gray-200"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && !!pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all no-underline ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-indigo-400" : "text-gray-500"}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1E2535]">
        <div className={`flex items-center gap-3 px-3 py-2 bg-[#0B0F19] rounded-xl border border-[#1E2535] ${collapsed ? "justify-center" : ""}`}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          {!collapsed && <span className="text-xs text-gray-500 font-medium">All systems operational</span>}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col h-screen bg-[#111827] border-r border-[#1E2535] fixed left-0 top-0 z-40 transition-all duration-300"
        style={{ width }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative w-[260px] h-full bg-[#111827] border-r border-[#1E2535] flex flex-col z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
