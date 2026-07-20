import React from 'react';
import { Search, Mic, Clock, Flame, Star, Bike, Timer } from 'lucide-react';

export function CyberGradient() {
  return (
    <div 
      className="relative w-full max-w-[390px] mx-auto min-h-[844px] overflow-hidden flex flex-col font-sans"
      dir="rtl"
      style={{
        backgroundColor: '#0a0014',
        color: '#ffffff',
      }}
    >
      <style>{`
        @keyframes meshGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .cyber-mesh {
          background: radial-gradient(circle at top right, rgba(255, 0, 110, 0.4), transparent 40%),
                      radial-gradient(circle at bottom left, rgba(255, 77, 0, 0.3), transparent 50%),
                      radial-gradient(circle at center, rgba(138, 43, 226, 0.2), transparent 60%);
          background-size: 200% 200%;
          animation: meshGradient 10s ease infinite;
        }
        .neon-border-magenta {
          box-shadow: 0 0 10px rgba(255, 0, 110, 0.5), inset 0 0 5px rgba(255, 0, 110, 0.3);
          border: 1px solid #FF006E;
        }
        .text-gradient-fire {
          background: linear-gradient(to right, #FF4D00, #FF006E);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Hero / Header */}
      <div className="relative pt-16 pb-8 px-6 cyber-mesh rounded-b-[2rem] border-b border-[#FF006E]/30 z-10">
        <h1 className="text-4xl font-extrabold mb-6 tracking-tight drop-shadow-md">
          ابحث في <span className="text-gradient-fire">جاهز</span>
        </h1>
        
        <div className="relative flex items-center w-full">
          <div className="absolute right-4 text-[#FF006E]">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            placeholder="عن ماذا تبحث؟" 
            className="w-full bg-[#1a0033]/80 backdrop-blur-md text-white placeholder-gray-400 h-14 pl-12 pr-12 rounded-2xl neon-border-magenta outline-none transition-all focus:ring-2 focus:ring-[#FF006E] text-lg font-medium"
          />
          <button className="absolute left-4 bg-gradient-to-tr from-[#FF006E] to-[#FF4D00] p-2 rounded-xl text-white shadow-[0_0_15px_rgba(255,0,110,0.6)]">
            <Mic size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 z-0">
        
        {/* Category Pills */}
        <div className="mt-8 px-6">
          <div className="flex space-x-3 space-x-reverse overflow-x-auto hide-scrollbar pb-4">
            {categories.map((cat, i) => (
              <button 
                key={i} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border border-[${cat.color}]/40 whitespace-nowrap transition-all ${
                  cat.active ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] border-white' : 'bg-black/40 hover:bg-white/5'
                }`}
                style={cat.active ? { boxShadow: `0 0 15px ${cat.color}60, inset 0 0 5px ${cat.color}40`, borderColor: cat.color } : {}}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="font-bold text-sm" style={{ color: cat.active ? '#fff' : cat.color }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Searches */}
        <div className="mt-6 px-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            الأكثر طلبًا اليوم <Flame size={20} className="text-[#FF4D00]" />
          </h2>
          <div className="flex flex-wrap gap-3">
            {['شاورما', 'بيتزا', 'كوسكوس', 'أتاي', 'برغر', 'طاجين', 'حريرة'].map((tag, i) => (
              <span key={i} className="px-4 py-2 bg-[#2d004d]/50 border border-[#8a2be2]/30 rounded-xl text-sm font-semibold text-white/90 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="mt-8 px-6">
          <h2 className="text-lg font-bold mb-4 text-white/70">عمليات البحث الأخيرة</h2>
          <div className="flex space-x-3 space-x-reverse overflow-x-auto hide-scrollbar">
            {['طاكوس ميكست', 'سوشي', 'عصير أفوكادو'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Stores */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 px-6 text-gradient-fire">اكتشف مطاعم سافي</h2>
          <div className="flex space-x-4 space-x-reverse overflow-x-auto hide-scrollbar px-6 pb-6">
            {stores.map((store, i) => (
              <div key={i} className="min-w-[260px] bg-[#1a0033]/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden relative group">
                <div className={`h-1.5 w-full`} style={{ background: store.accent }}></div>
                <div className="h-28 w-full relative overflow-hidden bg-[#2d004d]/50">
                  <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-transparent to-black" />
                  <div className="absolute bottom-2 right-3 text-2xl drop-shadow-lg">{store.icon}</div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold">{store.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{store.name}</h3>
                  <p className="text-sm text-gray-400 mb-3 truncate">{store.desc}</p>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                      <Bike size={12} className="text-[#FF4D00]" />
                      <span>{store.delivery}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                      <Timer size={12} className="text-[#FF006E]" />
                      <span>{store.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const categories = [
  { name: 'الكل', icon: '🍽️', color: '#ffffff', active: true },
  { name: 'مطاعم', icon: '🍔', color: '#FF4D00', active: false },
  { name: 'بقالة', icon: '🛒', color: '#00FF9D', active: false },
  { name: 'صيدلية', icon: '💊', color: '#00E5FF', active: false },
  { name: 'حلويات', icon: '🧁', color: '#FF006E', active: false },
  { name: 'مقاهي', icon: '☕', color: '#FFB800', active: false },
];

const stores = [
  { 
    name: 'مطعم البحر الأزرق', 
    desc: 'مأكولات بحرية طازجة، طاجين',
    rating: '4.8',
    delivery: '15 درهم',
    time: '25-35 دقيقة',
    icon: '🐟',
    accent: 'linear-gradient(to right, #00E5FF, #0077FF)'
  },
  { 
    name: 'بيتزا سافي', 
    desc: 'بيتزا إيطالية، باستا، ساندويتشات',
    rating: '4.5',
    delivery: '10 درهم',
    time: '20-30 دقيقة',
    icon: '🍕',
    accent: 'linear-gradient(to right, #FF4D00, #FF006E)'
  },
  { 
    name: 'مشاوي المدينة', 
    desc: 'شاورما، كباب، دجاج مشوي',
    rating: '4.6',
    delivery: 'مجاني',
    time: '15-25 دقيقة',
    icon: '🥩',
    accent: 'linear-gradient(to right, #FFB800, #FF4D00)'
  }
];

export default CyberGradient;
