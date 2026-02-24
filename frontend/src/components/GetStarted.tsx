import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Award, 
  Users, 
  BookOpen, 
  Trophy, 
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface GetStartedProps {
  onGetStarted: () => void;
  isNewUser?: boolean;
  userName?: string;
}

export function GetStarted({ onGetStarted, isNewUser, userName }: GetStartedProps) {
  const teachers = [
    {
      name: 'Dr. Rajesh Kumar',
      subject: 'Physics',
      experience: '15+ Years',
      qualification: 'Ph.D. in Physics, IIT Delhi',
      students: '2000+',
      image: 'https://images.unsplash.com/photo-1659353887617-8cf154b312c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBtYWxlJTIwcHJvZmVzc29yJTIwc2NpZW5jZXxlbnwxfHx8fDE3NzA2MzU3MTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.9,
      achievements: ['IIT-JEE Expert', 'Published Author', 'KVPY Mentor']
    },
    {
      name: 'Prof. Priya Sharma',
      subject: 'Mathematics',
      experience: '12+ Years',
      qualification: 'M.Sc. Mathematics, IIT Bombay',
      students: '1800+',
      image: 'https://images.unsplash.com/photo-1593442808882-775dfcd90699?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmZW1hbGUlMjB0ZWFjaGVyJTIwbWF0aGVtYXRpY3N8ZW58MXx8fHwxNzcwNjM1NzE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4.8,
      achievements: ['Olympiad Trainer', 'JEE Advanced Expert', 'CAT Mentor']
    },
    {
      name: 'Dr. Anand Verma',
      subject: 'Chemistry',
      experience: '18+ Years',
      qualification: 'Ph.D. in Chemistry, DU',
      students: '2500+',
      image: 'https://images.unsplash.com/photo-1758685734511-4f49ce9a382b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWFjaGVyJTIwdGVhY2hpbmclMjBjbGFzc3Jvb218ZW58MXx8fHwxNzcwNjM1NzE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 5.0,
      achievements: ['NEET Expert', 'Research Scholar', 'Best Teacher Award 2023']
    }
  ];

  const features = [
    { icon: Trophy, title: 'Top Results', desc: '95% Success Rate', color: 'from-yellow-500 to-orange-500' },
    { icon: Users, title: 'Expert Faculty', desc: '20+ Experienced Teachers', color: 'from-blue-500 to-cyan-500' },
    { icon: BookOpen, title: 'Study Material', desc: 'Comprehensive Notes & DPP', color: 'from-cyan-500 to-blue-500' },
    { icon: Target, title: 'Personalized', desc: 'Individual Attention', color: 'from-green-500 to-emerald-500' },
  ];

  const stats = [
    { number: '10,000+', label: 'Students Trained', icon: Users },
    { number: '95%', label: 'Success Rate', icon: Trophy },
    { number: '20+', label: 'Expert Faculty', icon: Award },
    { number: '15+', label: 'Years Experience', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Welcome Banner for New Users */}
      {isNewUser && userName && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="sticky top-0 z-50 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white py-4 px-4 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Award className="w-8 h-8" />
              </motion.div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold">Welcome to UJAAS, {userName}! 🎉</h3>
                <p className="text-xs sm:text-sm text-teal-100">Your account has been successfully created. Explore what we offer below!</p>
              </div>
            </div>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-white text-teal-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
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
            className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
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
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">India's Leading Coaching Institute</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 bg-clip-text text-transparent">
                  UJAAS
                </span>
                <br />
                <span className="text-gray-800">Coaching Center</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Empowering students with world-class education, expert faculty, and comprehensive study materials. Your success is our mission.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <motion.button
                  onClick={onGetStarted}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-semibold shadow-2xl hover:shadow-cyan-500/50 transition-all flex items-center gap-2 group"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.a
                  href="#teachers"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('teachers')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-teal-200 text-teal-700 rounded-xl font-semibold hover:bg-white transition-all"
                >
                  Meet Our Teachers
                </motion.a>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-2`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-gray-600">{feature.title}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1752579664702-e6609516e21a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb2FjaGluZyUyMGluc3RpdHV0ZSUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NzA2MzU3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Modern Classroom"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Floating Achievement Cards */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-teal-600">95%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-cyan-600">10k+</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-500">20+</p>
                      <p className="text-sm text-gray-600">Expert Faculty</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-2xl mb-4 shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose UJAAS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 bg-clip-text text-transparent">
                Why Choose UJAAS?
              </span>
            </h2>
            <p className="text-xl text-gray-600">The ultimate destination for your academic success</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: 'Proven Track Record',
                description: 'Over 95% of our students achieve their target ranks in competitive exams',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: Users,
                title: 'Expert Faculty',
                description: 'Learn from IIT & NIT alumni with years of teaching experience',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: BookOpen,
                title: 'Comprehensive Study Material',
                description: 'Curated notes, DPPs, and practice tests for thorough preparation',
                color: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Target,
                title: 'Personalized Attention',
                description: 'Small batch sizes ensure every student gets individual guidance',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: TrendingUp,
                title: 'Regular Assessments',
                description: 'Weekly tests and detailed performance analysis to track progress',
                color: 'from-red-500 to-rose-500'
              },
              {
                icon: CheckCircle,
                title: 'Digital Learning',
                description: 'Access study materials and practice tests anytime, anywhere',
                color: 'from-teal-500 to-cyan-500'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section id="teachers" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 bg-clip-text text-transparent">
                Meet Our Expert Faculty
              </span>
            </h2>
            <p className="text-xl text-gray-600">Learn from the best minds in education</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map((teacher, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
              >
                <div className="relative h-80 overflow-hidden group">
                  <ImageWithFallback
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-sm">{teacher.rating}</span>
                  </div>

                  {/* Name & Subject Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-1">{teacher.name}</h3>
                    <p className="text-teal-300 font-medium">{teacher.subject} Expert</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{teacher.experience}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{teacher.students}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{teacher.qualification}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Key Achievements:</p>
                    {teacher.achievements.map((achievement, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-teal-100 mb-8">
                Join thousands of successful students and achieve your dreams with UJAAS
              </p>
              <motion.button
                onClick={onGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-teal-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all inline-flex items-center gap-3 group"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}