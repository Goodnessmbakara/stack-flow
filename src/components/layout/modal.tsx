const Modal = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed z-[100000] top-0 right-0 left-0 bottom-0 bg-[#1A1A1A] flex items-center justify-center p-3">
      {children}
    </div>
  );
};

export default Modal;
