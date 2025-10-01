import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { Layout } from "./components/layout/layout";
import { DashboardLayout } from "./components/layout/dashboard-layout";
const HomePage = lazy(() => import("./components/pages/home"));
const NewTradePage = lazy(() => import("./components/pages/new"));
const TradingHistoryPage = lazy(() => import("./components/pages/history"));
const ReferralPage = lazy(() => import("./components/pages/referral"));
const WhitepaperPage = lazy(() => import("./components/pages/whitepaper"));
import { AppContextProvider } from "./context/AppContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppContextProvider>
        <Layout />
      </AppContextProvider>
    ),
    children: [
      {
        path: "",
        element: <HomePage />,
      },
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/whitepaper",
        element: <WhitepaperPage />,
      },
      // @DEV: Default /app route to /app/trade/new
      {
        path: "/app",
        element: <DashboardLayout />,
        children: [
          {
            path: "/app/trade/new",
            element: <NewTradePage />,
          },
          {
            path: "/app/trade/history",
            element: <TradingHistoryPage />,
          },
          {
            path: "/app/trade/referrals",
            element: <ReferralPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <div>404</div>,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;
