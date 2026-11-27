import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, RotateCcw } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LAB_META, STEPS, stepIndex } from '../../guide/curriculum';
import { emitGuide } from '../../guide/events';
import { formatHash, parseHash } from '../../guide/hash';

interface GuideApi {
  stepId: string;
  index: number;
  isTeacher: boolean;
}

const GuideCtx = createContext<GuideApi>({ stepId: STEPS[0].id, index: 0, isTeacher: false });
export const useGuide = () => useContext(GuideCtx);

function findCoach(ids: string[]): HTMLElement | null {
  for (const id of ids) {
    const nodes = document.querySelectorAll<HTMLElement>(`[data-coach="${id}"]`);
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.width > 2 && r.height > 2) return el;
    }
  }
  return null;
}

export const GuideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, currentUser, navigate, currentRoute, selectedId, resetDemoData } = useERP();
  const [index, setIndex] = useState(() => stepIndex(parseHash()?.stepId));
  const [phase, setPhase] = useState<'act' | 'bubble'>('act');
  const [freeExplore, setFreeExplore] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[index];
  const isTeacher = !!currentUser.isTeacher;

  useEffect(() => {
    if (isTeacher) setTeacherOpen(true);
    else {
      setTeacherOpen(false);
      setFreeExplore(false);
    }
  }, [isTeacher, currentUser.email]);

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

  useLayoutEffect(() => {
    if (!isSignedIn) return;
    const place = () => setRect(findCoach(step.coach)?.getBoundingClientRect() ?? null);
    place();
    const iv = window.setInterval(place, 500);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      clearInterval(iv);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [index, phase, isSignedIn, currentRoute, step.coach]);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    const target = STEPS[next];
    setIndex(next);
    setPhase('act');
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
  const calloutTop = rect
    ? (rect.bottom > window.innerHeight - 180 ? Math.max(8, rect.top - 130) : rect.bottom + 12)
    : 88;

  const lessonBar = (
      <div className="sticky top-0 z-40 border-b border-sky-700 bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-[200px] flex-1">
            <div className="text-base font-semibold text-sky-300">
              Module {labPos} of {LAB_META.length} · Step {modulePos} of {moduleSteps.length}
            </div>
            <div className="text-xl font-semibold leading-tight">{step.title}</div>
          </div>
          <p className="max-w-xl flex-1 text-lg leading-snug text-slate-100">{step.plain}</p>
          {isTeacher && (
            <button
              type="button"
              onClick={() => setTeacherOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-lg font-semibold text-slate-950"
            >
              <GraduationCap className="h-5 w-5" /> Presenter
            </button>
          )}
        </div>
      </div>
  );

  return (
    <GuideCtx.Provider value={{ stepId: step.id, index, isTeacher }}>
      {lessonBar}
      {children}
      {phase === 'act' && rect && (
        <div className="pointer-events-none fixed z-[60]" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}>
          <div className="coach-ring absolute inset-0 rounded-md" />
        </div>
      )}
      {phase === 'act' && (
        <div
          className="pointer-events-none fixed z-[61] max-w-sm rounded-lg border-2 border-amber-300 bg-slate-950 px-4 py-3 text-amber-50 shadow-2xl"
          style={{ top: rect ? calloutTop : 96, left: rect ? Math.min(rect.left, window.innerWidth - 360) : 24 }}
        >
          <div className="text-base font-semibold text-amber-300">Do this</div>
          <p className="mt-1 text-lg leading-snug">{step.coachText}</p>
        </div>
      )}

      {isTeacher && teacherOpen && (
        <aside className="fixed right-3 top-24 z-[65] max-h-[70vh] w-[min(420px,92vw)] overflow-auto rounded-lg border border-amber-300 bg-slate-900 p-4 text-slate-50 shadow-2xl">
          <div className="text-lg font-semibold text-amber-300">Teacher notes</div>
          <p className="mt-2 text-lg leading-snug">{step.teacher}</p>
          <label className="mt-3 flex items-center gap-2 text-lg">
            <input type="checkbox" checked={freeExplore} onChange={(e) => setFreeExplore(e.target.checked)} />
            Free explore — jump without moving the class screen
          </label>
          <label className="mt-3 block text-base text-slate-300">Jump to a step</label>
          <select
            className="mt-1 w-full rounded border border-slate-500 bg-slate-950 p-2 text-lg"
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
            className="mt-3 inline-flex items-center gap-2 rounded bg-rose-700 px-3 py-2 text-lg font-semibold"
          >
            <RotateCcw className="h-5 w-5" /> Reset demo data
          </button>
          <div className="mt-4 border-t border-slate-600 pt-3 text-base leading-snug text-slate-200">
            <div className="font-semibold text-slate-50">Attendance</div>
            <p className="mt-1">
              Sign-in sends name, email and role (Student or Teacher) to the sheet “Adv ITT - Oracle Fusion”. Mobile and ICAI numbers are not collected. The role is written in Notes.
            </p>
            <p className="mt-2">
              The live script still stores the time as text, so Today / 7 days / This month stay at 0 until you paste the updated Apps Script and redeploy that same deployment (Manage deployments → Edit → New version). The web app URL does not change.
            </p>
          </div>
        </aside>
      )}

      {phase === 'bubble' && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-xl border-2 border-amber-300 bg-slate-950 p-5 text-slate-50 shadow-2xl">
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

      <div className="fixed bottom-0 left-0 right-0 z-[70] flex items-center justify-between gap-3 border-t border-sky-700 bg-slate-950 px-4 py-3 text-slate-50">
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
