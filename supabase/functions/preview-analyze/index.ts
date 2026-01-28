import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Platform detection from URL - INCLUDES threads.com AND threads.net
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "YouTube";
  if (urlLower.includes("instagram.com")) return "Instagram";
  if (urlLower.includes("threads.net") || urlLower.includes("threads.com")) return "Threads";
  if (urlLower.includes("tiktok.com")) return "TikTok";
  if (urlLower.includes("facebook.com") || urlLower.includes("fb.com")) return "Facebook";
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "X";
  if (urlLower.includes("pinterest.com") || urlLower.includes("pin.it")) return "Pinterest";
  if (urlLower.includes("reddit.com")) return "Reddit";
  if (urlLower.includes("linkedin.com")) return "LinkedIn";
  if (urlLower.includes("medium.com")) return "Medium";
  if (urlLower.includes("naver.com") || urlLower.includes("blog.naver")) return "Naver";
  if (urlLower.includes("kakao.com") || urlLower.includes("story.kakao")) return "Kakao";
  if (urlLower.includes("brunch.co.kr")) return "Brunch";
  return "Web";
}

// Extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch YouTube oEmbed data
async function fetchYouTubeOEmbed(url: string): Promise<{ title: string; thumbnail_url: string; author_name?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data.title || "",
      thumbnail_url: data.thumbnail_url || "",
      author_name: data.author_name || "",
    };
  } catch (error) {
    console.error("[preview-analyze] YouTube oEmbed error:", error);
    return null;
  }
}

// Fetch Open Graph metadata
async function fetchOpenGraphData(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PickStackBot/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!response.ok) return {};
    
    const html = await response.text();
    
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    
    return {
      title: ogTitle || titleTag || "",
      description: ogDescription || metaDescription || "",
      image: ogImage || "",
    };
  } catch (error) {
    console.error("[preview-analyze] OG fetch error:", error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, categories } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: "url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[preview-analyze] Analyzing URL: ${url}`);

    const platform = detectPlatform(url);
    let title = "";
    let description = "";
    let thumbnailUrl = "";

    // Fetch metadata based on platform
    if (platform === "YouTube") {
      const oembedData = await fetchYouTubeOEmbed(url);
      if (oembedData) {
        title = oembedData.title;
        thumbnailUrl = oembedData.thumbnail_url;
        description = `YouTube 영상 by ${oembedData.author_name || "Unknown"}`;
      }
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } else {
      const ogData = await fetchOpenGraphData(url);
      title = ogData.title || "";
      description = ogData.description || "";
      thumbnailUrl = ogData.image || "";
    }

    console.log(`[preview-analyze] Platform: ${platform}, Title: ${title?.slice(0, 50)}`);

    // Get API key for AI analysis
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    let summary: string[] = [];
    let tags: string[] = [];
    let finalCategory = "기타";
    let confidence = 0.3;

    if (lovableApiKey && (title || description)) {
      try {
        // Build category context
        const categoryContext = categories?.length > 0
          ? categories.map((c: any) => `${c.name}${c.keywords ? ` [${c.keywords}]` : ""}`).join(", ")
          : "기타";

        const prompt = `콘텐츠 빠른 분석:

URL: ${url}
플랫폼: ${platform}
제목: ${title || "없음"}
설명: ${description?.slice(0, 300) || "없음"}

카테고리 목록: ${categoryContext}

JSON 응답만 (다른 텍스트 없이):
{
  "title": "명확한 제목 (원본 유지하거나 개선, 50자 이내)",
  "summary_3": ["핵심1 (25-35자)", "핵심2 (25-35자)", "핵심3 (25-35자)"],
  "tags": ["태그1", "태그2", "태그3", "태그4"],
  "final_category": "카테고리명 (위 목록 중 하나)",
  "confidence": 0.0-1.0
}`;

        console.log("[preview-analyze] Calling AI...");

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "콘텐츠 분석 전문가. JSON만 응답." },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          console.log("[preview-analyze] AI response:", content.slice(0, 150));

          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            title = parsed.title || title;
            summary = Array.isArray(parsed.summary_3) ? parsed.summary_3.slice(0, 3) : [];
            tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [];
            finalCategory = parsed.final_category || "기타";
            confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
          }
        }
      } catch (aiError) {
        console.error("[preview-analyze] AI error:", aiError);
      }
    }

    // Ensure 3 lines in summary
    while (summary.length < 3) {
      summary.push("");
    }

    const result = {
      success: true,
      platform,
      title: title || `${platform} 콘텐츠`,
      thumbnail_url: thumbnailUrl,
      summary_3: summary,
      tags,
      final_category: finalCategory,
      confidence,
    };

    console.log("[preview-analyze] Result:", JSON.stringify(result).slice(0, 200));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[preview-analyze] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
