import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, GraduationCap, RotateCcw, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LAB_META, STEPS, stepIndex } from '../../guide/curriculum';
import { AssistStyle } from '../../guide/assist';
import { emitGuide } from '../../guide/events';
import { formatHash, parseHash } from '../../guide/hash';
import { ClassroomToolbar } from '../ClassroomToolbar';

function assistOn(assist: AssistStyle, part: 'arrow' | 'highlighter' | 'blinker' | 'spotlight') {
  return assist === 'all' || assist === part;
}

interface GuideApi {
  stepId: string;
  index: number;
  isTeacher: boolean;
}

const GuideCtx = createContext<GuideApi>({ stepId: STEPS[0].id, index: 0, isTeacher: false });
export const useGuide = () => useContext(GuideCtx);

function visibleCoach(id: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-coach="${id}"]`);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) return el;
  }
  return null;
}

function findCoach(ids: string[]): HTMLElement | null {
  const back = visibleCoach('switch-to-fusion');
  if (back) return back;
  for (const id of ids) {
    const el = visibleCoach(id);
    if (el) return el;
  }
  return visibleCoach('guide-next');
}

function sameBox<T extends Record<string, number>>(prev: T | null, next: T) {
  if (!prev) return false;
  return Object.keys(next).every((key) => Math.abs(prev[key] - next[key]) < 1);
}

const PRESENTER_KEY = 'oracle_fusion_presenter';
const WIDE_QUERY = '(min-width: 1100px)';

export const GuideProvider: React.FC<{
  children: React.ReactNode;
  fontScale: string;
  onFont: (value: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
  assist: AssistStyle;
  onAssist: (value: AssistStyle) => void;
}> = ({ children, fontScale, onFont, dark, onToggleTheme, assist, onAssist }) => {
  const { isSignedIn, currentUser, navigate, currentRoute, selectedId, resetDemoData } = useERP();
  const [index, setIndex] = useState(() => stepIndex(parseHash()?.stepId));
  const [phase, setPhase] = useState<'act' | 'bubble'>('act');
  const [freeExplore, setFreeExplore] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [wide, setWide] = useState(true);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [calloutPos, setCalloutPos] = useState<{ top: number; left: number; maxWidth: number; maxHeight: number } | null>(null);
  const [stage, setStage] = useState({ left: 0, width: 0, top: 0, barTop: 0 });
  const lessonRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const presenterRef = useRef<HTMLElement>(null);
  const step = STEPS[index];
  const isTeacher = !!currentUser.isTeacher;

  useEffect(() => {
    if (!isTeacher) {
      setTeacherOpen(false);
      setFreeExplore(false);
      return;
    }
    setTeacherOpen(localStorage.getItem(PRESENTER_KEY) !== 'closed');
  }, [isTeacher, currentUser.email]);

  useLayoutEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const setPresenter = (open: boolean) => {
    setTeacherOpen(open);
    if (isTeacher) localStorage.setItem(PRESENTER_KEY, open ? 'open' : 'closed');
  };

  useEffect(() => {
    const onReset = () => {
      setIndex(0);
      setPhase('act');
    };
    window.addEventListener('fusion-guide-reset', onReset);
    return () => window.removeEventListener('fusion-guide-reset', onReset);
  }, []);

  useEffect(() => {
    const onEvt = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (name === step.completeOn) setPhase('bubble');
    };
    window.addEventListener('fusion-guide', onEvt as EventListener);
    return () => window.removeEventListener('fusion-guide', onEvt as EventListener);
  }, [step.completeOn, index]);

  useEffect(() => {
    if (step.completeOn.startsWith('role-') && currentUser.roleId === step.completeOn.slice(5)) {
      setPhase('bubble');
    }
  }, [index, currentUser.roleId, step.completeOn]);

  useEffect(() => {
    if (!teacherOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresenter(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [teacherOpen, isTeacher]);

  useLayoutEffect(() => {
    if (!isSignedIn) return;
    const place = () => {
      const el = findCoach(step.coach);
      const id = el?.getAttribute('data-coach') ?? null;
      setTargetId((prev) => (prev === id ? prev : id));
      if (!el) {
        setRect(null);
      } else {
        const lessonBottom = lessonRef.current?.getBoundingClientRect().bottom ?? 0;
        const barTop = bottomBarRef.current?.getBoundingClientRect().top ?? window.innerHeight;
        const r = el.getBoundingClientRect();
        const inView = r.top >= lessonBottom - 1 && r.bottom <= barTop - 1 && r.left >= 0 && r.right <= window.innerWidth;
        if (!inView) el.scrollIntoView({ block: 'center', inline: 'nearest' });
        setRect(el.getBoundingClientRect());
      }

      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const column = columnRef.current?.getBoundingClientRect();
      const boundsLeft = Math.max(8, column?.left ?? 8);
      const boundsRight = Math.max(boundsLeft + 160, (column?.right ?? window.innerWidth) - 8);
      const barTop = bottomBarRef.current?.getBoundingClientRect().top ?? window.innerHeight;
      const margin = 8;
      const nextStage = { left: column?.left ?? 0, width: column?.width ?? window.innerWidth, top: column?.top ?? 0, barTop };
      setStage((prev) => (sameBox(prev, nextStage) ? prev : nextStage));

      const card = calloutRef.current;
      const target = el?.getBoundingClientRect();
      if (card && phase === 'act' && assist !== 'off') {
        const notes = presenterRef.current?.getBoundingClientRect();
        const notesInColumn = !!notes && notes.width > 2 && notes.left < boundsRight - 12 && notes.right > boundsLeft + 12;
        const roomTop = notesInColumn ? notes!.bottom + margin : margin;
        const gap = barTop - margin - roomTop;
        const available = Math.max(72, gap);
        const maxWidth = Math.max(160, Math.min(boundsRight - boundsLeft, 24 * rootPx));
        card.style.maxWidth = `${maxWidth}px`;
        card.style.maxHeight = `${available}px`;
        const height = Math.max(card.offsetHeight, 110);
        const fittedHeight = Math.min(height, available);
        const width = Math.min(Math.max(card.offsetWidth, 180), maxWidth);
        const targetInBar = !!target && target.bottom > barTop - 4;
        let left = boundsLeft;
        let top = Math.max(roomTop, barTop - margin - fittedHeight);
        if (target && !targetInBar) {
          const besideLeft = target.left - margin - width;
          const above = target.top - margin - fittedHeight;
          const fitsBesideLeft = besideLeft >= boundsLeft && above >= roomTop && target.bottom <= barTop - margin;
          const fitsBesideRight = target.right + margin + width <= boundsRight && target.top >= roomTop && target.top + fittedHeight <= barTop - margin;
          if (fitsBesideLeft) {
            left = besideLeft;
            top = Math.min(Math.max(roomTop, target.top), barTop - margin - fittedHeight);
          } else if (fitsBesideRight) {
            left = target.right + margin;
            top = Math.max(roomTop, Math.min(target.top, barTop - margin - fittedHeight));
          } else {
            left = Math.min(Math.max(boundsLeft, target.left), Math.max(boundsLeft, boundsRight - width));
          }
        } else if (targetInBar && target) {
          const leftOfButton = target.left - margin - width;
          left = leftOfButton >= boundsLeft ? leftOfButton : boundsLeft;
        }
        if (left + width > boundsRight) left = Math.max(boundsLeft, boundsRight - width);
        if (top + fittedHeight > barTop - margin) top = Math.max(roomTop, barTop - margin - fittedHeight);
        const nextCallout = { top, left, maxWidth: width, maxHeight: available };
        setCalloutPos((prev) => (sameBox(prev, nextCallout) ? prev : nextCallout));
      }
    };
    place();
    const iv = window.setInterval(place, 500);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      clearInterval(iv);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [index, phase, isSignedIn, currentRoute, step.coach, teacherOpen, assist]);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    const target = STEPS[next];
    setIndex(next);
    setPhase('act');
    window.dispatchEvent(new Event('fusion-close-overlays'));
    const parsed = parseHash();
    if (freeExplore && isTeacher) {
      history.replaceState(null, '', formatHash(parsed?.route || target.route, parsed?.id, target.id));
      return;
    }
    const keepId = parsed?.route === target.route ? parsed?.id ?? selectedId : null;
    navigate(target.route, keepId);
    history.replaceState(null, '', formatHash(target.route, keepId, target.id));
  };

  if (!isSignedIn) {
    return <GuideCtx.Provider value={{ stepId: step.id, index, isTeacher: false }}>{children}</GuideCtx.Provider>;
  }

  const moduleSteps = STEPS.filter((s) => s.moduleId === step.moduleId);
  const modulePos = moduleSteps.findIndex((s) => s.id === step.id) + 1;
  const labPos = LAB_META.findIndex((m) => m.id === step.moduleId) + 1;
  const coachCopy = targetId === 'switch-to-fusion'
    ? 'This is the older EBS screen. Press Switch to Oracle Fusion Cloud UI to come back to the lesson.'
    : step.coachText;

  const lessonBar = (
      <div ref={lessonRef} className="sticky top-0 z-40 border-b border-sky-700 bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[12rem] flex-1">
              <div className="text-base font-semibold text-sky-300">
                Module {labPos} of {LAB_META.length} · Step {modulePos} of {moduleSteps.length}
              </div>
              <div data-testid="step-title" data-complete={step.completeOn} data-coaches={step.coach.join(' ')} className="text-xl font-semibold leading-tight">{step.title}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ClassroomToolbar
                fontScale={fontScale}
                onFont={onFont}
                dark={dark}
                onToggleTheme={onToggleTheme}
                assist={assist}
                onAssist={onAssist}
              />
              {isTeacher && (
                <button
                  type="button"
                  aria-expanded={teacherOpen}
                  onClick={() => setPresenter(!teacherOpen)}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-lg font-semibold text-slate-950"
                >
                  <GraduationCap className="h-5 w-5" /> Presenter
                </button>
              )}
            </div>
          </div>
          <p data-testid="step-plain" className="mt-2 max-w-4xl text-lg leading-snug text-slate-100">{step.plain}</p>
        </div>
      </div>
  );

  const notes = (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-600 px-4 py-3">
        <div className="text-2xl font-semibold text-amber-300">Teacher notes</div>
        <button
          type="button"
          data-testid="presenter-close"
          aria-label="Close notes"
          onClick={() => setPresenter(false)}
          className="rounded p-1 text-slate-100 hover:bg-slate-700"
        >
          <X className="h-7 w-7" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <p className="text-xl leading-snug">{step.teacher}</p>
        <label className="block text-lg text-slate-300">
          Assist style
          <select
            data-testid="teacher-assist"
            className="mt-1 w-full rounded border border-slate-500 bg-slate-950 p-2 text-lg"
            value={assist}
            onChange={(e) => onAssist(e.target.value as AssistStyle)}
          >
            <option value="all">All combined</option>
            <option value="arrow">Animated arrow</option>
            <option value="highlighter">Highlighter</option>
            <option value="blinker">Blinker</option>
            <option value="spotlight">Spotlight</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-lg">
          <input type="checkbox" checked={freeExplore} onChange={(e) => setFreeExplore(e.target.checked)} />
          Free explore — jump without moving the class screen
        </label>
        <label className="block text-lg text-slate-300">Jump to a step</label>
        <select
          data-testid="teacher-jump"
          className="w-full rounded border border-slate-500 bg-slate-950 p-2 text-lg"
          value={step.id}
          onChange={(e) => goTo(STEPS.findIndex((s) => s.id === e.target.value))}
        >
          {LAB_META.map((lab) => (
            <optgroup key={lab.id} label={lab.label}>
              {STEPS.filter((s) => s.moduleId === lab.id).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            resetDemoData();
            goTo(0);
          }}
          className="inline-flex items-center gap-2 rounded bg-rose-700 px-3 py-2 text-lg font-semibold"
        >
          <RotateCcw className="h-5 w-5" /> Reset demo data
        </button>
        <p className="border-t border-slate-600 pt-3 text-lg leading-snug text-slate-200">
          Sign-in records name, email and role (Student or Teacher) on the sheet “Adv ITT - Oracle Fusion”.
        </p>
      </div>
    </>
  );

  const spotlightOn = phase === 'act' && !!rect && assistOn(assist, 'spotlight');
  const maskHeight = Math.max(0, stage.barTop - stage.top);

  return (
    <GuideCtx.Provider value={{ stepId: step.id, index, isTeacher }}>
      <div className="flex min-h-screen items-stretch">
        <div ref={columnRef} data-testid="lesson-column" className="min-w-0 flex-1">
          {lessonBar}
          {isTeacher && teacherOpen && !wide && (
            <aside
              ref={presenterRef}
              data-testid="presenter-panel"
              data-layout="flow"
              className="relative z-[70] mx-3 mt-3 flex max-h-[34vh] flex-col overflow-hidden rounded-lg border border-amber-300 bg-slate-900 text-slate-50 shadow-xl"
            >
              {notes}
            </aside>
          )}
          <div className="pb-28">{children}</div>
        </div>
        {isTeacher && teacherOpen && wide && (
          <aside
            ref={presenterRef}
            data-testid="presenter-panel"
            data-layout="push"
            className="sticky top-0 z-[70] flex h-screen w-[min(26rem,38vw)] shrink-0 flex-col overflow-hidden border-l border-amber-300 bg-slate-900 text-slate-50"
          >
            {notes}
          </aside>
        )}
      </div>
      {isTeacher && !teacherOpen && !wide && (
        <button
          type="button"
          data-testid="presenter-tab"
          onClick={() => setPresenter(true)}
          className="fixed bottom-28 left-3 z-[70] rounded-full bg-amber-400 px-4 py-2 text-lg font-semibold text-slate-950 shadow-lg"
        >
          Notes
        </button>
      )}
      {createPortal(
        <>
      {spotlightOn && (
        <div
          data-testid="assist-spotlight-mask"
          className="pointer-events-none fixed z-[40] overflow-hidden"
          style={{ left: stage.left, top: stage.top, width: stage.width, height: maskHeight }}
        >
          <div
            data-testid="assist-spotlight"
            className="assist-spotlight absolute"
            style={{ top: rect!.top - stage.top - 8, left: rect!.left - stage.left - 8, width: rect!.width + 16, height: rect!.height + 16 }}
          />
        </div>
      )}
      {phase === 'act' && rect && assist !== 'off' && (
        <div data-testid="assist-layer" data-assist={assist} data-target={targetId || ''} className="pointer-events-none fixed z-[100]" style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}>
          {assistOn(assist, 'highlighter') && <div data-testid="assist-highlighter" className="assist-highlighter absolute inset-0" />}
          {assistOn(assist, 'blinker') && <div data-testid="assist-blinker" className="assist-blinker absolute -inset-1" />}
          <div data-testid="coach-ring" className="absolute inset-0" />
        </div>
      )}
      {phase === 'act' && rect && assistOn(assist, 'arrow') && (
        <div
          data-testid="assist-arrow"
          className="assist-arrow pointer-events-none fixed z-[101]"
          style={{
            top: rect.left > stage.left + 96 ? rect.top + rect.height / 2 - 36 : Math.max(8, rect.top - 80),
            left: Math.max(
              stage.left + 4,
              Math.min(
                rect.left > stage.left + 96 ? rect.left - 84 : rect.left + rect.width / 2 - 36,
                stage.left + Math.max(stage.width, 80) - 76,
              ),
            ),
            ['--assist-rotate' as string]: rect.left > stage.left + 96 ? '0deg' : '90deg',
            ['--assist-dx' as string]: rect.left > stage.left + 96 ? '12px' : '0px',
            ['--assist-dy' as string]: rect.left > stage.left + 96 ? '0px' : '12px',
          }}
        >
          <svg viewBox="0 0 72 72" aria-hidden="true">
            <path d="M8 28h34L32 14l10 22L32 58l10-14H8z" fill="#fde047" stroke="#22d3ee" strokeWidth="4" />
          </svg>
        </div>
      )}
      {phase === 'act' && assist !== 'off' && (
        <div
          ref={calloutRef}
          data-testid="coach-callout"
          className="pointer-events-none fixed z-[90] rounded-lg border-2 border-amber-300 bg-slate-950 px-4 py-3 text-amber-50 shadow-2xl"
          style={{
            top: calloutPos?.top ?? 8,
            left: calloutPos?.left ?? 8,
            maxWidth: calloutPos?.maxWidth ?? 320,
            maxHeight: calloutPos?.maxHeight ?? 240,
            overflow: 'auto',
            visibility: calloutPos ? 'visible' : 'hidden',
          }}
        >
          <div className="text-base font-semibold text-amber-300">Do this</div>
          <p className="mt-1 text-lg leading-snug">{coachCopy}</p>
        </div>
      )}
        </>,
        document.body,
      )}

      {phase === 'bubble' && (
        <div
          className="fixed bottom-0 top-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          style={{ left: stage.left, width: stage.width || '100%' }}
        >
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border-2 border-amber-300 bg-slate-950 p-5 text-slate-50 shadow-2xl">
            <div className="text-base font-semibold uppercase tracking-wide text-amber-300">What just happened</div>
            <h3 className="mt-1 text-2xl font-semibold">{step.title}</h3>
            <p className="mt-3 text-lg leading-snug"><strong>What you did. </strong>{step.bubble.did}</p>
            <p className="mt-2 text-lg leading-snug"><strong>Why a business does it. </strong>{step.bubble.why}</p>
            <p className="mt-2 text-lg leading-snug"><strong>The entry. </strong>{step.bubble.entry}</p>
            <p className="mt-2 text-lg leading-snug"><strong>The CA point. </strong>{step.bubble.ca}</p>
            <button
              type="button"
              data-coach="bubble-next"
              onClick={() => (index >= STEPS.length - 1 ? setPhase('act') : goTo(index + 1))}
              className="mt-4 w-full rounded-md bg-amber-400 px-4 py-3 text-xl font-semibold text-slate-950"
            >
              Got it — Next step
            </button>
          </div>
        </div>
      )}

      <div
        ref={bottomBarRef}
        data-testid="guide-bar"
        className="fixed bottom-0 z-40 flex items-center justify-between gap-3 border-t border-sky-700 bg-slate-950 px-4 py-3 text-slate-50"
        style={{ left: stage.width ? stage.left : 0, width: stage.width || '100%' }}
      >
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-2 rounded-md bg-slate-200 px-4 py-3 text-lg font-semibold text-slate-950 disabled:opacity-40"
        >
          <ChevronLeft className="h-6 w-6" /> Previous
        </button>
        <div className="hidden text-center text-base text-slate-300 sm:block">{LAB_META.find((m) => m.id === step.moduleId)?.label}</div>
        <button
          type="button"
          data-coach="guide-next"
          onClick={() => {
            if (phase === 'act') {
              if (step.completeOn === 'next') emitGuide('next');
              setPhase('bubble');
              return;
            }
            if (index < STEPS.length - 1) goTo(index + 1);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-lg font-semibold text-slate-950"
        >
          Next <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </GuideCtx.Provider>
  );
};
