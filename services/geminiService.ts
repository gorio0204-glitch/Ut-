import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Fund } from "../types";

// Helper to initialize AI. We create a new instance inside service calls if needed 
// to ensure we use the latest injected API_KEY if a user has selected a personal one.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry helper function with specific handling for status codes
async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    const status = error.status || (error.error && error.error.code);
    
    if (status === 429 || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      console.error("Gemini API Quota Exhausted (429)");
      throw new Error("ERROR_QUOTA_EXHAUSTED");
    }

    if (retries <= 0) throw error;
    console.warn(`API call failed, retrying... (${retries} attempts left). Error: ${errorMsg}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

export const fetchFundDetails = async (query: string, lang: 'zh-TW' | 'en' = 'zh-TW'): Promise<Fund> => {
  if (!process.env.API_KEY) {
    throw new Error("ERROR_API_KEY");
  }

  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const promptLang = lang === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : 'English';
  
  const prompt = `
    Role: Senior Financial Data Auditor & Verification Expert.
    Task: Retrieve and strictly FACT-CHECK the official data for the fund matching: "${query}".
    
    VERIFICATION PROTOCOL:
    1. Identify the official Fund House/Manager (e.g., BlackRock, Allianz, J.P. Morgan, Schroders, Fidelity).
    2. ONCE IDENTIFIED, you MUST perform a targeted search specifically on the official Fund House regional website (e.g., blackrock.com/hk, allianzgi.com, etc.).
    3. FACT-CHECK cross-reference: Compare data from search results (Morningstar, Bloomberg) against the identified Fund House official page. 
    4. DATA PRIORITY: You MUST prioritize the Fund House's official website data (NAV, ISIN, Holdings) over third-party data if a discrepancy exists.
    5. LOGO FETCHING: Find the official brand logo URL (SVG or PNG) from the Fund House's corporate identity page or favicon.

    Instructions:
    - Return the correct official fund name and ISIN.
    - Extract latest NAV price and currency.
    - Performance: Extract returns for YTD, 1m, 3m, 6m, 1y, 3y, 5y and 3y Volatility.
    - Dividends: Extract the most recent history from the last 3 years.
    - DESCRIPTION: Provide a concise summary (approx. 100 words) of the strategy.
    - NEWS: Find the latest 4 news items from Bloomberg, FT, or Morningstar.
    - OFFICIAL URL: Provide the specific URL used for fact-checking.

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
            fundHouseLogoUrl: { type: Type.STRING, nullable: true, description: "Direct URL to the fund house's official logo." },
            fundSize: { type: Type.STRING, nullable: true },
            description: { type: Type.STRING, nullable: true },
            domicile: { type: Type.STRING, nullable: true },
            launchDate: { type: Type.STRING, nullable: true },
            riskRating: { type: Type.NUMBER, nullable: true },
            ranking: { type: Type.STRING, nullable: true },
            changePercent: { type: Type.NUMBER, nullable: true },
            officialFactCheckUrl: { type: Type.STRING, nullable: true },
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

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchUrls = groundingChunks
      .map(chunk => chunk.web?.uri)
      .filter((uri): uri is string => !!uri);

    const sources = [...new Set([...(data.officialFactCheckUrl ? [data.officialFactCheckUrl] : []), ...searchUrls])];

    return {
      isin: (data.isin || query).toUpperCase(),
      name: data.name,
      price: data.price,
      currency: data.currency || "USD",
      manager: data.manager || "N/A",
      fundHouseLogoUrl: data.fundHouseLogoUrl || undefined,
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
      documents: data.officialFactCheckUrl ? [{ title: "Official Fund Factsheet", url: data.officialFactCheckUrl }] : [],
      sources: sources
    };
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getFundSuggestions = async (query: string): Promise<{name: string, isin: string}[]> => {
  if (!process.env.API_KEY || query.length < 2) return [];
  const ai = getAI();
  const prompt = `Quickly suggest 5 real investment funds matching "${query}". Include their full names and ISIN codes. Prioritize popular ETFs and mutual funds. Format: JSON array of objects with "name" and "isin".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              isin: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Suggestions failed:", error);
    return [];
  }
};

export const analyzePortfolio = async (funds: Fund[], lang: 'zh-TW' | 'en' = 'zh-TW'): Promise<string> => {
  if (!process.env.API_KEY || funds.length === 0) return "";
  const ai = getAI();
  const prompt = `Briefly analyze this fund portfolio in ${lang === 'zh-TW' ? '繁體中文' : 'English'}: ${funds.map(f => f.name).join(', ')}. Focus on risk and overlaps. Under 150 words.`;
  
  try {
    const response: GenerateContentResponse = await retry(() => ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt }));
    return response.text || "";
  } catch (error: any) {
    if (error.message === "ERROR_QUOTA_EXHAUSTED") throw error;
    return "";
  }
};