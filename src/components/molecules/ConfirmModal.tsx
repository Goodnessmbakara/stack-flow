import Modal from "../layout/modal";

const ConfirmModal = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;

  return (
    <Modal>
      <div className="flex items-center flex-col gap-3">
        <span className="relative inline-block w-[48px] h-[48px] border-[5px] border-white rounded-full box-border animate-pulse before:content-[''] before:absolute before:w-[48px] before:h-[48px] before:border-[5px] before:border-white before:rounded-full before:inline-block before:box-border before:left-1/2 before:top-1/2 before:animate-scaleUp"></span>
        <div className="text-center text-[1.2rem] text-white w-full md:w-[25rem]">
          <p>
            Confirm this transaction in your wallet app and wait a bit for it
            hash
          </p>
          <p className="font-light">
            If you like to cancel this transaction, please decline it in your
            wallet app
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
