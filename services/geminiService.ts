import { GoogleGenAI, Type } from "@google/genai";
import { Fund } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const fetchFundDetails = async (isin: string): Promise<Fund> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // Using flash model. Removed explicit thinking budget restriction to improve accuracy.
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Task: Find the most recent and accurate details for the mutual fund with ISIN: ${isin}.
    
    Steps:
    1. Use Google Search to find the official fund page (e.g., Morningstar, Bloomberg, FT, or the issuer's site).
    2. Verify the ISIN matches ${isin} exactly.
    3. Extract the latest Net Asset Value (NAV), Currency, and Date.
    4. Extract the Daily Change percentage (1 day return).
    5. Identify the Risk Rating (SRRI 1-7). If not explicitly stated, estimate based on asset class (Equity=6, Bond=3, Money=1).
    6. Get the Fund Manager name and a brief Description in Traditional Chinese (zh-Hant).
    7. Find up to 3 recent news items, market updates, or official announcements relevant to this fund. Include title, source, date, and URL if available.
    
    Output Rules:
    - Return a JSON object matching the schema.
    - If Buy Price is missing, leave null.
    - If Sell Price is missing, leave null.
    - If Change% is missing, leave null.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            manager: { type: Type.STRING },
            description: { type: Type.STRING },
            riskRating: { type: Type.NUMBER },
            changePercent: { type: Type.NUMBER, nullable: true },
            buyPrice: { type: Type.NUMBER, nullable: true },
            sellPrice: { type: Type.NUMBER, nullable: true },
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
          required: ["name", "price", "currency", "manager", "description", "riskRating"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    // Extract grounding metadata for sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: string | undefined) => uri !== undefined) as string[];

    const uniqueSources = Array.from(new Set(sources));

    // Fallbacks
    // If changePercent is null, default to 0. This avoids showing misleading random numbers.
    const finalChangePercent = (data.changePercent !== undefined && data.changePercent !== null) 
      ? data.changePercent 
      : 0;
      
    const nav = data.price;
    // If buyPrice is missing, simulate ~1.5% spread (common entry load)
    const finalBuyPrice = (data.buyPrice !== undefined && data.buyPrice !== null)
      ? data.buyPrice
      : Number((nav * 1.015).toFixed(4));
      
    // If sellPrice is missing, usually equals NAV
    const finalSellPrice = (data.sellPrice !== undefined && data.sellPrice !== null)
      ? data.sellPrice
      : nav;

    return {
      isin: isin,
      name: data.name,
      price: data.price,
      currency: data.currency,
      manager: data.manager,
      description: data.description,
      riskRating: data.riskRating,
      lastUpdated: new Date().toISOString(),
      sources: uniqueSources.slice(0, 3), 
      changePercent: finalChangePercent,
      buyPrice: finalBuyPrice,
      sellPrice: finalSellPrice,
      news: data.news || []
    };

  } catch (error) {
    console.error("Error fetching fund details:", error);
    throw new Error("Failed to fetch fund data. Please verify the ISIN is correct.");
  }
};

export const analyzePortfolio = async (funds: Fund[]): Promise<string> => {
   if (!apiKey || funds.length === 0) return "無法分析空的投資組合。";

   const fundSummaries = funds.map(f => `- ${f.name} (${f.isin}): NAV ${f.price} ${f.currency}, Change: ${f.changePercent}%, Risk: ${f.riskRating}`).join('\n');

   const prompt = `
     As a financial analyst, briefly analyze this portfolio of funds. 
     Identify the diversification level, potential risks, and the general sector exposure based on the fund names and descriptions.
     Keep it under 150 words. Use Traditional Chinese (zh-Hant).
     
     Portfolio:
     ${fundSummaries}
   `;

   try {
     const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview",
       contents: prompt,
       config: {
         thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster analysis
       }
     });
     return response.text || "無法產生分析報告。";
   } catch (error) {
     return "分析服務暫時不可用。";
   }
};