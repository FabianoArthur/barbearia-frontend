/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_ENV: string;
  /** "true" builds the backend-free demo (see src/demo). */
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
