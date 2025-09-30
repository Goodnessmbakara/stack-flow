import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <ToastContainer />
        <App />
      </QueryClientProvider>
    </Suspense>
  </StrictMode>
);
