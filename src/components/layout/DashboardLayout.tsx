import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
