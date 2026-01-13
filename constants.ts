export const APP_TITLE = "FundTracker AI";

// A mock initial state if local storage is empty
export const DEFAULT_FUNDS = [
  // Intentionally empty to encourage user interaction, 
  // or could add a popular one like 'US0378331005' (Apple) but ISINs for funds are usually like 'LU...'
];

export const MOCK_HISTORY_DAYS = 30;

// Helper to generate a simulated history based on the current price
// to make the charts look functional (since we can't fetch 30 days of history via search efficiently)
export const generateMockHistory = (currentPrice: number, days: number = 30): { date: string; value: number }[] => {
  const history = [];
  let price = currentPrice;
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (days - i));
    
    // Random walk
    const change = (Math.random() - 0.5) * (currentPrice * 0.05);
    price = price - change; // Reverse calculation from current
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: Number(price.toFixed(2))
    });
  }
  // Ensure the last point connects to current price
  history.push({
    date: now.toISOString().split('T')[0],
    value: currentPrice
  });
  
  return history;
};