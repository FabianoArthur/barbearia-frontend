import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/context";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const PublicLayout = lazy(() =>
  import("@/components/layout/PublicLayout").then((m) => ({
    default: m.PublicLayout,
  })),
);
const PublicBookingPage = lazy(
  () => import("@/features/booking/PublicBookingPage"),
);
const ConfirmationPage = lazy(
  () => import("@/features/confirmation/ConfirmationPage"),
);
const BarberDashboard = lazy(() => import("@/features/barber/BarberDashboard"));
const ManagerLayout = lazy(() => import("@/features/manager/ManagerLayout"));
const DashboardPage = lazy(
  () => import("@/features/manager/dashboard/DashboardPage"),
);
const EstablishmentsPage = lazy(
  () => import("@/features/manager/establishments/EstablishmentsPage"),
);
const BarbersPage = lazy(
  () => import("@/features/manager/barbers/BarbersPage"),
);
const ServicesPage = lazy(
  () => import("@/features/manager/services/ServicesPage"),
);
const SchedulePage = lazy(
  () => import("@/features/manager/schedule/SchedulePage"),
);
const ClientsPage = lazy(
  () => import("@/features/manager/clients/ClientsPage"),
);
const AppointmentsPage = lazy(
  () => import("@/features/manager/appointments/AppointmentsPage"),
);

// Finance — sub-route layout + pages
const FinanceLayout = lazy(() =>
  import("@/features/manager/finance/components/FinanceLayout").then((m) => ({
    default: m.FinanceLayout,
  })),
);
const FinancePage = lazy(
  () => import("@/features/manager/finance/FinancePage"),
);
const RevenueAnalyticsPage = lazy(
  () => import("@/features/manager/finance/components/RevenueAnalyticsPage"),
);
const BarberPerformancePage = lazy(
  () => import("@/features/manager/finance/components/BarberPerformancePage"),
);
const TrendsPage = lazy(
  () => import("@/features/manager/finance/components/TrendsPage"),
);
const FeeManagementPage = lazy(
  () => import("@/features/manager/finance/components/FeeManagementPage"),
);
const ServicePerformancePage = lazy(
  () => import("@/features/manager/finance/components/ServicePerformancePage"),
);
const CustomerAnalyticsPage = lazy(
  () => import("@/features/manager/finance/components/CustomerAnalyticsPage"),
);
const CapacityPage = lazy(
  () => import("@/features/manager/finance/components/CapacityPage"),
);
const BreakdownPage = lazy(
  () => import("@/features/manager/finance/components/BreakdownPage"),
);
const ForecastPage = lazy(
  () => import("@/features/manager/finance/components/ForecastPage"),
);
const ExpensesPage = lazy(
  () => import("@/features/manager/finance/expenses/ExpensesPage"),
);

// Users
const UsersPage = lazy(() => import("@/features/manager/users/UsersPage"));
const UserDetailPage = lazy(
  () => import("@/features/manager/users/UserDetailPage"),
);

// Payments
const PaymentsPage = lazy(
  () => import("@/features/manager/payments/components/PaymentsPage"),
);
const RefundsPage = lazy(
  () => import("@/features/manager/payments/components/RefundsPage"),
);

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-64 w-full max-w-2xl" />
    </div>
  );
}

function SuspenseWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

const router = createBrowserRouter(
  [
    {
      element: <SuspenseWrapper />,
      children: [
        {
          element: <PublicLayout />,
          children: [
            { path: "/", element: <PublicBookingPage /> },
            { path: "/confirm", element: <ConfirmationPage /> },
            { path: "/confirm/:code", element: <ConfirmationPage /> },
          ],
        },
        { path: "/login", element: <LoginPage /> },
        {
          element: <ProtectedRoute allowedRoles={["BARBER"]} />,
          children: [{ path: "/barber", element: <BarberDashboard /> }],
        },
        {
          element: <ProtectedRoute allowedRoles={["MANAGER", "SUPER_ADMIN"]} />,
          children: [
            {
              path: "/manager",
              element: <ManagerLayout />,
              children: [
                { index: true, element: <DashboardPage /> },
                { path: "dashboard", element: <DashboardPage /> },
                { path: "establishments", element: <EstablishmentsPage /> },
                { path: "barbers", element: <BarbersPage /> },
                { path: "users", element: <UsersPage /> },
                { path: "users/:userId", element: <UserDetailPage /> },
                { path: "services", element: <ServicesPage /> },
                { path: "schedule", element: <SchedulePage /> },
                { path: "clients", element: <ClientsPage /> },
                { path: "appointments", element: <AppointmentsPage /> },
                { path: "payments", element: <PaymentsPage /> },
                { path: "refunds", element: <RefundsPage /> },
                {
                  path: "finance",
                  element: <FinanceLayout />,
                  children: [
                    { index: true, element: <FinancePage /> },
                    { path: "revenue", element: <RevenueAnalyticsPage /> },
                    { path: "barbers", element: <BarberPerformancePage /> },
                    { path: "services", element: <ServicePerformancePage /> },
                    { path: "customers", element: <CustomerAnalyticsPage /> },
                    { path: "capacity", element: <CapacityPage /> },
                    { path: "trends", element: <TrendsPage /> },
                    { path: "breakdown", element: <BreakdownPage /> },
                    { path: "forecast", element: <ForecastPage /> },
                    { path: "expenses", element: <ExpensesPage /> },
                    {
                      // SUPER_ADMIN only — additionally guarded at component level
                      path: "fees",
                      element: <FeeManagementPage />,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  // "/" normally; "/<repo>/" when built for GitHub Pages.
  { basename: import.meta.env.BASE_URL },
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
