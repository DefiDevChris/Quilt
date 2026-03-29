'use client';

import Link from 'next/link';

const FEATURED_ITEMS = [
  { 
    title: "Modern Quilt Patterns", 
    type: "Patterns", 
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop', 
    color: 'from-orange-400 to-rose-400',
    description: 'Discover contemporary quilt designs'
  },
  { 
    title: "3D Quilt Blocks", 
    type: "Tutorials", 
    image: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=600&h=400&fit=crop', 
    color: 'from-blue-400 to-indigo-400',
    description: 'Learn dimensional quilting techniques'
  },
  { 
    title: "Typography in Quilts", 
    type: "Inspiration", 
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=400&fit=crop', 
    color: 'from-emerald-400 to-teal-400',
    description: 'Lettering and text designs'
  },
  { 
    title: "Micro-Quilting Details", 
    type: "Techniques", 
    image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&h=400&fit=crop', 
    color: 'from-purple-400 to-pink-400',
    description: 'Intricate stitching patterns'
  },
  { 
    title: "Color Theory for Quilters", 
    type: "Course", 
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop', 
    color: 'from-amber-400 to-orange-400',
    description: 'Master color combinations'
  },
  { 
    title: "Minimalist Patchwork", 
    type: "Gallery", 
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop', 
    color: 'from-cyan-400 to-blue-400',
    description: 'Clean, modern quilt aesthetics'
  },
];

export function FeaturedContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Curated Collections</h3>
        <Link 
          href="/socialthreads"
          className="text-sm font-bold text-orange-500 hover:text-orange-600 bg-white/50 px-4 py-2 rounded-full shadow-sm transition-colors"
        >
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_ITEMS.map((item, idx) => (
          <Link 
            key={idx} 
            href="/socialthreads"
            className="glass-panel-social rounded-[2rem] overflow-hidden glass-panel-social-hover cursor-pointer group relative block"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10"></div>
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider text-white mb-2 inline-block px-3 py-1 rounded-full bg-gradient-to-r ${item.color} shadow-sm`}>
                {item.type}
              </span>
              <h4 className="text-2xl font-bold text-white leading-tight mb-1">{item.title}</h4>
              <p className="text-sm text-white/80">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
