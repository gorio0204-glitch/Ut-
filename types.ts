export interface NewsItem {
  title: string;
  url?: string;
  source: string;
  date: string;
}

export interface Fund {
  isin: string;
  name: string;
  currency: string;
  price: number;
  lastUpdated: string; // ISO date string
  manager: string;
  description: string;
  riskRating: number; // 1-7
  sources?: string[]; // URLs from grounding
  changePercent?: number; // Simulated or fetched
  buyPrice?: number; // Subscription price
  sellPrice?: number; // Redemption price
  unitsHeld?: number; // Simulated holdings
  news?: NewsItem[];
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
  totalValue: number; // Assuming 1 unit of each for simplicity in this demo
  assetAllocation: { name: string; value: number }[];
}