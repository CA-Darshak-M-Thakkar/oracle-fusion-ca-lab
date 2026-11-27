import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AssistFeatures } from '../../guide/assist';
import { GUJARATI_PLAIN } from '../../guide/gujarati';

type Point = { x: number; y: number };

function prefersStill() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const AssistExtras: React.FC<{
  show: boolean;
  features: AssistFeatures;
  rect: DOMRect | null;
  targetId: string | null;
  stepIndex: number;
  stepTotal: number;
  stepId: string;
  plain: string;
  dismissed: boolean;
  onVoiceNotice: (text: string) => void;
}> = ({ show, features, rect, targetId, stepIndex, stepTotal, stepId, plain, dismissed, onVoiceNotice }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [geom, setGeom] = useState<{ start: Point; end: Point; label: string } | null>(null);

  useLayoutEffect(() => {
    if (!show || !rect) {
      setGeom(null);
      return;
    }
    const measure = () => {
      const bubble = document.querySelector('[data-testid="coach-callout"]');
      const box = bubble?.getBoundingClientRect();
      const start = box && box.width > 2
        ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
        : { x: Math.max(48, rect.left), y: Math.max(80, rect.top - 120) };
      const end = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const node = targetId ? document.querySelector(`[data-coach="${targetId}"]`) : null;
      const label = (node?.textContent || 'Next').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Next';
      setGeom({ start, end, label });
    };
    measure();
    const iv = window.setInterval(measure, 400);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearInterval(iv);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [show, rect, targetId, stepIndex, stepId]);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = prefersStill() ? '0' : `${len}`;
  }, [geom, dismissed, features.longArrow]);

  useEffect(() => {
    if (!show || !features.voice) {
      try { window.speechSynthesis?.cancel(); } catch { /* some browsers block speech */ }
      onVoiceNotice('');
      return;
    }
    const speak = () => {
      window.speechSynthesis.cancel();
      const gujarati = GUJARATI_PLAIN[stepId];
      const voices = window.speechSynthesis.getVoices();
      const guVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('gu'));
      const utter = new SpeechSynthesisUtterance(plain);
      utter.lang = 'en-IN';
      if (features.voiceLang === 'gu') {
        if (guVoice && gujarati) {
          try { utter.voice = guVoice; } catch { /* test doubles are plain objects */ }
          utter.lang = 'gu-IN';
          utter.text = gujarati;
          onVoiceNotice('');
        } else {
          utter.lang = 'en-IN';
          utter.text = plain;
          onVoiceNotice('Gujarati voice is not on this computer. Reading this step in English.');
        }
      } else {
        const enVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));
        if (enVoice) {
          try { utter.voice = enVoice; } catch { /* test doubles are plain objects */ }
        }
        onVoiceNotice('');
      }
      try { window.speechSynthesis.speak(utter); } catch { /* ignore autoplay limits */ }
    };
    if (!window.speechSynthesis) {
      onVoiceNotice('This browser cannot read aloud.');
      return;
    }
    speak();
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', speak);
    }
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', speak);
      window.speechSynthesis.cancel();
    };
  }, [show, features.voice, features.voiceLang, stepId, plain, stepIndex, onVoiceNotice]);

  if (!show || !rect || !geom || !targetId) return null;
  const { start, end } = geom;
  const bend = Math.min(start.y, end.y) - 70;
  const path = `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${bend} ${end.x} ${end.y}`;
  const countLeft = Math.max(8, Math.min(end.x - 70, window.innerWidth - 180));
  const countTop = Math.max(8, rect.top - 48);
  const magLeft = Math.max(8, Math.min(rect.right + 12, window.innerWidth - 240));
  const magTop = Math.max(8, rect.top - 8);

  return (
    <>
      {features.dim && (
        <div
          data-testid="assist-dim"
          className="pointer-events-none fixed z-[46] overflow-hidden"
          style={{
            left: document.querySelector('[data-testid="lesson-column"]')?.getBoundingClientRect().left ?? 0,
            top: 0,
            width: document.querySelector('[data-testid="lesson-column"]')?.getBoundingClientRect().width || window.innerWidth,
            height: window.innerHeight,
          }}
        >
          <div
            data-testid="assist-dim-hole"
            className="assist-dim-hole absolute"
            style={{ top: rect.top - 12, left: rect.left - (document.querySelector('[data-testid="lesson-column"]')?.getBoundingClientRect().left ?? 0) - 12, width: rect.width + 24, height: rect.height + 24 }}
          />
        </div>
      )}
      {features.longArrow && !dismissed && (
        <svg data-testid="assist-long-arrow" className="pointer-events-none fixed left-0 top-0 z-[102]" width={window.innerWidth} height={window.innerHeight} aria-hidden="true">
          <path
            ref={pathRef}
            data-testid="assist-long-arrow-path"
            d={path}
            fill="none"
            stroke="#fde047"
            strokeWidth="8"
            strokeLinecap="round"
            className="assist-long-arrow-path"
          />
          <circle data-testid="assist-long-arrow-end" cx={end.x} cy={end.y} r="7" fill="#22d3ee" stroke="#fde047" strokeWidth="4" />
        </svg>
      )}
      {features.hand && !dismissed && (
        <div
          data-testid="assist-hand"
          className="assist-hand pointer-events-none fixed z-[103] text-5xl"
          style={{
            ['--hand-x1' as string]: `${start.x}px`,
            ['--hand-y1' as string]: `${start.y}px`,
            ['--hand-x2' as string]: `${end.x}px`,
            ['--hand-y2' as string]: `${end.y}px`,
          }}
          aria-hidden="true"
        >
          <span className="assist-hand-glyph">👆</span>
        </div>
      )}
      {features.counter && (
        <div
          data-testid="assist-step-count"
          data-step={stepIndex + 1}
          data-total={stepTotal}
          className="pointer-events-none fixed z-[104] rounded-md bg-yellow-300 px-3 py-1 text-xl font-bold text-slate-950 shadow-lg"
          style={{ left: countLeft, top: countTop }}
        >
          Step {stepIndex + 1} of {stepTotal}
        </div>
      )}
      {features.magnifier && (
        <div
          data-testid="assist-magnifier"
          className="pointer-events-none fixed z-[99] max-w-[16rem] rounded-xl border-4 border-cyan-300 bg-slate-950 px-4 py-3 text-amber-50 shadow-2xl"
          style={{ left: magLeft, top: magTop, fontSize: '2rem', lineHeight: 1.15 }}
        >
          {geom.label}
        </div>
      )}
    </>
  );
};
