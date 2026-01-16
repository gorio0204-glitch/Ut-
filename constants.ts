export const APP_TITLE = "FundTracker AI";

// A mock initial state if local storage is empty
export const DEFAULT_FUNDS = [
  // Intentionally empty to encourage user interaction
];

export const MOCK_HISTORY_DAYS = 30;

// Helper to generate a simulated history based on the current price
// We generate history backwards from today to ensure continuity
export const generateMockHistory = (currentPrice: number, days: number = 30): { date: string; value: number }[] => {
  const history = [];
  let price = currentPrice;
  const now = new Date();
  
  // Volatility adjustment based on timeframe
  // Daily changes are usually small, but for longer periods we want realistic drift
  const dailyVol = 0.015; // 1.5% daily volatility approximation for random walk

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (i + 1));
    
    // Random walk step backwards: P_prev = P_curr / (1 + change) approx P_curr * (1 - change)
    const changePercent = (Math.random() - 0.5) * dailyVol;
    price = price * (1 - changePercent);
    
    history.unshift({
      date: date.toISOString().split('T')[0],
      value: Number(price.toFixed(4))
    });
  }
  
  // Add today's price as the last point
  history.push({
    date: now.toISOString().split('T')[0],
    value: currentPrice
  });
  
  return history;
};