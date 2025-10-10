import { useState, useEffect } from "react";
import CustomConnectButton from "../atoms/ConnectButton";
import { Icons } from "../ui/icons";
import { useAppContext } from "../../context/AppContext";
import ConfirmModal from "../molecules/ConfirmModal";
import SuccessModal from "../molecules/SuccessModal";
import { TransactionStatus } from "../molecules/TransactionStatus";
import { toast } from "react-toastify";
// import { axiosInstance } from "../../utils/axios";
import { useWallet } from "../../context/WalletContext";
import { useTokenService } from "../../services/tokenService";

export function TradeSummary() {
  // const [userBalance, setUserBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "failed">("pending");
  const [explorerUrl, setExplorerUrl] = useState<string>("");

  const { state } = useAppContext();
  const { asset, strategy, isFetching, selectedPremium, period, amount } =
    state;

  const { address } = useWallet();
  const tokenService = useTokenService();

  // Fetch real token balance (sBTC primary, STX fallback)
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!address) {
        setUsdcBalance(0);
        return;
      }

      try {
        // Get primary trading balance (sBTC or STX)
        const primaryBalance = await tokenService.getPrimaryBalance();
        setUsdcBalance(primaryBalance);
        
        console.log('Primary trading balance:', primaryBalance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setUsdcBalance(0);
      }
    };

    fetchTokenBalance();
  }, [address, tokenService]);

  // const handleBalanceChange = (balance: number) => {
  //   setUserBalance(balance);
  // };

  const callStrategy = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setShowConfirmModal(true);
      
      // Import transaction manager
      const { createOption, monitorTransaction, getExplorerUrl } = await import(
        "../../blockchain/stacks/transactionManager"
      );
      
      // Map strategy name to type
      const strategyMap: Record<string, 'CALL' | 'STRAP' | 'BCSP' | 'BPSP' | 'PUT' | 'STRIP' | 'BEPS' | 'BECS'> = {
        'CALL': 'CALL',
        'Call': 'CALL',
        'STRAP': 'STRAP',
        'Strap': 'STRAP',
        'Bull Call Spread': 'BCSP',
        'Bull Put Spread': 'BPSP',
        'PUT': 'PUT',
        'Put': 'PUT',
        'STRIP': 'STRIP',
        'Strip': 'STRIP',
        'Bear Put Spread': 'BEPS',
        'Bear Call Spread': 'BECS',
      };
      
      const mappedStrategy = strategyMap[strategy] || 'CALL';
      
      // Debug logging
      console.log('Transaction parameters:', {
        strategy: mappedStrategy,
        amount: parseFloat(amount),
        strikePrice: state.assetPrice,
        premium: parseFloat(selectedPremium),
        period: parseFloat(period),
        amountString: amount,
        assetPrice: state.assetPrice
      });

      // Validate parameters
      if (parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        return;
      }

      if (state.assetPrice <= 0) {
        toast.error("Asset price not loaded. Please wait and try again.");
        return;
      }

      if (parseFloat(selectedPremium) <= 0) {
        toast.error("Please select a valid premium");
        return;
      }

      // Create option on blockchain
        await createOption({
        strategy: mappedStrategy,
        amount: parseFloat(amount),
        strikePrice: state.assetPrice,
        premium: parseFloat(selectedPremium),
        period: parseFloat(period),
        userAddress: address,
        onFinish: async (data) => {
          console.log("✓ Transaction broadcast:", data.txId);
          setTxHash(data.txId);
          setShowConfirmModal(false);
          setShowTransactionStatus(true);
          setTxStatus("pending");
          setExplorerUrl(getExplorerUrl(data.txId));
          
          // Monitor transaction
          const confirmed = await monitorTransaction(
            data.txId,
            (status, details) => {
              console.log("Transaction status update:", status, details);
              
              if (status === "confirmed") {
                setTxStatus("success");
                toast.success(`Transaction confirmed! Block: ${details?.blockHeight}`);
              } else if (status === "failed") {
                setTxStatus("failed");
                toast.error(`Transaction failed: ${details?.reason || 'Unknown error'}`);
              } else {
                // Update pending status with progress info
                console.log(`Transaction pending... (${details?.attempts}/${details?.maxAttempts})`);
              }
            }
          );
          
          if (confirmed) {
            setTxStatus("success");
            
            // TODO: Implement on-chain referral rewards via smart contract
            // For now, referrals are tracked on-chain via transaction events
            console.log('Trade successful! TX:', data.txId);
          } else {
            setTxStatus("failed");
          }
        },
        onCancel: () => {
          setShowConfirmModal(false);
          toast.info("Transaction cancelled");
        },
      });
      
      // createOption returns void and uses callbacks
      // Success/failure is handled in onFinish/onCancel callbacks
    } catch (error) {
      console.error("Transaction failed:", error);
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
      <div className="col-span-2 bg-gradient-to-b from-[#1D2215] to-[#121412] py-3.5 px-6 rounded-t-lg">
        <div className="flex items-start gap-10 md:gap-24">
          <div className="w-full max-w-[300px] space-y-2">
            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Strategy</p>
              <p className="text-[#D6D6D6] font-bold">
                {asset} {strategy.replace("-", " ")}
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

      <div className="bg-[#1D2215] h-full rounded-lg py-3.5 px-6 gap-4 flex flex-col ">
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
              <Icons.USDC /> {usdcBalance ? usdcBalance.toFixed(8) : "0.00"} sBTC
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
          <CustomConnectButton
            onclick={callStrategy}
            // onBalanceChange={handleBalanceChange}
          />
        </div>
      </div>
    </>
  );
}
