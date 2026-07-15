import React, { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ship, Anchor, Shield, FileText, Calculator, BarChart3, 
  ArrowRight, Play, Check, X, Star, ChevronRight, 
  Globe2, Zap, Clock, Calendar, Lock, Users, Activity,
  Facebook, Twitter, Linkedin, Instagram, ChevronDown, Plus, Minus,
  Mail, Phone, MapPin, Menu
} from 'lucide-react';

interface LandingViewProps {
  onLoginClick: (role?: string) => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

function StatCounter({ end, label }: { end: string, label: string }) {
  return (
    <motion.div 
      variants={fadeInUp}
      className="flex flex-col items-center justify-center p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10"
    >
      <span className="text-4xl md:text-5xl font-serif font-extrabold text-white mb-2">{end}</span>
      <span className="text-sm font-medium text-slate-300 tracking-wide uppercase">{label}</span>
    </motion.div>
  );
}

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="text-lg font-bold text-slate-900">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-[#6C4CE1] shrink-0" /> : <Plus className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const AnimatedCounter = ({ end, suffix = "", prefix = "" }: { end: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) {
      const duration = 2000;
      const startTime = performance.now();
      
      const updateCounter = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        
        setCount(Math.floor(ease * end));
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    }
  }, [inView, end]);

  return <div ref={nodeRef} className="inline-block">{prefix}{count}{suffix}</div>;
};

export default function LandingView({ onLoginClick }: LandingViewProps) {

  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [navDropdown, setNavDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFormSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate network delay for the UI animation while the form submits to the hidden iframe
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#6C4CE1]/20 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo dark={!scrolled} className="scale-90 lg:scale-100" />
          
          <div className="lg:hidden flex items-center space-x-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-200 hover:bg-white/10'}`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            <div 
              className="relative group"
              onMouseEnter={() => setNavDropdown('Services')}
              onMouseLeave={() => setNavDropdown(null)}
            >
              <button className={`flex items-center space-x-1 text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-[#6C4CE1]' : 'text-slate-300 hover:text-white'}`}>
                <span>Services</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {navDropdown === 'Services' && (
                <div className="absolute top-full left-0 pt-2 w-48 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-2">
                    <button onClick={() => handleNavClick('agents')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Port Agent</button>
                    <button onClick={() => handleNavClick('agents')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Ship Agent</button>
                    <button onClick={() => handleNavClick('agents')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Protective Agent</button>
                  </div>
                </div>
              )}
            </div>

            <div 
              className="relative group"
              onMouseEnter={() => setNavDropdown('Company')}
              onMouseLeave={() => setNavDropdown(null)}
            >
              <button className={`flex items-center space-x-1 text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-[#6C4CE1]' : 'text-slate-300 hover:text-white'}`}>
                <span>Company</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {navDropdown === 'Company' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                  <button onClick={() => handleNavClick('about')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">About us</button>
                  <a href="#" className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Careers</a>
                  <button onClick={() => handleNavClick('faq')} className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">FAQ</button>
                </div>
              )}
            </div>

            <div 
              className="relative group"
              onMouseEnter={() => setNavDropdown('Resource')}
              onMouseLeave={() => setNavDropdown(null)}
            >
              <button className={`flex items-center space-x-1 text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-[#6C4CE1]' : 'text-slate-300 hover:text-white'}`}>
                <span>Resource</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {navDropdown === 'Resource' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                  <a href="#" className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Blogs</a>
                  <a href="#" className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Webinars</a>
                  <a href="#" className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Case Studies</a>
                  <a href="#" className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#6C4CE1]">Technical Docs</a>
                </div>
              )}
            </div>

            <button onClick={() => handleNavClick('contact')} className={`flex items-center space-x-1 text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-[#6C4CE1]' : 'text-slate-300 hover:text-white'}`}>
              Contact Us
            </button>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setLoginOpen(!loginOpen)}
                className={`flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-full transition-colors border ${scrolled ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-white border-white/20 hover:bg-white/10'}`}
              >
                <span>Log In</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>

              <AnimatePresence>
                {loginOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 flex flex-col space-y-1 z-50"
                  >
                    <button onClick={() => onLoginClick('SHIP_AGENT')} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl text-left transition-colors group">
                      <div className="bg-[#F2EFFF] p-2.5 rounded-lg text-[#6C4CE1] group-hover:scale-110 transition-transform"><Ship className="w-5 h-5"/></div>
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">Ship Agent</span>
                        <span className="block text-xs text-slate-500">Manage fleet operations</span>
                      </div>
                    </button>
                    <button onClick={() => onLoginClick('PORT_AGENT')} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl text-left transition-colors group">
                      <div className="bg-[#F2EFFF] p-2.5 rounded-lg text-[#6C4CE1] group-hover:scale-110 transition-transform"><Anchor className="w-5 h-5"/></div>
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">Port Agent</span>
                        <span className="block text-xs text-slate-500">Coordinate port calls</span>
                      </div>
                    </button>
                    <button onClick={() => onLoginClick('PROTECTIVE_AGENT')} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl text-left transition-colors group">
                      <div className="bg-[#F2EFFF] p-2.5 rounded-lg text-[#6C4CE1] group-hover:scale-110 transition-transform"><Shield className="w-5 h-5"/></div>
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">Protective Agent</span>
                        <span className="block text-xs text-slate-500">Protect principal interests</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavClick('contact')}
              className={`text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-lg ${scrolled ? 'bg-[#6C4CE1] text-white hover:bg-[#5839C6] shadow-[#6C4CE1]/20' : 'bg-white text-[#6C4CE1] hover:bg-slate-50'}`}
            >
              Request Demo
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[70px] left-0 w-full bg-white shadow-xl z-40 border-b border-slate-200 lg:hidden overflow-hidden"
          >
            <div className="p-6 flex flex-col space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Services</p>
                <div className="flex flex-col space-y-3 pl-2">
                  <button onClick={() => { setMobileMenuOpen(false); handleNavClick('agents'); }} className="text-left font-semibold text-slate-700">Port Agent</button>
                  <button onClick={() => { setMobileMenuOpen(false); handleNavClick('agents'); }} className="text-left font-semibold text-slate-700">Ship Agent</button>
                  <button onClick={() => { setMobileMenuOpen(false); handleNavClick('agents'); }} className="text-left font-semibold text-slate-700">Protective Agent</button>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company</p>
                <div className="flex flex-col space-y-3 pl-2">
                  <button onClick={() => { setMobileMenuOpen(false); handleNavClick('about'); }} className="text-left font-semibold text-slate-700">About us</button>
                  <button onClick={() => { setMobileMenuOpen(false); handleNavClick('faq'); }} className="text-left font-semibold text-slate-700">FAQ</button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Log In</p>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => onLoginClick('SHIP_AGENT')} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl text-left">
                    <div className="bg-[#F2EFFF] p-2 rounded-lg text-[#6C4CE1]"><Ship className="w-4 h-4"/></div>
                    <span className="font-bold text-slate-900 text-sm">Ship Agent</span>
                  </button>
                  <button onClick={() => onLoginClick('PORT_AGENT')} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl text-left">
                    <div className="bg-[#F2EFFF] p-2 rounded-lg text-[#6C4CE1]"><Anchor className="w-4 h-4"/></div>
                    <span className="font-bold text-slate-900 text-sm">Port Agent</span>
                  </button>
                  <button onClick={() => onLoginClick('PROTECTIVE_AGENT')} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl text-left">
                    <div className="bg-[#F2EFFF] p-2 rounded-lg text-[#6C4CE1]"><Shield className="w-4 h-4"/></div>
                    <span className="font-bold text-slate-900 text-sm">Protective Agent</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main>
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-40 overflow-hidden bg-slate-950 min-h-[90vh] flex items-center justify-center">
          {/* Reverted Hero Background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8 shadow-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B70ED] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B70ED]"></span>
                </span>
                <span>Trusted by Maritime Agencies Across Africa</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight text-white mb-8 leading-[1.1] drop-shadow-2xl">
                Run Every Port Call <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B70ED] to-[#bcaefe]">From One Intelligent Workspace.</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-xl lg:text-2xl text-slate-300 max-w-3xl mb-12 leading-relaxed font-medium">
                Oneport Agenc unifies vessel operations, laytime calculations, crew management, expenses, disbursements, documentation and reporting into one beautiful platform.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 w-full">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavClick('contact')}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#6C4CE1] text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-[#5839C6] transition-colors shadow-[0_0_40px_rgba(108,76,225,0.4)] border border-[#8B70ED]/50"
                >
                  <span>Request Demo</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <motion.a 
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-full font-bold text-lg transition-colors"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>Watch Overview</span>
                </motion.a>
              </motion.div>

              <motion.div variants={fadeInUp} className="w-full mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="text-4xl md:text-5xl font-serif font-black text-white mb-2"><AnimatedCounter end={150} suffix="+" /></div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Ports</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="text-4xl md:text-5xl font-serif font-black text-white mb-2"><AnimatedCounter end={98} suffix="%" /></div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Faster Operations</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="text-4xl md:text-5xl font-serif font-black text-white mb-2"><AnimatedCounter end={50} suffix="k+" /></div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Documents</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="text-4xl md:text-5xl font-serif font-black text-white mb-2"><AnimatedCounter end={24} suffix="/7" /></div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Availability</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Trusted Companies */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Built for Modern Maritime Operations</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center space-x-2"><Shield className="w-8 h-8 text-slate-800"/><span className="text-xl font-black text-slate-800">OCEANIC</span></div>
              <div className="flex items-center space-x-2"><Anchor className="w-8 h-8 text-slate-800"/><span className="text-xl font-black text-slate-800">NAVIGATOR</span></div>
              <div className="flex items-center space-x-2"><Globe2 className="w-8 h-8 text-slate-800"/><span className="text-xl font-black text-slate-800">GLOBALMERCHANT</span></div>
              <div className="flex items-center space-x-2"><Ship className="w-8 h-8 text-slate-800"/><span className="text-xl font-black text-slate-800">SEALINE</span></div>
              <div className="flex items-center space-x-2"><Zap className="w-8 h-8 text-slate-800"/><span className="text-xl font-black text-slate-800">NEXUS MARINE</span></div>
            </div>
          </div>
        </section>

                {/* About Us Section */}
        <section id="about" className="py-32 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Pioneering <span className="text-[#6C4CE1]">maritime software</span> for the modern era</h2>
                <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                  At Oneport Agenc, we are dedicated to transforming how maritime operations are managed globally. 
                  Our mission is to eliminate the friction in port call management by bridging the gap between Ship Agents, 
                  Port Agents, and Protective Agents.
                </p>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                  Founded by maritime professionals and technologists, we understand the complexities of laytime calculations, 
                  disbursement accounting, and real-time vessel coordination. We build software that works the way you do—just faster, 
                  smarter, and fully connected.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-4xl font-serif font-black text-[#6C4CE1] mb-2">10k+</div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Port Calls Managed</div>
                  </div>
                  <div>
                    <div className="text-4xl font-serif font-black text-[#6C4CE1] mb-2">50+</div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Countries Supported</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6C4CE1] to-purple-600 rounded-3xl transform rotate-3 opacity-20"></div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative z-10">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-[#F2EFFF] rounded-xl flex items-center justify-center text-[#6C4CE1]">
                      <Anchor className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Our Vision</h3>
                      <p className="text-slate-500 text-sm">A fully connected maritime ecosystem</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-slate-700">Unified workflow for all maritime stakeholders</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-slate-700">Real-time data synchronization across oceans</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-slate-700">Automated financial disbursements & laytime docs</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-slate-700">Industry-leading security and compliance standards</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agents Breakdown Section */}
        <section id="agents" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Built for every <span className="text-[#6C4CE1]">maritime operator</span></h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Oneport Agenc adapts to your role, providing the exact tools you need to succeed.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                <div className="w-14 h-14 bg-[#F2EFFF] rounded-2xl flex items-center justify-center text-[#6C4CE1] mb-6">
                  <Ship className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Ship Agents</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  As the vessel owner's representative, you need complete visibility. Our system helps you manage fleet operations, track expenses globally, and generate beautiful SOA reports instantly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Full fleet overview</li>
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Instant SOA generation</li>
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Multi-port tracking</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                <div className="w-14 h-14 bg-[#F2EFFF] rounded-2xl flex items-center justify-center text-[#6C4CE1] mb-6">
                  <Anchor className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Port Agents</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Coordinate port calls with precision. Generate PDAs, manage laytime calculations automatically, and handle local services and clearances all in one workflow.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Automated Laytime</li>
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> PDA / FDA generation</li>
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Real-time SOF tracking</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                <div className="w-14 h-14 bg-[#F2EFFF] rounded-2xl flex items-center justify-center text-[#6C4CE1] mb-6">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Protective Agents</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Protect your principal's interests with powerful auditing tools. Review SOFs, dispute laytime calculations, and audit disbursement accounts securely within the platform.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Secure document auditing</li>
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Laytime dispute resolution</li>
                  <li className="flex items-center text-sm font-medium text-slate-700"><Check className="w-4 h-4 text-emerald-500 mr-2"/> Principal reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">Everything you need to <br/><span className="text-[#6C4CE1]">scale your agency</span></h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">A comprehensive suite of tools perfectly engineered for the complexities of maritime logistics.</p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                { icon: Ship, title: "1. Vessel Operations", desc: "Track vessels in real-time, manage ETAs, and coordinate port services flawlessly." },
                { icon: Anchor, title: "2. Port Call Management", desc: "End-to-end workflow for every port call, from appointment to departure." },
                { icon: Calculator, title: "3. Laytime Calculator", desc: "Automated laytime logic with built-in rules for weather, weekends, and holidays." },
                { icon: Clock, title: "4. Demurrage Engine", desc: "Instantly calculate despatch or demurrage with precision accuracy." },
                { icon: FileText, title: "5. Expense Management", desc: "Generate Proforma and Final Disbursement Accounts (PDAs & FDAs) instantly." },
                { icon: BarChart3, title: "6. Reports & Analytics", desc: "Beautifully formatted SOFs and performance reports for your principals." }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(108, 76, 225, 0.15)" }}
                  className="bg-white p-10 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F2EFFF] to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-150 duration-500"></div>
                  
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C4CE1] to-[#8B70ED] flex items-center justify-center text-white mb-8 shadow-lg shadow-[#6C4CE1]/30">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="relative z-10 text-2xl font-bold text-slate-900 mb-4 group-hover:text-[#6C4CE1] transition-colors">{feature.title}</h3>
                  <p className="relative z-10 text-slate-600 leading-relaxed text-lg">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-slate-500">Everything you need to know about Oneport Agenc.</p>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[
                { q: "Is Oneport Agenc suitable for small agencies?", a: "Absolutely. Oneport Agenc is designed to scale from a single user managing a few port calls a month to large enterprise fleets handling thousands." },
                { q: "Does the laytime calculator handle complex weather terms?", a: "Yes, our laytime engine automatically calculates weather interruptions, weekends, holidays, and specific charter party terms with precision." },
                { q: "Can I generate PDF disbursements?", a: "Yes, you can generate beautiful, accurate PDAs and FDAs in one click, ready to be sent to your principals." },
                { q: "How secure is our data?", a: "We use enterprise-grade encryption for all data at rest and in transit. Your agency's data is siloed and completely secure." },
              ].map((faq, idx) => (
                <motion.div key={idx} variants={fadeInUp}>
                  <FAQItem question={faq.q} answer={faq.a} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Get in touch</h2>
                <p className="text-xl text-slate-600 mb-12">Our team of maritime experts is ready to help you streamline your agency operations.</p>
                
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-[#F2EFFF] p-4 rounded-2xl text-[#6C4CE1]">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Email us</h4>
                      <p className="text-slate-500 mb-2">Our friendly team is here to help.</p>
                      <a href="mailto:hello@oneportagenc.com" className="text-[#6C4CE1] font-semibold hover:underline">hello@oneportagenc.com</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-[#F2EFFF] p-4 rounded-2xl text-[#6C4CE1]">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Visit us</h4>
                      <p className="text-slate-500 mb-2">Come say hello at our office HQ.</p>
                      <p className="text-slate-900 font-semibold">100 Maritime Way, Lagos, Nigeria</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-[#F2EFFF] p-4 rounded-2xl text-[#6C4CE1]">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">Call us</h4>
                      <p className="text-slate-500 mb-2">Mon-Fri from 8am to 5pm.</p>
                      <a href="tel:+2348133860143" className="text-[#6C4CE1] font-semibold hover:underline">+2348133860143</a>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl"
              >
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center space-y-4 py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                      <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Message Sent!</h3>
                    <p className="text-slate-600 max-w-sm">
                      Thank you for reaching out. Our team will get back to you shortly.
                    </p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="mt-6 text-[#6C4CE1] font-semibold hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form className="space-y-6" action="https://formsubmit.co/adelekejohndavid@gmail.com" method="POST" target="hidden_iframe" onSubmit={handleFormSubmit}>
                    <iframe name="hidden_iframe" style={{ display: 'none' }}></iframe>
                    <input type="hidden" name="_captcha" value="false" />
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">First name</label>
                        <input type="text" name="firstName" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6C4CE1]/50 focus:border-[#6C4CE1] transition-all" placeholder="First name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Last name</label>
                        <input type="text" name="lastName" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6C4CE1]/50 focus:border-[#6C4CE1] transition-all" placeholder="Last name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Email</label>
                      <input type="email" name="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6C4CE1]/50 focus:border-[#6C4CE1] transition-all" placeholder="you@company.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Service Requested</label>
                      <select name="service" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6C4CE1]/50 focus:border-[#6C4CE1] transition-all appearance-none text-slate-700">
                        <option value="">Select a service...</option>
                        <option value="port_agent">Port Agent</option>
                        <option value="ship_agent">Ship Agent</option>
                        <option value="protective_agent">Protective Agent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Message</label>
                      <textarea name="message" required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6C4CE1]/50 focus:border-[#6C4CE1] transition-all" placeholder="Tell us about your needs..."></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-[#6C4CE1] text-white font-bold rounded-xl py-4 hover:bg-[#5839C6] transition-colors shadow-lg shadow-[#6C4CE1]/20 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-[#6C4CE1] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=2940&auto=format&fit=crop')] bg-cover grayscale"></div>
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">Ready to Modernize Your Maritime Operations?</h2>
            <p className="text-xl text-white/80 mb-12">Join hundreds of agencies running their port calls on Oneport Agenc.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavClick('contact')}
              className="bg-white text-[#6C4CE1] px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition-colors shadow-2xl"
            >
              Book a Demo
            </motion.button>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-950 pt-24 pb-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <Logo dark className="mb-6" />
              <p className="text-slate-500 mb-8 max-w-sm">
                The intelligent operating system for maritime agencies. Unifying port calls, finances, and reporting.
              </p>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-[#6C4CE1] hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-4">
                {['Features', 'Integrations', 'Changelog', 'Docs'].map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                <li><button onClick={() => handleNavClick('about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><button onClick={() => handleNavClick('contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4">
                {['Privacy Policy', 'Terms of Service', 'Security', 'Cookie Policy'].map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-600">
            <p>© {new Date().getFullYear()} Oneport Agenc Technology Limited. All rights reserved.</p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Globe2 className="w-4 h-4" />
              <span>English (US)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
