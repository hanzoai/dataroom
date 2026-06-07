/**
 * Stub `CancellationModal` — the commercial cancellation funnel was removed
 * with the AGPL paywall rip. We keep the component as a no-op so existing
 * call sites compile.
 */

export type CancellationModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CancellationModal(_props: CancellationModalProps) {
  return null;
}

export default CancellationModal;
