import { GoogleGenAI } from "@google/genai";

// IMPORTANT: In a production environment, never expose API keys on the client side.
// For this specific request to work immediately as a demo, we are using the process.env.API_KEY.
// Ensure the Netlify environment variable is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGameCommentary = async (score: number): Promise<string> => {
  try {
    const prompt = `
      Men "Tezkor Barmoqlar" (Fast Fingers) o'yinini o'ynadim va ${score} ball to'pladim.
      Menga o'zbek tilida qisqa, kulgili yoki ruhlantiruvchi 1 gaplik izoh yoz.
      Agar ball kam bo'lsa (30 dan kam), hazillashib ustimdan kul.
      Agar ball o'rtacha bo'lsa (30-60), maqtashga harakat qil.
      Agar ball yuqori bo'lsa (60+), meni "Afsona" deb atab maqta.
      Faqat matnni o'zini qaytar, hech qanday qo'shimcha belgilarsiz.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return score > 50 ? "Qoyilmaqom natija!" : "Yaxshi harakat, lekin yana urinib ko'ring!";
  }
};