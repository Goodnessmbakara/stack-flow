import { useState } from "react";
import CustomConnectButton from "../atoms/ConnectButton";
import { Icons } from "../ui/icons";
import { useAppContext } from "../../context/AppContext";
import ConfirmModal from "../molecules/ConfirmModal";
import SuccessModal from "../molecules/SuccessModal";
import { TransactionStatus } from "../molecules/TransactionStatus";
import { toast } from "react-toastify";
import { axiosInstance } from "../../utils/axios";
import { useWallet } from "../../context/WalletContext";

export function TradeSummary() {
  const [userBalance, setUserBalance] = useState<number | null>(null);
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

  const handleBalanceChange = (balance: number) => {
    setUserBalance(balance);
  };

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
      const strategyMap: Record<string, 'CALL' | 'STRAP' | 'BCSP' | 'BPSP'> = {
        'CALL': 'CALL',
        'Call': 'CALL',
        'STRAP': 'STRAP',
        'Strap': 'STRAP',
        'Bull Call Spread': 'BCSP',
        'Bull Put Spread': 'BPSP',
      };
      
      const mappedStrategy = strategyMap[strategy] || 'CALL';
      
      // Create option on blockchain
      const result = await createOption({
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
            (status) => {
              console.log("Transaction status:", status);
              if (status === "confirmed") setTxStatus("success");
              else if (status === "failed") setTxStatus("failed");
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
                Manual <Icons.questionMark />
              </p>
            </div>

            <div className="flex items-center justify-between *:text-xs *:capitalize">
              <p className="text-[#7A7A7A]">Liquidation</p>
              <p className="text-[#D6D6D6] font-bold">None</p>
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
              <Icons.USDC /> {userBalance && userBalance.toFixed(2)} USDC.e
            </p>
          </div>

          <div className="flex items-center justify-between *:text-xs *:text-[#D6D6D6]">
            <p>Platform Fee (0.1%)</p>
            <p className="flex items-center gap-2 font-bold">
              <Icons.USDC /> {(parseFloat(selectedPremium) / 1000).toFixed(2)}{" "}
              USDC.e
            </p>
          </div>
        </div>
        <div className="w-full">
          <CustomConnectButton
            onclick={callStrategy}
            onBalanceChange={handleBalanceChange}
          />
        </div>
      </div>
    </>
  );
}
