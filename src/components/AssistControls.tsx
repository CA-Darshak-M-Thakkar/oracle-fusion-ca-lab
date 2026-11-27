import React from 'react';
import { ASSIST_STYLES, AssistFeatures, AssistStyle } from '../guide/assist';

const CHECKS: { key: keyof AssistFeatures; id: string; label: string }[] = [
  { key: 'longArrow', id: 'assist-opt-long-arrow', label: 'Long pointing arrow' },
  { key: 'hand', id: 'assist-opt-hand', label: 'Moving hand' },
  { key: 'feedback', id: 'assist-opt-feedback', label: 'Click feedback' },
  { key: 'dim', id: 'assist-opt-dim', label: 'Dim the rest' },
  { key: 'counter', id: 'assist-opt-counter', label: 'Step counter' },
  { key: 'magnifier', id: 'assist-opt-magnifier', label: 'Magnifier' },
];

export const AssistControls: React.FC<{
  assist: AssistStyle;
  onAssist: (value: AssistStyle) => void;
  features: AssistFeatures;
  onFeatures: (value: AssistFeatures) => void;
  assistTestId?: string;
  voiceNotice?: string;
}> = ({ assist, onAssist, features, onFeatures, assistTestId = 'assist-style', voiceNotice }) => (
  <div data-assist-ui data-testid="assist-controls" className="flex max-w-full flex-wrap items-center gap-2 text-base text-slate-100">
    <label>
      Assist
      <select
        data-testid={assistTestId}
        className="ml-2 rounded bg-slate-800 px-2 py-2 text-lg text-slate-50"
        value={assist}
        onChange={(e) => onAssist(e.target.value as AssistStyle)}
      >
        {ASSIST_STYLES.map((style) => (
          <option key={style.id} value={style.id}>
            {style.label}
          </option>
        ))}
      </select>
    </label>
    <details className="rounded bg-slate-800 px-2 py-1">
      <summary className="cursor-pointer px-1 py-1 text-lg">More guides</summary>
      <div className="flex max-w-xs flex-col gap-1 py-2">
        {CHECKS.map((item) => (
          <label key={item.id} className="inline-flex items-center gap-2 text-base">
            <input
              data-testid={item.id}
              type="checkbox"
              checked={!!features[item.key]}
              onChange={(e) => onFeatures({ ...features, [item.key]: e.target.checked })}
            />
            {item.label}
          </label>
        ))}
      </div>
    </details>
    <button
      type="button"
      data-testid="assist-speaker"
      aria-pressed={features.voice}
      className={`rounded px-3 py-2 text-lg font-semibold ${features.voice ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-50'}`}
      onClick={() => onFeatures({ ...features, voice: !features.voice })}
    >
      {features.voice ? 'Voice on' : 'Voice off'}
    </button>
    <label>
      Voice language
      <select
        data-testid="assist-voice-lang"
        className="ml-2 rounded bg-slate-800 px-2 py-2 text-lg text-slate-50"
        value={features.voiceLang}
        onChange={(e) => onFeatures({ ...features, voiceLang: e.target.value === 'gu' ? 'gu' : 'en' })}
      >
        <option value="en">English</option>
        <option value="gu">Gujarati</option>
      </select>
    </label>
    {voiceNotice && (
      <p data-testid="assist-voice-notice" className="max-w-xs text-base leading-snug text-amber-200">
        {voiceNotice}
      </p>
    )}
  </div>
);
