import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";

interface CaptchaGateProps {
  onVerified: () => void;
}

export function CaptchaGate({ onVerified }: CaptchaGateProps) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      toast.error("reCAPTCHA ainda nao carregou. Tente novamente.");
      return;
    }

    setIsVerifying(true);
    try {
      const token = await executeRecaptcha("booking");

      if (token) {
        onVerified();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  }, [executeRecaptcha, onVerified]);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <ShieldCheck className="h-12 w-12 text-primary" />
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Para continuar com o agendamento, clique no botao abaixo para verificar
        que voce nao e um robo.
      </p>

      <Button
        className="w-full max-w-xs font-bold uppercase tracking-wider"
        disabled={isVerifying || !executeRecaptcha}
        onClick={handleVerify}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </div>
  );
}
