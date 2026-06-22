import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiUploadSimple,
  PiBracketsCurly,
  PiX,
  PiPlay,
  PiCheckCircle,
  PiWarningCircle,
  PiCopy,
  PiCheck,
  PiTable,
} from 'react-icons/pi';
import { routeBatch } from '../services/api';

const SAMPLE = [
  { weight: 0.8, value: 45, destinationCountry: 'Germany' },
  { weight: 4.2, value: 200, destinationCountry: 'France' },
  { weight: 15.5, value: 350, destinationCountry: 'Canada' },
  { weight: 1.2, value: 1500, destinationCountry: 'Japan' },
  { weight: 0, value: 100, destinationCountry: 'Invalid (weight 0)' },
];

export default function BatchUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (selected) => {
    setError(null);
    setResults([]);
    if (selected.type !== 'application/json' && !selected.name.endsWith('.json')) {
      setError('Only JSON files are supported.');
      return;
    }
    if (selected.size > 1024 * 1024) {
      setError('File exceeds the 1 MB limit.');
      return;
    }
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setStatusText('');
    setResults([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      setResults([]);
      setProgress(15);
      setStatusText('Reading file…');
      await new Promise((r) => setTimeout(r, 300));

      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Malformed JSON. The file must contain a valid JSON array.');
      }

      setProgress(40);
      setStatusText('Validating schema…');
      await new Promise((r) => setTimeout(r, 300));

      if (!Array.isArray(parsed)) throw new Error('The root structure must be an array of parcel objects.');

      const valid = parsed.every(
        (i) => i && typeof i === 'object' && 'weight' in i && 'value' in i && 'destinationCountry' in i
      );
      if (!valid) throw new Error('Every item needs weight, value and destinationCountry.');

      setProgress(70);
      setStatusText('Routing on the server…');
      const res = await routeBatch(parsed);

      setProgress(100);
      setStatusText('Done');
      await new Promise((r) => setTimeout(r, 200));

      if (res.success) setResults(res.data);
      else throw new Error(res.error?.message || 'Server batch routing failed.');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Something went wrong.');
      setProgress(0);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  const copySample = async () => {
    await navigator.clipboard.writeText(JSON.stringify(SAMPLE, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="max-w-2xl">
        <p className="eyebrow">Route / Batch</p>
        <h1 className="display-xl mt-3 text-ink">Batch routing</h1>
        <p className="mt-4 text-base leading-relaxed text-body">
          Upload a JSON manifest to route many parcels at once. Each row reports
          its own outcome, so partial failures don't stop the batch.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="card-lg p-6">
            <div className="flex items-center gap-2 text-ink">
              <PiUploadSimple size={18} />
              <h2 className="text-base font-semibold tracking-tight">Upload manifest</h2>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-7 text-center transition-colors ${
                dragActive ? 'border-primary bg-bone' : 'border-hairline hover:border-hairline-strong'
              } ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
              <span className="grid h-11 w-11 place-items-center rounded-full bg-bone text-mute">
                <PiBracketsCurly size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Drag a file here, or click to browse</p>
                <p className="mt-1 text-[12px] text-ash">JSON manifests up to 1 MB</p>
              </div>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-full bg-bone py-2 pl-4 pr-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <PiBracketsCurly size={16} className="shrink-0 text-charcoal" />
                  <span className="truncate font-mono text-[12.5px] text-ink">{file.name}</span>
                  <span className="shrink-0 text-[11px] text-ash">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                {!loading && (
                  <button type="button" onClick={removeFile} className="btn-icon h-8 w-8" aria-label="Remove file">
                    <PiX size={14} />
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-md border border-hairline-strong p-3.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <p className="text-[13px] text-ink">{error}</p>
              </div>
            )}

            {loading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-charcoal">{statusText}</span>
                  <span className="font-mono tnum text-ink">{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {file && !loading && (
              <button type="button" onClick={triggerUpload} className="btn btn-primary mt-5 w-full">
                <PiPlay size={15} />
                Route manifest
              </button>
            )}
          </div>

          <div className="code-well">
            <div className="code-tabstrip justify-between">
              <span className="code-tab" data-active="true">parcels.json</span>
              <button
                type="button"
                onClick={copySample}
                className="flex items-center gap-1.5 rounded-xs px-2 py-1 font-mono text-[11px] text-[rgba(252,252,252,0.72)] transition-colors hover:text-on-dark"
              >
                {copied ? <PiCheck size={13} className="text-success" /> : <PiCopy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="max-h-56 overflow-auto p-4 text-[12px] leading-relaxed">{JSON.stringify(SAMPLE, null, 2)}</pre>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-lg flex min-h-[440px] flex-col p-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2 text-ink">
                <PiTable size={18} />
                <h2 className="text-base font-semibold tracking-tight">Results</h2>
              </div>
              <span className="badge badge-neutral">{results.length} record{results.length === 1 ? '' : 's'}</span>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-bone text-mute">
                  <PiTable size={22} />
                </span>
                <div className="max-w-xs">
                  <p className="text-sm font-medium text-ink">No manifest routed yet</p>
                  <p className="mt-1 text-[13px] text-ash">Upload a JSON file and route it to see per-row outcomes here.</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Weight</th>
                      <th>Value</th>
                      <th>Destination</th>
                      <th>Status</th>
                      <th>Department</th>
                      <th>Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {results.map((row, i) => {
                        const ok = row.success;
                        const p = row.parcel;
                        const input = row.input;
                        return (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          >
                            <td className="font-mono text-ash">{i + 1}</td>
                            {ok ? (
                              <>
                                <td className="tnum">{p.weight} kg</td>
                                <td className="tnum">€{Number(p.value).toLocaleString()}</td>
                                <td className="font-sans">{p.destinationCountry}</td>
                                <td>
                                  {p.status === 'ROUTED' ? (
                                    <span className="badge badge-success">Routed</span>
                                  ) : (
                                    <span className="badge badge-warn">Hold</span>
                                  )}
                                </td>
                                <td className="font-sans">{p.department || '—'}</td>
                                <td className="text-charcoal">{p.matchedRule}</td>
                              </>
                            ) : (
                              <>
                                <td className="tnum text-mute">{input?.weight !== undefined ? `${input.weight} kg` : '—'}</td>
                                <td className="tnum text-mute">{input?.value !== undefined ? `€${input.value}` : '—'}</td>
                                <td className="font-sans text-mute">{input?.destinationCountry || '—'}</td>
                                <td>
                                  <span className="badge badge-warn">
                                    <PiWarningCircle size={12} />
                                    Failed
                                  </span>
                                </td>
                                <td colSpan={2} className="text-primary" title={row.error}>{row.error}</td>
                              </>
                            )}
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-auto flex items-center gap-2 border-t border-hairline pt-4 text-[12px] text-charcoal">
                <PiCheckCircle size={14} className="text-success" />
                Manifest processed — full batch logs in Sentry / Winston.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
