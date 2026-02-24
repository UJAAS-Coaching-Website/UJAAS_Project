import { useState } from 'react';
import { User } from '../App';
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
  UserPlus
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

// Mock user data
const MOCK_USERS = {
  student: {
    email: 'student@ugas.com',
    password: 'student123',
    data: {
      id: '1',
      name: 'Rahul Kumar',
      email: 'student@ugas.com',
      role: 'student' as const,
      enrolledCourses: ['JEE Advanced', 'JEE Mains', 'NEET']
    }
  },
  admin: {
    email: 'admin@ugas.com',
    password: 'admin123',
    data: {
      id: '2',
      name: 'Admin User',
      email: 'admin@ugas.com',
      role: 'admin' as const
    }
  }
};

const testimonials = [
  {
    name: 'Priya Sharma',
    course: 'JEE Advanced',
    image: '👩‍🎓',
    rating: 5,
    text: 'UGAS helped me crack JEE with AIR 234! The DPP practice and notes are exceptional.',
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
    text: 'Outstanding faculty and excellent study material. Highly recommend UGAS to all aspirants!',
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
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      // Signup validation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        role: 'student',
        enrolledCourses: []
      };
      
      onSignup(newUser);
    } else {
      // Login - Check credentials
      if (email === MOCK_USERS.student.email && password === MOCK_USERS.student.password) {
        onLogin(MOCK_USERS.student.data);
      } else if (email === MOCK_USERS.admin.email && password === MOCK_USERS.admin.password) {
        onLogin(MOCK_USERS.admin.data);
      } else {
        setError('Invalid email or password');
      }
    }
  };

  const handleDemoLogin = (role: 'student' | 'admin') => {
    if (role === 'student') {
      onLogin(MOCK_USERS.student.data);
    } else {
      onLogin(MOCK_USERS.admin.data);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block space-y-8"
          >
            {/* Logo and Header */}
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl mb-6 shadow-2xl"
              >
                <GraduationCap className="w-11 h-11 text-white" />
              </motion.div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                UGAS
              </h1>
              <p className="text-2xl text-gray-700 mb-2">Ultimate Guidance & Academic Support</p>
              <p className="text-lg text-gray-600">Empowering students to achieve their dreams</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">5000+</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Students Enrolled</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, rotate: -1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">98%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Success Rate</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, rotate: -1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">500+</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">AIR Top Rankers</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">15+</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Years Experience</p>
              </motion.div>
            </div>

            {/* Testimonial Carousel */}
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{testimonials[currentTestimonial].image}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-sm text-gray-600">{testimonials[currentTestimonial].course}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                  {testimonials[currentTestimonial].achievement}
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonials[currentTestimonial].text}"</p>
              
              {/* Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentTestimonial === index 
                        ? 'w-8 bg-gradient-to-r from-indigo-600 to-purple-600' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Contact Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Us</h3>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-indigo-600" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-purple-600" />
                <span>info@ugas.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-pink-600" />
                <span>123 Education Street, Delhi, India</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Mobile Logo */}
            <div className="text-center mb-8 lg:hidden">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg"
              >
                <GraduationCap className="w-9 h-9 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                UGAS
              </h1>
              <p className="text-gray-600">Ultimate Guidance & Academic Support</p>
            </div>

            {/* Login Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/50"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {isSignup ? 'Join UGAS and start your learning journey' : 'Sign in to continue your learning journey'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Input - Only for Signup */}
                {isSignup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative group">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-gray-50 focus:bg-white"
                        placeholder="John Doe"
                        required={isSignup}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-gray-50 focus:bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-gray-50 focus:bg-white"
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
                  >
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-gray-50 focus:bg-white"
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
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSignup ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </form>

              {/* Toggle between Login and Signup */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError('');
                    setShowDemo(false);
                  }}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition"
                >
                  {isSignup ? (
                    <>Already have an account? <span className="font-semibold text-indigo-600">Sign In</span></>
                  ) : (
                    <>Don't have an account? <span className="font-semibold text-indigo-600">Sign Up</span></>
                  )}
                </button>
              </div>

              {/* Demo Credentials - Only show for login */}
              {!isSignup && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDemo(!showDemo)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {showDemo ? 'Hide' : 'Show'} Demo Credentials
                  </button>
                  
                  {showDemo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700">Student Account</p>
                          <button
                            onClick={() => handleDemoLogin('student')}
                            className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                          >
                            Quick Login
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">Email: student@ugas.com</p>
                        <p className="text-xs text-gray-600">Password: student123</p>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700">Admin Account</p>
                          <button
                            onClick={() => handleDemoLogin('admin')}
                            className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-md"
                          >
                            Quick Login
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">Email: admin@ugas.com</p>
                        <p className="text-xs text-gray-600">Password: admin123</p>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            <p className="text-center text-sm text-gray-600 mt-6">
              © 2026 UGAS Coaching Center. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}