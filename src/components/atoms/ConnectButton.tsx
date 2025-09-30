import { useEffect } from "react";
import Button from "./Button";
import { useStacksWallet } from "../../hooks/useStacksWallet";
import { useAppContext } from "../../context/AppContext";

const CustomConnectButton = ({
  onclick,
  onBalanceChange,
}: {
  onclick?: () => void;
  onBalanceChange?: (balance: number) => void;
}) => {
  const { userData, isConnecting, isLoading, connectWallet, disconnectWallet, isSignedIn } = useStacksWallet();

  const { state } = useAppContext();
  const { selectedPremium } = state;

  // For now, we'll simulate a balance - in a real app you'd fetch STX balance
  const stxBalance = 1000; // This would come from Stacks API

  useEffect(() => {
    if (onBalanceChange) {
      onBalanceChange(stxBalance);
    }
  }, [stxBalance, onBalanceChange]);

  if (isLoading) {
    return (
      <Button variant="gradient" className="w-full" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <div className="w-full">
      {(() => {
        if (!isSignedIn) {
          return (
            <Button
              variant="gradient"
              className="w-full"
              onclick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect Stacks Wallet"}
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-2 w-full">
            {!onclick && (
              <Button
                variant="gradient"
                onclick={disconnectWallet}
                className="w-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {userData?.address ? 
                    `${userData.address.slice(0, 6)}...${userData.address.slice(-4)}` : 
                    "Connected"
                  }
                  {stxBalance ? ` (${stxBalance} STX)` : ""}
                </div>
              </Button>
            )}

            {onclick && (
              <Button
                variant="gradient"
                className={`w-full ${
                  stxBalance &&
                  selectedPremium &&
                  stxBalance < Number(selectedPremium)
                    ? "cursor-not-allowed"
                    : ""
                }`}
                onclick={onclick}
              >
                {stxBalance &&
                selectedPremium &&
                stxBalance < Number(selectedPremium)
                  ? "Insufficient balance"
                  : "Buy this strategy"}
              </Button>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default CustomConnectButton;
