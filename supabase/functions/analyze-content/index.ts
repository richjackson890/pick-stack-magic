import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Platform detection from URL
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "YouTube";
  if (urlLower.includes("instagram.com")) return "Instagram";
  if (urlLower.includes("threads.net")) return "Threads";
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
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data.title || "",
      thumbnail_url: data.thumbnail_url || "",
      author_name: data.author_name || "",
    };
  } catch (error) {
    console.error("YouTube oEmbed fetch error:", error);
    return null;
  }
}

// Fetch generic Open Graph metadata
async function fetchOpenGraphData(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PickStackBot/1.0)" },
    });
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
    console.error("Open Graph fetch error:", error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const { item_id } = await req.json();
    if (!item_id) {
      return new Response(JSON.stringify({ error: "item_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-content] Starting analysis for item: ${item_id}`);

    // Get the item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*")
      .eq("id", item_id)
      .eq("user_id", userId)
      .single();

    if (itemError || !item) {
      console.error("Item fetch error:", itemError);
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await supabase
      .from("items")
      .update({ ai_status: "processing" })
      .eq("id", item_id)
      .eq("user_id", userId);

    // Get user categories
    const { data: userCategories } = await supabase
      .from("categories")
      .select("id, name, keywords")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    const categoryList = userCategories || [];
    const categoryNames = categoryList.map((c) => c.name);

    // Fetch metadata based on platform
    let title = item.title || "";
    let thumbnailUrl = item.thumbnail_url || "";
    let description = "";
    let extractedText = "";
    const platform = detectPlatform(item.url || "");

    if (platform === "YouTube" && item.url) {
      const oembedData = await fetchYouTubeOEmbed(item.url);
      if (oembedData) {
        title = oembedData.title || title;
        thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
        description = `YouTube 영상 by ${oembedData.author_name || "Unknown"}`;
      }
      // Try to get higher quality thumbnail
      const videoId = getYouTubeVideoId(item.url);
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } else if (item.url) {
      const ogData = await fetchOpenGraphData(item.url);
      title = ogData.title || title;
      thumbnailUrl = ogData.image || thumbnailUrl;
      description = ogData.description || "";
    }

    extractedText = [title, description].filter(Boolean).join("\n\n");

    // Call Lovable AI for analysis
    let aiResult = {
      title: title || "제목 없음",
      summary_3: ["콘텐츠 요약을 불러오는 중...", "", ""],
      tags: ["저장됨"],
      category: "기타",
      confidence: 0.5,
    };

    if (lovableApiKey) {
      try {
        const categoryInfo = categoryList.map((c) => ({
          name: c.name,
          keywords: c.keywords || "",
        }));

        const prompt = `다음 콘텐츠를 분석해주세요.

URL: ${item.url || "없음"}
플랫폼: ${platform}
제목: ${title || "없음"}
설명: ${description || "없음"}
추출 텍스트: ${extractedText || "없음"}

사용자 카테고리 목록:
${categoryInfo.map((c) => `- ${c.name}${c.keywords ? ` (키워드: ${c.keywords})` : ""}`).join("\n")}

다음 JSON 형식으로 응답해주세요:
{
  "title": "콘텐츠 제목 (한국어로, 50자 이내)",
  "summary_3": ["첫번째 요약 포인트 (20-35자)", "두번째 요약 포인트 (20-35자)", "세번째 요약 포인트 (20-35자)"],
  "tags": ["태그1", "태그2", "태그3"],
  "category": "카테고리명",
  "confidence": 0.0-1.0
}

규칙:
- summary_3는 한국어로, 짧고 실용적인 핵심 포인트 3개
- 건강/투자/요리/건축/렌더링툴 관련이면 '실행 팁' 중심으로 요약
- category는 위 사용자 카테고리 중 가장 적합한 것 선택
- 적합한 카테고리가 없으면 "기타"
- confidence는 분류 확신도 (0.0~1.0)
- 정보가 부족하면 confidence를 낮게`;

        console.log("[analyze-content] Calling Lovable AI...");

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "당신은 콘텐츠 분석 전문가입니다. 주어진 콘텐츠를 분석하고 요약, 태그, 카테고리를 생성합니다. 항상 요청된 JSON 형식으로만 응답합니다." },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          console.log("[analyze-content] AI response:", content);

          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiResult = {
              title: parsed.title || title || "제목 없음",
              summary_3: Array.isArray(parsed.summary_3) ? parsed.summary_3.slice(0, 3) : ["요약 없음", "", ""],
              tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 7) : [],
              category: parsed.category || "기타",
              confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
            };
          }
        } else {
          const errorText = await aiResponse.text();
          console.error("[analyze-content] AI API error:", aiResponse.status, errorText);
          
          if (aiResponse.status === 429) {
            throw new Error("AI 요청 한도 초과. 잠시 후 다시 시도해주세요.");
          }
          if (aiResponse.status === 402) {
            throw new Error("AI 크레딧이 부족합니다.");
          }
        }
      } catch (aiError) {
        console.error("[analyze-content] AI processing error:", aiError);
        // Continue with default values if AI fails
      }
    } else {
      console.log("[analyze-content] LOVABLE_API_KEY not configured, using defaults");
    }

    // Find category ID
    let categoryId = item.category_id;
    const matchedCategory = categoryList.find((c) => c.name === aiResult.category);
    if (matchedCategory) {
      categoryId = matchedCategory.id;
    } else {
      // Fall back to default category
      const defaultCategory = categoryList.find((c) => c.name === "기타");
      if (defaultCategory) {
        categoryId = defaultCategory.id;
      }
    }

    // Update item with analysis results
    const updateData = {
      title: aiResult.title,
      platform: platform,
      thumbnail_url: thumbnailUrl || null,
      summary_3lines: aiResult.summary_3.filter(Boolean),
      tags: aiResult.tags,
      category_id: categoryId,
      ai_confidence: aiResult.confidence,
      ai_reason: `AI 자동 분류: ${aiResult.category} (신뢰도: ${Math.round(aiResult.confidence * 100)}%)`,
      extracted_text: extractedText || null,
      ai_status: "done",
      ai_error: null,
    };

    console.log("[analyze-content] Updating item with:", updateData);

    const { error: updateError } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", item_id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[analyze-content] Update error:", updateError);
      throw updateError;
    }

    console.log(`[analyze-content] Successfully analyzed item: ${item_id}`);

    return new Response(
      JSON.stringify({ success: true, data: updateData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[analyze-content] Error:", error);

    // Try to update item with error status
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { item_id } = await req.json().catch(() => ({}));
        if (item_id) {
          await supabase
            .from("items")
            .update({
              ai_status: "error",
              ai_error: error instanceof Error ? error.message : "Unknown error",
            })
            .eq("id", item_id);
        }
      }
    } catch (e) {
      console.error("[analyze-content] Failed to update error status:", e);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
