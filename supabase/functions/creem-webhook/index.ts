import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { record } = await req.json()
  
  // 1. 获取支付信息
  // Creem 支付成功后会传回这些数据
  const userId = record.custom_fields?.user_id 
  const status = record.status

  if (status === 'success' && userId) {
    // 2. 初始化数据库连接
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. 更新用户权限：把 is_pro 改成 true
    const { error } = await supabase
      .from('profiles') // 假设你的表名是 profiles
      .update({ is_pro: true })
      .eq('id', userId)

    if (error) return new Response(JSON.stringify(error), { status: 500 })
  }

  return new Response(JSON.stringify({ done: true }), { status: 200 })
})
