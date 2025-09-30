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
    "bg-[#101210] border border-white/30 text-white px-6 py-2.5 text-[15px] rounded-md";
  const gradientStyles =
    "bg-gradient-to-r from-[#bbf737] to-[#ffee62] border-none px-6 py-2.5 text-[15px] rounded-md";

  return (
    <button
      type="button"
      onClick={onclick}
      {...props}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap gap-2",
        variant === "gradient" ? gradientStyles : baseStyles,
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;
