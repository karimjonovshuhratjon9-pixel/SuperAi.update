import { SearchResult, SearchSource } from "../types";

const TAVILY_KEY_STORAGE = "superai_tavily_api_key";

export const getTavilyApiKey = (): string => {
  try {
    const key = localStorage.getItem(TAVILY_KEY_STORAGE);
    if (key && key.trim()) return key.trim();
  } catch {}
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_TAVILY_API_KEY
  ) {
    return import.meta.env.VITE_TAVILY_API_KEY.trim();
  }
  return "";
};

export const setTavilyApiKey = (key: string): void => {
  localStorage.setItem(TAVILY_KEY_STORAGE, key.trim());
};

/**
 * DuckDuckGo Instant Answer / HTML fallback search
 */
async function searchDuckDuckGo(query: string): Promise<SearchSource[]> {
  try {
    const encQuery = encodeURIComponent(query);
    const ddgApi = `https://api.duckduckgo.com/?q=${encQuery}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgApi);
    if (!res.ok) throw new Error(`DDG API failed: ${res.status}`);
    const data = await res.json();

    const sources: SearchSource[] = [];

    if (data.AbstractText && data.AbstractURL) {
      sources.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          sources.push({
            title: topic.Text.slice(0, 60) + "...",
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    // Agar DDG API natija bermasa, Wikipedia API orqali qidiramiz
    if (sources.length === 0) {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encQuery}&limit=5&namespace=0&format=json&origin=*`,
      );
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const titles = wikiData[1] || [];
        const snippets = wikiData[2] || [];
        const urls = wikiData[3] || [];
        for (let i = 0; i < titles.length; i++) {
          if (titles[i] && urls[i]) {
            sources.push({
              title: titles[i],
              url: urls[i],
              snippet: snippets[i] || titles[i],
            });
          }
        }
      }
    }

    return sources;
  } catch (err) {
    console.warn("DuckDuckGo/Wiki search fallback error:", err);
    return [];
  }
}

/**
 * Tavily AI Search API
 */
async function searchTavily(
  query: string,
  apiKey: string,
): Promise<SearchSource[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      include_answer: true,
      max_results: 5,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily error: ${res.status} ${body}`);
  }

  const data = await res.json();
  const sources: SearchSource[] = [];

  if (Array.isArray(data.results)) {
    for (const r of data.results) {
      sources.push({
        title: r.title || "Veb sahifa",
        url: r.url || "",
        snippet: r.content || r.snippet || "",
      });
    }
  }

  return sources;
}

/**
 * Asosiy Web Qidiruv xizmati:
 * 1) Tavily API (agar mavjud bo'lsa)
 * 2) DuckDuckGo & Wikipedia (avtomatik bepul fallback)
 */
export async function performWebSearch(query: string): Promise<SearchResult> {
  const apiKey = getTavilyApiKey();
  let sources: SearchSource[] = [];

  if (apiKey) {
    try {
      sources = await searchTavily(query, apiKey);
    } catch (err) {
      console.warn("Tavily search failed, switching to public fallback:", err);
      sources = await searchDuckDuckGo(query);
    }
  } else {
    sources = await searchDuckDuckGo(query);
  }

  return {
    query,
    sources,
  };
}
