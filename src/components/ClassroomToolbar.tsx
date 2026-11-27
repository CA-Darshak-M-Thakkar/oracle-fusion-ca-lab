import React from 'react';
import { AssistFeatures, AssistStyle } from '../guide/assist';
import { AssistControls } from './AssistControls';

export const ClassroomToolbar: React.FC<{
  fontScale: string;
  onFont: (value: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
  assist: AssistStyle;
  onAssist: (value: AssistStyle) => void;
  features: AssistFeatures;
  onFeatures: (value: AssistFeatures) => void;
  assistTestId?: string;
  voiceNotice?: string;
}> = ({ fontScale, onFont, dark, onToggleTheme, assist, onAssist, features, onFeatures, assistTestId = 'assist-style', voiceNotice }) => (
  <div data-testid="classroom-toolbar" className="flex max-w-full flex-wrap items-center gap-2 text-base text-slate-100">
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
    <AssistControls
      assist={assist}
      onAssist={onAssist}
      features={features}
      onFeatures={onFeatures}
      assistTestId={assistTestId}
      voiceNotice={voiceNotice}
    />
  </div>
);
