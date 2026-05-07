import { BottomSheet } from './BottomSheet';
import { NeonButton } from './NeonButton';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {description && (
        <p className="text-sm text-text-secondary mb-6">{description}</p>
      )}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`w-full rounded-full py-3 font-semibold transition-all ${
            destructive
              ? 'bg-neon-red/15 border border-neon-red/40 text-neon-red hover:bg-neon-red/25'
              : 'bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/20'
          }`}
        >
          {confirmLabel}
        </button>
        <NeonButton variant="outline" fullWidth onClick={onClose}>
          {cancelLabel}
        </NeonButton>
      </div>
    </BottomSheet>
  );
}
