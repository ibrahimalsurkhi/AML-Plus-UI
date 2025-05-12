import { toast as sonnerToast } from "sonner"

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toast = (props: ToastProps) => {
  const { title, description, variant } = props;
  return sonnerToast(title || '', {
    description,
    className: variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : undefined
  });
};

export { toast } 