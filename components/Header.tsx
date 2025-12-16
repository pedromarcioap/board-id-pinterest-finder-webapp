import React from 'react';
import { Search } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 flex justify-center items-center bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="bg-pinterest-red p-2 rounded-full text-white">
          <Search size={24} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          BoardID <span className="text-pinterest-red">Finder</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;