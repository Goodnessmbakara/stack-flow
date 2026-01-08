import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { Connect } from "@stacks/connect-react";
import { TurnKeyProviderEl } from "./lib/turnkey.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

import "./index.css";
import App from "./App.tsx";
import { WalletProvider } from "./context/WalletContext.tsx";

const queryClient = new QueryClient();

// Configure Stacks authentication for Connect provider
const authOptions = {
  appDetails: {
    name: "StackFlow",
    icon: window.location.origin + "/logo.png",
  },
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Connect authOptions={authOptions}>
          <TurnKeyProviderEl>
            <QueryClientProvider client={queryClient}>
              <WalletProvider>
                <ToastContainer />
                <App />
              </WalletProvider>
            </QueryClientProvider>
          </TurnKeyProviderEl>
        </Connect>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
