/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_PRODUCT_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PUBLIC_WEB_URL?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_LEGAL_PROVIDER?: string;
  readonly VITE_EXAM_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
