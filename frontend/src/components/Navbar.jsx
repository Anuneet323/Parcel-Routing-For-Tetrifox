import { motion } from 'framer-motion';
import { PiGithubLogoFill, PiArrowRight } from 'react-icons/pi';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'single', label: 'Route parcel' },
  { id: 'batch', label: 'Batch' },
];

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Parcel Routing — go to dashboard"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary">
            <span className="h-2 w-2 rounded-full bg-white" aria-hidden="true" />
          </span>
          <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
            Parcel Routing
          </span>
        </button>

        <nav
          className="flex items-center gap-1 overflow-x-auto rounded-full bg-bone/70 p-1"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive ? 'text-on-dark' : 'text-mute hover:text-ink'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-icon hidden sm:inline-flex"
            aria-label="View source on GitHub"
          >
            <PiGithubLogoFill size={18} />
          </a>
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className="btn btn-primary min-h-10! px-4! py-2! text-sm"
          >
            Route a parcel
            <PiArrowRight size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
