import { useState, useEffect } from 'react';
import { User as UserType } from '../App';
import { login } from '../api/auth';
import { 
  User, 
  Lock, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/logo.svg';

interface LoginProps {
  onLogin: (user: UserType) => void;
}


export function Login({ onLogin }: LoginProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await login(loginId, password);
      onLogin(response.user as UserType);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center relative overflow-hidden"
      style={{
        minHeight: isMobile ? undefined : '100vh',
        height: isMobile ? '100dvh' : undefined,
        padding: isMobile ? '1rem' : '1rem',
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1]}}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1]}}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50"
          style={{ padding: isMobile ? '1.25rem 1.5rem' : '2rem' }}
        >
          {/* Logo and Header */}
          <div className="text-center" style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
            <motion.img
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              src={logo}
              alt="UJAAS Logo"
              className="object-contain mx-auto"
              style={{
                width: isMobile ? '3.5rem' : '6rem',
                height: isMobile ? '3.5rem' : '6rem',
                marginBottom: isMobile ? '0.5rem' : '1rem',
              }}
            />
            <h1
              className="font-bold"
              style={{
                color: 'rgb(159, 29, 14)',
                fontSize: isMobile ? '1.5rem' : '1.875rem',
                marginBottom: isMobile ? '0.25rem' : '0.5rem',
              }}
            >
              UJAAS
            </h1>
          </div>

          <div className="text-center" style={{ marginBottom: isMobile ? '0.75rem' : '1.5rem' }}>
            <p
              className="text-gray-600"
              style={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
            >
              Sign in to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem' }}>
            {/* Login ID Input */}
            <div>
              <label
                htmlFor="loginId"
                className="block font-medium text-gray-700"
                style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', marginBottom: isMobile ? '0.25rem' : '0.375rem' }}
              >
                Login ID
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  style={{ width: isMobile ? '1rem' : '1.25rem', height: isMobile ? '1rem' : '1.25rem' }}
                />
                <input
                  id="loginId"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                  placeholder="Enter Login ID"
                  required
                  style={{
                    paddingLeft: isMobile ? '2.25rem' : '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: isMobile ? '0.5rem' : '0.75rem',
                    paddingBottom: isMobile ? '0.5rem' : '0.75rem',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-gray-700"
                style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', marginBottom: isMobile ? '0.25rem' : '0.375rem' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  style={{ width: isMobile ? '1rem' : '1.25rem', height: isMobile ? '1rem' : '1.25rem' }}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                  placeholder="••••••••"
                  required
                  style={{
                    paddingLeft: isMobile ? '2.25rem' : '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: isMobile ? '0.5rem' : '0.75rem',
                    paddingBottom: isMobile ? '0.5rem' : '0.75rem',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl text-red-700"
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                paddingTop: isMobile ? '0.625rem' : '0.75rem',
                paddingBottom: isMobile ? '0.625rem' : '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                marginTop: isMobile ? '0.25rem' : '0',
              }}
            >
              {isSubmitting ? 'Please wait...' : 'Sign In'}
            </motion.button>
          </form>
        </div>

      </motion.div>
    </div>
  );
}
