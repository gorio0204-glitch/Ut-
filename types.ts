export interface NewsItem {
  title: string;
  url?: string;
  source: string;
  date: string;
}

export interface DividendHistoryItem {
  paymentDate: string;
  exDate: string;
  amount: number;
  currency?: string;
  reinvestmentNav?: number;
  yield?: number;
}

export interface DividendInfo {
  frequency?: string; 
  lastDate?: string; 
  amount?: number;
  currency?: string;
  yield?: number; 
  reinvestmentNav?: number; 
  history?: DividendHistoryItem[]; 
}

export interface FundPerformance {
  ytd?: number;
  month1?: number;
  month3?: number;
  month6?: number;
  year1?: number;
  year3?: number;
  year5?: number;
  volatility3y?: number;
}

export interface Holding {
  name: string;
  percent?: number;
}

export interface Sector {
  name: string;
  percent?: number;
}

export interface Document {
  title: string;
  url: string;
}

export interface Fund {
  isin: string;
  name: string;
  currency: string;
  price: number;
  lastUpdated: string; 
  manager: string;
  description: string; 
  domicile?: string;
  launchDate?: string;
  riskRating: number; 
  sources?: string[]; 
  changePercent?: number; 
  buyPrice?: number; 
  sellPrice?: number; 
  unitsHeld?: number; 
  news?: NewsItem[];
  performance?: FundPerformance;
  dividendInfo?: DividendInfo;
  isFavorite?: boolean;
  // New Fields
  fundSize?: string;
  topHoldings?: Holding[];
  sectorAllocation?: Sector[];
  documents?: Document[];
}

export interface FundHistoryPoint {
  date: string;
  value: number;
}

export interface SearchResult {
  fund: Fund;
  rawText: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface PortfolioStats {
  totalValue: number; 
  assetAllocation: { name: string; value: number }[];
}

export interface AppPreferences {
  showPerformance: boolean;
  showChart: boolean;
  showDividends: boolean;
  compactMode: boolean;
}