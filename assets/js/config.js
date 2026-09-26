/* =========================================================
   Configuração do Supabase (pedidos e avaliações compartilhados)

   Supabase → Project Settings → API:
     supabaseUrl      "Project URL"
     supabaseAnonKey  chave "publishable" (sb_publishable_...) ou a antiga
                      "anon" (eyJ...). NUNCA a "secret" / service_role.

   A chave anon é pública por natureza: quem protege os dados são
   as regras de supabase/schema.sql. Deixe em branco para o site
   funcionar só com o localStorage de cada aparelho, como antes.
   ========================================================= */
window.BAR_CONFIG = {
  supabaseUrl: 'https://lvfwzcedynxyahwvacqh.supabase.co',
  supabaseAnonKey: 'sb_publishable_Ctpu_NLKaENx7hV4xtRrLw_4KXsI-1e'
};
