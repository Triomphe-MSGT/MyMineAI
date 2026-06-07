import type { ReactionEmoji } from '@mymeet/shared-types';
import { cn } from '@/lib/utils';

export const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '👏', '❤️', '😂', '😮', '🎉'];

interface ReactionsPickerProps {
  open: boolean;
  onSelect: (emoji: ReactionEmoji) => void;
  onClose: () => void;
}

export function ReactionsPicker({ open, onSelect, onClose }: ReactionsPickerProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-border bg-card px-2 py-2 shadow-xl">
        <div className="flex gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md text-xl',
                'transition-transform hover:scale-110 hover:bg-secondary'
              )}
              title={`Réagir ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
