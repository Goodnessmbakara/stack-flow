import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { Layout } from "./components/layout/layout";
import { DashboardLayout } from "./components/layout/dashboard-layout";
const HomePage = lazy(() => import("./components/pages/home"));
const NewTradePage = lazy(() => import("./components/pages/new"));
const TradingHistoryPage = lazy(() => import("./components/pages/history"));
const AboutPage = lazy(() => import("./components/pages/about"));
const WhitepaperPage = lazy(() => import("./components/pages/whitepaper"));
const CopyTradingDashboard = lazy(() => import("./components/pages/copy-trading-dashboard"));
const SentimentDashboard = lazy(() => import("./components/pages/sentiment-dashboard"));
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
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/whitepaper",
        element: <WhitepaperPage />,
      },
      // @DEV: Default /app route to /app/trade/new
      {
        path: "/trade",
        element: <DashboardLayout />,
        children: [
          {
            path: "/trade",
            element: <NewTradePage />,
          },
          {
            path: "/trade/history",
            element: <TradingHistoryPage />,
          },
          {
            path: "/trade/copy",
            element: <CopyTradingDashboard />,
          },
          {
            path: "/trade/sentiment",
            element: <SentimentDashboard />,
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
