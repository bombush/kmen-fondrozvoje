// This file will just re-export from the toast library you're using
// For simplicity, let's use sonner
import { toast } from "sonner"

export const useToast = () => {
  return { 
    toast: (props: { title?: string; description?: string; variant?: string }) => {
      if (props.variant === "destructive") {
        return toast.error(props.title, {
          description: props.description
        });
      }
      return toast.success(props.title, {
        description: props.description
      });
    }
  }
} 