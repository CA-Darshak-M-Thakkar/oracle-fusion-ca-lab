/**
 * Local test sign-in only. Vite sets DEV to false in production builds, so this
 * stays off on GitHub Pages even if the variable is present in the shell.
 */
export const e2eBypassEnabled =
  import.meta.env.DEV === true && import.meta.env.VITE_E2E_BYPASS === '1';
