import { AgentActionCall } from "../types";
import { performWebSearch } from "./webSearchService";

// Sozlamalarni localStorage da saqlash
const TG_BOT_TOKEN_KEY = "superai_tg_bot_token";
const TG_CHAT_ID_KEY = "superai_tg_chat_id";

export const getTelegramConfig = () => {
  return {
    botToken: localStorage.getItem(TG_BOT_TOKEN_KEY) || "",
    chatId: localStorage.getItem(TG_CHAT_ID_KEY) || "",
  };
};

export const setTelegramConfig = (botToken: string, chatId: string) => {
  localStorage.setItem(TG_BOT_TOKEN_KEY, botToken.trim());
  localStorage.setItem(TG_CHAT_ID_KEY, chatId.trim());
};

/**
 * Mavjud AI Instrumentlar (Tools) tavsifi
 */
export const AVAILABLE_TOOLS = [
  {
    name: "web_search",
    description: "Internetdan yangi ma'lumotlar, yangiliklar yoki faktlar qidirish",
    parameters: { query: "qidiruv so'zi yoki savol" },
  },
  {
    name: "send_telegram",
    description: "Telegram bot orqali xabar yoki xulosa yuborish",
    parameters: { message: "yuboriladigan xabar matni" },
  },
  {
    name: "send_email",
    description: "Email mijozi (mailto) orqali xat tayyorlash va jo'natish",
    parameters: { to: "email manzil", subject: "mavzu", body: "xat matni" },
  },
  {
    name: "calculate",
    description: "Matematik va mantiqiy hisob-kitoblarni xatosiz bajarish",
    parameters: { expression: "matematik ifoda, masalan: (150 * 1.12) / 4" },
  },
  {
    name: "get_weather",
    description: "Shahar yoki joyning ob-havo ma'lumotini olish",
    parameters: { city: "shahar nomi (masalan: Tashkent, Samarkand)" },
  },
  {
    name: "execute_code",
    description: "JavaScript / hisoblash kodini xavfsiz sandboxda ishga tushirish",
    parameters: { code: "javascript kodi" },
  },
];

export async function sendTelegramMessage(text: string): Promise<{ success: boolean; message: string }> {
  const { botToken, chatId } = getTelegramConfig();
  if (!botToken || !chatId) {
    return {
      success: false,
      message: "Telegram Bot Token yoki Chat ID sozlanmagan. Iltimos, Sozlamalar -> Integratsiyalardan kiriting.",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return { success: true, message: "Xabar Telegram ga muvaffaqiyatli yuborildi! 🚀" };
    } else {
      return { success: false, message: `Telegram xatosi: ${data.description || res.statusText}` };
    }
  } catch (err: any) {
    return { success: false, message: `Telegram xatolik: ${err.message}` };
  }
}

export async function fetchWeather(city: string): Promise<any> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=uz&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return { error: `"${city}" shahri koordinatalari topilmadi.` };
    }
    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
    );
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    return {
      city: name,
      country,
      temperature: `${current.temperature_2m}°C`,
      humidity: `${current.relative_humidity_2m}%`,
      windSpeed: `${current.wind_speed_10m} km/soat`,
      time: current.time,
    };
  } catch (err: any) {
    return { error: `Ob-havo ma'lumotini olib bo'lmadi: ${err.message}` };
  }
}

export function evaluateMath(expression: string): { success: boolean; result?: number | string; error?: string } {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().%^eEpiPI ]/g, "");
    // eslint-disable-next-line no-new-func
    const evaluated = Function(`"use strict"; return (${sanitized.replace(/pi/gi, "Math.PI")});`)();
    return { success: true, result: evaluated };
  } catch (e: any) {
    return { success: false, error: "Hisoblashda xatolik: " + e.message };
  }
}

export async function executeAgentAction(toolCall: { toolName: string; params: Record<string, any> }): Promise<any> {
  switch (toolCall.toolName) {
    case "web_search":
      return await performWebSearch(toolCall.params.query || "");
    case "send_telegram":
      return await sendTelegramMessage(toolCall.params.message || "");
    case "get_weather":
      return await fetchWeather(toolCall.params.city || "Tashkent");
    case "calculate":
      return evaluateMath(toolCall.params.expression || "");
    case "send_email": {
      const { to = "", subject = "", body = "" } = toolCall.params;
      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return {
        success: true,
        mailtoUrl,
        message: `Email tayyorlandi: ${to} ga ochish uchun havola tayyor.`,
      };
    }
    case "execute_code": {
      try {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
          error: (...args: any[]) => logs.push("[ERROR] " + args.join(" ")),
          warn: (...args: any[]) => logs.push("[WARN] " + args.join(" ")),
        };
        // eslint-disable-next-line no-new-func
        const fn = new Function("console", toolCall.params.code || "");
        const output = fn(customConsole);
        return {
          success: true,
          logs: logs.length ? logs.join("\n") : (output !== undefined ? String(output) : "Muvaffaqiyatli bajarildi (hech qanday console.log chiqmadi)."),
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    default:
      return { error: `Noma'lum instrument: ${toolCall.toolName}` };
  }
}
