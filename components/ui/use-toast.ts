// Adapted from shadcn/ui toast implementation
// https://ui.shadcn.com/docs/components/toast

import { useToast as useToastOriginal } from "@/components/ui/toast";

export { type ToastActionElement, ToastProvider } from "@/components/ui/toast";

export function useToast() {
  const { toast } = useToastOriginal();
  
  return {
    toast: ({ title, description, variant, action, ...props }: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
      action?: React.ReactNode;
      [key: string]: any;
    }) => {
      return toast({
        title,
        description,
        variant,
        action,
        ...props,
      });
    },
  };
} 