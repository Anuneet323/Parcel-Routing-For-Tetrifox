import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiLockKey, PiUser, PiKey, PiShieldCheck, PiWarningCircle } from 'react-icons/pi';
import { loginUser } from '../services/api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginUser(username, password);
      if (result.success && result.data.token) {
        localStorage.setItem('routing_app_token', result.data.token);
        localStorage.setItem('routing_app_username', result.data.username);
        onLoginSuccess();
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 
        'Could not connect to the authentication service.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80dvh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Main login card */}
        <div className="card-lg bg-card p-8 shadow-2xl border border-hairline relative overflow-hidden">
          {/* Subtle accent glow decoration */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[rgba(234,40,4,0.06)] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[rgba(255,106,61,0.06)] blur-3xl pointer-events-none" />

          {/* Logo / Header */}
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-[rgba(234,40,4,0.1)] text-primary flex items-center justify-center text-2xl shadow-inner mb-4">
              <PiLockKey />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink font-sans">
              System Authorization
            </h2>
            <p className="mt-1.5 text-xs text-mute font-mono uppercase tracking-widest">
              Parcel Flow Control console
            </p>
          </div>

          {/* Demo Credentials Box */}
          <div className="mt-6 p-4 tile border border-hairline/80 rounded-md">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 text-primary text-base">
                <PiShieldCheck />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-ink font-sans">
                  Demo Console Credentials
                </h4>
                <p className="mt-1 text-[11px] text-mute font-mono leading-relaxed">
                  Username: <span className="font-semibold text-ink select-all bg-canvas px-1.5 py-0.5 rounded">admin</span>
                  <br />
                  Password: <span className="font-semibold text-ink select-all bg-canvas px-1.5 py-0.5 rounded">admin123</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 text-xs bg-red-50 text-primary border border-red-100 rounded-md"
              >
                <span className="text-base flex-shrink-0"><PiWarningCircle /></span>
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            <div>
              <label htmlFor="username-input" className="field-label mb-1.5">
                <PiUser /> Username
              </label>
              <input
                id="username-input"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter console username"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password-input" className="field-label mb-1.5">
                <PiKey /> Password
              </label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verifying Identity...
                </span>
              ) : (
                'Access Console'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
