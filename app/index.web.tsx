import React, { useEffect, useRef } from 'react';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

// Resolve local asset URIs for use in HTML <img> tags
const MASCOT = {
  neutral: Image.resolveAssetSource(require('../assets/daruma-no-bg/daruma-neutral-no-bg.png')).uri,
  neutralBlink: Image.resolveAssetSource(require('../assets/daruma-no-bg/daruma-neutral-blink-no-bg.png')).uri,
  happy: Image.resolveAssetSource(require('../assets/daruma-no-bg/daruma-happy-no-bg.png')).uri,
  sad: Image.resolveAssetSource(require('../assets/daruma-no-bg/daruma-sad-no-bg.png')).uri,
};

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCTA = () => {
    if (isSignedIn) {
      router.replace('/(tabs)');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/sign-in' as any);
    }
  };

  // Allow body scrolling (ScrollViewStyleReset sets overflow:hidden globally)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Mascot parallax + idle behaviour (mirrors the original Stitch script)
  useEffect(() => {
    const heroSection = document.getElementById('hero-section') as HTMLElement | null;
    const mascotWrapper = document.getElementById('mascot-wrapper') as HTMLElement | null;
    const mascotNeutral = document.getElementById('mascot-neutral') as HTMLElement | null;
    const mascotSad = document.getElementById('mascot-sad') as HTMLElement | null;
    const mascotBlinkOverlay = document.getElementById('mascot-blink-overlay') as HTMLElement | null;
    const mascotHitbox = document.getElementById('mascot-hitbox') as HTMLElement | null;

    if (!heroSection || !mascotWrapper || !mascotNeutral || !mascotSad || !mascotBlinkOverlay || !mascotHitbox) return;

    let isHoveringMascot = false;

    const resetToSad = () => {
      if (!isHoveringMascot) {
        mascotNeutral.style.opacity = '0';
        mascotBlinkOverlay.style.opacity = '0';
        mascotSad.style.opacity = '1';
        mascotWrapper.style.transform = 'translate(0px, 0px)';
      }
    };

    const wakeUp = () => {
      if (!isHoveringMascot) {
        mascotSad.style.opacity = '0';
        mascotNeutral.style.opacity = '1';
        mascotBlinkOverlay.style.opacity = '1';
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(resetToSad, 5000);
    };

    const onMouseMove = (e: MouseEvent) => {
      wakeUp();
      if (!isHoveringMascot) {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        mascotWrapper.style.transform = `translate(${-xAxis}px, ${-yAxis}px)`;
      }
    };

    const onMouseLeave = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      resetToSad();
    };

    const onMascotEnter = () => {
      isHoveringMascot = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      mascotWrapper.style.transform = 'translate(0px, 0px) scale(1.05)';
      mascotSad.style.opacity = '0';
      mascotBlinkOverlay.style.opacity = '0';
    };

    const onMascotLeave = () => {
      isHoveringMascot = false;
      mascotWrapper.style.transform = 'translate(0px, 0px) scale(1)';
      wakeUp();
    };

    heroSection.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    mascotHitbox.addEventListener('mouseenter', onMascotEnter);
    mascotHitbox.addEventListener('mouseleave', onMascotLeave);

    idleTimerRef.current = setTimeout(resetToSad, 5000);

    return () => {
      heroSection.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      mascotHitbox.removeEventListener('mouseenter', onMascotEnter);
      mascotHitbox.removeEventListener('mouseleave', onMascotLeave);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-washi-paper text-sumi-ink overflow-x-hidden antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed z-50 top-0 w-full bg-surface/40 backdrop-blur-2xl shadow-sm transition-all duration-300 border-b border-white/20">
        <div className="flex justify-between items-center w-full px-5 md:px-8 max-w-[1200px] mx-auto h-20">
          <div className="text-2xl font-bold text-hanko-red tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined">water_drop</span>
            fudami
          </div>
          <div className="hidden md:flex gap-8 items-center bg-white/30 px-6 py-2 rounded-full border border-white/40 backdrop-blur-md">
            {(['Learn', 'Roadmap', 'Pricing', 'About'] as const).map((label) => (
              <a
                key={label}
                className="text-sumi-ink-muted hover:text-hanko-red hover:scale-95 transition-all duration-200 text-base"
                href={`#${label.toLowerCase()}`}
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              className="text-base font-bold text-hanko-red hover:scale-95 transition-transform duration-200 hidden md:block"
              onClick={handleCTA}
            >
              Sign In
            </button>
            <button
              className="text-sumi-ink hover:scale-95 transition-transform duration-200 bg-white/50 w-10 h-10 rounded-full flex items-center justify-center border border-white/60"
              onClick={handleCTA}
            >
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden" id="hero-section">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-washi-paper via-surface to-aizome-indigo-light/20">
          <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(ellipse at top right, #FCEAE9 0%, transparent 60%)' }}></div>
        </div>
        <div className="relative z-10 w-full px-5 md:px-8 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left space-y-8 p-8 md:p-0">
            <div className="inline-block px-4 py-1.5 rounded-full glass-panel text-hanko-red text-[12px] font-bold uppercase tracking-[0.1em] mb-2">Liquid Zen UI</div>
            <h1 className="text-[24px] md:text-[56px] md:leading-[64px] text-sumi-ink tracking-tight font-bold leading-8">
              Master Japanese with <span className="text-hanko-red drop-shadow-sm">fudami</span>
            </h1>
            <p className="text-lg text-sumi-ink-muted max-w-xl mx-auto md:mx-0 leading-7">
              The next-generation Spaced Repetition System. Anki's depth meets Duolingo's delightful UX, powered by the advanced FSRS algorithm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                className="bg-hanko-red text-white text-lg font-bold py-4 px-8 rounded-full hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group"
                style={{ boxShadow: '0 8px 16px rgba(232,57,41,0.3), inset 0 2px 0 rgba(255,255,255,0.2)' }}
                onClick={handleCTA}
              >
                Start Learning
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <button
                className="glass-panel text-sumi-ink text-lg py-4 px-8 rounded-full hover:bg-white/60 transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={handleCTA}
              >
                Open Web App
              </button>
            </div>
          </div>

          {/* Mascot */}
          <div className="relative h-[400px] md:h-[600px] flex justify-center items-center group cursor-pointer" id="mascot-hitbox">
            <div className="relative w-72 h-72 md:w-[450px] md:h-[450px] animate-float mascot-container" id="mascot-wrapper">
              <img alt="fudami mascot neutral" className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300 opacity-100 group-hover:opacity-0" id="mascot-neutral" src={MASCOT.neutral} />
              <img alt="fudami mascot happy" className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100" id="mascot-happy" src={MASCOT.happy} />
              <img alt="fudami mascot sad" className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-300" id="mascot-sad" src={MASCOT.sad} />
              <img alt="fudami mascot blinking" className="absolute inset-0 w-full h-full object-contain mascot-blink pointer-events-none group-hover:hidden" id="mascot-blink-overlay" src={MASCOT.neutralBlink} />
              <div className="absolute rounded-full blur-3xl -z-10 group-hover:bg-hanko-red-light/60 transition-colors duration-500 mix-blend-overlay" style={{ inset: '-2.5rem', background: 'rgba(255,255,255,0.4)' }}></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce" style={{ color: 'rgba(107,102,97,0.5)' }}>
          <span className="material-symbols-outlined text-[32px]">keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-lowest relative z-20" id="learn">
        <div className="w-full px-5 md:px-8 max-w-[1200px] mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-2xl font-semibold text-sumi-ink">The Best of Both Worlds</h2>
            <p className="text-lg text-sumi-ink-muted max-w-2xl mx-auto leading-7">We combined the rigorous science of Anki with the engaging, gamified experience of Duolingo to create a frictionless learning habit.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-10 rounded-[2.5rem] hover:-translate-y-2 transition-transform duration-500 border-t border-l border-white/80" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aizome-indigo-light to-white flex items-center justify-center mb-6 text-aizome-indigo" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-sumi-ink">Anki's Depth</h3>
              <p className="text-base text-sumi-ink-muted leading-relaxed">Under the hood, fudami leverages advanced Spaced Repetition logic. Never forget a Kanji again by reviewing it exactly when your brain is about to forget it. Deep, customizable, and scientifically proven.</p>
            </div>
            <div className="glass-panel p-10 rounded-[2.5rem] hover:-translate-y-2 transition-transform duration-500 border-t border-l border-white/80" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hanko-red-light to-white flex items-center justify-center mb-6 text-hanko-red" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>extension</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-sumi-ink">Duolingo's UX</h3>
              <p className="text-base text-sumi-ink-muted leading-relaxed">Say goodbye to utilitarian interfaces. fudami offers tactile, squishy buttons, clear visual feedback, and a persistent mascot that reacts to your streaks. Learning feels like play, not a chore.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FSRS ─────────────────────────────────────────────────────────── */}
      <section className="py-32 bg-gradient-to-b from-washi-paper to-surface-container-lowest border-y border-white/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlN2U1ZTAiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PC9zdmc+')" }}></div>
        <div className="w-full px-5 md:px-8 max-w-[1200px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/60 border border-white backdrop-blur-md text-aizome-indigo text-[12px] font-bold uppercase tracking-[0.1em] shadow-sm">Powered by FSRS</div>
              <h2 className="text-[40px] leading-[48px] font-bold text-sumi-ink">Next-Gen Memory Optimization</h2>
              <p className="text-lg text-sumi-ink-muted leading-7">fudami uses the Free Spaced Repetition Scheduler (FSRS), an algorithm that significantly outperforms traditional SM-2 models by tracking three distinct dimensions of your memory.</p>
              <div className="space-y-6 mt-8">
                {[
                  { icon: 'anchor', color: 'text-matcha-green', bg: 'from-matcha-green-light', title: 'Stability (S)', desc: 'How well the memory is entrenched. Higher stability means longer intervals between reviews.' },
                  { icon: 'psychology', color: 'text-sumi-ink', bg: 'from-surface-variant', title: 'Difficulty (D)', desc: 'Inherent complexity of the card. Difficult cards increase stability slower after a successful review.' },
                  { icon: 'history', color: 'text-aizome-indigo', bg: 'from-secondary-fixed-dim', title: 'Retrievability (R)', desc: 'The probability you can recall the card right now. fudami aims to review when R hits 90%.' },
                ].map(({ icon, color, bg, title, desc }) => (
                  <div key={title} className="glass-panel p-4 rounded-2xl flex gap-4 items-start border-white/60">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} to-white flex items-center justify-center shrink-0`} style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                      <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-sumi-ink">{title}</h4>
                      <p className="text-base text-sumi-ink-muted">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="grid grid-cols-2 gap-6 h-[450px]">
                <div className="col-span-2 glass-panel rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-end border-t border-l border-white" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-matcha-green-light flex items-center justify-center text-matcha-green">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-[80px] leading-[100px] font-bold text-sumi-ink tracking-tighter">94<span className="text-[32px] font-bold text-sumi-ink-muted leading-10">%</span></div>
                    <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-sumi-ink-muted mt-2">Average Retention</div>
                  </div>
                  <svg className="absolute bottom-0 left-0 w-full h-32 text-matcha-green/30" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'currentColor', stopOpacity: 0.5 }} />
                        <stop offset="100%" style={{ stopColor: 'currentColor', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <path d="M0,100 C20,80 40,90 60,40 C80,0 100,20 100,20 L100,100 Z" fill="url(#grad1)" />
                    <path d="M0,100 C20,80 40,90 60,40 C80,0 100,20 100,20" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="glass-panel rounded-[2rem] p-6 flex flex-col justify-center items-center text-center border-t border-l border-white shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-hanko-red-light flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[32px] text-hanko-red" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  </div>
                  <div className="text-[32px] font-bold text-sumi-ink leading-10">12 <span className="text-lg text-sumi-ink-muted font-normal">Days</span></div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-sumi-ink-muted mt-1">Streak Logic</div>
                </div>
                <div className="glass-panel rounded-[2rem] p-6 flex flex-col justify-center items-center text-center border-t border-l border-white shadow-sm bg-gradient-to-br from-white/40 to-aizome-indigo-light/20">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm border border-white">
                    <span className="material-symbols-outlined text-[32px] text-aizome-indigo">speed</span>
                  </div>
                  <div className="text-[32px] font-bold text-sumi-ink leading-10">&lt; 100<span className="text-lg text-sumi-ink-muted font-normal">ms</span></div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-sumi-ink-muted mt-1">Scheduling Speed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-container-lowest overflow-hidden" id="roadmap">
        <div className="w-full px-5 md:px-8 max-w-[1200px] mx-auto">
          <div className="mb-12">
            <h2 className="text-[32px] font-bold text-sumi-ink leading-10">The Path Forward</h2>
            <p className="text-lg text-sumi-ink-muted leading-7">Our master plan for comprehensive language mastery.</p>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-12 timeline-scroll snap-x snap-mandatory px-4 -mx-4 md:px-0 md:mx-0">
            {[
              {
                status: 'Current Phase', statusColor: 'text-matcha-green', dotBg: 'bg-matcha-green', icon: 'check',
                title: 'Vocab & Kanji Base',
                desc: 'Core SRS functionality, Wanikani integration, native drawing pad for Kanji practice, and offline mobile support.',
                tags: [{ label: 'FSRS Engine', style: 'bg-white border-white/60 text-sumi-ink' }, { label: 'Drawing', style: 'bg-white border-white/60 text-sumi-ink' }],
              },
              {
                status: 'Coming Soon', statusColor: 'text-aizome-indigo', dotBg: 'bg-aizome-indigo', icon: 'pending',
                title: 'AI Contextual Tutor',
                desc: "Generative example sentences based on your interests. Confused by a grammar point? Ask the AI for a personalized explanation.",
                tags: [{ label: 'LLM Integration', style: 'bg-aizome-indigo-light/50 border-aizome-indigo-light text-aizome-indigo' }],
              },
              {
                status: 'Future Vision (Premium)', statusColor: 'text-sumi-ink-muted', dotBg: 'bg-surface-variant', dotText: 'text-sumi-ink', icon: 'lock', opacity: 'opacity-70 hover:opacity-100 transition-opacity',
                title: 'Speaking & Expression',
                desc: 'Real-time voice recognition for pitch accent correction. Simulated shadow-boxing conversations with AI personas.',
                tags: [{ label: 'Pitch Accent', style: 'bg-hanko-red-light/50 border-hanko-red-light text-hanko-red' }, { label: 'Voice Rec', style: 'bg-white border-white/60 text-sumi-ink' }],
              },
            ].map((phase) => (
              <div key={phase.title} className={`snap-center shrink-0 w-[320px] md:w-[400px] glass-panel rounded-[2rem] p-8 border-t border-l border-white relative shadow-sm ${phase.opacity ?? ''}`}>
                <div className={`absolute -top-4 -left-4 ${phase.dotBg} ${phase.dotText ?? 'text-white'} w-10 h-10 rounded-full flex items-center justify-center border-4 border-surface-container-lowest shadow-md`}>
                  <span className="material-symbols-outlined text-[20px]">{phase.icon}</span>
                </div>
                <div className={`text-[12px] font-bold ${phase.statusColor} uppercase tracking-[0.1em] mb-3`}>{phase.status}</div>
                <h3 className="text-2xl font-semibold mb-4 text-sumi-ink">{phase.title}</h3>
                <p className="text-base text-sumi-ink-muted mb-8 leading-relaxed">{phase.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {phase.tags.map((t) => (
                    <span key={t.label} className={`px-4 py-1.5 border rounded-full text-[12px] font-bold shadow-sm ${t.style}`}>{t.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-32 bg-sumi-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-sumi-ink via-transparent to-transparent"></div>
        <div className="w-full px-5 md:px-8 max-w-[1200px] mx-auto relative z-10 text-center">
          <div className="inline-block p-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 mb-8">
            <span className="material-symbols-outlined text-[48px] text-hanko-red">water_drop</span>
          </div>
          <h2 className="text-[48px] leading-[56px] font-bold mb-6">Ready to solidify your memory?</h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-7">Join thousands of learners optimizing their Japanese studies with fudami's Liquid Zen interface.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              className="bg-hanko-red text-white text-lg font-bold py-5 px-12 rounded-full hover:scale-105 transition-all duration-300 active:scale-95"
              style={{ boxShadow: '0 8px 24px rgba(232,57,41,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' }}
              onClick={handleCTA}
            >
              Open Web App
            </button>
            <a
              className="flex items-center gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all text-base py-4 px-8 border border-transparent hover:border-white/20"
              href="https://github.com"
            >
              <span className="material-symbols-outlined">code</span>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-surface-container-lowest border-t border-washi-border pb-8" id="about">
        <div className="flex flex-col md:flex-row justify-between items-center w-full py-12 px-5 max-w-[1200px] mx-auto gap-6">
          <div className="text-[12px] font-bold text-sumi-ink-muted flex items-center gap-2 uppercase tracking-[0.1em]">
            <span className="material-symbols-outlined text-[16px] text-hanko-red">water_drop</span>
            © 2025 fudami. Crafted by Arno.
          </div>
          <div className="flex gap-8">
            {['GitHub', 'Personal Projects', 'Privacy', 'Terms'].map((label) => (
              <a key={label} className="text-[12px] font-bold uppercase tracking-[0.1em] text-sumi-ink-muted hover:text-hanko-red transition-colors" href="#">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
