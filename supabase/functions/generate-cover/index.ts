import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Category-specific prompt modifiers
const categoryStyles: Record<string, string> = {
  '건강': 'healthy lifestyle, wellness, fitness, green and teal colors, organic shapes, vitality',
  '투자': 'finance, growth charts, stocks, blue and gold colors, professional, modern business',
  '레시피': 'delicious food, culinary art, warm colors, appetizing, kitchen, cooking',
  '건축 레퍼런스': 'architecture, modern building, blueprint, purple and pink gradients, structural design',
  '렌더링/툴': '3D rendering, digital art, software interface, pink and red gradient, technology',
  '기타': 'abstract minimal design, subtle gradients, clean aesthetic, neutral colors',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { item_id, title, summary, tags, category_name, platform } = await req.json();

    if (!item_id || !title) {
      return new Response(JSON.stringify({ error: 'item_id and title are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-cover] Generating cover for item: ${item_id}`);

    // Build the prompt
    const categoryStyle = categoryStyles[category_name] || categoryStyles['기타'];
    const tagContext = tags?.length > 0 ? `Keywords: ${tags.slice(0, 3).join(', ')}.` : '';
    const summaryContext = summary ? `Context: ${summary.slice(0, 100)}.` : '';
    
    const prompt = `Create a visually striking 1:1 square cover image for social media content.
Style: Modern, minimal, abstract art with ${categoryStyle}.
Platform: ${platform || 'web'} content.
${summaryContext}
${tagContext}
Title hint: "${title.slice(0, 50)}".

Requirements:
- NO text, letters, numbers, or words in the image
- Abstract visual representation of the concept
- Rich gradients and depth
- Clean, professional aesthetic
- Suitable as a thumbnail/cover image
- High contrast for visibility at small sizes`;

    console.log(`[generate-cover] Prompt: ${prompt.slice(0, 200)}...`);

    // Call Lovable AI Image Generation
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-cover] AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error('[generate-cover] No image in response:', JSON.stringify(aiData).slice(0, 500));
      throw new Error('No image generated');
    }

    console.log('[generate-cover] Image generated, uploading to storage...');

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format');
    }

    const [, imageType, base64Data] = base64Match;
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${user.id}/${item_id}_${Date.now()}.${imageType}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, imageBuffer, {
        contentType: `image/${imageType}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('[generate-cover] Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('covers')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    console.log(`[generate-cover] Uploaded to: ${publicUrl}`);

    // Update the item's thumbnail_url
    const { error: updateError } = await supabase
      .from('items')
      .update({ thumbnail_url: publicUrl })
      .eq('id', item_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[generate-cover] DB update error:', updateError);
      throw new Error(`Failed to update item: ${updateError.message}`);
    }

    console.log(`[generate-cover] Successfully generated cover for item: ${item_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      thumbnail_url: publicUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-cover] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate cover' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
