
export enum CowStatus {
  HEALTHY = 'Saudável',
  TREATMENT = 'Em Tratamento',
  PREGNANT = 'Prenha',
  LACTATING = 'Lactação',
  DRY = 'Seca'
}

export enum EventType {
  VACCINE = 'Vacina',
  ULTRASOUND = 'Ultrassom',
  DEWORMER = 'Vermífugo'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface ManagementEvent {
  id: string;
  type: EventType;
  name: string;
  startDate: string;
  nextDate: string;
}

export interface ProductionRecord {
  date: string;
  liters: number;
}

export interface Cow {
  id: string;
  tag: string;
  name: string;
  breed: string;
  status: CowStatus;
  birthDate: string;
  weight: number;
  production: ProductionRecord[];
  managementEvents: ManagementEvent[];
}

export interface DashboardStats {
  totalCows: number;
  totalMilkToday: number;
  cowsInTreatment: number;
  averageProduction: number;
}
