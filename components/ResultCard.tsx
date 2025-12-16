import React, { useState } from 'react';
import { BoardData } from '../types';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface ResultCardProps {
  data: BoardData;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-8 bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
      <div className="bg-pinterest-red p-4 text-center">
        <h2 className="text-white font-semibold text-lg">Board Encontrado!</h2>
      </div>
      
      <div className="p-8 flex flex-col items-center">
        {data.thumbnail && (
          <img 
            src={data.thumbnail} 
            alt="Board Cover" 
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md -mt-12 mb-4 bg-gray-200"
          />
        )}
        
        <h3 className="text-xl font-bold text-gray-800 mb-1 text-center">{data.name}</h3>
        <a 
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-gray-500 flex items-center gap-1 hover:text-pinterest-red transition-colors mb-6"
        >
          {data.url} <ExternalLink size={12} />
        </a>

        <div className="w-full bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col items-center">
          <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
            Board ID Único
          </label>
          <div className="flex items-center gap-3 w-full justify-center">
            <span className="text-4xl font-mono font-bold text-gray-800 tracking-wider">
              {data.id}
            </span>
          </div>
          
          <button
            onClick={handleCopy}
            className={`mt-6 w-full py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              copied 
                ? 'bg-green-500 text-white shadow-green-200 shadow-lg' 
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {copied ? (
              <>
                <Check size={20} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copiar ID
              </>
            )}
          </button>
        </div>

        <button 
          onClick={onReset}
          className="mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium underline decoration-dashed underline-offset-4"
        >
          Buscar outro board
        </button>
      </div>
    </div>
  );
};

export default ResultCard;