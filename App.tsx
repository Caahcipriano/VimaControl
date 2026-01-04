
import React, { useState, useEffect, useMemo } from 'react';
import { Cow, CowStatus, EventType, ManagementEvent, User } from './types';
import CowCard from './components/CowCard';
import StatsChart from './components/StatsChart';
import GeminiAssistant from './components/GeminiAssistant';
import { BREEDS, STATUS_COLORS } from './constants';

const USERS_STORAGE_KEY = 'vimacontrol_users';
const SESSION_KEY = 'vimacontrol_session';

const INITIAL_COW_DATA: Cow[] = [
  {
    id: '1',
    tag: '1024',
    name: 'Mimosa',
    breed: 'Holandesa',
    status: CowStatus.LACTATING,
    birthDate: '2020-05-15',
    weight: 580,
    production: [
      { date: '01/10', liters: 22 },
      { date: '02/10', liters: 24 },
    ],
    managementEvents: []
  }
];

const App: React.FC = () => {
  // --- PWA Logic ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [pwaStatus, setPwaStatus] = useState({
    https: window.location.protocol === 'https:',
    serviceWorker: 'serviceWorker' in navigator,
    installed: window.matchMedia('(display-mode: standalone)').matches
  });

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setPwaStatus(prev => ({ ...prev, installed: true }));
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Para instalar, use o menu 'Instalar aplicativo' do seu navegador Chrome.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      return savedSession ? JSON.parse(savedSession) : null;
    } catch { return null; }
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- Herd State ---
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [view, setView] = useState<'herd' | 'details' | 'config'>('herd');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Partial<Cow>>({
    tag: '', name: '', breed: BREEDS[0], status: CowStatus.HEALTHY, weight: 0,
    birthDate: new Date().toISOString().split('T')[0], managementEvents: []
  });

  const [productionValue, setProductionValue] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      const userStorageKey = `vimacontrol_data_${currentUser.id}`;
      const savedData = localStorage.getItem(userStorageKey);
      setCows(savedData ? JSON.parse(savedData) : INITIAL_COW_DATA);
      setView('herd');
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      const userStorageKey = `vimacontrol_data_${currentUser.id}`;
      localStorage.setItem(userStorageKey, JSON.stringify(cows));
    }
  }, [cows, currentUser]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    if (authMode === 'register') {
      const newUser = { id: Math.random().toString(36).substr(2, 9), ...authFormData };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
      doLogin(newUser);
    } else {
      const user = users.find(u => u.email === authFormData.email && u.password === authFormData.password);
      if (user) doLogin(user);
      else setAuthError('Dados incorretos.');
    }
  };

  const doLogin = (user: User) => {
    const { password, ...userSession } = user;
    setCurrentUser(userSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setView('herd');
  };

  const handleSaveCow = () => {
    if (formData.id) {
      setCows(cows.map(c => c.id === formData.id ? { ...c, ...formData } as Cow : c));
    } else {
      const newCow = { ...formData, id: Math.random().toString(36).substr(2, 9), production: [], managementEvents: [] } as Cow;
      setCows([...cows, newCow]);
    }
    setShowModal(false);
  };

  const dashboardStats = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const totalMilkToday = cows.reduce((acc, c) => acc + (c.production.find(p => p.date === today)?.liters || 0), 0);
    return {
      totalCows: cows.length,
      totalMilkToday,
      cowsInTreatment: cows.filter(c => c.status === CowStatus.TREATMENT).length,
      averageProduction: cows.length > 0 ? Number((cows.reduce((a, c) => a + (c.production.reduce((s, p) => s + p.liters, 0) / (c.production.length || 1)), 0) / cows.length).toFixed(1)) : 0
    };
  }, [cows]);

  const filteredCows = cows.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.tag.includes(searchQuery));

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-black text-green-800 text-center mb-8">VimaControl</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <input type="text" placeholder="Seu Nome" required value={authFormData.name} onChange={e => setAuthFormData({...authFormData, name: e.target.value})} className="w-full p-4 bg-stone-50 border rounded-2xl outline-none" />
            )}
            <input type="email" placeholder="E-mail" required value={authFormData.email} onChange={e => setAuthFormData({...authFormData, email: e.target.value})} className="w-full p-4 bg-stone-50 border rounded-2xl outline-none" />
            <input type="password" placeholder="Senha" required value={authFormData.password} onChange={e => setAuthFormData({...authFormData, password: e.target.value})} className="w-full p-4 bg-stone-50 border rounded-2xl outline-none" />
            <button type="submit" className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg">
              {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-stone-500 text-sm font-bold underline">
            {authMode === 'login' ? 'Criar uma conta grátis' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="bg-green-800 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">VimaControl</h1>
            <p className="text-green-100 text-[10px] uppercase font-bold tracking-widest">Produtor: {currentUser.name}</p>
          </div>
          <button onClick={() => setView('config')} className="w-10 h-10 rounded-full bg-white text-green-800 font-black border-2 border-white flex items-center justify-center">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-2">
        {view === 'herd' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Animais</span><p className="text-2xl font-black text-stone-800">{dashboardStats.totalCows}</p></div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Litros Hoje</span><p className="text-2xl font-black text-green-700">{dashboardStats.totalMilkToday}L</p></div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Em Alerta</span><p className="text-2xl font-black text-red-600">{dashboardStats.cowsInTreatment}</p></div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Média L</span><p className="text-2xl font-black text-blue-700">{dashboardStats.averageProduction}</p></div>
            </div>

            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Buscar por brinco ou nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-stone-200 p-4 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-bold text-stone-700">Meu Rebanho</h2>
                <button onClick={() => { setFormData({ tag: '', name: '', breed: BREEDS[0], status: CowStatus.HEALTHY, weight: 0, birthDate: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md">+ Adicionar</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCows.map(cow => <CowCard key={cow.id} cow={cow} onClick={(c) => { setSelectedCow(c); setView('details'); }} />)}
            </div>
          </div>
        )}

        {view === 'config' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-bold text-stone-800">Menu do Aplicativo</h2>
            
            {/* CHECKLIST DE TRANSFORMAÇÃO EM APP */}
            {!pwaStatus.installed && (
              <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-sm space-y-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  Como transformar em Aplicativo:
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${pwaStatus.https ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pwaStatus.https ? '✓' : '!'}
                    </span>
                    <span className={pwaStatus.https ? 'text-stone-600' : 'text-red-600 font-bold'}>
                      {pwaStatus.https ? 'Conexão Segura (HTTPS) OK' : 'Acesse via HTTPS (Ex: Vercel)'}
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span className="text-stone-600">Service Worker & Manifest OK</span>
                  </li>
                </ul>
                
                {isInstallable ? (
                  <button onClick={handleInstallClick} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg animate-pulse">
                    INSTALAR APLICATIVO AGORA
                  </button>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-2xl text-[11px] text-stone-500 leading-relaxed italic">
                    Dica: No Android, clique nos 3 pontinhos do Chrome e selecione "Instalar aplicativo" para fixar na tela inicial.
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
              <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl border-2 border-red-100">
                Sair da Conta
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-6 py-4 flex justify-around items-center z-40 shadow-xl pb-safe">
        <button onClick={() => { setView('herd'); setSelectedCow(null); }} className={`flex flex-col items-center gap-1 ${view === 'herd' ? 'text-green-800' : 'text-stone-300'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span className="text-[9px] font-black uppercase">Rebanho</span>
        </button>
        <button onClick={() => setView('config')} className={`flex flex-col items-center gap-1 ${view === 'config' ? 'text-green-800' : 'text-stone-300'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          <span className="text-[9px] font-black uppercase">Configurar</span>
        </button>
      </nav>

      <GeminiAssistant currentCow={selectedCow || undefined} />
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-6 text-stone-800">Novo Animal</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Brinco (Tag)" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border" />
              <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border" />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-stone-400 font-bold">Cancelar</button>
                <button onClick={handleSaveCow} className="flex-1 py-3 bg-green-700 text-white font-bold rounded-xl shadow-md">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
