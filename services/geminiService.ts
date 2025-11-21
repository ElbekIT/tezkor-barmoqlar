import { GoogleGenAI } from "@google/genai";

// Instructions mandate using process.env.API_KEY
const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
} else {
  console.warn("API Key topilmadi! AI izohlari ishlamaydi.");
}

export const generateGameCommentary = async (score: number): Promise<string> => {
  if (!ai) {
    return score > 50 ? "Qoyilmaqom natija! (AI ulanmagan)" : "Yaxshi harakat! (AI ulanmagan)";
  }

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