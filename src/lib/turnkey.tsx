"use client";

import {
  TurnkeyProvider,
  TurnkeyProviderConfig,
} from "@turnkey/react-wallet-kit";

const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: import.meta.env.VITE_ORGANIZATION_ID!,
  authProxyConfigId: import.meta.env.VITE_AUTH_PROXY_CONFIG_ID!,
};

export function TurnKeyProviderEl({ children }: { children: React.ReactNode }) {
  return (
    <TurnkeyProvider
      config={turnkeyConfig}
      callbacks={{
        onError: (error) => console.error("Turnkey error:", error),
      }}
    >
      {" "}
      {children}{" "}
    </TurnkeyProvider>
  );
}
