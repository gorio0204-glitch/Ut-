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
  
  // Enhanced prompt for Fuzzy Search, Robust Matching and Detailed Fund Data
  const prompt = `
    Role: Financial Data Expert.
    Task: Identify the fund best matching the query: "${query}" and extract its real-time details.

    Search & Fuzzy Matching Strategy:
    1. **Exact Match**: If "${query}" is a valid ISIN, find that specific fund.
    2. **Fuzzy Name Match**: If "${query}" is a fund name (full or partial) or has typos, use search to find the correct official fund name and ISIN. (e.g. "Allianz Income" -> "Allianz Income and Growth").
    3. **Category Match**: If "${query}" is a generic category (e.g. "US Tech ETF", "Global Bond Fund"), identify the *single most popular/representative* fund for that category.
    4. **Context**: Use terms like "${query} Morningstar", "${query} Bloomberg", "${query} Factsheet", "${query} Holdings", "${query} Rank" to ground the search.

    Data Extraction Requirements (Language: ${promptLang}):
       - **Identity**: Official Name, ISIN (Correct the ISIN if the user provided a partial one).
       - **Snapshot**: Latest Price/NAV, Currency, Risk Rating (1-7), Manager/Provider name, Fund Size (AUM with currency).
       - **Profile**: Description (2 sentences on strategy), Domicile, Launch Date.
       - **Performance**: Returns for YTD, 1m, 3m, 6m, 1y, 3y, 5y, and 3y Volatility.
       - **Dividends**: Payment Frequency, Last Payment Date, Last Amount, Annual Yield (%).
       - **Portfolio**: Top 5 Holdings (Name, %), Top 5 Sector Allocations (Name, %).
       - **Documents**: Find URLs for "Factsheet" or "Prospectus" or "Monthly Report" if available in search snippets.
       - **Ranking**: Find the category ranking or percentile (e.g., "Top 10%", "5/102", "4 Stars").
       
    **CRITICAL: Dividend History (Last 3 Years)**
    Extract a list of dividend payments from the last 3 years (up to 36 entries).
    For each entry: Payment Date, Ex-Dividend Date, Amount, Reinvestment NAV, Annual Yield at that time.

    Output Format: JSON only.
    If no fund matches the query even loosely, set 'name' to null.
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
            name: { type: Type.STRING, nullable: true, description: "Official Fund Name" },
            isin: { type: Type.STRING, nullable: true, description: "ISIN Code" },
            price: { type: Type.NUMBER, nullable: true, description: "Latest NAV" },
            currency: { type: Type.STRING, nullable: true },
            manager: { type: Type.STRING, nullable: true },
            fundSize: { type: Type.STRING, nullable: true, description: "e.g. 500M USD" },
            description: { type: Type.STRING, nullable: true, description: "Investment strategy summary" },
            domicile: { type: Type.STRING, nullable: true },
            launchDate: { type: Type.STRING, nullable: true },
            riskRating: { type: Type.NUMBER, nullable: true },
            changePercent: { type: Type.NUMBER, nullable: true },
            buyPrice: { type: Type.NUMBER, nullable: true },
            sellPrice: { type: Type.NUMBER, nullable: true },
            ranking: { type: Type.STRING, nullable: true, description: "Category rank or percentile, e.g. 5/102 or Top 10%" },
            performance: {
              type: Type.OBJECT,
              nullable: true,
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
              nullable: true,
              properties: {
                frequency: { type: Type.STRING, nullable: true, description: "e.g. Monthly, Acc" },
                lastDate: { type: Type.STRING, nullable: true },
                amount: { type: Type.NUMBER, nullable: true },
                currency: { type: Type.STRING, nullable: true },
                yield: { type: Type.NUMBER, nullable: true },
                reinvestmentNav: { type: Type.NUMBER, nullable: true },
                history: {
                  type: Type.ARRAY,
                  nullable: true,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      paymentDate: { type: Type.STRING, nullable: true },
                      exDate: { type: Type.STRING, nullable: true },
                      amount: { type: Type.NUMBER, nullable: true },
                      currency: { type: Type.STRING, nullable: true },
                      reinvestmentNav: { type: Type.NUMBER, nullable: true },
                      yield: { type: Type.NUMBER, nullable: true }
                    }
                  }
                }
              }
            },
            topHoldings: {
              type: Type.ARRAY,
              nullable: true,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  percent: { type: Type.NUMBER, nullable: true }
                }
              }
            },
            sectorAllocation: {
              type: Type.ARRAY,
              nullable: true,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  percent: { type: Type.NUMBER, nullable: true }
                }
              }
            },
            documents: {
              type: Type.ARRAY,
              nullable: true,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              }
            },
            news: {
              type: Type.ARRAY,
              nullable: true,
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

    let text = response.text;
    if (!text) throw new Error("ERROR_PARSE");

    if (text.includes("```")) {
      text = text.replace(/```json\n?|```/g, "").trim();
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("ERROR_PARSE");
    }

    // Validation: If AI returned null name or could not find price, consider it a 404
    if (!data.name || data.price === null || data.price === undefined) {
       throw new Error("ERROR_NOT_FOUND");
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: string | undefined) => uri !== undefined) as string[];

    const uniqueSources = Array.from(new Set(sources));

    const nav = data.price ?? 0;
    const finalChangePercent = data.changePercent ?? 0;
    const finalCurrency = data.currency || "USD";
    const finalDescription = data.description || (lang === 'zh-TW' ? "暫無描述" : "No description");
    const finalRisk = data.riskRating || 4;
    const finalManager = data.manager || (lang === 'zh-TW' ? "資訊暫缺" : "Unknown");
    
    // Fallback: If AI didn't find specific buy/sell prices, simulate reasonable spread
    const finalBuyPrice = data.buyPrice ?? (nav > 0 ? Number((nav * 1.015).toFixed(4)) : 0);
    const finalSellPrice = data.sellPrice ?? nav;
    
    // Ensure ISIN is uppercase or fallback to query if AI returned null/empty
    const resolvedIsin = (data.isin || query).toUpperCase();

    return {
      isin: resolvedIsin,
      name: data.name,
      price: nav,
      currency: finalCurrency,
      manager: finalManager,
      description: finalDescription, 
      domicile: data.domicile || '',
      launchDate: data.launchDate || '',
      riskRating: finalRisk,
      lastUpdated: new Date().toISOString(),
      sources: uniqueSources.slice(0, 3), 
      changePercent: finalChangePercent,
      buyPrice: finalBuyPrice,
      sellPrice: finalSellPrice,
      ranking: data.ranking,
      performance: data.performance || {},
      dividendInfo: data.dividendInfo || {},
      news: data.news || [],
      fundSize: data.fundSize,
      topHoldings: data.topHoldings || [],
      sectorAllocation: data.sectorAllocation || [],
      documents: data.documents || []
    };

  } catch (error: any) {
    console.error("fetchFundDetails error:", error);
    
    let msg = error.message || "ERROR_UNKNOWN";
    
    // Map common network errors to codes
    if (msg.includes("Rpc failed") || msg.includes("xhr error") || msg.includes("fetch") || msg.includes("network")) {
      throw new Error("ERROR_NETWORK");
    } else if (msg.includes("API_KEY")) {
      throw new Error("ERROR_API_KEY");
    }

    // Pass through known error codes
    if (msg.startsWith("ERROR_")) {
      throw new Error(msg);
    }

    throw new Error("ERROR_UNKNOWN");
  }
};

export const analyzePortfolio = async (funds: Fund[], lang: 'zh-TW' | 'en' = 'zh-TW'): Promise<string> => {
   if (!process.env.API_KEY || funds.length === 0) return "";

   const fundSummaries = funds.map(f => `- ${f.name} (${f.isin}): Price ${f.price} ${f.currency}, Change: ${f.changePercent}%, Risk: RR${f.riskRating}`).join('\n');
   const promptLang = lang === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : 'English';

   const prompt = `
     Role: Professional Financial Analyst.
     Task: Briefly analyze the following portfolio.
     Language: Respond in ${promptLang}.
     Length: Under 150 words.
     
     Portfolio:
     ${fundSummaries}
   `;

   try {
     const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview", 
       contents: prompt,
     });
     return response.text || "";
   } catch (error) {
     return "";
   }
};