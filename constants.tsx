
import React from 'react';

export const COLORS = {
  primary: '#166534', // Green-800
  secondary: '#854d0e', // Yellow-800
  accent: '#1e40af', // Blue-800
  danger: '#991b1b', // Red-800
  background: '#f5f5f4' // Stone-100
};

export const BREEDS = ['Holandesa', 'Jersey', 'Girolando', 'Nelore', 'Guzerá', 'Pardo Suíço'];

export const STATUS_COLORS: Record<string, string> = {
  'Saudável': 'bg-green-100 text-green-800',
  'Em Tratamento': 'bg-red-100 text-red-800',
  'Prenha': 'bg-purple-100 text-purple-800',
  'Lactação': 'bg-blue-100 text-blue-800',
  'Seca': 'bg-amber-100 text-amber-800'
};
