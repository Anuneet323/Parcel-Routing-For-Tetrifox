import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * BootLoader — full-screen boot-checklist splash for the Parcel Routing console.
 *
 * Angle: SYSTEM CHECK. A compact stack of monospace boot lines resolves
 * top-to-bottom inside a rounded bone card. Each row flips from a pulsing amber
 * status dot to a small green check (success #2b9a66) as its subsystem reports
 * "ok" — "rule registry … ok", "predicate engine … ok", "departments … ok".
 * Brand stamp + wordmark sit above; the orange stamp is the single dominant
 * orange element (rows resolve to green, never orange) to honor scarcity.
 *
 * Self-contained: all motion via framer-motion. No index.css additions required.
 * The parent (App.jsx) owns the AnimatePresence fade/scale exit + unmount timing.
 */

const BOOT_STEPS = [
  { id: 'registry', label: 'rule registry' },
  { id: 'predicate', label: 'predicate engine' },
  { id: 'departments', label: 'departments' },
];

// Cadence: rows resolve in sequence, finishing comfortably inside the parent's
// ~1100ms minimum visible window.
const FIRST_RESOLVE_MS = 320;
const STEP_STRIDE_MS = 250;

const SUCCESS = '#2b9a66';
const PENDING_AMBER = '#c9a227';

/**
 * Routing-fork mark: one input line splits to three department nodes.
 * White on the orange stamp — matches the favicon / brand language.
 */
function RoutingForkMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="Parcel Routing"
    >
      <path d="M4 14H11" stroke="#fcfcfc" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M11 14H15M15 14L21 7M15 14L21 14M15 14L21 21"
        stroke="#fcfcfc"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="7" r="1.7" fill="#fcfcfc" />
      <circle cx="22.5" cy="14" r="1.7" fill="#fcfcfc" />
      <circle cx="22.5" cy="21" r="1.7" fill="#fcfcfc" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="11"
      height="11"
      fill="none"
      stroke="#ffffff"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.2 4.5L19 6.5" />
    </svg>
  );
}

function BootRow({ step, done, reduceMotion, index }) {
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : 0.12 + index * 0.07,
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="flex items-center gap-3 py-1.5"
    >
      {/* Status node: pulsing amber dot -> green check chip */}
      <span className="relative grid h-4 w-4 shrink-0 place-items-center">
        <motion.span
          aria-hidden="true"
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: PENDING_AMBER }}
          animate={
            done || reduceMotion
              ? { opacity: 0, scale: 0.5 }
              : { opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }
          }
          transition={
            done || reduceMotion
              ? { duration: 0.18 }
              : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
          }
        />
        <motion.span
          aria-hidden="true"
          className="grid h-4 w-4 place-items-center rounded-full"
          style={{ backgroundColor: SUCCESS }}
          initial={false}
          animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <CheckGlyph />
        </motion.span>
      </span>

      {/* Subsystem label */}
      <span className="font-mono text-[13px] tracking-tight text-body">
        {step.label}
      </span>

      {/* Dotted leader */}
      <span
        aria-hidden="true"
        className="mb-[5px] h-px min-w-3 flex-1 self-end"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(32,32,32,0.22) 0 2px, transparent 2px 6px)',
        }}
      />

      {/* Status word */}
      <motion.span
        className="tnum font-mono text-[12px] tracking-tight"
        animate={{ color: done ? SUCCESS : '#8d8d8d' }}
        transition={{ duration: reduceMotion ? 0 : 0.26 }}
      >
        {done ? 'ok' : '····'}
      </motion.span>
    </motion.li>
  );
}

export default function BootLoader() {
  const reduceMotion = useReducedMotion();
  const [doneCount, setDoneCount] = useState(reduceMotion ? BOOT_STEPS.length : 0);

  // Drive the checklist resolution. Under reduced motion every row is already
  // resolved (calm static "ready" state) so the timers are skipped.
  useEffect(() => {
    if (reduceMotion) return undefined;
    const timers = BOOT_STEPS.map((_, i) =>
      setTimeout(
        () => setDoneCount((c) => Math.max(c, i + 1)),
        FIRST_RESOLVE_MS + i * STEP_STRIDE_MS
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const allDone = doneCount >= BOOT_STEPS.length;
  const statusText = allDone
    ? 'All subsystems ready'
    : `Bringing subsystems online — ${doneCount} of ${BOOT_STEPS.length}`;

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-canvas px-6"
      role="status"
      aria-live="polite"
      aria-busy={!allDone}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-[340px] flex-col items-center"
      >
        {/* Brand stamp + wordmark — the single dominant orange element */}
        <div className="flex items-center gap-3">
          <motion.span
            className="grid h-11 w-11 place-items-center rounded-lg bg-primary"
            initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <RoutingForkMark />
          </motion.span>
          <span className="flex flex-col leading-none">
            <span className="font-sans text-[17px] font-semibold tracking-tight text-ink">
              Parcel Routing
            </span>
            <span className="eyebrow mt-1.5">Rule engine console</span>
          </span>
        </div>

        {/* Boot checklist card */}
        <div className="card-lg mt-7 w-full bg-bone px-5 py-4">
          <ul className="flex flex-col">
            {BOOT_STEPS.map((step, i) => (
              <BootRow
                key={step.id}
                step={step}
                index={i}
                done={i < doneCount}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </ul>
        </div>

        {/* Eyebrow status line */}
        <div className="mt-5 flex items-center gap-2">
          <motion.span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: allDone ? SUCCESS : '#bbbbbb' }}
            animate={
              allDone || reduceMotion ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }
            }
            transition={
              allDone || reduceMotion
                ? { duration: 0.2 }
                : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
            }
          />
          <motion.span
            key={statusText}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="eyebrow"
          >
            {statusText}
          </motion.span>
        </div>
      </motion.div>

      {/* Screen-reader-only authoritative status */}
      <span className="sr-only">
        {allDone
          ? 'Parcel Routing console ready. Loading complete.'
          : 'Starting Parcel Routing console. Initializing rule registry, predicate engine and departments.'}
      </span>
    </div>
  );
}
