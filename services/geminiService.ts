
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { MODELS, SYSTEM_INSTRUCTION } from "../constants";

export const getGeminiResponse = async (prompt: string, imageBase64?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (imageBase64) {
    // Extract mime type and data from base64 string
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      contents.parts.unshift({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: MODELS.TEXT,
    contents: [contents],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  return response.text;
};

export const generateImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const editImage = async (prompt: string, baseImageBase64: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const match = baseImageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");

  const response = await ai.models.generateContent({
    model: MODELS.IMAGE,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const streamChat = async (prompt: string, onChunk: (text: string) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContentStream({
    model: MODELS.TEXT,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });

  for await (const chunk of response) {
    onChunk(chunk.text || '');
  }
};
