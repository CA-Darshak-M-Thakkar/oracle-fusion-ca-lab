/**
 * Google Identity Services web client ID.
 * OAuth client type: Web application. App status: In production.
 * Authorised JavaScript origins:
 *   https://ca-darshak-m-thakkar.github.io
 *   http://localhost:5173
 * Override at build time with VITE_GOOGLE_CLIENT_ID if you rotate the client.
 */
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '42173928595-0spi55tt4458pa2l7jkvaiv108u4ecqv.apps.googleusercontent.com';

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
