import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Fetch Instagram-specific metadata (optimized for Reels)
async function fetchInstagramMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  author?: string;
  caption?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!response.ok) return {};
    
    const html = await response.text();
    console.log(`[preview-analyze] Instagram HTML length: ${html.length}`);
    
    // Instagram-specific meta tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    
    // Try alternative meta tag formats
    const altDescription = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1];
    
    // Extract Instagram caption from og:description
    let caption = "";
    const descriptionText = ogDescription || altDescription || "";
    
    // Pattern 1: Korean format "게시물: "caption""
    const captionMatch1 = descriptionText.match(/게시물:\s*[""]([^""]+)[""]/i);
    // Pattern 2: English format "Instagram: "caption""
    const captionMatch2 = descriptionText.match(/Instagram:\s*[""]([^""]+)[""]/i);
    // Pattern 3: Just extract quoted content at end
    const captionMatch3 = descriptionText.match(/[""]([^""]{10,})[""]$/);
    
    if (captionMatch1) {
      caption = captionMatch1[1];
    } else if (captionMatch2) {
      caption = captionMatch2[1];
    } else if (captionMatch3) {
      caption = captionMatch3[1];
    } else if (descriptionText.length > 50) {
      caption = descriptionText;
    }
    
    // Extract author/username
    let author = "";
    const authorMatch = descriptionText.match(/[-–]\s*(@?\w+)(?:'s|의|님의|\s+on\s+Instagram)/i);
    if (authorMatch) {
      author = authorMatch[1].startsWith('@') ? authorMatch[1] : `@${authorMatch[1]}`;
    }
    
    console.log(`[preview-analyze] Instagram caption: ${caption?.slice(0, 80)}`);
    console.log(`[preview-analyze] Instagram author: ${author}`);
    
    return {
      title: decodeHtmlEntities(ogTitle || ""),
      description: decodeHtmlEntities(descriptionText),
      author,
      caption: decodeHtmlEntities(caption),
    };
  } catch (error) {
    console.error("[preview-analyze] Instagram metadata error:", error);
    return {};
  }
}

// Fetch Open Graph metadata with browser-like headers
async function fetchOpenGraphData(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[preview-analyze] OG fetch HTTP ${response.status} for ${url}`);
      return {};
    }

    const html = await response.text();
    console.log(`[preview-analyze] OG HTML length: ${html.length} for ${url}`);

    // Match og:meta — handle both attribute orders: property then content, or content then property
    const extractOg = (prop: string): string => {
      const m1 = html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'));
      if (m1) return m1[1];
      const m2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${prop}["']`, 'i'));
      if (m2) return m2[1];
      return "";
    };

    const ogTitle = extractOg("og:title");
    const ogDescription = extractOg("og:description");
    const ogImage = extractOg("og:image");
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1];

    console.log(`[preview-analyze] OG extracted — title: ${(ogTitle || titleTag || '').slice(0, 50)}, image: ${ogImage ? 'yes' : 'no'}`);

    return {
      title: decodeHtmlEntities(ogTitle || titleTag || ""),
      description: decodeHtmlEntities(ogDescription || metaDescription || ""),
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
    // Authentication check - verify user is logged in
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[preview-analyze] Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user with Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("[preview-analyze] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[preview-analyze] Authenticated user: ${user.id}`);

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
    } else if (platform === "Instagram") {
      // Special handling for Instagram (Reels, Posts, Stories)
      console.log("[preview-analyze] Fetching Instagram metadata...");
      const instaData = await fetchInstagramMetadata(url);
      
      // Use caption as primary content
      if (instaData.caption && instaData.caption.length > 10) {
        // Build better title from caption
        const firstLine = instaData.caption.split('\n')[0];
        title = firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '');
        
        // Include full caption in description for AI analysis
        description = instaData.caption;
      } else if (instaData.title && instaData.title !== 'Instagram') {
        title = instaData.title;
      }
      
      // Include author info
      if (instaData.author) {
        const contentType = url.includes('/reel') ? '릴스' : '게시물';
        description = `Instagram ${contentType} by ${instaData.author}\n\n${instaData.caption || instaData.description || ""}`;
      }
      
      console.log(`[preview-analyze] Instagram title: ${title}`);
      console.log(`[preview-analyze] Instagram description: ${description?.slice(0, 100)}`);
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
