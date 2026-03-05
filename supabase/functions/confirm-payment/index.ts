const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentKey, orderId, amount, paymentType } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return new Response(JSON.stringify({ error: '필수 파라미터가 없습니다' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    // Confirm payment with TossPayments API
    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY');
    if (!tossSecretKey) {
      return new Response(JSON.stringify({ error: '결제 설정 오류' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encodedKey = btoa(`${tossSecretKey}:`);
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('TossPayments error:', tossResult);
      return new Response(JSON.stringify({ 
        error: tossResult.message || '결제 승인에 실패했습니다',
        code: tossResult.code 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Payment confirmed! Update user profile based on payment type
    if (paymentType === 'subscription') {
      // Upgrade to premium
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({ is_premium: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return new Response(JSON.stringify({ error: '프로필 업데이트 실패' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      payment: {
        orderId: tossResult.orderId,
        totalAmount: tossResult.totalAmount,
        method: tossResult.method,
        approvedAt: tossResult.approvedAt,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
