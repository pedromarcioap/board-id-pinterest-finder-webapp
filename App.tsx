import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ResultCard from './components/ResultCard';
import { extractBoardId } from './services/pinterestService';
import { BoardData, ExtractionState } from './types';
import { Search, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [state, setState] = useState<ExtractionState>({
    status: 'idle',
    data: null,
    error: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setState({ status: 'loading', data: null, error: null });

    try {
      const data = await extractBoardId(urlInput);
      setState({ status: 'success', data, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setState({ status: 'error', data: null, error: errorMessage });
    }
  };

  const handleReset = () => {
    setState({ status: 'idle', data: null, error: null });
    setUrlInput('');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F9F9F9] text-gray-900">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-3xl z-10 flex flex-col items-center">
          
          {state.status === 'idle' && (
            <div className="text-center mb-10 space-y-4 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Descubra o ID de qualquer <br />
                <span className="text-pinterest-red">Board do Pinterest</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Uma ferramenta simples para obter o identificador numérico único necessário para APIs, widgets e plugins. Sem login, sem complicações.
              </p>
            </div>
          )}

          {state.status === 'idle' || state.status === 'loading' || state.status === 'error' ? (
            <div className="w-full max-w-2xl mx-auto bg-white p-2 rounded-full shadow-lg border border-gray-200 transition-all focus-within:ring-4 focus-within:ring-red-100 focus-within:border-pinterest-red">
              <form onSubmit={handleSubmit} className="flex items-center">
                <div className="pl-6 text-gray-400">
                  <Search size={24} />
                </div>
                <input
                  type="url"
                  placeholder="Cole a URL do board aqui (ex: https://br.pinterest.com/username/pasta/)"
                  className="w-full p-4 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-400"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={state.status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={state.status === 'loading' || !urlInput}
                  className="mr-2 py-3 px-8 bg-pinterest-red hover:bg-pinterest-dark disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-full font-semibold transition-colors flex items-center gap-2"
                >
                  {state.status === 'loading' ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Buscar <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : null}

          {state.status === 'error' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-fade-in">
              <AlertCircle size={20} />
              <p className="font-medium">{state.error}</p>
            </div>
          )}

          {state.status === 'success' && state.data && (
            <ResultCard data={state.data} onReset={handleReset} />
          )}

          {state.status === 'idle' && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4 w-full max-w-4xl">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-xl">1</div>
                <h3 className="font-bold text-gray-800 mb-2">Copie a URL</h3>
                <p className="text-sm text-gray-500">Vá até o Pinterest e copie o link da pasta que você deseja.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-pinterest-red font-bold text-xl">2</div>
                <h3 className="font-bold text-gray-800 mb-2">Cole & Busque</h3>
                <p className="text-sm text-gray-500">Insira o link na barra de busca acima e clique no botão.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-green-600 font-bold text-xl">3</div>
                <h3 className="font-bold text-gray-800 mb-2">Pegue o ID</h3>
                <p className="text-sm text-gray-500">O ID numérico aparecerá instantaneamente para você copiar.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Custom Keyframe Animations defined in styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;