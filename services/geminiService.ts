
import { GoogleGenAI } from "@google/genai";

/* Fix: Initialize the GoogleGenAI instance at the module level with the apiKey from process.env.API_KEY.
   The SDK requires a named parameter { apiKey: ... }. */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getVeterinaryAdvice = async (cowData: any, query: string) => {
  /* Fix: Use gemini-3-pro-preview for advanced reasoning tasks like clinical veterinary advice. */
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `Você é um veterinário sênior especialista em bovinos. 
  Ajude o pecuarista com dúvidas sobre manejo, saúde, nutrição e produtividade.
  Seja prático, use termos técnicos quando necessário mas explique de forma simples.
  Se houver risco de vida para o animal, recomende sempre a visita de um profissional local.`;

  const prompt = `Dados da Vaca: ${JSON.stringify(cowData)}. Pergunta do pecuarista: ${query}`;

  try {
    /* Fix: Calling generateContent directly on ai.models as per latest guidelines. */
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    /* Fix: response.text is an extracted string property on GenerateContentResponse. */
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, tive um problema ao processar seu pedido. Tente novamente em instantes.";
  }
};

export const analyzeProduction = async (history: any[]) => {
  try {
    /* Fix: Consistently use the module-level 'ai' instance and ensure text property access. */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este histórico de produção leiteira e dê 3 dicas acionáveis para melhorar o rendimento: ${JSON.stringify(history)}`,
      config: {
          systemInstruction: "Retorne a resposta em formato Markdown com sugestões curtas e precisas."
      }
    });
    /* Fix: Access extracted text via the .text property. */
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível analisar o histórico de produção no momento.";
  }
};
