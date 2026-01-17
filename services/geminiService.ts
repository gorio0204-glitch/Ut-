import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Fund } from "../types";

// Always initialize with process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry helper function
async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    console.warn(`API call failed, retrying... (${retries} attempts left). Error: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

export const fetchFundDetails = async (query: string, lang: 'zh-TW' | 'en' = 'zh-TW'): Promise<Fund> => {
  if (!process.env.API_KEY) {
    throw new Error("ERROR_API_KEY");
  }

  const model = "gemini-3-flash-preview";
  const promptLang = lang === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : 'English';
  
  const prompt = `
    Role: Senior Financial Analyst & Data Scraper.
    Task: Find the official data for the fund matching: "${query}".
    
    Data Source Priorities:
    - Official Fund Manager websites (BlackRock, Allianz, Vanguard, etc.)
    - Financial terminals: Bloomberg, Financial Times (ft.com), Morningstar, Reuters, Yahoo Finance, Google Finance.
    - Regional regulators: SFC, SEC, etc.

    Instructions:
    1. Resolve typos and fuzzy names to the correct official fund name and ISIN.
    2. Extract latest NAV price and currency.
    3. Performance: Extract returns for YTD, 1m, 3m, 6m, 1y, 3y, 5y and 3y Volatility.
    4. Dividends: Extract the most recent history from the last 3 years.
    5. **RANKING**: Specifically find the "Category Ranking" or "Peer Percentile".
    6. **DESCRIPTION**: Provide a concise summary (approx. 100 words) of the fund's investment objective and strategy. Focus on what it invests in and its risk profile.
    7. **NEWS**: Find the latest 4 news items. PRIORITIZE: Financial Times (ft.com), Bloomberg, and Morningstar. Use real URLs if possible.
    8. Portfolio: Find top holdings and sector allocation.

    Output Language: ${promptLang}
    Output Format: JSON only.
  `;

  try {
    const callApi = (): Promise<GenerateContentResponse> => ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, nullable: true },
            isin: { type: Type.STRING, nullable: true },
            price: { type: Type.NUMBER, nullable: true },
            currency: { type: Type.STRING, nullable: true },
            manager: { type: Type.STRING, nullable: true },
            fundSize: { type: Type.STRING, nullable: true },
            description: { type: Type.STRING, nullable: true },
            domicile: { type: Type.STRING, nullable: true },
            launchDate: { type: Type.STRING, nullable: true },
            riskRating: { type: Type.NUMBER, nullable: true },
            ranking: { type: Type.STRING, nullable: true },
            changePercent: { type: Type.NUMBER, nullable: true },
            performance: {
              type: Type.OBJECT,
              properties: {
                ytd: { type: Type.NUMBER, nullable: true },
                month1: { type: Type.NUMBER, nullable: true },
                month3: { type: Type.NUMBER, nullable: true },
                month6: { type: Type.NUMBER, nullable: true },
                year1: { type: Type.NUMBER, nullable: true },
                year3: { type: Type.NUMBER, nullable: true },
                year5: { type: Type.NUMBER, nullable: true },
                volatility3y: { type: Type.NUMBER, nullable: true }
              }
            },
            dividendInfo: {
              type: Type.OBJECT,
              properties: {
                frequency: { type: Type.STRING, nullable: true },
                lastDate: { type: Type.STRING, nullable: true },
                yield: { type: Type.NUMBER, nullable: true },
                history: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      paymentDate: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      yield: { type: Type.NUMBER, nullable: true }
                    }
                  }
                }
              }
            },
            topHoldings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, percent: { type: Type.NUMBER } }
              }
            },
            sectorAllocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, percent: { type: Type.NUMBER } }
              }
            },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING, nullable: true },
                  source: { type: Type.STRING },
                  date: { type: Type.STRING }
                }
              }
            }
          },
          required: ["name"],
        },
      },
    });

    const response = await retry(callApi);
    let text = response.text || "";
    if (text.includes("```")) text = text.replace(/```json\n?|```/g, "").trim();

    const data = JSON.parse(text);
    if (!data.name || !data.price) throw new Error("ERROR_NOT_FOUND");

    return {
      isin: (data.isin || query).toUpperCase(),
      name: data.name,
      price: data.price,
      currency: data.currency || "USD",
      manager: data.manager || "N/A",
      description: data.description || "",
      domicile: data.domicile || "",
      launchDate: data.launchDate || "",
      riskRating: data.riskRating || 4,
      lastUpdated: new Date().toISOString(),
      ranking: data.ranking || "-",
      changePercent: data.changePercent || 0,
      performance: data.performance || {},
      dividendInfo: data.dividendInfo || {},
      news: data.news || [],
      fundSize: data.fundSize || "-",
      topHoldings: data.topHoldings || [],
      sectorAllocation: data.sectorAllocation || [],
      documents: []
    };
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const analyzePortfolio = async (funds: Fund[], lang: 'zh-TW' | 'en' = 'zh-TW'): Promise<string> => {
  if (!process.env.API_KEY || funds.length === 0) return "";
  const prompt = `Briefly analyze this fund portfolio in ${lang === 'zh-TW' ? '繁體中文' : 'English'}: ${funds.map(f => f.name).join(', ')}. Under 150 words.`;
  const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
  return response.text || "";
};