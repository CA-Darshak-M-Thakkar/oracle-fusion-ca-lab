export const ASSIST_KEY = 'oracle_fusion_assist';
export const FEATURES_KEY = 'oracle_fusion_assist_features';

export const ASSIST_STYLES = [
  { id: 'all', label: 'All combined' },
  { id: 'arrow', label: 'Animated arrow' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'blinker', label: 'Blinker' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'off', label: 'Off' },
] as const;

export type AssistStyle = (typeof ASSIST_STYLES)[number]['id'];

export type AssistFeatures = {
  longArrow: boolean;
  hand: boolean;
  feedback: boolean;
  dim: boolean;
  counter: boolean;
  voice: boolean;
  magnifier: boolean;
  voiceLang: 'en' | 'gu';
};

export const VISUAL_FEATURES = ['longArrow', 'hand', 'feedback', 'dim', 'counter', 'magnifier'] as const;

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

export function defaultFeatures(style: AssistStyle, prev?: Partial<AssistFeatures>): AssistFeatures {
  const visual = style === 'all';
  const lang = prev?.voiceLang === 'gu' ? 'gu' : 'en';
  if (style === 'off') {
    return {
      longArrow: false,
      hand: false,
      feedback: false,
      dim: false,
      counter: false,
      voice: false,
      magnifier: false,
      voiceLang: lang,
    };
  }
  return {
    longArrow: visual,
    hand: visual,
    feedback: visual,
    dim: visual,
    counter: visual,
    voice: style === 'all' ? !!prev?.voice : false,
    magnifier: visual,
    voiceLang: lang,
  };
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function readFeatures(style: AssistStyle): AssistFeatures {
  const base = defaultFeatures(style);
  try {
    const raw = localStorage.getItem(FEATURES_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AssistFeatures>;
    if (!parsed || typeof parsed !== 'object') return base;
    return {
      longArrow: flag(parsed.longArrow, base.longArrow),
      hand: flag(parsed.hand, base.hand),
      feedback: flag(parsed.feedback, base.feedback),
      dim: flag(parsed.dim, base.dim),
      counter: flag(parsed.counter, base.counter),
      voice: flag(parsed.voice, false),
      magnifier: flag(parsed.magnifier, base.magnifier),
      voiceLang: parsed.voiceLang === 'gu' ? 'gu' : 'en',
    };
  } catch {
    return base;
  }
}
