import React from 'react';
import { ASSIST_STYLES, AssistStyle } from '../guide/assist';

export const ClassroomToolbar: React.FC<{
  fontScale: string;
  onFont: (value: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
  assist: AssistStyle;
  onAssist: (value: AssistStyle) => void;
  assistTestId?: string;
}> = ({ fontScale, onFont, dark, onToggleTheme, assist, onAssist, assistTestId = 'assist-style' }) => (
  <div data-testid="classroom-toolbar" className="flex flex-wrap items-center gap-2 text-base text-slate-100">
    <label>
      Text
      <select
        data-testid="font-size"
        className="ml-2 rounded bg-slate-800 px-2 py-2 text-lg text-slate-50"
        value={fontScale}
        onChange={(e) => onFont(e.target.value)}
      >
        <option value="100">100%</option>
        <option value="125">125%</option>
        <option value="150">150%</option>
      </select>
    </label>
    <button type="button" data-testid="theme-toggle" className="rounded bg-slate-700 px-3 py-2 text-lg" onClick={onToggleTheme}>
      {dark ? 'Light theme' : 'Dark theme'}
    </button>
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
  </div>
);
