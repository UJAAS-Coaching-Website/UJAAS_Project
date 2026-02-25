import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/logo.svg';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <h3 className="text-2xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                UJAAS
              </h3>
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              UJAAS CAREER INSTITUTE
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, link: '#', color: 'hover:text-blue-400' },
                { icon: Twitter, link: '#', color: 'hover:text-sky-400' },
                { icon: Instagram, link: '#', color: 'hover:text-pink-400' },
                { icon: Linkedin, link: '#', color: 'hover:text-blue-500' },
                { icon: Youtube, link: '#', color: 'hover:text-red-500' }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  whileHover={{ scale: 1.2}}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center ${social.color} transition-all hover:bg-white/20`}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>


          {/* Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold text-lg mb-4 text-white">Our Courses</h4>
            <ul className="space-y-2 text-sm">
              {[
                'JEE (Mains+Advanced)',
                'NEET',
                'Foundation Courses',
                'Boards',
                'GUJCET'
              ].map((course, index) => (
                <li key={index}>
                  <motion.a
                    href="#"
                    whileHover={{ x: 5 }}
                    className="text-gray-300 hover:text-white transition-all flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {course}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Our Locations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold text-lg mb-4 text-white">Our Locations</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>6/D, Shankeshwar Society, Near Kaliyawadi Bridge, Grid Road, Junathana, Navsari - 396445, Gujarat</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Somnath Tower, Opp. L.M.P. School, Bilimora - Chikhli Road, Bilimora - 396321, Gujarat</span>
              </li>
            </ul>
          </motion.div>

          {/* Our Locations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold text-lg mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3 text-sm">

             <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                VP Sir
                <a href="tel:+919904562526" className="hover:text-white transition">
                  +91 99045 62526
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                AK Sir
                <a href="tel:+917983184044" className="hover:text-white transition">
                  +91 79831 84044
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                KA Sir
                <a href="tel:+918630370169" className="hover:text-white transition">
                  +91 86303 70169
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <a href="mailto:ujas2.0.nvs@gmail.com" className="hover:text-white transition">
                  ujas2.0.nvs@gmail.com
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} UJAAS Coaching Center. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white transition"
              >
                Privacy Policy
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white transition"
              >
                Terms of Service
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="text-gray-400 hover:text-white transition"
              >
                Cookie Policy
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}