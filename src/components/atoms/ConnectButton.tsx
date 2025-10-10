import { useEffect, useState } from "react";
import Button from "./Button";
import { useWallet } from "../../context/WalletContext";
import { useAppContext } from "../../context/AppContext";

const CustomConnectButton = ({
  onclick,
  onBalanceChange,
}: {
  onclick?: () => void;
  onBalanceChange?: (balance: number) => void;
}) => {
  const { address, isConnecting, isLoading, connectWallet, disconnect } = useWallet();
  const { state } = useAppContext();
  const { selectedPremium } = state;

  // Fetch real STX balance from Stacks API
  const [stxBalance, setStxBalance] = useState<number>(0);
  const [, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchStxBalance = async () => {
      if (!address) {
        setStxBalance(0);
        if (onBalanceChange) onBalanceChange(0);
        return;
      }

      setIsLoadingBalance(true);
      try {
        // Fetch STX balance from Stacks API
        const response = await fetch(
          `https://api.testnet.hiro.so/extended/v1/address/${address}/stx`
        );
        
        if (response.ok) {
          const data = await response.json();
          const balance = parseFloat(data.balance) / 1000000; // Convert from microSTX to STX
          setStxBalance(balance);
          if (onBalanceChange) onBalanceChange(balance);
        } else {
          console.error('Failed to fetch STX balance:', response.status);
          setStxBalance(0);
          if (onBalanceChange) onBalanceChange(0);
        }
      } catch (error) {
        console.error('Error fetching STX balance:', error);
        setStxBalance(0);
        if (onBalanceChange) onBalanceChange(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchStxBalance();
  }, [address, onBalanceChange]);

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
        if (!address) {
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
                onclick={disconnect}
                className="w-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {address ? 
                    `${address.slice(0, 6)}...${address.slice(-4)}` : 
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
