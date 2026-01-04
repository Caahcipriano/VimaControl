
import React from 'react';
import { Cow, CowStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface CowCardProps {
  cow: Cow;
  onClick: (cow: Cow) => void;
}

const CowCard: React.FC<CowCardProps> = ({ cow, onClick }) => {
  const latestProduction = cow.production.length > 0 
    ? cow.production[cow.production.length - 1].liters 
    : 0;

  return (
    <div 
      onClick={() => onClick(cow)}
      className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-95 duration-75"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-stone-800">#{cow.tag} - {cow.name}</h3>
          <p className="text-stone-500 text-sm">{cow.breed}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[cow.status]}`}>
          {cow.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-stone-50 p-2 rounded">
          <p className="text-stone-400 text-[10px] uppercase font-bold">Produção Hoje</p>
          <p className="font-semibold text-stone-700">{latestProduction} Litros</p>
        </div>
        <div className="bg-stone-50 p-2 rounded">
          <p className="text-stone-400 text-[10px] uppercase font-bold">Peso</p>
          <p className="font-semibold text-stone-700">{cow.weight} kg</p>
        </div>
      </div>
    </div>
  );
};

export default CowCard;
