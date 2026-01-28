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

// Generate fallback title when none is available
function generateFallbackTitle(url: string | null, platform: string): string {
  if (!url) return `${platform} 저장 콘텐츠`;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const slug = pathParts[pathParts.length - 1].replace(/[-_]/g, ' ').slice(0, 50);
      if (slug && slug.length > 3) return slug;
    }
    return `${platform} 저장 콘텐츠 (${new Date().toLocaleDateString('ko-KR')})`;
  } catch {
    return `${platform} 저장 콘텐츠`;
  }
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

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Extract main text content from HTML (more comprehensive extraction)
function extractTextContent(html: string): string {
  // Remove script, style, nav, footer, header, aside tags
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  
  // Extract article or main content preferentially
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentDiv = cleaned.match(/<div[^>]*class="[^"]*(?:content|article|post|entry|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  
  let targetHtml = articleMatch?.[1] || mainMatch?.[1] || contentDiv?.[1] || cleaned;
  
  // Extract headings for keywords
  const headings: string[] = [];
  targetHtml.replace(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, (_, content) => {
    headings.push(content.trim());
    return '';
  });
  
  // Extract paragraph text
  const paragraphs: string[] = [];
  targetHtml.replace(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/p>/gi, (_, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    if (text.length > 20) paragraphs.push(text);
    return '';
  });
  
  // Extract list items
  const listItems: string[] = [];
  targetHtml.replace(/<li[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/li>/gi, (_, content) => {
    const text = content.replace(/<[^>]+>/g, '').trim();
    if (text.length > 10) listItems.push(text);
    return '';
  });
  
  // Combine extracted text
  const allText = [
    ...headings.slice(0, 10),
    ...paragraphs.slice(0, 20),
    ...listItems.slice(0, 15),
  ].join('\n');
  
  return decodeHtmlEntities(allText).replace(/\s+/g, ' ').trim();
}

// Extract hashtags from text
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w가-힣]+/g) || [];
  return [...new Set(matches)].slice(0, 10);
}

// Extract @mentions
function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w._]+/g) || [];
  return [...new Set(matches)].slice(0, 5);
}

// Fetch Instagram-specific metadata (optimized for Reels)
async function fetchInstagramMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  caption?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
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
    console.log(`[analyze-content] Instagram HTML length: ${html.length}`);
    
    // Instagram-specific meta tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    
    // Try alternative meta tags (Instagram sometimes uses different formats)
    const altTitle = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
    const altDescription = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1];
    
    // Extract Instagram caption from og:description (format: "X likes, X comments - username on Instagram: "caption"")
    let caption = "";
    const descriptionText = ogDescription || altDescription || "";
    
    // Pattern 1: "좋아요 N개, 댓글 N개 - username의 Instagram 게시물: "caption""
    const captionMatch1 = descriptionText.match(/게시물:\s*[""]([^""]+)[""]/i);
    // Pattern 2: "N likes, N comments - username on Instagram: "caption""
    const captionMatch2 = descriptionText.match(/Instagram:\s*[""]([^""]+)[""]/i);
    // Pattern 3: Just extract quoted content
    const captionMatch3 = descriptionText.match(/[""]([^""]{10,})[""]$/);
    
    if (captionMatch1) {
      caption = captionMatch1[1];
    } else if (captionMatch2) {
      caption = captionMatch2[1];
    } else if (captionMatch3) {
      caption = captionMatch3[1];
    } else if (descriptionText.length > 50) {
      // Use the whole description if it's long enough
      caption = descriptionText;
    }
    
    // Extract author/username from description
    let author = "";
    const authorMatch = descriptionText.match(/[-–]\s*(@?\w+)(?:'s|의|님의|\s+on\s+Instagram)/i);
    if (authorMatch) {
      author = authorMatch[1].startsWith('@') ? authorMatch[1] : `@${authorMatch[1]}`;
    }
    
    // Also try to extract from URL path
    if (!author) {
      const urlMatch = url.match(/instagram\.com\/(?:p|reel|reels)\/\w+/i);
      if (!urlMatch) {
        const usernameMatch = url.match(/instagram\.com\/([^\/\?]+)/);
        if (usernameMatch && !['p', 'reel', 'reels', 'stories', 'tv'].includes(usernameMatch[1])) {
          author = `@${usernameMatch[1]}`;
        }
      }
    }
    
    console.log(`[analyze-content] Instagram caption: ${caption?.slice(0, 100)}`);
    console.log(`[analyze-content] Instagram author: ${author}`);
    
    return {
      title: decodeHtmlEntities(ogTitle || altTitle || ""),
      description: decodeHtmlEntities(descriptionText),
      image: ogImage || "",
      author,
      caption: decodeHtmlEntities(caption),
    };
  } catch (error) {
    console.error("[analyze-content] Instagram metadata fetch error:", error);
    return {};
  }
}

// Fetch generic Open Graph metadata with comprehensive text extraction
async function fetchOpenGraphData(url: string): Promise<{ 
  title?: string; 
  description?: string; 
  image?: string;
  extractedText?: string;
  hashtags?: string[];
  author?: string;
  keywords?: string[];
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
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
    console.log(`[analyze-content] Fetched HTML length: ${html.length}`);
    
    // OG and meta tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const metaKeywords = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const author = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const twitterDescription = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    
    // Extract comprehensive text content
    const extractedText = extractTextContent(html);
    console.log(`[analyze-content] Extracted main text length: ${extractedText.length}`);
    
    // Extract hashtags from content
    const hashtags = extractHashtags(html);
    
    // Parse meta keywords
    const keywords = metaKeywords?.split(',').map(k => k.trim()).filter(Boolean) || [];
    
    const description = ogDescription || metaDescription || twitterDescription || "";
    
    return {
      title: decodeHtmlEntities(ogTitle || titleTag || ""),
      description: decodeHtmlEntities(description),
      image: ogImage || "",
      extractedText: extractedText.slice(0, 3000), // Limit to 3000 chars
      hashtags,
      author,
      keywords,
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
    } else if (platform === "Instagram" && item.url) {
      // Special handling for Instagram (Reels, Posts, Stories)
      console.log("[analyze-content] Fetching Instagram metadata...");
      const instaData = await fetchInstagramMetadata(item.url);
      
      // Use caption as primary content for analysis
      if (instaData.caption && instaData.caption.length > 10) {
        extractedText = instaData.caption;
        console.log(`[analyze-content] Instagram caption extracted: ${extractedText.length} chars`);
      }
      
      // Build better title from caption
      if (instaData.caption && instaData.caption.length > 5) {
        // Use first line or first 50 chars of caption as title
        const firstLine = instaData.caption.split('\n')[0];
        title = firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '');
      } else if (instaData.title && instaData.title !== 'Instagram') {
        title = instaData.title;
      }
      
      // Include author in description
      if (instaData.author) {
        description = `Instagram ${item.url.includes('/reel') ? '릴스' : '게시물'} by ${instaData.author}`;
        if (instaData.caption) {
          description += `\n\n${instaData.caption.slice(0, 500)}`;
        }
      } else {
        description = instaData.description || "";
      }
      
      // Extract hashtags from caption
      if (instaData.caption) {
        const captionHashtags = extractHashtags(instaData.caption);
        console.log(`[analyze-content] Instagram hashtags: ${captionHashtags.join(', ')}`);
      }
      
      console.log(`[analyze-content] Instagram title: ${title}`);
      console.log(`[analyze-content] Instagram author: ${instaData.author || 'unknown'}`);
    } else if (item.url) {
      console.log("[analyze-content] Fetching Open Graph data...");
      const ogData = await fetchOpenGraphData(item.url);
      title = ogData.title || title;
      thumbnailUrl = ogData.image || thumbnailUrl;
      description = ogData.description || "";
      
      // Use comprehensive extracted text
      if (ogData.extractedText) {
        extractedText = ogData.extractedText;
        console.log(`[analyze-content] Rich text extraction: ${extractedText.length} chars`);
      }
      
      // Merge hashtags from page
      const pageHashtags = ogData.hashtags || [];
      
      // Include author and keywords in context
      if (ogData.author) {
        description = `${description} (저자: ${ogData.author})`;
      }
      if (ogData.keywords?.length) {
        description = `${description} [키워드: ${ogData.keywords.slice(0, 5).join(', ')}]`;
      }
      
      console.log(`[analyze-content] OG title: ${title}`);
      console.log(`[analyze-content] Page hashtags: ${pageHashtags.join(', ')}`);
    }

    // Build comprehensive extracted text (don't overwrite if already populated from rich extraction)
    if (!extractedText || extractedText.length < 100) {
      extractedText = [title, description].filter(Boolean).join("\n\n");
    }
    console.log(`[analyze-content] Final extracted text length: ${extractedText.length}`);

    // Default result (used if AI fails or not configured)
    let aiResult = {
      title: title || item.title || "제목 없음",
      summary_3: ["콘텐츠가 저장되었습니다.", "", ""],
      tags: ["저장됨"],
      category: "기타",
      confidence: 0.3,
      // New enhanced fields
      core_keywords: [] as string[],
      entities: [] as string[],
      hashtags: [] as string[],
      intent: "정보" as string,
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

        // Light mode prompt - with user category priority and enhanced metadata extraction
        // Include extracted text for better analysis
        const textForAnalysis = extractedText.slice(0, 1500);
        
        const prompt = mode === "light" 
          ? `콘텐츠 분석:

URL: ${item.url || "없음"}
플랫폼: ${platform}
제목: ${title || "없음"}
설명: ${description ? description.slice(0, 500) : "없음"}
본문 추출: ${textForAnalysis || "없음"}

[사용자 카테고리 목록 - 반드시 이 중에서 선택]:
${categoryContext}

JSON 응답 (반드시 이 형식):
{
  "title": "콘텐츠 제목 (50자 이내, 한국어)",
  "summary_3": ["핵심요약1 (25-35자)", "핵심요약2 (25-35자)", "핵심요약3 (25-35자)"],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "final_category": "카테고리명",
  "confidence": 0.0-1.0,
  "why_category": "분류 근거 한 문장",
  "core_keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3", "핵심키워드4", "핵심키워드5", "핵심키워드6", "핵심키워드7", "핵심키워드8"],
  "entities": ["사람/브랜드/장소/툴 고유명사"],
  "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3"],
  "intent": "정보/튜토리얼/구매/영감/뉴스/후기/레퍼런스 중 하나"
}

분류 규칙:
1. final_category는 반드시 위 카테고리 목록 중 하나만 선택
2. 키워드가 있으면 해당 키워드와 콘텐츠 매칭 우선 고려
3. 건강 관련: 루틴/실행 관점 (시간대, 횟수, 주의사항 형태로)
4. 투자/의학/법률: 단정 금지, "참고/일반 정보" 톤 유지
5. 애매하면 "기타" 선택
6. summary_3는 한국어, 실용적 핵심 3개
7. core_keywords: 본문에서 추출한 검색용 핵심 키워드 5-8개 (검색에 유용한 단어)
8. entities: 고유명사(사람, 브랜드, 장소, 툴명) 추출
9. hashtags: 원문에 있는 해시태그 또는 관련 해시태그 생성
10. intent: 콘텐츠 목적 분류`
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
  "why_category": "분류 근거",
  "core_keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3", "핵심키워드4", "핵심키워드5", "핵심키워드6", "핵심키워드7", "핵심키워드8"],
  "entities": ["고유명사들"],
  "hashtags": ["#해시태그"],
  "intent": "정보/튜토리얼/구매/영감/뉴스/후기/레퍼런스"
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
              // Enhanced fields
              core_keywords: Array.isArray(parsed.core_keywords) ? parsed.core_keywords.slice(0, 8) : [],
              entities: Array.isArray(parsed.entities) ? parsed.entities.slice(0, 10) : [],
              hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 5) : [],
              intent: parsed.intent || "정보",
            };
            console.log(`[analyze-content] Parsed AI result: category=${aiResult.category}, confidence=${aiResult.confidence}`);
            console.log(`[analyze-content] Enhanced metadata: keywords=${aiResult.core_keywords.length}, entities=${aiResult.entities.length}, intent=${aiResult.intent}`);
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

    // Generate fallback_title if title is empty
    const fallbackTitle = aiResult.title || title || generateFallbackTitle(item.url, platform);
    
    // Generate smart_snippet from summary
    const smartSnippet = aiResult.summary_3[0] || description?.slice(0, 100) || "";

    // Update item with analysis results including new metadata
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
      // New enhanced metadata fields
      fallback_title: fallbackTitle,
      smart_snippet: smartSnippet,
      core_keywords: aiResult.core_keywords,
      entities: aiResult.entities,
      hashtags: aiResult.hashtags,
      intent: aiResult.intent,
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
