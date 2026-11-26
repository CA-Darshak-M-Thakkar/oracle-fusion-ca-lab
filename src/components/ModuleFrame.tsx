import React, { useState } from 'react';
import { HelpCircle, Star, Home, X, BookOpen } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { ModuleRoute } from '../types/erp';

interface ModuleFrameProps {
  title: string;
  route: ModuleRoute;
  caConceptTitle: string;
  caConceptBody: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const ModuleFrame: React.FC<ModuleFrameProps> = ({
  title,
  route,
  caConceptTitle,
  caConceptBody,
  actions,
  children,
}) => {
  const { navigate, favorites, toggleFavorite } = useERP();
  const [showCaHelp, setShowCaHelp] = useState(false);
  const isFav = favorites.some((f) => f.route === route);

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#F4F6F9]">
      {/* Sub-header Bar */}
      <div className="bg-white border-b border-[#D6DFE6] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('home')}
            className="text-[#5E6C7A] hover:text-[#00688C] p-1 rounded hover:bg-[#EDF6FA]"
            title="Return to Springboard"
          >
            <Home className="w-4 h-4" />
          </button>
          <span className="text-[#BCC6D0]">/</span>
          <h2 className="text-[17px] font-medium text-[#161513]">{title}</h2>
          <button
            onClick={() => setShowCaHelp(!showCaHelp)}
            title="CA Student Note: What is this screen?"
            className="text-[#00688C] hover:bg-[#EDF6FA] p-1 rounded-full transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFavorite(title, route)}
            title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
            className={`p-1 rounded transition-colors ${
              isFav ? 'text-[#F59E0B]' : 'text-[#8C847C] hover:text-[#F59E0B]'
            }`}
          >
            <Star className="w-4 h-4" fill={isFav ? '#F59E0B' : 'none'} />
          </button>
        </div>

        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {/* CA Concept Drawer/Banner */}
      {showCaHelp && (
        <div className="bg-[#EDF6FA] border-b border-[#83BFE5] px-6 py-3 text-[12.5px] text-[#1D3549] flex items-start justify-between gap-4 no-print">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-[#00688C] mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-[#00688C]">{caConceptTitle}</div>
              <p className="mt-0.5 leading-relaxed">{caConceptBody}</p>
            </div>
          </div>
          <button onClick={() => setShowCaHelp(false)} className="text-[#5E6C7A] hover:text-[#161513]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-5">{children}</div>
    </div>
  );
};
