"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

/**
 * Props for the DashboardLayout client component.
 */
interface DashboardLayoutProps {
  /** User session info passed from the server layout */
  user: {
    name?: string | null;
    email?: string | null;
  };
  /** Page content to render in the main area */
  children: React.ReactNode;
}

/** Sidebar widths */
const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 72;
const HEADER_HEIGHT = 64;

/**
 * Client-side Dashboard Layout wrapper.
 *
 * Manages sidebar collapsed/mobile state and responsive layout.
 * Uses Tailwind classes for spacing + inline styles for dynamic values.
 */
export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /** Detect mobile breakpoint */
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const mainMarginLeft = isMobile ? 0 : sidebarWidth;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200 font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        width={sidebarWidth}
      />
      <Header
        user={user}
        sidebarWidth={isMobile ? 0 : sidebarWidth}
        onOpenMobileSidebar={() => setMobileOpen(true)}
        height={HEADER_HEIGHT}
      />

      {/* Main Content */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          paddingTop: HEADER_HEIGHT + 8,
          marginLeft: mainMarginLeft,
        }}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
