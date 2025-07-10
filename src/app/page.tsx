"use client";
import { Brain, Users, Clock, Workflow, ArrowRight, Search, Shield, Zap, BarChart3, MessageCircle } from 'lucide-react';
import {useRouter} from 'next/navigation';


export default function Home() {
  const router = useRouter();

  const handleStartButtonClick = () => {
    router.push('/chat');
  }
  return (
    <div className="h-screen overflow-hidden flex">
      {/* Left Section - Light Background (60%) */}
      <div className="w-3/5 bg-slate-50 flex flex-col">
        {/* Header - Reduced padding */}
        <header className="px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TalentWise</span>
            <div className="ml-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
              Always Available
            </div>
          </div>
          
          <nav className="flex items-center space-x-6">
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">About</a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Contact</a>
          </nav>
        </header>

        {/* Hero Content - Optimized spacing */}
        <div className="flex-1 px-8 flex flex-col justify-center min-h-0">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                24/7 AI-Powered
              </span>
              <br />
              HR Assistant
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Get instant HR support anytime, anywhere. Streamline recruitment, onboarding, and employee assistance with round-the-clock intelligent automation.
            </p>

            {/* Interactive Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ask about hiring, policies, benefits - Available 24/7..."
                  className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg bg-white cursor-pointer"
                  onClick={handleStartButtonClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStartButtonClick();
                    }
                  }}
                  readOnly
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-4">
              <button onClick={handleStartButtonClick} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center group shadow-lg">
                Start Chatting Now
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center text-green-600 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Online Now - Always Ready to Help
            </div>
          </div>
        </div>

        {/* Quick Value Props - Reduced padding */}
        <div className="px-8 pb-6 flex-shrink-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Smart Recruitment</h3>
              <p className="text-xs text-gray-600">Screen candidates around the clock</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Clock className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">24/7 Instant Support</h3>
              <p className="text-xs text-gray-600">Never wait for HR answers</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Workflow className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Seamless Onboarding</h3>
              <p className="text-xs text-gray-600">Support new hires anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Dark Background (40%) */}
      <div className="w-2/5 bg-slate-900 text-white flex flex-col">
        {/* Transform HR Header - Reduced padding */}
        <div className="px-6 py-6 flex-shrink-0">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-blue-400 font-semibold text-xs tracking-wide uppercase">Available 24/7/365</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Transform Your HR Operations</h2>
          <p className="text-slate-300 text-sm">Never let time zones limit your HR capabilities</p>
        </div>

        {/* Key Transformation Areas - Optimized spacing */}
        <div className="flex-1 px-6 space-y-4 min-h-0 overflow-y-auto">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-sm">Always-On Recruitment</h3>
              <p className="text-slate-300 text-xs">Screen candidates 24/7 - never miss top talent</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-sm">Round-the-Clock Employee Experience</h3>
              <p className="text-slate-300 text-xs">Instant answers to HR questions anytime</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-sm">Continuous Process Automation</h3>
              <p className="text-slate-300 text-xs">HR workflows that never sleep</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-sm">Real-Time Data Insights</h3>
              <p className="text-slate-300 text-xs">24/7 analytics and reporting dashboards</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-sm">24/7 Compliance Monitoring</h3>
              <p className="text-slate-300 text-xs">Automated policy adherence around the clock</p>
            </div>
          </div>
        </div>

        {/* Success Metrics - Compact design */}
        <div className="px-6 py-4 border-t border-slate-800 flex-shrink-0">
          <h3 className="font-semibold mb-4 text-slate-200 text-sm">Success Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-green-400 mb-1">24/7</div>
              <div className="text-xs text-slate-400">Zero Downtime</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400 mb-1">&lt;30s</div>
              <div className="text-xs text-slate-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400 mb-1">500+</div>
              <div className="text-xs text-slate-400">Companies Trust Us</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400 mb-1">95%</div>
              <div className="text-xs text-slate-400">Satisfaction Rate</div>
            </div>
          </div>
          
          {/* 24/7 Visual Element */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Always Online</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA - Compact */}
        <div className="px-6 pb-6 flex-shrink-0">
          <button onClick={handleStartButtonClick} className="w-full bg-white text-slate-900 py-2.5 rounded-xl font-semibold hover:bg-slate-100 transition-colors text-sm">
            Start 24/7 Support Chat
          </button>
          <p className="text-center text-slate-400 text-xs mt-2">
            Join thousands getting instant HR help anytime
          </p>
        </div>
      </div>
    </div>
  );
}