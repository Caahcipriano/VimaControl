
import React, { useState, useEffect, useMemo } from 'react';
import { Cow, CowStatus, EventType, ManagementEvent, ProductionRecord, User } from './types';
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
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- User Profile Edit State ---
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [userEditData, setUserEditData] = useState({ name: '', email: '', password: '' });

  // --- Herd State ---
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [view, setView] = useState<'herd' | 'details' | 'stats' | 'config'>('herd');
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [formData, setFormData] = useState<Partial<Cow>>({
    tag: '', name: '', breed: BREEDS[0], status: CowStatus.HEALTHY, weight: 0,
    birthDate: new Date().toISOString().split('T')[0], managementEvents: []
  });

  const [eventFormData, setEventFormData] = useState<Partial<ManagementEvent>>({
    id: '', type: EventType.VACCINE, name: '', startDate: new Date().toISOString().split('T')[0], nextDate: ''
  });

  const [productionValue, setProductionValue] = useState<number>(0);

  // Load user data
  useEffect(() => {
    if (currentUser) {
      const userStorageKey = `vimacontrol_data_${currentUser.id}`;
      const savedData = localStorage.getItem(userStorageKey);
      setCows(savedData ? JSON.parse(savedData) : INITIAL_COW_DATA);
      setView('herd');
      setSelectedCow(null);
    } else {
      setCows([]);
    }
  }, [currentUser?.id]);

  // Persist user data
  useEffect(() => {
    if (currentUser) {
      const userStorageKey = `vimacontrol_data_${currentUser.id}`;
      localStorage.setItem(userStorageKey, JSON.stringify(cows));
    }
  }, [cows, currentUser]);

  // --- Helpers ---
  const updateCowInState = (updatedCow: Cow) => {
    setCows(prev => prev.map(c => c.id === updatedCow.id ? updatedCow : c));
    if (selectedCow?.id === updatedCow.id) {
      setSelectedCow(updatedCow);
    }
  };

  // --- Auth Handlers ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    
    if (authMode === 'register') {
      if (!authFormData.email || !authFormData.password || !authFormData.name) {
        setAuthError('Preencha todos os campos obrigatórios.');
        return;
      }
      if (users.some(u => u.email === authFormData.email)) {
        setAuthError('E-mail já cadastrado.');
        return;
      }
      const newUser: User = { 
        id: Math.random().toString(36).substr(2, 9), 
        name: authFormData.name, 
        email: authFormData.email, 
        password: authFormData.password 
      };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
      doLogin(newUser);
    } else {
      const user = users.find(u => u.email === authFormData.email && u.password === authFormData.password);
      if (user) {
        doLogin(user);
      } else {
        setAuthError('E-mail ou senha incorretos.');
      }
    }
  };

  const doLogin = (user: User) => {
    const { password, ...userSession } = user;
    setCurrentUser(userSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
    setAuthFormData({ name: '', email: '', password: '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setSelectedCow(null);
    setView('herd');
    setAuthFormData({ name: '', email: '', password: '' });
    setAuthError('');
  };

  // --- User Update Handler ---
  const handleOpenUserEdit = () => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const currentFullData = users.find(u => u.id === currentUser?.id);
    if (currentFullData) {
      setUserEditData({
        name: currentFullData.name,
        email: currentFullData.email,
        password: currentFullData.password || ''
      });
      setShowUserEditModal(true);
    }
  };

  const handleSaveUser = () => {
    if (!currentUser) return;
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    
    if (users.some(u => u.email === userEditData.email && u.id !== currentUser.id)) {
      alert('Este e-mail já está sendo usado por outro usuário.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, ...userEditData };
      }
      return u;
    });

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    const updatedUserSession = { id: currentUser.id, name: userEditData.name, email: userEditData.email };
    setCurrentUser(updatedUserSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUserSession));
    
    setShowUserEditModal(false);
  };

  // --- Animal CRUD ---
  const handleSaveCow = () => {
    if (formData.id) {
      const updated = { ...selectedCow, ...formData } as Cow;
      updateCowInState(updated);
    } else {
      const newCow = { ...formData, id: Math.random().toString(36).substr(2, 9), production: [], managementEvents: [] } as Cow;
      setCows([...cows, newCow]);
    }
    setShowModal(false);
  };

  const handleDeleteCow = (id: string) => {
    setCows(cows.filter(c => c.id !== id));
    setShowDeleteConfirm(null);
    setSelectedCow(null);
    setView('herd');
  };

  // --- Management Event CRUD ---
  const handleOpenEventModal = (event?: ManagementEvent) => {
    if (event) {
      setEventFormData(event);
    } else {
      setEventFormData({ id: '', type: EventType.VACCINE, name: '', startDate: new Date().toISOString().split('T')[0], nextDate: '' });
    }
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!selectedCow) return;
    let updatedEvents;
    if (eventFormData.id) {
      updatedEvents = selectedCow.managementEvents.map(e => e.id === eventFormData.id ? eventFormData as ManagementEvent : e);
    } else {
      const newEvent = { ...eventFormData, id: Math.random().toString(36).substr(2, 9) } as ManagementEvent;
      updatedEvents = [...selectedCow.managementEvents, newEvent];
    }
    updateCowInState({ ...selectedCow, managementEvents: updatedEvents });
    setShowEventModal(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!selectedCow) return;
    const updatedEvents = selectedCow.managementEvents.filter(e => e.id !== eventId);
    updateCowInState({ ...selectedCow, managementEvents: updatedEvents });
  };

  // --- Production CRUD ---
  const handleSaveProduction = () => {
    if (!selectedCow) return;
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const updatedProd = [...selectedCow.production.filter(p => p.date !== today), { date: today, liters: productionValue }];
    updateCowInState({ ...selectedCow, production: updatedProd });
    setShowProductionModal(false);
    setProductionValue(0);
  };

  const handleDeleteProduction = (index: number) => {
    if (!selectedCow) return;
    const updatedProd = selectedCow.production.filter((_, i) => i !== index);
    updateCowInState({ ...selectedCow, production: updatedProd });
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
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-green-100 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-green-800 tracking-tighter">VimaControl</h1>
            <p className="text-stone-500 font-medium italic">Gestão inteligente de rebanho</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Nome Completo</label>
                <input type="text" placeholder="Como devemos te chamar?" value={authFormData.name} onChange={e => setAuthFormData({...authFormData, name: e.target.value})} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">E-mail</label>
              <input type="email" placeholder="seu@email.com" value={authFormData.email} onChange={e => setAuthFormData({...authFormData, email: e.target.value})} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Senha</label>
              <input type="password" placeholder="••••••••" value={authFormData.password} onChange={e => setAuthFormData({...authFormData, password: e.target.value})} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all" />
            </div>
            {authError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
            <button type="submit" className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-800 transition-all active:scale-95">
              {authMode === 'login' ? 'Entrar no Sistema' : 'Criar minha conta'}
            </button>
          </form>
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="w-full mt-6 text-stone-500 text-sm font-bold underline hover:text-green-700 transition-colors">
            {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já possui uma conta? Faça Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 select-none">
      <header className="bg-green-800 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">VimaControl</h1>
            <p className="text-green-100 text-[10px] font-medium opacity-80 uppercase tracking-widest">Olá, {currentUser.name}</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setView('config')} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-800 font-black border-2 border-white uppercase hover:scale-105 transition-transform active:scale-95 shadow-md">
                {currentUser.name.substring(0, 2)}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-2">
        {view === 'herd' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Rebanho</span><p className="text-2xl font-black text-stone-800">{dashboardStats.totalCows}</p></div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Litros Hoje</span><p className="text-2xl font-black text-green-700">{dashboardStats.totalMilkToday}L</p></div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Tratamento</span><p className="text-2xl font-black text-red-600">{dashboardStats.cowsInTreatment}</p></div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-center"><span className="text-stone-400 text-[10px] font-bold uppercase block">Média Prod.</span><p className="text-2xl font-black text-blue-700">{dashboardStats.averageProduction}L</p></div>
            </div>

            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Buscar por nome ou brinco..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-stone-200 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" />
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-bold text-stone-700">Meus Animais</h2>
                <button onClick={() => { setFormData({ tag: '', name: '', breed: BREEDS[0], status: CowStatus.HEALTHY, weight: 0, birthDate: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-green-800 transition-all">+ Novo</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCows.map(cow => <CowCard key={cow.id} cow={cow} onClick={(c) => { setSelectedCow(c); setView('details'); }} />)}
            </div>
            {filteredCows.length === 0 && <div className="text-center py-20 text-stone-400 italic">Nenhum animal cadastrado.</div>}
          </div>
        )}

        {view === 'details' && selectedCow && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-10">
            <button onClick={() => setView('herd')} className="text-stone-500 font-bold flex items-center gap-2 hover:text-green-700 px-2 py-1">← Voltar</button>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-stone-800 leading-tight">#{selectedCow.tag}<br/>{selectedCow.name}</h2>
                  <p className="text-stone-500 font-medium mt-1">{selectedCow.breed} • {selectedCow.weight} kg</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-2 rounded-full font-bold shadow-sm text-xs ${STATUS_COLORS[selectedCow.status]}`}>{selectedCow.status}</div>
                  <button onClick={() => { setFormData(selectedCow); setShowModal(true); }} className="text-green-700 text-xs font-bold underline p-2">Editar</button>
                </div>
              </div>

              {/* Sanity Plan CRUD Section */}
              <div className="mt-8 border-t border-stone-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-stone-700">Sanidade</h3>
                  <button onClick={() => handleOpenEventModal()} className="text-green-700 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">+ Manejo</button>
                </div>
                <div className="space-y-3">
                  {selectedCow.managementEvents.length > 0 ? selectedCow.managementEvents.map(event => (
                    <div key={event.id} className="bg-stone-50 p-4 rounded-2xl flex justify-between items-center border border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${event.type === EventType.VACCINE ? 'bg-blue-100 text-blue-700' : event.type === EventType.ULTRASOUND ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {event.type === EventType.VACCINE ? '💉' : event.type === EventType.ULTRASOUND ? '🩺' : '💊'}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800 text-sm">{event.name}</p>
                          <div className="flex gap-4 mt-1">
                            <p className="text-[9px] text-stone-500 uppercase font-bold">Aplic: {new Date(event.startDate).toLocaleDateString('pt-BR')}</p>
                            <p className="text-[9px] text-red-500 uppercase font-bold">Ret: {new Date(event.nextDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEventModal(event)} className="p-2 text-stone-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-stone-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  )) : <div className="p-10 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400 text-sm italic">Nenhum manejo registrado.</div>}
                </div>
              </div>

              {/* Production CRUD Section */}
              <div className="mt-8 border-t border-stone-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-stone-700">Produção</h3>
                  <button onClick={() => setShowHistoryModal(true)} className="text-blue-700 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg">Histórico</button>
                </div>
                {selectedCow.production.length > 0 ? <StatsChart data={selectedCow.production} /> : <div className="h-32 flex items-center justify-center text-stone-300 italic">Sem registros de produção.</div>}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setShowProductionModal(true)} className="bg-green-700 text-white font-bold py-5 rounded-3xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 tracking-wide">+ Registrar Ordenha</button>
              <button onClick={() => setShowDeleteConfirm(selectedCow.id)} className="text-red-600 font-bold py-3 hover:underline">Remover Animal</button>
            </div>
          </div>
        )}

        {view === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-2xl font-bold text-stone-800">Relatórios</h2>
             <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center text-stone-500 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="font-bold text-lg text-stone-700">Em Breve!</p>
                <p className="text-sm mt-2 max-w-xs mx-auto">Painéis com gráficos avançados e exportação de relatórios em PDF para sua fazenda.</p>
             </div>
          </div>
        )}

        {view === 'config' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-bold text-stone-800">Minha Fazenda</h2>
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center gap-5 pb-6 border-b border-stone-100">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl font-black text-green-800 uppercase shadow-inner border-2 border-green-50">{currentUser.name.substring(0, 2)}</div>
                <div>
                  <p className="font-bold text-2xl text-stone-800 tracking-tight">{currentUser.name}</p>
                  <p className="text-stone-500 font-medium text-sm">{currentUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                 <button onClick={handleOpenUserEdit} className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 font-bold text-stone-600 active:bg-stone-100">
                    <span>Meus Dados Cadastrados</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={() => setShowPrivacyModal(true)} className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 font-bold text-stone-600 active:bg-stone-100">
                    <span>Privacidade e Segurança</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
              </div>

              <div className="pt-4">
                <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-black py-5 rounded-2xl border-2 border-red-100 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sair da Conta
                </button>
                <p className="text-center text-[9px] text-stone-400 font-bold mt-8 uppercase tracking-widest opacity-60">Versão 1.2.5 • VimaControl App</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-6 py-4 flex justify-around items-center z-40 shadow-xl pb-safe">
        <button onClick={() => { setView('herd'); setSelectedCow(null); }} className={`flex flex-col items-center gap-1 transition-all ${view === 'herd' ? 'text-green-800 scale-110' : 'text-stone-300'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tight">Rebanho</span>
        </button>
        <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-1 transition-all ${view === 'stats' ? 'text-green-800 scale-110' : 'text-stone-300'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tight">Estatísticas</span>
        </button>
        <button onClick={() => setView('config')} className={`flex flex-col items-center gap-1 transition-all ${view === 'config' ? 'text-green-800 scale-110' : 'text-stone-300'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          <span className="text-[9px] font-black uppercase tracking-tight">Perfil</span>
        </button>
      </nav>

      <GeminiAssistant currentCow={selectedCow || undefined} />

      {/* --- User Edit Modal --- */}
      {showUserEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-stone-800">Editar Meus Dados</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Nome Completo</label>
                <input type="text" value={userEditData.name} onChange={e => setUserEditData({...userEditData, name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">E-mail de Acesso</label>
                <input type="email" value={userEditData.email} onChange={e => setUserEditData({...userEditData, email: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Mudar Senha (opcional)</label>
                <input type="password" placeholder="••••••••" value={userEditData.password} onChange={e => setUserEditData({...userEditData, password: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setShowUserEditModal(false)} className="flex-1 py-4 font-bold text-stone-400">Cancelar</button>
                <button onClick={handleSaveUser} className="flex-1 py-4 bg-green-700 text-white font-bold rounded-2xl shadow-lg">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Privacy Modal --- */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95 shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4 text-stone-800">Privacidade e Segurança</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <p className="text-stone-600 text-sm leading-relaxed">
                🔐 <strong>Privacidade e Segurança – VimaControl</strong><br/><br/>
                O VimaControl coleta apenas as informações necessárias para o controle e manejo do rebanho bovino. Os dados são usados exclusivamente para funcionamento do aplicativo e não são compartilhados com terceiros.<br/><br/>
                As informações são protegidas com medidas de segurança e o acesso é feito por login e senha. O usuário pode solicitar a exclusão da conta e dos dados a qualquer momento.<br/><br/>
                📧 Contato: suporte@vimacontrol.com.br
              </p>
            </div>
            <button onClick={() => setShowPrivacyModal(false)} className="mt-6 w-full py-4 bg-stone-900 text-white font-bold rounded-2xl">Fechar</button>
          </div>
        </div>
      )}

      {/* --- Cow Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-stone-800">{formData.id ? 'Editar Animal' : 'Novo Animal'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Brinco</label><input type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Peso (kg)</label><input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Nome</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Raça</label><select value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200">{BREEDS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as CowStatus})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200">{Object.values(CowStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="flex gap-3 pt-6"><button onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-stone-400">Voltar</button><button onClick={handleSaveCow} className="flex-1 py-4 bg-green-700 text-white font-bold rounded-2xl shadow-lg">Confirmar</button></div>
            </div>
          </div>
        </div>
      )}

      {/* --- Production Modal --- */}
      {showProductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95 shadow-2xl text-center">
            <h3 className="text-xl font-bold mb-4 text-stone-800">Nova Ordenha</h3>
            <p className="text-stone-500 text-sm mb-6">Quantos litros {selectedCow?.name} deu hoje?</p>
            <div className="relative">
                <input type="number" autoFocus value={productionValue || ''} onChange={e => setProductionValue(Number(e.target.value))} className="w-full p-8 text-6xl font-black text-center bg-green-50 text-green-800 rounded-3xl outline-none border-2 border-green-100" placeholder="0" />
                <span className="absolute right-6 bottom-4 text-green-200 font-black text-xl">LITROS</span>
            </div>
            <div className="flex gap-3 mt-8"><button onClick={() => setShowProductionModal(false)} className="flex-1 py-4 font-bold text-stone-400">Cancelar</button><button onClick={handleSaveProduction} className="flex-1 py-4 bg-green-700 text-white font-bold rounded-2xl shadow-lg">Salvar</button></div>
          </div>
        </div>
      )}

      {/* --- Delete Modal --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 shadow-2xl">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">!</div>
            <h3 className="text-xl font-bold mb-2 text-stone-800">Apagar Animal?</h3>
            <p className="text-stone-500 text-sm mb-8 leading-relaxed">Isso apagará todo o histórico de produção e vacinas de {selectedCow?.name}.</p>
            <div className="flex gap-3"><button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 font-bold text-stone-400">Manter</button><button onClick={() => handleDeleteCow(showDeleteConfirm)} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg">Apagar</button></div>
          </div>
        </div>
      )}

      {/* --- History Modal --- */}
      {showHistoryModal && selectedCow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 max-h-[80vh] flex flex-col animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-stone-800">Histórico de Leite</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
              {selectedCow.production.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div><p className="text-[9px] font-bold text-stone-400 uppercase">{p.date}</p><p className="font-bold text-stone-800">{p.liters} Litros</p></div>
                  <button onClick={() => handleDeleteProduction(i)} className="p-2 text-stone-300 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}
              {selectedCow.production.length === 0 && <p className="text-center text-stone-400 italic py-10">Vazio.</p>}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="w-full py-4 font-bold bg-stone-800 text-white rounded-2xl shadow-md">Voltar</button>
          </div>
        </div>
      )}

      {/* --- Management Modal --- */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-stone-800">{eventFormData.id ? 'Editar' : 'Registrar'} Manejo</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase mb-2 block ml-2">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(EventType).map(type => (
                    <button key={type} onClick={() => setEventFormData({...eventFormData, type})} className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${eventFormData.type === type ? 'bg-green-700 text-white border-green-700 shadow-md' : 'bg-stone-50 text-stone-500'}`}>{type}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Nome</label><input type="text" placeholder="Ex: Febre Aftosa" value={eventFormData.name} onChange={e => setEventFormData({...eventFormData, name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-green-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Data</label><input type="date" value={eventFormData.startDate} onChange={e => setEventFormData({...eventFormData, startDate: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-stone-400 uppercase ml-2">Retorno</label><input type="date" value={eventFormData.nextDate} onChange={e => setEventFormData({...eventFormData, nextDate: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs" /></div>
              </div>
              <div className="flex gap-3 pt-6"><button onClick={() => setShowEventModal(false)} className="flex-1 py-4 font-bold text-stone-400">Sair</button><button onClick={handleSaveEvent} className="flex-1 py-4 bg-green-700 text-white font-bold rounded-2xl shadow-md">Salvar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
