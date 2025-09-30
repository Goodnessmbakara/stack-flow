import { GiCheckMark } from "react-icons/gi";
import Modal from "../layout/modal";
import Button from "../atoms/Button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: string;
}

const SuccessModal = ({ isOpen, onClose, txHash }: SuccessModalProps) => {
  if (!isOpen) return null;

  const viewOnArbiscan = `https://arbiscan.io/tx/${txHash}`;

  return (
    <Modal>
      <div className="flex items-center flex-col gap-3">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-[5rem] h-[5rem] rounded-full bg-green-300/20 animate-pulse"></div>
          <div className="absolute w-[4rem] h-[4rem] rounded-full bg-green-400/30"></div>
          <div className="absolute w-[3rem] h-[3rem] rounded-full bg-green-500/40"></div>
          <div className="relative w-[2.5rem] h-[2.5rem] rounded-full bg-green-600 flex items-center justify-center">
            <GiCheckMark className="text-white text-[1.5rem]" />
          </div>
        </div>
        <p className="text-[1.3rem] text-white mt-4">
          Your transaction was confirmed successfully
        </p>
        <div className="flex items-center gap-3 font-bold">
          <a href={viewOnArbiscan} target="_blank" rel="noopener noreferrer">
            <Button variant="gradient">View on Arbiscan</Button>
          </a>
          <Button onClick={onClose}>Close and Continue</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SuccessModal;
