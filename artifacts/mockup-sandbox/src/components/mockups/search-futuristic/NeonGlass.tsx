import React, { useState } from 'react';
import { Search, Clock, ChevronRight, Star, Bike, Timer, X } from 'lucide-react';

export function NeonGlass() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');

  const categories = [
    { id: 'الكل', label: 'الكل', icon: '🍽️' },
    { id: 'مطاعم', label: 'مطاعم', icon: '🍔' },
    { id: 'بقالة', label: 'بقالة', icon: '🛒' },
    { id: 'صيدلية', label: 'صيدلية', icon: '💊' },
    { id: 'حلويات', label: 'حلويات', icon: '🧁' },
    { id: 'مقاهي', label: 'مقاهي', icon: '☕' },
  ];

  const recentSearches = ['بيتزا مارغريتا', 'برغر دجاج', 'طاجين لحم'];
  const trending = ['شاورما', 'بيتزا', 'كوسكوس', 'أتاي', 'برغر', 'طاجين', 'حريرة'];

  const stores = [
    { id: 1, name: 'مطعم البحر الأزرق', rating: 4.8, time: '20-30 د', fee: '10 درهم', gradient: 'from-blue-600 to-cyan-400' },
    { id: 2, name: 'بيتزا سافي', rating: 4.5, time: '30-45 د', fee: '15 درهم', gradient: 'from-purple-600 to-pink-500' },
    { id: 3, name: 'مشاوي المدينة', rating: 4.2, time: '25-40 د', fee: '12 درهم', gradient: 'from-orange-500 to-red-500' },
  ];

  return (
    <div dir="rtl" className="max-w-[390px] mx-auto min-h-[844px] h-[844px] overflow-hidden relative bg-[#0a0a14] text-white font-sans">
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
        @keyframes blob-float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .neon-search-ring {
          animation: pulse-ring 2s infinite cubic-bezier(0.455, 0.03, 0.515, 0.955);
        }
        .animate-blob {
          animation: blob-float 10s infinite alternate ease-in-out;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .neon-border {
          border: 1px solid rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.2), inset 0 0 10px rgba(6, 182, 212, 0.1);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Background Nebula */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] rounded-full bg-cyan-600/20 blur-[80px] animate-blob"></div>
        <div className="absolute top-[40%] left-[-20%] w-[250px] h-[250px] rounded-full bg-purple-600/20 blur-[80px] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[350px] h-[350px] rounded-full bg-blue-600/20 blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 h-full flex flex-col pt-12 pb-6">
        {/* Header Section */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">جاهز</h1>
            <div className="glass-panel px-3 py-1 rounded-full flex items-center gap-1 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-medium text-cyan-300">اكتشف الجديد</span>
            </div>
          </div>

          <div className="relative group neon-search-ring rounded-2xl">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-cyan-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="عن ماذا تبحث؟..."
              className="w-full h-14 pl-12 pr-12 rounded-2xl glass-panel neon-border text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-right"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-4 flex items-center text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* Categories */}
          <div className="mb-8">
            <div className="flex overflow-x-auto hide-scrollbar px-6 gap-3 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl transition-all duration-300 ${
                    activeCategory === cat.id 
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                      : 'glass-panel text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className="px-6 mb-8">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-500" /> عمليات البحث الأخيرة
            </h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <div key={idx} className="glass-panel flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-300">
                  <span>{search}</span>
                  <button className="text-gray-500 hover:text-red-400 transition-colors ml-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="px-6 mb-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-orange-500">🔥</span> الأكثر طلبًا اليوم
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {trending.map((item, idx) => (
                <button 
                  key={idx} 
                  className="px-4 py-2 rounded-xl bg-[#0f1020] border border-gray-800 hover:border-cyan-500/50 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all text-sm font-medium text-gray-300"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Stores */}
          <div className="mb-8">
            <div className="px-6 flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">مطاعم مقترحة لك</h2>
              <button className="text-xs font-medium text-cyan-400 flex items-center gap-1 hover:text-cyan-300">
                عرض الكل <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="flex overflow-x-auto hide-scrollbar px-6 gap-4 pb-4">
              {stores.map((store) => (
                <div key={store.id} className="min-w-[240px] glass-panel rounded-2xl overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
                  <div className={`h-28 bg-gradient-to-br ${store.gradient} relative opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-white">{store.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-2">{store.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Timer size={14} className="text-cyan-500" />
                        <span>{store.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bike size={14} className="text-cyan-500" />
                        <span>{store.fee}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
