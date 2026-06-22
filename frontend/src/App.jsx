import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import BootLoader from './components/BootLoader';
import Dashboard from './pages/Dashboard';
import SingleRoute from './pages/SingleRoute';
import BatchUpload from './pages/BatchUpload';

// Boot loader is shown until BOTH document.fonts.ready resolves AND a minimum
// visible window elapses (so it never flashes). A hard fallback guarantees the
// app reveals even if fonts.ready never settles.
const BOOT_MIN_VISIBLE_MS = 1100;
const BOOT_FALLBACK_MS = 2500;

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setIsBooting(false);
    };

    const start = performance.now();
    const fontsReady =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve();

    // Reveal once fonts are ready AND the minimum window has elapsed.
    fontsReady
      .catch(() => {})
      .then(() => {
        const elapsed = performance.now() - start;
        const remaining = Math.max(0, BOOT_MIN_VISIBLE_MS - elapsed);
        minTimer = setTimeout(finish, remaining);
      });

    // Hard fallback in case fonts.ready never settles.
    let minTimer;
    const fallbackTimer = setTimeout(finish, BOOT_FALLBACK_MS);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'single':
        return <SingleRoute />;
      case 'batch':
        return <BatchUpload />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <motion.div
            key="boot-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.015, y: -6 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-100"
          >
            <BootLoader />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-dvh flex-col bg-canvas">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="py-12 sm:py-16"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto bg-deep text-on-dark">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                <span className="font-sans text-base font-semibold tracking-tight">Parcel Routing</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[rgba(252,252,252,0.62)]">
                A console for the configurable rule engine — weight, value and
                destination evaluated against an open-closed predicate registry.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3" aria-label="Footer">
              <div>
                <h2 className="eyebrow text-[rgba(252,252,252,0.5)]">Console</h2>
                <ul className="mt-4 space-y-2.5 text-sm text-[rgba(252,252,252,0.72)]">
                  <li>Dashboard</li>
                  <li>Route a parcel</li>
                  <li>Batch routing</li>
                </ul>
              </div>
              <div>
                <h2 className="eyebrow text-[rgba(252,252,252,0.5)]">Engine</h2>
                <ul className="mt-4 space-y-2.5 text-sm text-[rgba(252,252,252,0.72)]">
                  <li>Rule registry</li>
                  <li>Departments</li>
                  <li>Insurance hold</li>
                </ul>
              </div>
              <div>
                <h2 className="eyebrow text-[rgba(252,252,252,0.5)]">Resources</h2>
                <ul className="mt-4 space-y-2.5 text-sm text-[rgba(252,252,252,0.72)]">
                  <li>API reference</li>
                  <li>README</li>
                  <li>Status</li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-12 h-px w-full bg-[rgba(252,252,252,0.12)]" />

          <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-[rgba(252,252,252,0.52)] sm:flex-row sm:items-center">
            <span className="font-mono">© {new Date().getFullYear()} Parcel Flow Systems — rule engine core v1.0.0</span>
            <span className="flex items-center gap-2">
              <span className="badge badge-success">
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                Operational
              </span>
            </span>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}

export default App;
