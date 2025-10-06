import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { Layout } from "./components/layout/layout";
import { DashboardLayout } from "./components/layout/dashboard-layout";
const HomePage = lazy(() => import("./components/pages/home"));
const NewTradePage = lazy(() => import("./components/pages/new"));
const TradingHistoryPage = lazy(() => import("./components/pages/history"));
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
        path: "/about",
        element: <WhitepaperPage />,
      },
      // @DEV: Default /trade route to /trade/new
      {
        path: "/trade",
        element: <DashboardLayout />,
        children: [
          {
            path: "", // Renders at /trade
            element: <NewTradePage />,
          },
          {
            path: "history", // Renders at /trade/history
            element: <TradingHistoryPage />,
          },
          // {
          //   path: "referrals",
          //   element: <ReferralPage />,
          // },
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
