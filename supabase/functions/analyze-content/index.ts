import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate URL hash for deduplication
function generateUrlHash(url: string): string {
  // Simple hash: normalize URL and create a deterministic string
  const normalized = url.toLowerCase().replace(/\/$/, "").replace(/^https?:\/\//, "").replace(/^www\./, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${hash.toString(16)}_${normalized.length}`;
}

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

// Fetch YouTube oEmbed data with timeout
async function fetchYouTubeOEmbed(url: string): Promise<{ title: string; thumbnail_url: string; author_name?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
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
    console.error("[analyze-content] YouTube oEmbed fetch error:", error);
    return null;
  }
}

// Fetch generic Open Graph metadata with timeout
async function fetchOpenGraphData(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PickStackBot/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!response.ok) return {};
    
    const html = await response.text();
    console.log(`[analyze-content] Fetched HTML length: ${html.length}`);
    
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
    console.error("[analyze-content] Open Graph fetch error:", error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let itemId: string | undefined;
  let supabase: any;
  let userId: string | undefined;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[analyze-content] Missing auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      console.error("[analyze-content] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = claims.claims.sub;

    const body = await req.json();
    itemId = body.item_id;
    const mode = body.mode || "light"; // light or deep
    
    if (!itemId) {
      return new Response(JSON.stringify({ error: "item_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-content] ========== START ==========`);
    console.log(`[analyze-content] Item: ${itemId}, Mode: ${mode}, User: ${userId}`);

    // Get the item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single();

    if (itemError || !item) {
      console.error("[analyze-content] Item fetch error:", itemError);
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-content] Item URL: ${item.url}`);
    console.log(`[analyze-content] Current status: ${item.ai_status}`);

    // Generate URL hash for deduplication
    const urlHash = item.url ? generateUrlHash(item.url) : null;
    console.log(`[analyze-content] URL hash: ${urlHash}`);

    // Check for existing analysis with same URL hash (skip if already done and mode is light)
    if (urlHash && mode === "light" && item.ai_status === "done") {
      console.log("[analyze-content] Already analyzed (done), skipping AI call");
      return new Response(
        JSON.stringify({ success: true, cached: true, message: "Already analyzed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate URL from other items
    if (urlHash && mode === "light") {
      const { data: existingItems } = await supabase
        .from("items")
        .select("id, title, thumbnail_url, summary_3lines, tags, category_id, ai_confidence")
        .eq("user_id", userId)
        .eq("url_hash", urlHash)
        .eq("ai_status", "done")
        .neq("id", itemId)
        .limit(1);

      if (existingItems && existingItems.length > 0) {
        const existing = existingItems[0];
        console.log(`[analyze-content] Found existing analysis from item: ${existing.id}`);
        
        // Copy results from existing item
        const copyData = {
          title: existing.title || item.title,
          thumbnail_url: existing.thumbnail_url,
          summary_3lines: existing.summary_3lines,
          tags: existing.tags,
          category_id: existing.category_id,
          ai_confidence: existing.ai_confidence,
          ai_status: "done",
          ai_error: null,
          url_hash: urlHash,
          analysis_mode: "light",
          ai_finished_at: new Date().toISOString(),
        };

        await supabase
          .from("items")
          .update(copyData)
          .eq("id", itemId)
          .eq("user_id", userId);

        console.log("[analyze-content] Copied existing analysis, no AI call needed");
        return new Response(
          JSON.stringify({ success: true, cached: true, data: copyData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update status to processing with tracking info
    const currentAttempts = (item.ai_attempts || 0) + 1;
    await supabase
      .from("items")
      .update({ 
        ai_status: "processing",
        ai_started_at: new Date().toISOString(),
        ai_attempts: currentAttempts,
        url_hash: urlHash,
        analysis_mode: mode,
      })
      .eq("id", itemId)
      .eq("user_id", userId);

    console.log(`[analyze-content] Updated to processing (attempt ${currentAttempts})`);

    // Get user categories
    const { data: userCategories } = await supabase
      .from("categories")
      .select("id, name, keywords")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    const categoryList = userCategories || [];

    // Fetch metadata based on platform
    let title = item.title || "";
    let thumbnailUrl = item.thumbnail_url || "";
    let description = "";
    let extractedText = "";
    const platform = detectPlatform(item.url || "");

    console.log(`[analyze-content] Detected platform: ${platform}`);

    if (platform === "YouTube" && item.url) {
      console.log("[analyze-content] Fetching YouTube oEmbed...");
      const oembedData = await fetchYouTubeOEmbed(item.url);
      if (oembedData) {
        title = oembedData.title || title;
        thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
        description = `YouTube 영상 by ${oembedData.author_name || "Unknown"}`;
        console.log(`[analyze-content] YouTube title: ${title}`);
      }
      const videoId = getYouTubeVideoId(item.url);
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } else if (item.url) {
      console.log("[analyze-content] Fetching Open Graph data...");
      const ogData = await fetchOpenGraphData(item.url);
      title = ogData.title || title;
      thumbnailUrl = ogData.image || thumbnailUrl;
      description = ogData.description || "";
      console.log(`[analyze-content] OG title: ${title}`);
    }

    extractedText = [title, description].filter(Boolean).join("\n\n");
    console.log(`[analyze-content] Extracted text length: ${extractedText.length}`);

    // Default result (used if AI fails or not configured)
    let aiResult = {
      title: title || item.title || "제목 없음",
      summary_3: ["콘텐츠가 저장되었습니다.", "", ""],
      tags: ["저장됨"],
      category: "기타",
      confidence: 0.3,
    };

    // Call Lovable AI for analysis (LIGHT MODE)
    if (lovableApiKey) {
      try {
        const categoryInfo = categoryList.map((c: any) => ({
          name: c.name,
          keywords: c.keywords || "",
        }));

        // Build category context with keywords for better matching
        const categoryContext = categoryInfo.map((c: any) => 
          `${c.name}${c.keywords ? ` [키워드: ${c.keywords}]` : ""}`
        ).join("\n");

        // Light mode prompt - with user category priority
        const prompt = mode === "light" 
          ? `콘텐츠 분석:

URL: ${item.url || "없음"}
플랫폼: ${platform}
제목: ${title || "없음"}
설명: ${description ? description.slice(0, 500) : "없음"}

[사용자 카테고리 목록 - 반드시 이 중에서 선택]:
${categoryContext}

JSON 응답 (반드시 이 형식):
{
  "title": "콘텐츠 제목 (50자 이내)",
  "summary_3": ["핵심요약1 (25-35자)", "핵심요약2 (25-35자)", "핵심요약3 (25-35자)"],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "final_category": "카테고리명",
  "confidence": 0.0-1.0,
  "why_category": "분류 근거 한 문장"
}

분류 규칙:
1. final_category는 반드시 위 카테고리 목록 중 하나만 선택
2. 키워드가 있으면 해당 키워드와 콘텐츠 매칭 우선 고려
3. 건강 관련: 루틴/실행 관점 (시간대, 횟수, 주의사항 형태로)
4. 투자/의학/법률: 단정 금지, "참고/일반 정보" 톤 유지
5. 애매하면 "기타" 선택
6. summary_3는 한국어, 실용적 핵심 3개`
          : `콘텐츠 심층 분석:

URL: ${item.url || "없음"}
플랫폼: ${platform}
제목: ${title || "없음"}
설명: ${description || "없음"}
추출 텍스트: ${extractedText.slice(0, 1500) || "없음"}

[사용자 카테고리 목록]:
${categoryContext}

JSON 응답:
{
  "title": "콘텐츠 제목",
  "summary_3": ["상세요약1", "상세요약2", "상세요약3"],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5", "태그6", "태그7"],
  "final_category": "카테고리명",
  "confidence": 0.0-1.0,
  "why_category": "분류 근거"
}

분류 규칙:
1. final_category는 위 목록 중 하나만 선택
2. 사용자 카테고리 키워드 우선 매칭
3. 건강 관련: 루틴/실행 관점 문장
4. 투자/의학/법률: 단정 금지`;

        console.log("[analyze-content] Calling Lovable AI...");
        console.log(`[analyze-content] Prompt length: ${prompt.length}`);

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
            max_tokens: 500,
          }),
        });

        console.log(`[analyze-content] AI response status: ${aiResponse.status}`);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          console.log("[analyze-content] AI response content:", content.slice(0, 200));

          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiResult = {
              title: parsed.title || title || "제목 없음",
              summary_3: Array.isArray(parsed.summary_3) ? parsed.summary_3.slice(0, 3) : ["요약 없음", "", ""],
              tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, mode === "light" ? 5 : 7) : [],
              category: parsed.final_category || parsed.category || "기타",
              confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
            };
            console.log(`[analyze-content] Parsed AI result: category=${aiResult.category}, confidence=${aiResult.confidence}`);
            if (parsed.why_category) {
              console.log(`[analyze-content] Category reason: ${parsed.why_category}`);
            }
          } else {
            console.error("[analyze-content] Failed to parse JSON from AI response");
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
          throw new Error(`AI API error: ${aiResponse.status}`);
        }
      } catch (aiError: any) {
        console.error("[analyze-content] AI processing error:", aiError);
        throw aiError; // Re-throw to trigger error handling
      }
    } else {
      console.log("[analyze-content] LOVABLE_API_KEY not configured, using defaults");
    }

    // Find category ID
    let categoryId = item.category_id;
    const matchedCategory = categoryList.find((c: any) => c.name === aiResult.category);
    if (matchedCategory) {
      categoryId = matchedCategory.id;
    } else {
      const defaultCategory = categoryList.find((c: any) => c.name === "기타");
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
      ai_reason: `AI ${mode === "light" ? "라이트" : "딥"} 분석: ${aiResult.category} (${Math.round(aiResult.confidence * 100)}%)`,
      extracted_text: extractedText || null,
      ai_status: "done",
      ai_error: null,
      ai_finished_at: new Date().toISOString(),
      url_hash: urlHash,
      analysis_mode: mode,
    };

    console.log("[analyze-content] Updating item with results...");

    const { error: updateError } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[analyze-content] DB update error:", updateError);
      throw updateError;
    }

    console.log(`[analyze-content] ========== SUCCESS ==========`);
    console.log(`[analyze-content] Item ${itemId} analyzed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: updateData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[analyze-content] ========== ERROR ==========");
    console.error("[analyze-content] Error:", error.message || error);

    // Update item with error status
    if (supabase && itemId && userId) {
      try {
        await supabase
          .from("items")
          .update({
            ai_status: "error",
            ai_error: error.message || "Unknown error",
            ai_finished_at: new Date().toISOString(),
          })
          .eq("id", itemId)
          .eq("user_id", userId);
        console.log("[analyze-content] Updated item to error status");
      } catch (e) {
        console.error("[analyze-content] Failed to update error status:", e);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message || "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
