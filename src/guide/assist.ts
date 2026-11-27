export const ASSIST_KEY = 'oracle_fusion_assist';

export const ASSIST_STYLES = [
  { id: 'all', label: 'All combined' },
  { id: 'arrow', label: 'Animated arrow' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'blinker', label: 'Blinker' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'off', label: 'Off' },
] as const;

export type AssistStyle = (typeof ASSIST_STYLES)[number]['id'];

export function isAssistStyle(value: string | null | undefined): value is AssistStyle {
  return ASSIST_STYLES.some((style) => style.id === value);
}

export function readAssist(): AssistStyle {
  try {
    const stored = localStorage.getItem(ASSIST_KEY);
    return isAssistStyle(stored) ? stored : 'all';
  } catch {
    return 'all';
  }
}
