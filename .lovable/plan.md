

## Notificações Push Mesmo com Site Fechado

### O que muda
Hoje as notificações dependem de uma conexão WebSocket ativa (Supabase Realtime), que morre quando o tab fecha. Para funcionar **sem o site aberto**, precisamos de uma arquitetura diferente baseada em **Web Push API**.

### Como vai funcionar

```text
Novo pedido inserido no banco
        |
        v
Database Webhook (Supabase)
        |
        v
Edge Function "push-notify"
        |
        v
Envia Web Push via VAPID keys
        |
        v
Service Worker recebe no dispositivo
        |
        v
Notificação nativa aparece (mesmo com browser fechado)
```

### Etapas de implementação

**1. Gerar chaves VAPID**
- Vou gerar um par de chaves (publica/privada) usando a biblioteca `web-push`
- A chave publica vai no frontend, a privada como Secret no Supabase

**2. Service Worker (`public/sw.js`)**
- Arquivo que roda em background no navegador
- Escuta eventos `push` e exibe a notificação nativa
- Ao clicar na notificação, abre `/admin/orders`

**3. Frontend: registrar assinatura push**
- No `AdminLayout`, ao carregar, registra o Service Worker
- Solicita permissão de notificação e obtém a "subscription" do browser
- Salva essa subscription no Supabase (nova tabela `push_subscriptions`)

**4. Nova tabela no Supabase: `push_subscriptions`**
- Colunas: `id`, `store_id`, `user_id`, `endpoint`, `keys_p256dh`, `keys_auth`, `created_at`
- Armazena as assinaturas de cada admin para enviar push

**5. Edge Function: `push-notify`**
- Recebe webhook do Supabase quando um novo pedido e inserido
- Busca as subscriptions do `store_id` correspondente
- Envia Web Push para cada dispositivo registrado
- Usa a lib `web-push` (compativel com Deno)

**6. Database Webhook no Supabase**
- Configurar um webhook na tabela `orders` (evento INSERT)
- Aponta para a Edge Function `push-notify`

### O que voce precisara fazer manualmente

1. **Criar a tabela `push_subscriptions`** no Supabase (vou fornecer o SQL)
2. **Adicionar Secrets** no Supabase Dashboard:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (ex: `mailto:seu@email.com`)
3. **Configurar o Database Webhook** apontando para a Edge Function (vou dar o passo a passo)

### Detalhes tecnicos

- A notificacao aparece mesmo com o browser completamente fechado (desde que o browser esteja instalado no sistema)
- No celular Android funciona perfeitamente; no iOS Safari tem suporte a partir do iOS 16.4 com PWA instalada
- As notificacoes existentes (som + toast com site aberto) continuam funcionando normalmente em paralelo
- Nenhuma dependencia externa de servico pago (Firebase, OneSignal etc.) -- tudo nativo com Web Push API

