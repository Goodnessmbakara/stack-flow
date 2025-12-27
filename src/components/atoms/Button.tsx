import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  variant?: "gradient" | "default";
  onclick?: () => void;
}

const Button = ({
  variant,
  children,
  className,
  onclick,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "bg-[#101210] border border-white/30 text-white px-6 py-2.5 text-[15px] rounded-full hover:bg-white/10 transition-all";
  const gradientStyles =
    "bg-[#37f741] text-black font-bold from-[#bbf737] to-[#ffee62] border-none px-6 py-2.5 text-[15px] rounded-full hover:brightness-110 transition-all shadow-[0_0_15px_rgba(55,247,65,0.4)]";

  return (
    <button
      type="button"
      onClick={onclick}
      {...props}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap gap-2 cursor-pointer",
        variant === "gradient" ? gradientStyles : baseStyles,
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;
