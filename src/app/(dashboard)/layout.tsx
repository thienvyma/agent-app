import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server-side layout for the (dashboard) route group.
 *
 * Responsibilities:
 * - Fetches NextAuth session
 * - Redirects to /login if unauthenticated
 * - Passes user data to the client-side DashboardLayout
 */
export default async function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Middleware already protects, but double-check for type safety
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}
