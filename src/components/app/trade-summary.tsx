import { useState, useEffect } from "react";
import { useTurnkey } from "@turnkey/react-wallet-kit";
// import CustomConnectButton from "../atoms/ConnectButton";
import { Icons } from "../ui/icons";
import { useAppContext } from "../../context/AppContext";
import ConfirmModal from "../molecules/ConfirmModal";
import SuccessModal from "../molecules/SuccessModal";
import { TransactionStatus } from "../molecules/TransactionStatus";
import { toast } from "react-toastify";
import { useTokenService } from "../../services/tokenService";
import {
  createOption,
  monitorTransaction,
  getExplorerUrl,
} from "../../blockchain/stacks/transactionManager";
import Button from "../atoms/Button";

export function TradeSummary() {
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "failed">(
    "pending"
  );
  const [explorerUrl, setExplorerUrl] = useState<string>("");

  const { state } = useAppContext();
  const { strategy, isFetching, selectedPremium, period, amount } = state;

  // Turnkey hooks
  const { signTransaction, wallets } = useTurnkey();
  const tokenService = useTokenService();

  // Get wallet address from Turnkey
  const walletAddress = wallets[0]?.accounts[0]?.address;

  // Fetch real token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!walletAddress) {
        setUsdcBalance(0);
        return;
      }

      try {
        const primaryBalance = await tokenService.getPrimaryBalance();
        setUsdcBalance(primaryBalance);
        console.log("Primary trading balance:", primaryBalance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setUsdcBalance(0);
      }
    };

    fetchTokenBalance();
  }, [walletAddress, tokenService]);

  const callStrategy = async () => {
    // Validate wallet connection
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setShowConfirmModal(true);

      // Map strategy name to type
      const strategyMap: Record<
        string,
        "CALL" | "STRAP" | "BCSP" | "BPSP" | "PUT" | "STRIP" | "BEPS" | "BECS"
      > = {
        CALL: "CALL",
        Call: "CALL",
        STRAP: "STRAP",
        Strap: "STRAP",
        "Bull Call Spread": "BCSP",
        "Bull Put Spread": "BPSP",
        PUT: "PUT",
        Put: "PUT",
        STRIP: "STRIP",
        Strip: "STRIP",
        "Bear Put Spread": "BEPS",
        "Bear Call Spread": "BECS",
      };

      const mappedStrategy = strategyMap[strategy] || "CALL";

      console.log("Transaction parameters:", {
        strategy: mappedStrategy,
        amount: parseFloat(amount),
        strikePrice: state.assetPrice,
        premium: parseFloat(selectedPremium),
        period: parseFloat(period),
        walletAddress,
      });

      // Validate parameters
      if (parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        setShowConfirmModal(false);
        return;
      }

      if (state.assetPrice <= 0) {
        toast.error("Asset price not loaded. Please wait and try again.");
        setShowConfirmModal(false);
        return;
      }

      if (parseFloat(selectedPremium) <= 0) {
        toast.error("Please select a valid premium");
        setShowConfirmModal(false);
        return;
      }

      // Create option with Turnkey signing
      await createOption(
        {
          strategy: mappedStrategy,
          amount: parseFloat(amount),
          strikePrice: state.assetPrice,
          premium: parseFloat(selectedPremium),
          period: parseFloat(period),
          userAddress: walletAddress,
          onFinish: async (data: any) => {
            console.log("Transaction broadcast:", data.txId);
            setTxHash(data.txId);
            setShowConfirmModal(false);
            setShowTransactionStatus(true);
            setTxStatus("pending");
            setExplorerUrl(getExplorerUrl(data.txId));

            // Monitor transaction
            const confirmed = await monitorTransaction(
              data.txId,
              (status: any, details: any) => {
                console.log("Transaction status update:", status, details);

                if (status === "confirmed") {
                  setTxStatus("success");
                  toast.success(
                    `Transaction confirmed! Block: ${details?.blockHeight}`
                  );
                } else if (status === "failed") {
                  setTxStatus("failed");
                  toast.error(
                    `Transaction failed: ${details?.reason || "Unknown error"}`
                  );
                } else {
                  console.log(
                    `Transaction pending... (${details?.attempts}/${details?.maxAttempts})`
                  );
                }
              }
            );

            if (confirmed) {
              setTxStatus("success");
              console.log("Trade successful! TX:", data.txId);
            } else {
              setTxStatus("failed");
            }
          },
          onError: (err: Error) => {
            console.error("Transaction error:", err);
            setShowConfirmModal(false);
            setTxStatus("failed");
            toast.error(
              err.message || "Failed to create option. Please try again."
            );
          },
          onCancel: () => {
            setShowConfirmModal(false);
            toast.info("Transaction cancelled");
          },
        },
        signTransaction
      );
    } catch (error) {
      console.error("Trade execution error:", error);
      setShowConfirmModal(false);
      toast.error("Failed to create option. Please try again.");
    }
  };

  return (
    <>
      <ConfirmModal isOpen={showConfirmModal} />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        txHash={txHash}
      />

      {showTransactionStatus && (
        <TransactionStatus
          txId={txHash}
          status={txStatus}
          explorerUrl={explorerUrl}
          onClose={() => {
            setShowTransactionStatus(false);
            if (txStatus === "success") {
              setShowSuccessModal(true);
            }
          }}
        />
      )}

      <div className="col-span-2 bg-linear-to-b from-[#1D2215] to-[#121412] py-3.5 px-6 rounded-t-lg">
        <div className="flex items-start gap-10 md:gap-24">
          <div className="w-full max-w-[300px] space-y-2">
            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Strategy</p>
              <p className="text-[#D6D6D6] font-bold">
                STX
                {strategy.replace("-", " ")}
              </p>
            </div>

            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Exercising</p>
              <p className="text-[#D6D6D6] font-bold flex items-center gap-2">
                {(() => {
                  switch (strategy) {
                    case "CALL":
                    case "PUT":
                      return "Automatic";
                    case "STRAP":
                    case "STRIP":
                      return "Manual";
                    case "Bull Call Spread":
                    case "Bull Put Spread":
                    case "Bear Put Spread":
                    case "Bear Call Spread":
                      return "Automatic";
                    default:
                      return "Manual";
                  }
                })()}
              </p>
            </div>

            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Liquidation</p>
              <p className="text-[#D6D6D6] font-bold">
                {(() => {
                  switch (strategy) {
                    case "CALL":
                    case "PUT":
                      return "At Expiry";
                    case "STRAP":
                    case "STRIP":
                      return "Manual";
                    case "Bull Call Spread":
                    case "Bull Put Spread":
                    case "Bear Put Spread":
                    case "Bear Call Spread":
                      return "At Expiry";
                    default:
                      return "None";
                  }
                })()}
              </p>
            </div>
          </div>

          <div className="w-full max-w-[300px] space-y-2">
            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Profit Zone</p>
              <p className="text-[#D6D6D6] font-bold">
                {">"}
                {isFetching ? "..." : "$3,257"}
              </p>
            </div>

            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Max. Loss Zone</p>
              <p className="text-[#D6D6D6] font-bold flex items-center gap-2">
                {"<"}$3,130
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1D2215] h-full rounded-lg py-3.5 px-6 gap-4 flex flex-col">
        <div>
          <div className="flex items-center justify-between *:text-xs *:text-[#D6D6D6]">
            <p>Total Cost</p>
            <p className="flex items-center gap-2 font-bold">
              <Icons.USDC /> {selectedPremium} USDC.e
            </p>
          </div>

          <div className="flex items-center justify-between *:text-xs *:text-[#D6D6D6]">
            <p>Your Balance</p>
            <p className="flex items-center gap-2 font-bold">
              <Icons.USDC /> {usdcBalance ? usdcBalance.toFixed(8) : "0.00"}{" "}
              sBTC
            </p>
          </div>

          <div className="flex items-center justify-between *:text-xs *:text-[#D6D6D6]">
            <p>Platform Fee (0.1%)</p>
            <p className="flex items-center gap-2 font-bold">
              <Icons.USDC /> {(parseFloat(selectedPremium) * 0.001).toFixed(8)}{" "}
              sBTC
            </p>
          </div>
        </div>

        <div className="w-full">
          {/* <CustomConnectButton
            onclick={callStrategy}
            // disabled={!walletAddress}
          /> */}

          <Button onClick={callStrategy}>Buy strategy</Button>
        </div>
      </div>
    </>
  );
}
