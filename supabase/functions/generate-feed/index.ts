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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { channel_id } = await req.json();
    if (!channel_id) {
      return new Response(JSON.stringify({ error: "channel_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limit for free users
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, feed_generation_date")
      .eq("user_id", user.id)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];
    if (profile && !profile.is_premium && profile.feed_generation_date === today) {
      return new Response(JSON.stringify({ error: "daily_limit", message: "무료 사용자는 하루 1회만 피드를 생성할 수 있어요" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch channel
    const { data: channel, error: channelError } = await supabase
      .from("creator_channels")
      .select("*")
      .eq("id", channel_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (channelError || !channel) {
      return new Response(JSON.stringify({ error: "Channel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todayStr = new Date().toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    });

    const systemPrompt = `너는 SNS 콘텐츠 리서처다.
다음 채널 프로필을 보고, 이 채널이 지금 다뤄야 할 뉴스/이슈/트렌드를 10개 제안해라.

채널 정보:
- 이름: ${channel.name}
- 플랫폼: ${channel.platform}
- 톤: ${(channel.tone_keywords || []).join(", ")}
- 콘텐츠 공식: ${channel.content_formula || "없음"}
- 해시태그: ${(channel.target_hashtags || []).join(", ")}

현재 날짜: ${todayStr}

각 항목에 다음을 포함해라:
- title: 뉴스/이슈 제목
- summary: 1-2줄 요약
- angle: 이 채널에서 다룰 수 있는 앵글 제안
- urgency: 'hot' | 'trending' | 'evergreen'

JSON 배열로만 응답해라.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "지금 이 채널에 맞는 콘텐츠 기회 10개를 JSON 배열로 제안해줘." },
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    let feedItems = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        feedItems = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("JSON parse error:", e);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update feed_generation_date for free users
    if (profile && !profile.is_premium) {
      await supabase
        .from("profiles")
        .update({ feed_generation_date: today })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ feed: feedItems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
