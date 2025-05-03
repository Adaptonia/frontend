import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
  "w-full font-medium py-4 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-blue-400 text-white hover:bg-blue-500",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
      },
      size: {
        default: "py-4",
        sm: "py-2 text-sm",
        lg: "py-5 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button, buttonVariants }; 