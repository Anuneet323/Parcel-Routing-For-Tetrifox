import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  PiPackage,
  PiShieldWarning,
  PiScales,
  PiWarningCircle,
  PiArrowsClockwise,
  PiArrowUpRight,
  PiX,
  PiCaretDown,
  PiCaretUp,
  PiClock,
  PiInfo,
  PiTerminalWindow,
  PiSlidersHorizontal,
} from 'react-icons/pi';
import { getStats, getParcels, getErrors, resetStats } from '../services/api';

function CountUp({ value }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString()),
    });
    return () => controls.stop();
  }, [value, mv]);
  return <span className="tnum">{display}</span>;
}

const stamp = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalParcelsProcessed: 0,
    insurancePending: 0,
    heavyParcels: 0,
    errorCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [selectedKpiTitle, setSelectedKpiTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [expandedErrorId, setExpandedErrorId] = useState(null);

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await resetStats();
      if (res.success) {
        setStats({ totalParcelsProcessed: 0, insurancePending: 0, heavyParcels: 0, errorCount: 0 });
        setSelectedKpi(null);
      } else {
        throw new Error(res.message || 'Failed to reset statistics.');
      }
    } catch (err) {
      setError(err.message || 'Could not reach the routing service.');
    } finally {
      setLoading(false);
    }
  };

  const handleKpiClick = async (kpiId, kpiTitle) => {
    setSelectedKpi(kpiId);
    setSelectedKpiTitle(kpiTitle);
    setModalLoading(true);
    setModalError(null);
    setModalData([]);
    setExpandedErrorId(null);
    try {
      let res;
      if (kpiId === 'total') res = await getParcels();
      else if (kpiId === 'insurance') res = await getParcels({ status: 'PENDING_INSURANCE_APPROVAL' });
      else if (kpiId === 'heavy') res = await getParcels({ department: 'Heavy Department' });
      else if (kpiId === 'errors') res = await getErrors();

      if (res && res.success) setModalData(res.data);
      else throw new Error('Failed to load drill-down details.');
    } catch (err) {
      setModalError(err.message || 'Could not load details from the server.');
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getStats();
        if (!active) return;
        if (res.success) setStats(res.data);
        else setError('Failed to retrieve stats data.');
      } catch (err) {
        if (active) setError(err.message || 'Could not reach the routing service.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const kpis = [
    { id: 'total', title: 'Total processed', value: stats.totalParcelsProcessed, icon: PiPackage, hint: 'Parcels ingested by the engine' },
    { id: 'insurance', title: 'Insurance pending', value: stats.insurancePending, icon: PiShieldWarning, hint: 'Declared value over €1,000' },
    { id: 'heavy', title: 'Heavy parcels', value: stats.heavyParcels, icon: PiScales, hint: 'Weight beyond the 10 kg limit' },
    { id: 'errors', title: 'Routing errors', value: stats.errorCount, icon: PiWarningCircle, hint: 'Failed routing evaluations', alert: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard / Live</p>
          <h1 className="display-xl mt-3 text-ink">Routing overview</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-body">
            Real-time counters from the rule engine — what came in, what got held,
            and what failed to route.
          </p>
        </div>
        <button type="button" onClick={handleReset} disabled={loading} className="btn btn-outline self-start sm:self-auto">
          <PiArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} />
          Reset counters
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card mt-8 flex items-start gap-3 border-hairline-strong! p-4"
          >
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <p className="text-sm text-ink">
              <span className="font-semibold">Connection failed.</span> {error} Make sure the backend is running on port 5004.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const isOrange = kpi.alert && kpi.value > 0;
          return (
            <motion.button
              key={kpi.id}
              type="button"
              onClick={() => handleKpiClick(kpi.id, kpi.title)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              className="card group flex flex-col items-start p-5 text-left transition-colors hover:border-hairline-strong"
            >
              <div className="flex w-full items-start justify-between">
                <span className="text-sm font-medium text-charcoal">{kpi.title}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-bone text-ink">
                  <Icon size={18} />
                </span>
              </div>

              <div className={`display-md mt-6 ${isOrange ? 'text-primary' : 'text-ink'}`}>
                {loading ? (
                  <span className="block h-8 w-16 animate-pulse rounded-full bg-bone" />
                ) : (
                  <CountUp value={kpi.value} />
                )}
              </div>

              <p className="mt-1.5 text-[13px] text-ash">{kpi.hint}</p>

              <span className="mt-5 flex items-center gap-1 text-[13px] font-medium text-charcoal transition-colors group-hover:text-primary">
                View details
                <PiArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="code-well lg:col-span-2">
          <div className="code-tabstrip">
            <span className="code-tab" data-active="true">
              <PiTerminalWindow size={13} className="-mt-0.5 mr-1 inline" />
              routing.log
            </span>
          </div>
          <div className="space-y-2 p-5 text-[12.5px]">
            <p className="text-[rgba(252,252,252,0.6)]">[{stamp()} 11:59:12] SYSTEM — initializing rule engine registry</p>
            <p className="text-[rgba(252,252,252,0.6)]">[{stamp()} 11:59:12] INFO — loaded and validated rules.json</p>
            <p className="text-success">[{stamp()} 11:59:13] OK — mongo connection established</p>
            <p className="text-on-dark">[{stamp()} 11:59:15] READY — engine accepting shipments</p>
            {stats.totalParcelsProcessed > 0 && (
              <p className="text-on-dark">[{stamp()} 11:59:45] ROUTED — processed {stats.totalParcelsProcessed.toLocaleString()} parcel records</p>
            )}
            {stats.insurancePending > 0 && (
              <p className="text-primary">[{stamp()} 12:01:03] HOLD — {stats.insurancePending} item(s) pending insurance review</p>
            )}
            {stats.errorCount > 0 && (
              <p className="text-primary">[{stamp()} 12:02:11] ALERT — {stats.errorCount} routing error(s) logged</p>
            )}
          </div>
        </div>

        <div className="card-lg flex flex-col p-6">
          <div className="flex items-center gap-2 text-ink">
            <PiSlidersHorizontal size={18} />
            <h2 className="text-base font-semibold tracking-tight">Rule registry</h2>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-charcoal">
            Rules live in <code className="rounded-sm bg-bone px-1 py-0.5 font-mono text-[12px] text-ink">rules.json</code> on the server and compile to executable predicates under the open-closed principle.
          </p>

          <dl className="mt-5 space-y-0 text-sm">
            {[
              ['Mail department', '≤ 1 kg'],
              ['Regular department', '≤ 10 kg'],
              ['Heavy department', '> 10 kg'],
              ['Insurance hold', '> €1,000'],
            ].map(([k, v], idx) => (
              <div key={k} className={`flex items-center justify-between py-2.5 ${idx > 0 ? 'border-t border-hairline' : ''}`}>
                <dt className="text-charcoal">{k}</dt>
                <dd className="font-mono text-[13px] tnum text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-auto pt-5 text-[12px] text-ash">Monitored via Sentry APM + Winston.</p>
        </div>
      </div>

      <AnimatePresence>
        {selectedKpi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedKpi(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="card-lg flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden bg-card"
            >
              <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-[19px] font-semibold tracking-tight text-ink">{selectedKpiTitle}</h3>
                  <span className="badge badge-neutral">
                    {modalLoading ? 'loading…' : `${modalData.length} record${modalData.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                <button type="button" onClick={() => setSelectedKpi(null)} className="btn-icon" aria-label="Close">
                  <PiX size={18} />
                </button>
              </div>

              <div className="min-h-[220px] flex-1 overflow-y-auto p-6">
                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <span className="spinner" />
                    <span className="text-sm text-charcoal">Loading records…</span>
                  </div>
                ) : modalError ? (
                  <div className="card flex items-start gap-3 border-hairline-strong! p-4">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <p className="text-sm text-ink">{modalError}</p>
                  </div>
                ) : modalData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <PiInfo size={32} className="text-stone" />
                    <p className="text-sm font-medium text-ink">No records yet</p>
                    <p className="text-[13px] text-ash">Route some parcels and they will show up here.</p>
                  </div>
                ) : selectedKpi === 'errors' ? (
                  <div className="space-y-3">
                    {modalData.map((errItem) => {
                      const isExpanded = expandedErrorId === errItem._id;
                      return (
                        <div key={errItem._id} className="card p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                                <PiWarningCircle size={15} className="text-primary" />
                                {errItem.details?.message || 'Routing error'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-mute">
                                <span className="flex items-center gap-1">
                                  <PiClock size={12} />
                                  {new Date(errItem.timestamp).toLocaleString()}
                                </span>
                                <span className="font-mono">id {errItem._id?.slice(-8)}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedErrorId(isExpanded ? null : errItem._id)}
                              className="btn btn-ghost text-[13px]"
                            >
                              Payload
                              {isExpanded ? <PiCaretUp size={13} /> : <PiCaretDown size={13} />}
                            </button>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.pre
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="code-well mt-3 overflow-x-auto p-3 text-[12px]"
                              >
                                {JSON.stringify(errItem.details?.input || errItem.details, null, 2)}
                              </motion.pre>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-hairline">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Parcel</th>
                          <th>Destination</th>
                          <th>Weight</th>
                          <th>Value</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((p) => (
                          <tr key={p._id}>
                            <td className="font-mono text-charcoal">{p._id.slice(-8)}</td>
                            <td className="font-sans">{p.destinationCountry}</td>
                            <td className="tnum">{p.weight} kg</td>
                            <td className="tnum">€{p.value.toLocaleString()}</td>
                            <td>
                              {p.department ? (
                                <span className="badge badge-tag">{p.department.replace(' Department', '')}</span>
                              ) : (
                                <span className="text-ash">—</span>
                              )}
                            </td>
                            <td>
                              {p.status === 'ROUTED' ? (
                                <span className="badge badge-success">Routed</span>
                              ) : (
                                <span className="badge badge-warn">Hold</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-hairline px-6 py-4">
                <button type="button" onClick={() => setSelectedKpi(null)} className="btn btn-dark">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
