"use client";
import { Brain } from 'lucide-react';
import PromptStarters from '@/components/PromptStarters';
import GeneralChat from '@/components/GeneralChat';
import JDGenerator from '@/components/JDGenerator';
import InterviewQuestionGenerator from '@/components/InterviewQuestionGenerator';
import { useRightPanelStore } from '@/stores/rightPanelStore';
import { BlobBackground } from '@/components/BlobBackground';
import { motion } from 'framer-motion';
// import { ThreeAccent } from '@/components/ThreeAccent';
// import { ParallaxScroll } from 'aceternity-ui';
// import { AnimatedBeam } from 'aceternity-ui';

export default function Home() {
  const mode = useRightPanelStore((s) => s.mode);

  return (
    <div className="h-screen overflow-hidden flex md:flex-row flex-col">
      {/* Left Section - Dark Background (60%) */}
      <div className="md:w-3/5 w-full bg-[#0c1b40] flex flex-col relative order-2 md:order-1">
        <BlobBackground />
        {/* Removed translucent overlay for clearer blend-mode interaction */}
        {/* Simplified Header */}
        <header className="px-8 py-4 flex justify-between items-center flex-shrink-0 relative z-10 text-white mix-blend-difference">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TalentWise</span>
          </div>
          
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-white/90 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#solutions" className="text-white/90 hover:text-white transition-colors text-sm font-medium">Solutions</a>
            <a href="#about" className="text-white/90 hover:text-white transition-colors text-sm font-medium">About</a>
            <a href="#contact" className="text-white/90 hover:text-white transition-colors text-sm font-medium">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="/auth/sign-in" className="text-white/90 hover:text-white transition-colors text-sm font-medium">Login</a>
            <a href="/auth/sign-up" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">Sign up</a>
          </div>
        </header>

        {/* Simplified Hero Content */}
        <motion.div 
          initial={{ opacity: 0, z: -50 }}
          animate={{ opacity: 1, z: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 px-8 flex flex-col justify-center min-h-0 relative z-10 text-white mix-blend-difference"
        >
          {/* <ParallaxScroll> */}
            <div id="hero" className="max-w-2xl relative">
              {/* Accent spheres removed as requested */}
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Your Reliable AI HR Partner
              </h1>
              
              <p className="text-xl mb-8 leading-relaxed">
                Streamline recruitment, onboarding, and employee support with our intelligent HR assistant. Available 24/7 to help your team succeed.
              </p>

              <div className="flex space-x-4 mb-6">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors">Learn More</button>
                <button className="border border-white text-white px-6 py-3 rounded-full font-medium hover:bg-white hover:text-[#0c1b40] transition-colors mix-blend-normal">View Demo</button>
              </div>
            </div>
          {/* </ParallaxScroll> */}

          {/* Features List */}
          <div id="features" className="px-8 pb-6 mt-6 flex-shrink-0 text-white mix-blend-difference">
            <ul className="space-y-4">
              <li className="flex items-center">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center mr-3 mix-blend-difference">✓</span>
                <span>Reduce hiring time with smart screening</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center mr-3 mix-blend-difference">✓</span>
                <span>24/7 support for queries</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center mr-3 mix-blend-difference">✓</span>
                <span>Seamless onboarding information</span>
              </li>
            </ul>
          </div>

          {/* <AnimatedBeam from="#hero" to="#features" /> */}
        </motion.div>

        {/* Duplicate features list removed to avoid repetition */}
      </div>

      {/* Right Section - General Chat with Prompt Starters */}
      <div className="md:w-2/5 w-full bg-slate-900 text-white flex flex-col order-1 md:order-2 border-l border-slate-700/40">
        {/* Prompt Starters Header */}
        <div className="px-8 py-6 flex-shrink-0 border-b border-slate-700/40">
          <h2 className="text-2xl font-bold mb-4">Ask Aura Anything</h2>
          <div className="flex items-center text-sm text-gray-400 mb-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Aura • Online
          </div>
          <PromptStarters />
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {mode === 'jd' ? (
            <JDGenerator />
          ) : mode === 'interview' ? (
            <InterviewQuestionGenerator />
          ) : (
            <GeneralChat endpoint="/api/general-chat" />
          )}
        </div>
      </div>
    </div>
  );
} 