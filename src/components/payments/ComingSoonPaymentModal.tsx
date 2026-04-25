// Elegant "coming soon" modal shown when a user clicks a premium CTA
// while payments are still in coming_soon mode.

import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  planName?: string;
  showPricingLink?: boolean;
}

export function ComingSoonPaymentModal({ open, onClose, planName, showPricingLink = true }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {planName ? `${planName} presto disponibile` : "Funzione presto disponibile"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground text-center">
          <p>
            I pagamenti premium sono già predisposti nell'architettura, ma non sono ancora attivi
            in questa versione.
          </p>
          <p className="text-xs">
            Quando verranno configurati provider e link, i checkout si attiveranno automaticamente.
            Non è richiesto alcun pagamento in questa versione.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {showPricingLink && (
            <Link
              to="/pricing"
              onClick={onClose}
              className="text-center px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              Vedi i piani <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            onClick={onClose}
            className="text-center px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Continua in modalità demo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}