import { useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Send,
  Star,
  Calendar,
} from 'lucide-react';
import { Footer } from './Footer';
import logo from '../assets/logo.svg';
import { LandingData } from '../App';

interface GetStartedProps {
  onGetStarted: () => void;
  isNewUser?: boolean;
  userName?: string;
  landingData: LandingData;
  onSubmitQuery: (query: { name: string; email: string; phone: string; course: string; message: string }) => void;
}

export function GetStarted({ onGetStarted, isNewUser, userName, landingData, onSubmitQuery }: GetStartedProps) {
  const [currentAchiever, setCurrentAchiever] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
    message: ''
  });

  const { faculty, achievers, courses } = landingData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitQuery(formData);
    alert('Thank you! Your interest has been registered. Our team will contact you soon.');
    setFormData({ name: '', email: '', phone: '', course: '', message: '' });
  };

  const nextAchiever = () => {
    setCurrentAchiever((prev) => (prev + 1) % achievers.length);
  };

  const prevAchiever = () => {
    setCurrentAchiever((prev) => (prev - 1 + achievers.length) % achievers.length);
  };

  const visibleAchievers = achievers.length <= 3
    ? achievers.map((achiever, idx) => ({ achiever, idx }))
    : Array.from({ length: 3 }, (_, offset) => {
        const idx = (currentAchiever + offset) % achievers.length;
        return { achiever: achievers[idx], idx };
      });
  const shouldPaginateAchievers = achievers.length > 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {isNewUser && userName && (
        <div className="sticky top-0 z-[1000] bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white py-4 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <h3 className="font-bold">Welcome to UJAAS, {userName}!</h3>
                <p className="text-xs text-teal-100">Your account has been successfully created</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute top-6 right-6">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Login
            </button>
          </div>

          <img
            src={logo}
            alt="UJAAS Logo"
            className="w-32 h-32 mx-auto mb-6 object-contain"
          />
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span style={{ color: 'rgb(159, 28, 13)' }}>
              UJAAS Career Institute
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We Believe in Excellence, Because It's All About a Bright Future
          </p>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white">Admissions Open</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {courses.map((course, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 text-center shadow-lg"
              >
                <BookOpen className="w-5 h-5 text-teal-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 text-xl leading-tight">{course}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Our Expert Faculty
              </span>
            </h2>
            <p className="text-gray-600 text-lg">Learn from the Best in the Field</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faculty.map((member, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
              >
                <div className="aspect-square bg-gradient-to-br from-teal-200 to-cyan-200 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-teal-600 font-semibold mb-2">{member.subject}</p>
                  <p className="text-sm text-gray-600 mb-2">{member.designation}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Award className="w-4 h-4 text-cyan-600" />
                    <span>{member.experience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Our Achievers
              </span>
            </h2>
            <p className="text-gray-600 text-lg">Success Stories from UJAAS</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {shouldPaginateAchievers && (
              <>
                <button
                  onClick={prevAchiever}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-6 h-6 text-teal-600" />
                </button>

                <button
                  onClick={nextAchiever}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-6 h-6 text-teal-600" />
                </button>
              </>
            )}

            {achievers.length > 0 ? (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  {visibleAchievers.map(({ achiever, idx }) => (
                    <div
                      key={`${achiever.name}-${idx}`}
                      className="bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="aspect-square bg-gradient-to-br from-teal-200 to-cyan-200">
                        <img
                          src={achiever.image}
                          alt={achiever.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{achiever.name}</h3>
                        <p className="text-teal-600 font-semibold mb-2">{achiever.achievement}</p>
                        <div className="inline-flex items-center gap-2 text-base font-bold text-cyan-600">
                          <Calendar className="w-5 h-5" />
                          Year: {achiever.year}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {shouldPaginateAchievers && (
                  <div className="flex justify-center gap-2 mt-6">
                    {achievers.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentAchiever(idx)}
                        className={`h-2 rounded-full transition-all ${
                          currentAchiever === idx ? 'w-8 bg-teal-600' : 'w-2 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
                <p className="text-gray-500 italic">No achievers added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Register Your Interest
              </span>
            </h2>
            <p className="text-gray-600 text-lg">Fill the form below and we'll contact you soon</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 shadow-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course Interested In *
                </label>
                <select
                  required
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a course</option>
                  {courses.map((course, idx) => (
                    <option key={idx} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  placeholder="Tell us more about your requirements..."
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition inline-flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Registration
              </button>
            </div>
          </form>

        </div>
      </section>

      <Footer />
    </div>
  );
}
