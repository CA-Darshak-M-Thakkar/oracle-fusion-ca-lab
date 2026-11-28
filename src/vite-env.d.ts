/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_SERVER_GATE?: string;
  readonly VITE_E2E_BYPASS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
