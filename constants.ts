export const APP_TITLE = "FundTracker AI";

// A mock initial state if local storage is empty
export const DEFAULT_FUNDS = [
  // Intentionally empty to encourage user interaction
];

export const MOCK_HISTORY_DAYS = 30;

/**
 * Generates a simulated price history based on current price.
 * Uses a geometric random walk backwards from today.
 */
export const generateMockHistory = (currentPrice: number, days: number = 30): { date: string; value: number }[] => {
  const history = [];
  let price = currentPrice;
  const now = new Date();
  
  // Adjust volatility based on timeframe (longer timeframes look smoother)
  const dailyVol = days > 365 ? 0.008 : 0.015; 

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (i + 1));
    
    // Geometric random walk step backwards
    const changePercent = (Math.random() - 0.5) * dailyVol;
    price = price * (1 - changePercent);
    
    history.unshift({
      date: date.toISOString().split('T')[0],
      value: Number(price.toFixed(4))
    });
  }
  
  // Ensure the latest point is exactly the current price
  history.push({
    date: now.toISOString().split('T')[0],
    value: currentPrice
  });
  
  return history;
};