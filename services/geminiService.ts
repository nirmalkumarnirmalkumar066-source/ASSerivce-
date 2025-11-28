import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWorkDescription = async (title: string, place: string, timeSlot: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Please configure API Key to generate description.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a professional, concise (max 2 sentences) work description for a job titled "${title}" taking place at "${place}" during the "${timeSlot}" shift. Focus on duties.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description.";
  }
};

export const generateFollowUpMessage = async (workTitle: string, workerName: string, status: 'interested' | 'not_interested'): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "";

  const prompt = status === 'interested' 
    ? `Draft a short, encouraging confirmation message to employee ${workerName} who just expressed interest in the shift "${workTitle}". Include a reminder to be on time.`
    : `Draft a short, polite acknowledgement message to employee ${workerName} who is not interested in the shift "${workTitle}". Keep it professional.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Message generation failed.";
  }
};

export const generateDailyInsight = async (workItems: number, interestedCount: number, notInterestedCount: number): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "System ready.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a workforce manager assistant. Provide a 1-sentence strategic insight based on: ${workItems} active shifts, ${interestedCount} interested workers, and ${notInterestedCount} not interested workers today.`,
    });
    return response.text.trim();
  } catch (error) {
    return "Insights currently unavailable.";
  }
};