import { lazy, Suspense } from "react";
import { SWRConfig } from "swr";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { AuthProvider } from "@/features/auth/context";
import { AppRouter } from "@/router";
import { Toaster } from "@/components/ui/sonner";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const isProduction = import.meta.env.VITE_ENV === "production";

// Only the demo build (VITE_DEMO=true) includes the banner chunk.
const DemoBanner =
  import.meta.env.VITE_DEMO === "true"
    ? lazy(() => import("./demo/DemoBanner"))
    : null;

function App() {
  const content = (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <AuthProvider>
        {DemoBanner && (
          <Suspense fallback={null}>
            <DemoBanner />
          </Suspense>
        )}
        <AppRouter />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </SWRConfig>
  );

  if (isProduction) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        {content}
      </GoogleReCaptchaProvider>
    );
  }

  return content;
}

export default App;
