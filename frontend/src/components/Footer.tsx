import { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/logo.svg';

const socialLinks = [
  { icon: Facebook, link: 'https://www.facebook.com/100088932682619/', color: 'hover:text-blue-400', label: 'Facebook' },
  { icon: Instagram, link: 'https://www.instagram.com/ujas2.0careerinstitute/', color: 'hover:text-pink-400', label: 'Instagram' },
  { icon: Youtube, link: 'https://youtube.com/@ujas2.0careerinstitute?si=S7-TrfZ1Q1v4UCL-', color: 'hover:text-red-500', label: 'YouTube' },
];

const courses = [
  'JEE (Mains+Advanced)',
  'NEET',
  'Foundation Courses',
  'Boards',
  'GUJCET',
];

const locations = [
  '6/D, Shankeshwar Society, Near Kaliyawadi Bridge, Grid Road, Junathana, Navsari - 396445, Gujarat',
  'Somnath Tower, Opp. L.M.P. School, Bilimora - Chikhli Road, Bilimora - 396321, Gujarat',
];

const desktopContacts = [
  { label: 'VP Sir', href: 'tel:+919904562526', value: '+91 99045 62526' },
  { label: 'AK Sir', href: 'tel:+917983184044', value: '+91 79831 84044' },
  { label: 'KA Sir', href: 'tel:+918630370169', value: '+91 86303 70169' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 768;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  return (
    <footer className="mt-auto overflow-hidden bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 text-white">
      {isMobile ? (
        <div className="rounded-t-[2rem] bg-[linear-gradient(180deg,rgba(13,69,76,0.98)_0%,rgba(12,95,100,0.98)_100%)] px-5 py-8">
          <div className="text-center">
            <div className="mx-auto flex max-w-xs flex-col items-center">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/15">
                  <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
                </div>
                <h3 className="text-xl font-bold tracking-wide" style={{ color: 'rgb(159, 29, 14)' }}>
                  UJAAS
                </h3>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-200">
                Empowering students through quality education.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 ${social.color}`}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-200">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-blue-400" />
                <span>Delhi</span>
              </div>
              <a href="tel:+919876543210" className="flex items-center justify-center gap-2 transition hover:text-white">
                <Phone className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                <span>+91 9876543210</span>
              </a>
              <a href="mailto:info@ugas.com" className="flex items-center justify-center gap-2 transition hover:text-white">
                <Mail className="h-4 w-4 flex-shrink-0 text-teal-400" />
                <span>info@ugas.com</span>
              </a>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowMoreInfo((value) => !value)}
                aria-expanded={showMoreInfo}
                className="mx-auto flex min-h-9 w-auto min-w-36 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/14 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <span>{showMoreInfo ? 'Less Info' : 'More Info'}</span>
                {showMoreInfo ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />}
              </button>
            </div>

            {showMoreInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className="mt-7 space-y-5 border-t border-white/10 pt-6 text-left">
                  <div>
                    <h4 className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
                      Our Courses
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-200">
                      {courses.map((course) => (
                        <li key={course} className="flex items-center justify-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
                          <span>{course}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
                      Our Locations
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-200">
                      {locations.map((location) => (
                        <li key={location} className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                          <span>{location}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs text-gray-400">
                © {currentYear} UJAAS. All rights reserved.
              </p>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                <a href="#" className="transition hover:text-white">
                  Privacy
                </a>
                <a href="#" className="transition hover:text-white">
                  Terms
                </a>
                <a href="#" className="transition hover:text-white">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
                <h3 className="text-2xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                  UJAAS
                </h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-300">
                UJAAS CAREER INSTITUTE
              </p>
              <p className="mb-4 text-sm leading-relaxed text-gray-300">
                We Believe In Excellence
              </p>
              <p className="mb-4 text-sm leading-relaxed text-gray-300">
                Because It&apos;s All About A Bright Future
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 ${social.color}`}
                  >
                    <social.icon className="h-4 w-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="mb-4 text-lg font-semibold text-white">Our Courses</h4>
              <ul className="space-y-2 text-sm">
                {courses.map((course) => (
                  <li key={course}>
                    <motion.a
                      href="#"
                      className="group flex items-center gap-2 text-gray-300 transition-all hover:text-white"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      {course}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="mb-4 text-lg font-semibold text-white">Our Locations</h4>
              <ul className="space-y-3 text-sm">
                {locations.map((location) => (
                  <li key={location} className="flex items-start gap-3 text-gray-300">
                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                    <span>{location}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="mb-4 text-lg font-semibold text-white">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                {desktopContacts.map((contact) => (
                  <li key={contact.href} className="flex items-center gap-3 text-gray-300">
                    <Phone className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                    {contact.label}
                    <a href={contact.href} className="transition hover:text-white">
                      {contact.value}
                    </a>
                  </li>
                ))}
                <li className="flex items-center gap-3 text-gray-300">
                  <Mail className="h-5 w-5 flex-shrink-0 text-teal-400" />
                  <a href="mailto:ujas2.0.nvs@gmail.com" className="transition hover:text-white">
                    ujas2.0.nvs@gmail.com
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 border-t border-white/10 pt-8"
          >
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <p className="text-sm text-gray-400">
                © {currentYear} UJAAS Career Institute. All rights reserved.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </footer>
  );
}
