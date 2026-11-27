/**
 * Google Identity Services web client ID.
 * Paste the OAuth client ID here, or set VITE_GOOGLE_CLIENT_ID before `npm run build`.
 * Leave it empty to use the name + email fallback on the login screen.
 * Authorized JavaScript origin: https://ca-darshak-m-thakkar.github.io
 */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/** Emails that open Teacher mode. Students never see that panel. */
export const TEACHER_EMAILS: string[] = ['cadmthakkar@gmail.com'];

export function isTeacherEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const cleaned = email.trim().toLowerCase();
  return TEACHER_EMAILS.some((t) => t.toLowerCase() === cleaned);
}

export type ClassRole = 'Student' | 'Teacher';

export function classRoleFor(email: string | undefined | null): ClassRole {
  return isTeacherEmail(email) ? 'Teacher' : 'Student';
}
