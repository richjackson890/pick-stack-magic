import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_DRAFT_LIMIT = 2;

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

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const { idea_id } = await req.json();
    if (!idea_id) {
      return new Response(JSON.stringify({ error: "idea_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, draft_generation_count")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.is_premium && (profile.draft_generation_count ?? 0) >= FREE_DRAFT_LIMIT) {
      return new Response(JSON.stringify({ error: "월간 초안 생성 횟수를 초과했습니다. Pro로 업그레이드하세요." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch idea
    const { data: idea, error: ideaError } = await supabase
      .from("content_ideas")
      .select("title, hook, format, content_layers, hashtags, channel_id, reference_item_ids")
      .eq("id", idea_id)
      .eq("user_id", userId)
      .single();

    if (ideaError || !idea) {
      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch channel
    const { data: channel } = await supabase
      .from("creator_channels")
      .select("name, platform, tone_keywords, content_formula")
      .eq("id", idea.channel_id)
      .eq("user_id", userId)
      .single();

    if (!channel) {
      return new Response(JSON.stringify({ error: "Channel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch reference items if available
    let referencesText = "";
    const refIds = idea.reference_item_ids || [];
    if (refIds.length > 0) {
      const { data: refItems } = await supabase
        .from("items")
        .select("title, summary_3lines, smart_snippet")
        .in("id", refIds)
        .eq("user_id", userId);

      if (refItems?.length) {
        referencesText = refItems.map((item, i) => {
          const summary = (item.summary_3lines || []).join(" ");
          return `[레퍼런스 ${i + 1}] ${item.title}: ${summary || item.smart_snippet || ""}`;
        }).join("\n");
      }
    }

    const contentLayers = Array.isArray(idea.content_layers)
      ? (idea.content_layers as { layer_name: string; description: string }[])
          .map((l) => `${l.layer_name}: ${l.description}`).join("\n")
      : "";

    const systemPrompt = `너는 SNS 콘텐츠 작가다. 주어진 아이디어와 채널 정보를 바탕으로 바로 사용할 수 있는 콘텐츠 초안을 작성해라.

채널 정보:
- 이름: ${channel.name}
- 플랫폼: ${channel.platform}
- 톤앤매너: ${(channel.tone_keywords || []).join(", ")}
- 콘텐츠 공식: ${channel.content_formula || "없음"}

아이디어:
- 제목: ${idea.title}
- 후킹: ${idea.hook || "없음"}
- 포맷: ${idea.format || "carousel"}
- 콘텐츠 레이어:
${contentLayers || "없음"}
- 해시태그: ${(idea.hashtags || []).join(", ")}

${referencesText ? `참고 레퍼런스:\n${referencesText}` : ""}

플랫폼별 작성 규칙:
- Instagram 캐러셀: 슬라이드별 텍스트를 [슬라이드1], [슬라이드2] 형태로 5-7장 작성. 마지막 슬라이드는 CTA. 캡션도 별도 작성.
- Instagram 릴스: 60-90초 분량 스크립트. 첫 3초 후킹 멘트 필수. 자막용 텍스트 포함.
- Threads: 3-5개 연결 스레드 형태. 첫 스레드가 후킹. 마지막에 참여 유도 질문.
- YouTube Shorts: 30-60초 스크립트. 섬네일 텍스트 제안 포함.
- Blog/Newsletter: 800-1500자 장문. 소제목 포함. SEO 키워드 자연스럽게 삽입.

반드시 해당 플랫폼 규칙에 맞춰서 작성하고, 채널의 톤앤매너를 반영해라.
해시태그는 본문 끝에 포함해라.`;

    console.log("[generate-draft] Calling AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `"${idea.title}" 아이디어를 ${channel.platform} ${idea.format || "carousel"} 포맷에 맞게 콘텐츠 초안을 작성해줘.` },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[generate-draft] AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI 생성 실패" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const draftContent = aiData.choices?.[0]?.message?.content || "";

    if (!draftContent) {
      return new Response(JSON.stringify({ error: "AI가 초안을 생성하지 못했습니다" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save draft to content_ideas
    const { error: updateError } = await supabase
      .from("content_ideas")
      .update({ draft_content: draftContent, status: "drafted" })
      .eq("id", idea_id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[generate-draft] Save error:", updateError);
      return new Response(JSON.stringify({ error: "초안 저장 실패" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment draft_generation_count
    await supabase
      .from("profiles")
      .update({ draft_generation_count: (profile.draft_generation_count ?? 0) + 1 })
      .eq("user_id", userId);

    console.log("[generate-draft] Successfully generated draft for idea:", idea_id);

    return new Response(JSON.stringify({ draft_content: draftContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-draft] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
