import { useState, useEffect } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';
import { Footer } from './Footer';
import logo from '../assets/logo.svg';
import { LandingData } from '../App';

interface GetStartedProps {
  onGetStarted: () => void;
  isNewUser?: boolean;
  userName?: string;
  landingData: LandingData;
  onSubmitQuery: (query: { name: string; email: string; phone: string; courseId: string; message?: string }) => void;
}

export function GetStarted({ onGetStarted, isNewUser, userName, landingData, onSubmitQuery }: GetStartedProps) {
  const [currentAchiever, setCurrentAchiever] = useState(0);
  const [activeVisionIndex, setActiveVisionIndex] = useState(0);
  const [currentFaculty, setCurrentFaculty] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const getItemsPerView = (section: 'faculty' | 'achievers') => {
    if (typeof window === 'undefined') return section === 'faculty' ? 4 : 3;
    if (window.innerWidth < 768) return 2; // mobile: 2 tiles
    if (window.innerWidth < 1024) return section === 'faculty' ? 3 : 2; // tablet: 3 faculty, 2 achievers
    return section === 'faculty' ? 4 : 3; // desktop: 4 faculty, 3 achievers
  };

  const [facultyItemsPerView, setFacultyItemsPerView] = useState(() => getItemsPerView('faculty'));
  const [achieversItemsPerView, setAchieversItemsPerView] = useState(() => getItemsPerView('achievers'));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setFacultyItemsPerView(getItemsPerView('faculty'));
      setAchieversItemsPerView(getItemsPerView('achievers'));
    };
    handleResize(); // initialize on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: '',
    message: ''
  });

  const { faculty, achievers, courses } = landingData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitQuery(formData);
    alert('Thank you! Your interest has been registered. Our team will contact you soon.');
    setFormData({ name: '', email: '', phone: '', courseId: '', message: '' });
  };

  const nextAchiever = () => {
    const limit = Math.max(1, achievers.length - achieversItemsPerView + 1);
    setCurrentAchiever((prev) => (prev + 1) % limit);
  };

  const prevAchiever = () => {
    const limit = Math.max(1, achievers.length - achieversItemsPerView + 1);
    setCurrentAchiever((prev) => (prev - 1 + limit) % limit);
  };

  const shouldPaginateAchievers = achievers.length > achieversItemsPerView;

  const nextFaculty = () => {
    const limit = Math.max(1, faculty.length - facultyItemsPerView + 1);
    setCurrentFaculty((prev) => (prev + 1) % limit);
  };

  const prevFaculty = () => {
    const limit = Math.max(1, faculty.length - facultyItemsPerView + 1);
    setCurrentFaculty((prev) => (prev - 1 + limit) % limit);
  };

  const shouldPaginateFaculty = faculty.length > facultyItemsPerView;

  // Autoplay functionality - Achievers (0.5s transition + 2s gap = 2.5s total)
  useEffect(() => {
    const timer = setInterval(() => {
      if (shouldPaginateAchievers) nextAchiever();
    }, 2500); 
    return () => clearInterval(timer);
  }, [shouldPaginateAchievers, achievers.length, achieversItemsPerView]);

  // Autoplay functionality - Faculty (0.5s transition + 3s gap = 3.5s total)
  useEffect(() => {
    const timer = setInterval(() => {
      if (shouldPaginateFaculty) nextFaculty();
    }, 3500); 
    return () => clearInterval(timer);
  }, [shouldPaginateFaculty, faculty.length, facultyItemsPerView]);

  return (
    <div className="footer-reveal-page min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
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

      <div className="footer-reveal-main">
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm md:text-base md:gap-2 md:px-6 md:py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <LogIn className="w-4 h-4 md:w-5 md:h-5 text-white" />
              Login
            </button>
          </div>

          <img
            src={logo}
            alt="UJAAS Logo"
            className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 object-contain"
          />
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span style={{ color: 'rgb(159, 28, 13)' }}>
              UJAAS Career Institute
            </span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4 md:px-0">
            We Believe in Excellence, Because It's All About a Bright Future
          </p>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="pb-8 pt-0 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                The Vision
              </span>
            </h2>
          </div>
          
          <div className="relative">
            {landingData.visions && landingData.visions.length > 0 ? (
              <>
                <div className="overflow-hidden py-10 -my-10">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${activeVisionIndex * 100}%)` }}
                  >
                    {landingData.visions.map((vision) => (
                      <div key={vision.id} className="w-full flex-shrink-0 px-4">
                        <div 
                          className="bg-gradient-to-br from-teal-50 to-cyan-50 overflow-hidden shadow-xl border border-white"
                          style={{
                            borderRadius: isMobile ? '1rem' : '1.5rem',
                            display: 'flex',
                            flexDirection: 'row',
                            minHeight: isMobile ? undefined : '350px',
                          }}
                        >
                          {/* Left Section - Image & Name */}
                          <div 
                            className="bg-white/50 overflow-hidden"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              flexShrink: 0,
                              width: isMobile ? '35%' : '25%',
                              maxWidth: isMobile ? '35%' : '25%',
                              borderRight: '1px solid rgb(204 251 241)',
                            }}
                          >
                            <div 
                              className="w-full bg-white/30 overflow-hidden"
                              style={{
                                height: isMobile ? '8rem' : undefined,
                                flex: isMobile ? undefined : '1 1 0%',
                                flexShrink: 0,
                              }}
                            >
                              <img 
                                src={vision.image} 
                                alt={vision.name} 
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'top' }}
                              />
                            </div>
                            <div 
                              className="text-center flex flex-col justify-center"
                              style={{
                                padding: isMobile ? '0.5rem 0.25rem' : '0.75rem',
                                flexGrow: 0,
                                flexShrink: 0,
                                marginTop: 'auto',
                              }}
                            >
                              <h3 
                                className="font-bold text-gray-900 leading-tight"
                                style={{
                                  fontSize: isMobile ? '0.7rem' : '0.875rem',
                                  marginBottom: '0.125rem',
                                }}
                              >{vision.name}</h3>
                              <p 
                                className="text-teal-600 font-semibold"
                                style={{ fontSize: isMobile ? '9px' : '0.6875rem' }}
                              >{vision.designation}</p>
                            </div>
                          </div>
                          
                          {/* Right Section - Quote */}
                          <div 
                            className="flex flex-col justify-center relative overflow-hidden"
                            style={{
                              width: isMobile ? '65%' : '75%',
                              padding: isMobile ? '0.75rem' : '2.5rem',
                              minWidth: 0,
                            }}
                          >
                            <div 
                              className="relative z-10 text-gray-700 italic font-serif"
                              style={{
                                fontSize: isMobile ? '11px' : '1.25rem',
                                lineHeight: isMobile ? '1.5' : '1.75',
                                textAlign: isMobile ? 'left' : 'left',
                                paddingLeft: isMobile ? '0.25rem' : '1.25rem',
                                paddingRight: isMobile ? '0.25rem' : '1.25rem',
                                paddingTop: isMobile ? '0.25rem' : '0.75rem',
                                paddingBottom: isMobile ? '0.25rem' : '0.75rem',
                              }}
                            >
                              {/* Inline Opening Quote */}
                              <span 
                                className="inline-block align-top"
                                style={{ 
                                  color: 'rgb(0 138 225 / 0.4)',
                                  width: isMobile ? '0.75rem' : '2rem',
                                  height: isMobile ? '0.4rem' : '1rem',
                                  marginRight: isMobile ? '0.25rem' : '0.375rem',
                                  marginTop: isMobile ? '-0.125rem' : '-0.25rem',
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"></path>
                                </svg>
                              </span>
                              
                              {vision.vision}
                              
                              {/* Inline Closing Quote */}
                              <span 
                                className="inline-block align-bottom"
                                style={{ 
                                  color: 'rgb(0 138 225 / 0.4)',
                                  width: isMobile ? '0.75rem' : '2rem',
                                  height: isMobile ? '0.4rem' : '1rem',
                                  marginLeft: isMobile ? '0.25rem' : '0.375rem',
                                  marginBottom: isMobile ? '-0.125rem' : '-0.25rem',
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                  <path d="M19.417 6.679C20.447 7.773 21 9 21 10.989c0 3.5-2.457 6.637-6.03 8.188l-.893-1.378c3.335-1.804 3.987-4.145 4.247-5.621-.537.278-1.24.375-1.929.311-1.804-.167-3.226-1.648-3.226-3.489a3.5 3.5 0 0 1 3.5-3.5c1.073 0 2.099.49 2.748 1.179zm-10 0C10.447 7.773 11 9 11 10.989c0 3.5-2.457 6.637-6.03 8.188l-.893-1.378c3.335-1.804 3.987-4.145 4.247-5.621-.537.278-1.24.375-1.929.311C4.591 12.322 3.17 10.841 3.17 9a3.5 3.5 0 0 1 3.5-3.5c1.073 0 2.099.49 2.748 1.179z"></path>
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {landingData.visions.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveVisionIndex(prev => prev === 0 ? landingData.visions.length - 1 : prev - 1)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-12 p-1.5 md:p-3 bg-white rounded-full shadow-lg border border-gray-100 text-teal-600 hover:text-teal-700 transition-all z-20"
                    >
                      <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                    </button>
                    <button
                      onClick={() => setActiveVisionIndex(prev => prev === landingData.visions.length - 1 ? 0 : prev + 1)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-12 p-1.5 md:p-3 bg-white rounded-full shadow-lg border border-gray-100 text-teal-600 hover:text-teal-700 transition-all z-20"
                    >
                      <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                    </button>
                    
                    <div className="flex justify-center gap-2 mt-3 mb-3">
                      {landingData.visions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveVisionIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            activeVisionIndex === idx ? 'bg-teal-600 w-8' : 'bg-gray-300 w-2'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 italic">No vision entries added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500" style={isMobile ? { paddingTop: '1.5rem', paddingBottom: '1.5rem' } : undefined}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4 md:mb-6" style={isMobile ? { marginBottom: '0.75rem' } : undefined}>
            <h2 className="text-2xl md:text-4xl font-bold text-white">{isMobile ? 'Admissions Open' : 'Admissions Open'}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" style={isMobile ? { gap: '0.75rem' } : undefined}>
            {courses.map((course, idx) => (
              <div
                key={course.id || idx}
                className="bg-white rounded-xl p-4 md:p-6 text-center shadow-lg"
                style={isMobile ? { padding: '0.625rem' } : undefined}
              >
                <BookOpen className="w-6 h-6 md:w-5 md:h-5 text-teal-600 mx-auto mb-2 md:mb-3" style={isMobile ? { width: '1rem', height: '1rem', marginBottom: '0.25rem' } : undefined} />
                <h3 className="font-bold text-gray-900 text-base md:text-xl leading-tight" style={isMobile ? { fontSize: '0.875rem', lineHeight: '1.4' } : undefined}>{course.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Our Expert Faculty
              </span>
            </h2>
            <p className="text-sm md:text-lg text-gray-600">Learn from the Best in the Field</p>
          </div>

          <div className="relative max-w-7xl mx-auto">
            {shouldPaginateFaculty && (
              <>
                <button
                  onClick={prevFaculty}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-6 h-6 text-teal-600" />
                </button>

                <button
                  onClick={nextFaculty}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-6 h-6 text-teal-600" />
                </button>
              </>
            )}

            {/* Unified Viewports Carousel - Faculty */}
            {faculty.length > 0 && (
              <div className="overflow-hidden w-full px-2">
                <div 
                  className="flex"
                  style={{ 
                    transition: 'transform 0.5s linear',
                    width: `${(faculty.length / facultyItemsPerView) * 100}%`,
                    transform: `translateX(-${currentFaculty * (100 / faculty.length)}%)` 
                  }}
                >
                  {faculty.map((member, idx) => (
                    <div key={`${member.name}-${idx}`} className="px-2 md:px-3 lg:px-4" style={{ width: `${100 / faculty.length}%` }}>
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition flex flex-col h-full bg-white">
                        <div className="aspect-square bg-gradient-to-br from-teal-200 to-cyan-200 overflow-hidden shrink-0">
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3 md:p-6 flex-grow flex flex-col justify-center text-center md:text-left">
                          <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-0.5 md:mb-1">{member.name}</h3>
                          <p className="text-teal-600 text-xs md:text-base font-semibold mb-1 md:mb-2">{member.subject}</p>
                          <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">{member.designation}</p>
                          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-700 mt-auto justify-center md:justify-start">
                            <Award className="w-3 h-3 md:w-4 md:h-4 text-cyan-600 shrink-0" />
                            <span className="truncate">{member.experience}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Dots */}
            {shouldPaginateFaculty && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: Math.max(1, faculty.length - facultyItemsPerView + 1) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentFaculty(idx)}
                    className={`h-2 rounded-full ${
                      currentFaculty === idx ? 'w-8 bg-teal-600' : 'w-2 bg-gray-300'
                    }`}
                    style={{ transition: 'all 0.5s linear' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Our Achievers
              </span>
            </h2>
            <p className="text-sm md:text-lg text-gray-600">Success Stories from UJAAS</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {shouldPaginateAchievers && (
              <>
                <button
                  onClick={prevAchiever}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-6 h-6 text-teal-600" />
                </button>

                <button
                  onClick={nextAchiever}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-6 h-6 text-teal-600" />
                </button>
              </>
            )}

            {achievers.length > 0 ? (
              <>
            {/* Unified Viewports Carousel - Achievers */}
            {achievers.length > 0 && (
              <div className="overflow-hidden w-full px-2">
                <div 
                  className="flex"
                  style={{ 
                    transition: 'transform 0.5s linear',
                    width: `${(achievers.length / achieversItemsPerView) * 100}%`,
                    transform: `translateX(-${currentAchiever * (100 / achievers.length)}%)` 
                  }}
                >
                  {achievers.map((achiever, idx) => (
                    <div key={`${achiever.name}-${idx}`} className="px-2 md:px-3" style={{ width: `${100 / achievers.length}%` }}>
                      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full bg-white">
                        <div className="aspect-square bg-gradient-to-br from-teal-200 to-cyan-200 shrink-0">
                          <img
                            src={achiever.image}
                            alt={achiever.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3 md:p-5 flex-grow flex flex-col justify-center text-center md:text-left">
                          <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-0.5 md:mb-1">{achiever.name}</h3>
                          <p className="text-teal-600 text-xs md:text-base font-semibold mb-1 md:mb-2">{achiever.achievement}</p>
                          {achiever.year?.trim() ? (
                            <div className="inline-flex items-center gap-1 md:gap-2 text-xs md:text-base font-bold text-cyan-600 mt-auto justify-center md:justify-start">
                              <Calendar className="w-3 h-3 md:w-5 md:h-5 shrink-0" />
                              <span className="truncate">Year: {achiever.year}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shouldPaginateAchievers && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: Math.max(1, achievers.length - achieversItemsPerView + 1) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentAchiever(idx)}
                    className={`h-2 rounded-full ${
                      currentAchiever === idx ? 'w-8 bg-teal-600' : 'w-2 bg-gray-300'
                    }`}
                    style={{ transition: 'all 0.5s linear' }}
                  />
                ))}
              </div>
            )}
              </>
            ) : (
              <div className="text-center py-8 bg-white rounded-2xl shadow-xl">
                <p className="text-gray-500 italic">No achievers added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Register Your Interest
              </span>
            </h2>
            <p className="text-sm md:text-lg text-gray-600">Fill the form below and we'll contact you soon</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
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
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
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
                Submit Interest
              </button>
            </div>
          </form>

        </div>
      </section>

      </div>
      <Footer />
    </div>
  );
}
