import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiPaperPlaneTilt,
  PiScales,
  PiCurrencyEur,
  PiGlobeHemisphereWest,
  PiCheckCircle,
  PiWarningCircle,
  PiArrowsLeftRight,
  PiArrowRight,
} from 'react-icons/pi';
import { routeSingle } from '../services/api';

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-charcoal">{label}</dt>
      <dd className={`text-[13.5px] text-ink ${mono ? 'font-mono tnum' : 'font-medium'}`}>{value}</dd>
    </div>
  );
}

export default function SingleRoute() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { weight: '', value: '', destinationCountry: '' } });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const payload = {
        weight: parseFloat(data.weight),
        value: parseFloat(data.value),
        destinationCountry: data.destinationCountry.trim(),
      };
      const res = await routeSingle(payload);
      if (res.success) setResult(res.data);
      else throw new Error(res.error?.message || 'Failed to route parcel.');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Routing failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    setResult(null);
    setError(null);
  };

  const fields = [
    { name: 'weight', label: 'Weight (kg)', icon: PiScales, type: 'number', placeholder: '2.5',
      rules: { required: 'Weight is required', min: { value: 0.001, message: 'Weight must be greater than 0' } } },
    { name: 'value', label: 'Value (€)', icon: PiCurrencyEur, type: 'number', placeholder: '150',
      rules: { required: 'Value is required', min: { value: 0, message: 'Value cannot be negative' } } },
    { name: 'destinationCountry', label: 'Destination', icon: PiGlobeHemisphereWest, type: 'text', placeholder: 'Germany',
      rules: { required: 'Destination is required', minLength: { value: 2, message: 'At least 2 characters' } } },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="max-w-2xl">
        <p className="eyebrow">Route / Single</p>
        <h1 className="display-xl mt-3 text-ink">Route a parcel</h1>
        <p className="mt-4 text-base leading-relaxed text-body">
          Enter weight, value and destination — the rule engine evaluates them in
          order and assigns a department, or holds the parcel for insurance.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="card-lg self-start p-6 md:col-span-2">
          <div className="flex items-center gap-2 text-ink">
            <PiPaperPlaneTilt size={18} />
            <h2 className="text-base font-semibold tracking-tight">Shipment</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            {fields.map((f) => {
              const Icon = f.icon;
              const hasError = !!errors[f.name];
              return (
                <div key={f.name} className="space-y-2">
                  <label htmlFor={f.name} className="field-label">
                    <Icon size={14} className="text-mute" />
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    type={f.type}
                    step={f.type === 'number' ? 'any' : undefined}
                    placeholder={f.placeholder}
                    className={`input ${hasError ? 'input-error' : ''}`}
                    {...register(f.name, f.rules)}
                  />
                  {hasError && (
                    <p className="px-1 text-[12px] font-medium text-primary">{errors[f.name].message}</p>
                  )}
                </div>
              );
            })}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading ? 'Evaluating…' : 'Route parcel'}
                {!loading && <PiArrowRight size={15} />}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-outline">
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card-lg flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center"
              >
                <span className="spinner" />
                <div>
                  <p className="font-semibold text-ink">Running decision rules</p>
                  <p className="mt-1 text-[13px] text-charcoal">Evaluating the predicate registry…</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card-lg flex min-h-[320px] flex-col items-center justify-center gap-3 border-hairline-strong p-8 text-center"
              >
                <PiWarningCircle size={34} className="text-primary" />
                <div>
                  <p className="font-semibold text-ink">Routing failed</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-charcoal">{error}</p>
                </div>
                <button type="button" onClick={resetForm} className="btn btn-ghost mt-1 text-primary">
                  Clear and retry
                </button>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="card-lg overflow-hidden"
              >
                {result.status === 'ROUTED' ? (
                  <div className="flex items-center justify-between gap-3 border-b border-hairline bg-bone px-6 py-5">
                    <div className="flex items-center gap-2.5">
                      <PiCheckCircle size={22} className="text-success" />
                      <div>
                        <p className="font-semibold text-ink">Routed</p>
                        <p className="text-[12px] text-charcoal">Assigned to a department</p>
                      </div>
                    </div>
                    <span className="badge badge-success">{result.status}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 border-b border-hairline bg-bone px-6 py-5">
                    <div className="flex items-center gap-2.5">
                      <PiWarningCircle size={22} className="text-primary" />
                      <div>
                        <p className="font-semibold text-ink">Insurance hold</p>
                        <p className="text-[12px] text-charcoal">Held from weight routing</p>
                      </div>
                    </div>
                    <span className="badge badge-warn">Pending</span>
                  </div>
                )}

                <div className="p-6">
                  {result.status === 'ROUTED' ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="tile p-4">
                        <p className="eyebrow">Department</p>
                        <p className="mt-2 text-lg font-semibold tracking-tight text-ink">{result.department}</p>
                      </div>
                      <div className="tile p-4">
                        <p className="eyebrow">Matched rule</p>
                        <p className="mt-2 font-mono text-sm text-ink">{result.matchedRule}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md bg-bone p-4">
                      <p className="text-[13.5px] leading-relaxed text-body">
                        Declared value of <span className="font-semibold text-ink">€{Number(result.value).toLocaleString()}</span> exceeds the €1,000 threshold, so the parcel is held in the <span className="font-mono text-[12.5px] text-primary">PENDING_INSURANCE_APPROVAL</span> queue.
                      </p>
                    </div>
                  )}

                  <dl className="mt-4 divide-y divide-[var(--color-hairline)] border-t border-hairline">
                    <Row label="Parcel ID" value={result.id} mono />
                    <Row label="Weight" value={`${result.weight} kg`} mono />
                    <Row label="Value" value={`€${Number(result.value).toLocaleString()}`} mono />
                    <Row label="Destination" value={result.destinationCountry} />
                    {result.status !== 'ROUTED' && <Row label="Matched rule" value={result.matchedRule} />}
                  </dl>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="tile flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-mute">
                  <PiArrowsLeftRight size={22} />
                </span>
                <div className="max-w-xs">
                  <p className="font-semibold text-ink">Awaiting shipment</p>
                  <p className="mt-1 text-[13px] text-charcoal">
                    Fill in the form and the routing decision will appear here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
