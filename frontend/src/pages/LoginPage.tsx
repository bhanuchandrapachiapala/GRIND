import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NeonButton } from '../components/ui/NeonButton';

export function LoginPage() {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-5 animated-gradient">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, rgba(0,255,255,0.2), transparent 40%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.15), transparent 40%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm bg-white/[0.03] border border-neon-cyan/10 rounded-card backdrop-blur-md p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight neon-text">GRIND</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your daily discipline engine
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/10 rounded-lg px-4 py-3 text-white outline-none"
          />
          <NeonButton
            type="submit"
            variant="solid"
            fullWidth
            disabled={loading}
            className="mt-2"
          >
            {loading ? 'Entering…' : 'Enter the Grind'}
          </NeonButton>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-neon-red mt-2"
            >
              {error}
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
