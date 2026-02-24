import { useState } from 'react';
import { User } from '../App';
import { login, signup } from '../api/auth';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  AlertCircle, 
  Star, 
  Award, 
  TrendingUp, 
  Users,
  Phone,
  MapPin,
  MessageCircle,
  UserPlus,
  Trophy
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

const testimonials = [
  {
    name: 'Priya Sharma',
    course: 'JEE Advanced',
    image: '👩‍🎓',
    rating: 5,
    text: 'UJAAS helped me crack JEE with AIR 234! The DPP practice and notes are exceptional.',
    achievement: 'AIR 234'
  },
  {
    name: 'Arjun Mehta',
    course: 'NEET',
    image: '👨‍🎓',
    rating: 5,
    text: 'Best coaching institute! The structured approach and daily practice tests made all the difference.',
    achievement: 'AIR 567'
  },
  {
    name: 'Sneha Patel',
    course: 'JEE Mains',
    image: '👩‍🎓',
    rating: 5,
    text: 'Outstanding faculty and excellent study material. Highly recommend UJAAS to all aspirants!',
    achievement: '99.8 Percentile'
  }
];

export function Login({ onLogin, onSignup }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }

        const response = await signup(name, email, password);
        onSignup(response.user as User);
      } else {
        const response = await login(email, password);
        onLogin(response.user as User);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoCreds = (role: 'student' | 'admin') => {
    const demoEmail = role === 'student' ? 'student@ujaas.com' : 'admin@ujaas.com';
    const demoPassword = role === 'student' ? 'student123' : 'admin123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
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
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl mb-4 shadow-lg"
            >
              <GraduationCap className="w-9 h-9 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              UJAAS
            </h1>
            <p className="text-gray-600 text-sm">
              Ultimate Guidance & Academic Support
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => {
                setIsSignup(false);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                !isSignup
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignup(true);
                setError('');
                setShowDemo(false);
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                isSignup
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input - Only for Signup */}
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                    placeholder="John Doe"
                    required={isSignup}
                  />
                </div>
              </motion.div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Confirm Password - Only for Signup */}
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                    placeholder="••••••••"
                    required={isSignup}
                  />
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </motion.button>
          </form>

          {/* Demo Credentials - Only show for login */}
          {!isSignup && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 mb-3"
              >
                <MessageCircle className="w-4 h-4" />
                {showDemo ? 'Hide' : 'Try'} Demo Login
              </button>
              
              {showDemo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => handleUseDemoCreds('student')}
                    className="w-full p-3 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-xl border border-teal-200 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">Student Demo</p>
                        <p className="text-xs text-gray-600">student@ujaas.com</p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleUseDemoCreds('admin')}
                    className="w-full p-3 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-xl border border-cyan-200 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">Admin Demo</p>
                        <p className="text-xs text-gray-600">admin@ujaas.com</p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Footer Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">5000+</p>
                <p className="text-xs text-gray-600">Students</p>
              </div>
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">98%</p>
                <p className="text-xs text-gray-600">Success</p>
              </div>
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">15+</p>
                <p className="text-xs text-gray-600">Years</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            © 2026 UJAAS Coaching Center. All rights reserved.
          </p>
        </div>

        {/* Additional Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 border border-white/50 text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-600">Top Ranked Institute</p>
          </div>
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 border border-white/50 text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-600">500+ Top Ranks</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
