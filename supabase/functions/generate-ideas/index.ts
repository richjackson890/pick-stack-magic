import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { item_ids, keywords, channel_id } = await req.json();

    if ((!item_ids?.length && !keywords?.trim()) || !channel_id) {
      return new Response(JSON.stringify({ error: "item_ids or keywords, and channel_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isKeywordMode = !item_ids?.length && !!keywords?.trim();

    // Check usage limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, idea_generation_count")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FREE_IDEA_LIMIT = 3;
    if (!profile.is_premium && profile.idea_generation_count >= FREE_IDEA_LIMIT) {
      return new Response(JSON.stringify({ error: "월간 아이디어 생성 횟수를 초과했습니다. Pro로 업그레이드하세요." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch items (only for reference mode)
    let referencesText = "";
    if (!isKeywordMode) {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("title, summary_3lines, tags, smart_snippet, core_keywords")
        .in("id", item_ids)
        .eq("user_id", userId);

      if (itemsError || !items?.length) {
        return new Response(JSON.stringify({ error: "Items not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      referencesText = items.map((item, i) => {
        const summary = (item.summary_3lines || []).join(" ");
        const tags = (item.tags || []).join(", ");
        const kw = (item.core_keywords || []).join(", ");
        return `[레퍼런스 ${i + 1}]\n제목: ${item.title}\n요약: ${summary || item.smart_snippet || ""}\n태그: ${tags}\n키워드: ${kw}`;
      }).join("\n\n");
    } else {
      referencesText = `사용자 입력 키워드: ${keywords.trim()}`;
    }

    // Fetch channel
    const { data: channel, error: channelError } = await supabase
      .from("creator_channels")
      .select("name, platform, tone_keywords, content_formula, target_hashtags")
      .eq("id", channel_id)
      .eq("user_id", userId)
      .single();

    if (channelError || !channel) {
      return new Response(JSON.stringify({ error: "Channel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const referenceLabel = isKeywordMode ? "사용자 입력 키워드" : "레퍼런스 자료";

    const systemPrompt = `너는 SNS 콘텐츠 전략가다. 사용자가 제공한 ${referenceLabel}와 채널 프로필을 분석해서 콘텐츠 아이디어를 3개 제안해라.

채널 정보:
- 이름: ${channel.name}
- 플랫폼: ${channel.platform}
- 톤앤매너: ${(channel.tone_keywords || []).join(", ")}
- 콘텐츠 공식: ${channel.content_formula || "없음"}
- 타겟 해시태그: ${(channel.target_hashtags || []).join(", ")}

${referenceLabel}:
${referencesText}

반드시 아래 JSON 형식으로만 응답해라. 다른 텍스트 없이 JSON만:
{
  "ideas": [
    {
      "title": "포스트 제목",
      "hook": "첫 줄 후킹 멘트",
      "format": "carousel 또는 reel 또는 thread 또는 long_form",
      "content_layers": [{"layer_name": "레이어명", "description": "설명"}],
      "hashtags": ["해시태그1", "해시태그2"],
      "estimated_engagement": "low 또는 mid 또는 high"
    }
  ]
}`;

    console.log("[generate-ideas] Calling AI...");

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
          { role: "user", content: isKeywordMode ? "위 키워드를 기반으로 채널에 맞는 콘텐츠 아이디어 3개를 JSON으로 제안해줘." : "위 레퍼런스 자료를 분석하고 채널에 맞는 콘텐츠 아이디어 3개를 JSON으로 제안해줘." },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[generate-ideas] AI error:", aiResponse.status, errorText);
      
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
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("[generate-ideas] AI response length:", content.length);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[generate-ideas] Failed to parse JSON from AI response:", content.slice(0, 500));
      return new Response(JSON.stringify({ error: "AI 응답 파싱 실패" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const ideas = parsed.ideas;

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return new Response(JSON.stringify({ error: "AI가 아이디어를 생성하지 못했습니다" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save ideas to content_ideas table
    const ideaRecords = ideas.slice(0, 3).map((idea: any) => ({
      user_id: userId,
      channel_id,
      title: idea.title || "무제",
      hook: idea.hook || null,
      format: idea.format || "carousel",
      content_layers: idea.content_layers || [],
      hashtags: idea.hashtags || [],
      estimated_engagement: idea.estimated_engagement || "mid",
      reference_item_ids: isKeywordMode ? [] : item_ids,
      status: "idea",
    }));

    const { data: savedIdeas, error: saveError } = await supabase
      .from("content_ideas")
      .insert(ideaRecords)
      .select();

    if (saveError) {
      console.error("[generate-ideas] Save error:", saveError);
      return new Response(JSON.stringify({ error: "아이디어 저장 실패" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment idea_generation_count
    await supabase
      .from("profiles")
      .update({ idea_generation_count: profile.idea_generation_count + 1 })
      .eq("user_id", userId);

    console.log("[generate-ideas] Successfully generated and saved", savedIdeas?.length, "ideas");

    return new Response(JSON.stringify({ ideas: savedIdeas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-ideas] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
