import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useHydrateEstablishment } from "@/stores/useHydrateEstablishment";

export default function ManagerLayout() {
  // Hydrate the Zustand establishment store (replaces EstablishmentProvider)
  useHydrateEstablishment();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6 overflow-auto min-h-[calc(100vh-57px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
