// Screen sharing is handled via useMedia + ControlsBar.
// This component is a placeholder for future dedicated screen-share UI overlays.

export function ScreenShareIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary/90 px-4 py-1 text-sm font-medium text-primary-foreground">
      Partage d'écran actif — cochez « Partager l'audio » si proposé par le navigateur
    </div>
  );
}
