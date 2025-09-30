import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CustomConnectButton from "../atoms/ConnectButton";
import { IoCloseOutline } from "react-icons/io5";
import { useAccount } from "wagmi";
import { axiosInstance } from "../../utils/axios";
import { toast } from "react-toastify";

const ReferralModal = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [showReferralModal, setShowReferralModal] = useState(true);
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRegisterReferral = async () => {
    if (address && referralCode && !isProcessing) {
      setIsProcessing(true);
      try {
        await axiosInstance.post("referrals/register", {
          refereeWalletAddress: address,
          referralCode,
        });

        toast.success("Referral registered successfully!");
        setShowReferralModal(false);
      } catch (error: any) {
        console.error("Error registering referral:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Failed to register referral. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (address) {
      handleRegisterReferral();
      setShowReferralModal(false);
    }
  }, [address]);

  return (
    <>
      {referralCode && showReferralModal && (
        <div className="fixed inset-0 z-[100000] bg-[#1a1a1ad3] backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#1D2215] max-w-md w-full mx-4 p-8 rounded-xl border border-[#ffffff1a] shadow-xl relative">
            <IoCloseOutline
              onClick={() => setShowReferralModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer text-[1.6rem]"
            />

            <h2 className="text-white text-2xl font-semibold mb-6">
              Welcome to Options AI
            </h2>

            <div className="space-y-6">
              <div className="text-gray-300">
                You've been referred by a community member.
                <div className="mt-2 bg-[#0e1a01a8] p-2 rounded-md">
                  Referral Code:{" "}
                  <span className="text-[#82e01ea8] font-bold">
                    {referralCode}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Connect your wallet to complete the referral process.
                </p>
                <div>
                  <CustomConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReferralModal;
