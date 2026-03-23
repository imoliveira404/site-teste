import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CAKTO_SECRET = Deno.env.get("CAKTO_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

console.log("Configuração carregada:");
console.log("- SUPABASE_URL:", SUPABASE_URL ? "OK" : "MISSING");
console.log("- RESEND_API_KEY:", RESEND_API_KEY ? `Configurada (${RESEND_API_KEY.substring(0, 7)}...)` : "MISSING");
console.log("- CAKTO_SECRET:", CAKTO_SECRET ? "Configurada" : "MISSING");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // 1. Validar Secret
    if (!CAKTO_SECRET) {
      console.error("ERRO: Variável de ambiente CAKTO_SECRET não configurada no Supabase.");
    }

    if (payload.secret !== CAKTO_SECRET) {
      console.error(`Invalid secret. Recebido: ${payload.secret?.substring(0, 4)}... Esperado: ${CAKTO_SECRET?.substring(0, 4)}...`);
      return new Response(JSON.stringify({ error: "Invalid secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verificar se a compra foi aprovada
    if (payload.event !== "purchase_approved" && payload.data?.status !== "paid") {
      console.log("Event not handled (ignored):", payload.event);
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = payload.data.customer;
    const { name: productName } = payload.data.product;

    console.log(`Processing purchase for ${email}, Product: ${productName}`);

    // 3. Buscar uma key disponível para este produto (usando o NOME por enquanto)
    const { data: keyRecord, error: fetchError } = await supabase
      .from("keys")
      .select("*")
      .eq("product_id", productName) // Mudado para PRODUCT_NAME para facilitar testes
      .eq("status", "available")
      .limit(1)
      .single();

    if (fetchError || !keyRecord) {
      console.error("No keys available for product name:", productName);
      return new Response(JSON.stringify({
        error: `No keys available for ${productName}. Verifique se você colocou exatamente este nome na tabela 'keys'.`,
        received_product_name: productName
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Marcar key como usada
    const { error: updateError } = await supabase
      .from("keys")
      .update({
        status: "used",
        buyer_email: email,
        used_at: new Date().toISOString(),
      })
      .eq("id", keyRecord.id);

    if (updateError) {
      console.error("Error updating key status:", updateError);
      return new Response(JSON.stringify({ error: "Error updating key status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Enviar e-mail com a key
    console.log(`Tentando enviar e-mail para ${email} usando Resend...`);

    const emailOptions = {
      from: "onboarding@resend.dev", // Apenas onboarding@resend.dev sem nome personalizado para teste puro
      to: email,
      subject: `Sua chave para ${productName} chegou!`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sua chave AuroraMC</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <!-- Header -->
                <tr>
                    <td align="center" style="background-color: #4CAF50; padding: 40px 20px;">
                        <img src="https://media.discordapp.net/attachments/1484719838944297023/1484719898117537904/banner.png?ex=69bf40a8&is=69bdef28&hm=e40df3682aaf10f8c6e0e2fd471bee7b06914fee1371b2b1dba44f93da127f22&=&format=png&quality=lossless" style="width: 300px;">
                        <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Sua aventura começa aqui!</p>
                    </td>
                </tr>
                
                <!-- Content -->
                <tr>
                    <td style="padding: 40px 30px;">
                        <h2 style="color: #333333; margin-top: 0; font-size: 22px;">Olá! Obrigado pela sua compra. 😊</h2>
                        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
                            Sua compra do produto <strong>${productName}</strong> foi aprovada com sucesso. Abaixo, você encontrará a sua chave de ativação exclusiva:
                        </p>
                        
                        <!-- Chave Card -->
                        <div style="background-color: #f1f8e9; border: 2px dashed #4CAF50; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                            <span style="display: block; color: #4CAF50; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">CÓDIGO DE ATIVAÇÃO</span>
                            <code style="display: block; font-size: 24px; font-weight: 800; color: #2e7d32; letter-spacing: 2px;">${keyRecord.key_content}</code>
                        </div>

                        <!-- Tutorial -->
                        <div style="background-color: #fff9c4; border-left: 4px solid #fbc02d; padding: 15px; margin-bottom: 30px; border-radius: 0 4px 4px 0;">
                            <p style="margin: 0; color: #7f6e00; font-size: 14px;"><strong>💡 Como ativar?</strong></p>
                            <p style="margin: 5px 0 0 0; color: #7f6e00; font-size: 14px;">Dentro do servidor, use o comando: <br><strong style="font-size: 16px;">/usar ${keyRecord.key_content}</strong></p>
                        </div>
                        
                        <p style="color: #555555; line-height: 1.6; font-size: 14px;">
                            Caso precise de ajuda, não hesite em abrir um ticket no nosso Discord oficial ou acessar nossa central de ajuda.
                        </p>
                    </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                    <td align="center" style="background-color: #fafafa; padding: 30px; border-top: 1px solid #eeeeee;">
                        <div style="margin-bottom: 20px;">
                            <a href="https://discord.gg/auroramc" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                                <img src="https://cdn-icons-png.flaticon.com/512/5968/5968756.png" width="24" height="24" alt="Discord">
                            </a>
                            <a href="https://youtube.com/auroramc" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                                <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="24" height="24" alt="YouTube">
                            </a>
                            <a href="https://instagram.com/auroramc" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                                <img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" width="24" height="24" alt="Instagram">
                            </a>
                            <a href="https://auroramc.com.br" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                                <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" width="24" height="24" alt="Website">
                            </a>
                        </div>
                        
                        <p style="color: #999999; font-size: 12px; margin-bottom: 10px;">
                            <strong>AuroraMC &copy; 2026</strong> - Todos os direitos reservados.
                        </p>
                        
                        <div style="color: #999999; font-size: 11px;">
                            <a href="https://auroramc.com.br/termos" style="color: #4CAF50; text-decoration: none;">Política de Privacidade</a> 
                            <span style="margin: 0 5px;">|</span>
                            <a href="https://auroramc.com.br/ajuda" style="color: #4CAF50; text-decoration: none;">Central de Ajuda</a>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    };

    const { data: emailData, error: emailError } = await resend.emails.send(emailOptions);

    if (emailError) {
      console.error("ERRO NO RESEND:", JSON.stringify(emailError, null, 2));
      return new Response(JSON.stringify({
        success: false,
        error: "Erro ao enviar e-mail via Resend",
        details: emailError
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("E-mail enviado com sucesso! Resposta do Resend:", emailData);

    return new Response(JSON.stringify({
      success: true,
      message: "Webhook processado e e-mail enviado!",
      resend_id: emailData?.id
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Critical error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
