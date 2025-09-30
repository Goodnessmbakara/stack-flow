import { Fragment, useEffect, useState } from "react";
import { useStacksWallet } from "../../hooks/useStacksWallet";
import CustomConnectButton from "../atoms/ConnectButton";
import { axiosInstance } from "../../utils/axios";
import { MdOutlineLink } from "react-icons/md";
import { toast } from "react-toastify";
import { RiUserShared2Line } from "react-icons/ri";
import { FaRegShareFromSquare } from "react-icons/fa6";

interface Referral {
  referee_address: string;
  referralRewards: any[];
  created_at: string;
}

const Referral = () => {
  const { userData } = useStacksWallet();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await axiosInstance.post(
          `/referrals/generateCode/${userData?.address}`
        );

        const pageUrl = window.location.href;
        const referralLink = `${pageUrl.replace("referrals", "")}new?ref=${
          res.data.data.referral_code
        }`;

        setReferralCode(referralLink);

        if (!referralLink) return;

        const res2 = await axiosInstance.get(
          `/referrals/list/${res.data.data.referral_code}`
        );

        setReferrals(res2.data.data.referrals);

        console.log("res2", res2);
      } catch (error) {
        console.error("Error fetching referrals:", error);
      }
    };

    if (!userData?.address) return;

    fetchReferrals();
  }, [userData?.address]);

  return (
    <Fragment>
      <div className="bg-[#1D2215] h-fit rounded-lg py-4 sm:py-7 px-3 sm:px-6">
        <h1 className="font-semibold text-white border-b border-b-[#666666] pb-[1rem] text-[1rem] sm:text-[1.2rem] flex items-center gap-3">
          <FaRegShareFromSquare className="text-[1.2rem]" /> Share & Earn
        </h1>

        <div className="mt-[1rem] flex gap-[.5rem] flex-col">
          <h2 className="text-white flex flex-col sm:flex-row text-[1rem] sm:text-[1.2rem] gap-3 items-start sm:items-center">
            Your Referral link:{" "}
            {referralCode && (
              <span
                className="bg-[#0e1a01a8] w-full sm:w-auto flex items-center sm:justify-center gap-2 bg-[#080e01a8] py-2 px-4 rounded-md text-[#82e01ea8] overflow-hidden text-ellipsis cursor-pointer hover:opacity-80"
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  toast.success("Copied text to clipboard");
                }}
              >
                <MdOutlineLink className="text-[1.5rem] min-w-[1.5rem]" />
                <span className="overflow-hidden text-ellipsis">
                  {referralCode}
                </span>
              </span>
            )}
          </h2>
          <p className="text-white text-[0.9rem] sm:text-[1rem]">
            Refer your friends and earn 50% of their commissions
          </p>

          {!userData?.address && <CustomConnectButton />}
        </div>
      </div>

      <div className="bg-[#1D2215] h-fit rounded-lg py-4 sm:py-7 px-3 sm:px-6 mt-4">
        <h1 className="font-semibold text-white pb-[1rem] text-[1rem] sm:text-[1.2rem] flex items-center gap-3">
          <RiUserShared2Line className="text-[1.2rem]" />
          {referrals.length > 0 ? "Your Referrals" : "No Referrals"}
        </h1>

        {referrals.length > 0 && (
          <div className="gap-4">
            {referrals.map((referral, index) => (
              <div
                key={index}
                className="flex bg-[#0e1a01a8] p-4 rounded-lg justify-between flex-col md:flex-row flex justify-between gap-4"
              >
                <div className="flex flex-col">
                  <span className="text-white text-sm">Referred Address</span>
                  <span className="text-[#82e01ea8] font-medium truncate">
                    {referral.referee_address}
                  </span>
                  <span className="text-gray-400 text-xs">
                    Joined {new Date(referral.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col ">
                  <span className="text-white text-sm">Commission Earned</span>
                  <span className="text-[#82e01ea8] font-medium flex items-center gap-1">
                    <span>
                      {" "}
                      {referral.referralRewards.length > 0
                        ? referral.referralRewards.reduce(
                            (prev, curr) => prev + parseFloat(curr.amount),
                            0
                          )
                        : 0}
                    </span>
                    <span>USDC.e</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default Referral;
