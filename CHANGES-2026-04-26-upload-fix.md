# Fix: "Upload falhou — Nenhum arquivo enviado" + Migração R2

**Data:** 2026-04-26 (segundo bloco de mudanças do dia)
**Escopo:** corrigir o erro de upload de avatar/banner/background visto em
produção e migrar todas as imagens em base64 para o Cloudflare R2.

---

## 1. Sintoma

Em `https://faren.com.br/dashboard/edit`, qualquer tentativa de subir
avatar/banner/background retornava:

```json
HTTP 400  {"error":"Nenhum arquivo enviado."}
```

O bug afetava 100% dos uploads, independentemente do tipo de arquivo, tamanho,
navegador, autenticação ou caminho de rede (Cloudflare worker, DNS proxy ou
direto no Render).

## 2. Investigação

Reproduzido em três caminhos distintos com o mesmo resultado:

| Caminho | Resultado |
|---|---|
| Browser → `https://api.faren.com.br` (CF DNS proxy) | 400 "Nenhum arquivo enviado." |
| `curl --form` direto em `https://faren-api-wn1z.onrender.com` | 400 "Nenhum arquivo enviado." |
| `node fetch` via `dev-proxy.mjs` local | 400 "Nenhum arquivo enviado." |

⇒ Bug está no **backend**, não na rede.

Subindo o api-server localmente (`PORT=8090` apontando pro Postgres de prod) e
adicionando `console.log` na rota, o log expôs a causa raiz:

```
[upload-debug] req data chunk 267 total: 267
[upload-debug] req end, total: 267
[upload-debug] req close, total: 267
[upload] r2 failed: Cannot set headers after they are sent to the client
```

O Busboy **estava** recebendo o arquivo e disparando o evento `'file'`. O R2
recebia o upload normalmente. O problema era ordem de eventos:

1. `bb.on('file')` dispara, lê o stream, registra `fileStream.on('end', async …)`.
2. `fileStream.on('end')` chama `await uploadBuffer(…)` — **assíncrono**.
3. Antes do `await` resolver, o `bb.on('finish')` (Busboy é Writable, herda
   `finish`) dispara porque o body completo já foi escrito.
4. `bb.on('finish')` lê `responded === false` (a flag só virava `true` depois do
   upload terminar) e responde **400 "Nenhum arquivo enviado."**.
5. Em seguida, `await uploadBuffer` resolve, tenta `res.json({ url })` →
   `Cannot set headers after they are sent to the client`. Erro engolido pelo
   `try/catch`.

Resultado: **toda requisição de upload retornava 400**, mesmo quando o R2
recebia o arquivo com sucesso.

## 3. Correção (`artifacts/api-server/src/routes/profiles.ts`)

Separadas duas semânticas que estavam misturadas em uma única flag:

- `fileReceived`: marcado **sincronicamente** dentro de `bb.on('file')`. É a
  fonte de verdade pra "o multipart trazia ou não um arquivo".
- `responded`: continua sendo "o `res.json/status` já foi chamado".

Além disso, o callback do `fileStream.on('end')` virou síncrono e a parte async
do upload virou uma Promise armazenada em `uploadInFlight`. O `bb.on('finish')`
agora aguarda essa promise antes de encerrar, evitando que o handler termine
antes do upload R2.

Diff conceitual:

```diff
+ let fileReceived = false;
+ let uploadInFlight: Promise<void> | null = null;

  bb.on('file', (_name, fileStream, info) => {
+   fileReceived = true;
    …
    fileStream.on('end', () => {
-     // antes: async; só setava responded=true depois do uploadBuffer
+     uploadInFlight = (async () => {
+       try {
+         const url = await uploadBuffer(…);
+         if (responded) return;
+         responded = true;
+         res.json({ url });
+       } catch (e) {
+         fail(500, "Falha ao enviar para o armazenamento.");
+       }
+     })();
    });
  });

  bb.on('finish', async () => {
+   if (responded) return;
+   if (!fileReceived) {
+     fail(400, "Nenhum arquivo enviado.");
+     return;
+   }
+   if (uploadInFlight) {
+     try { await uploadInFlight; } catch { /* fail() já tratou */ }
+   }
  });
```

## 4. Validação local

API rodando em `:8090` com env de produção (R2 + Postgres prod) e JWT forjado
pra usuário `id=1`:

| Teste | Esperado | Resultado |
|---|---|---|
| Upload PNG válido | 200 + `{url: "https://pub-….r2.dev/avatars/1/…"}` | ✅ 200, URL R2 retornada |
| Multipart sem campo `file` | 400 "Nenhum arquivo enviado." | ✅ 400 com mensagem correta |
| MIME não permitido (`text/plain`) | 415 "Tipo de arquivo não permitido" | ✅ 415 com mensagem correta |

Arquivo realmente subiu pro bucket R2 (`avatars/1/c414cd0e204de974.png`),
visível via `R2_PUBLIC_URL`.

## 5. Migração base64 → R2 (executada agora)

Antes da correção:
- **1** `users.avatar_url` em `data:…` (base64 inline).
- **0** `profiles.background_url` em `data:…`.

Script: `artifacts/api-server/src/scripts/migrate-base64-to-r2.ts`. Foi
necessário **remover** o `import "dotenv/config"` (dependência não declarada
no `package.json` do api-server; env é injetado por shell na execução).

Comando executado:

```bash
cd artifacts/api-server
DATABASE_URL="${PROD_DATABASE}?sslmode=require" \
  R2_BUCKET=… R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… \
  R2_SECRET_ACCESS_KEY=… R2_PUBLIC_URL=… \
  pnpm dlx tsx src/scripts/migrate-base64-to-r2.ts all
```

Resultado:

```
[users] 1/19 need migration
[users] done: ok=1 fail=0
[profiles] 0/19 need migration
[profiles] done: ok=0 fail=0
```

Pós-migração: **0** entradas base64 restantes no banco.

## 6. Pendente para liberar a correção em produção

O fix está apenas **no código local** (commit local). Pra ir pro ar:

1. Push de `main` pro GitHub. O workflow `deploy-backend.yml` (ou o auto-deploy
   do Render) vai rebuildar e deployar o api-server.
2. Forçar redeploy no Render se o auto-deploy estiver inativo:
   ```bash
   curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services/srv-d7gjdc5ckfvc73ftk79g/deploys \
     -d '{"clearCache":"do_not_clear"}'
   ```
3. Smoke test em `https://api.faren.com.br/api/profile/upload?prefix=avatars`
   com um JWT válido (deve retornar `{url: …}`).

> **Nota de versão deployada hoje cedo (`dep-d7mvo1cvikkc73b0rf6g`)**: era
> apenas o commit `782ad2bd` (backup pipeline + TLS). Os secrets R2 já estão
> publicados no Render, mas o **código** com a integração R2 e o fix do upload
> ainda não foi para produção.

## 7. Arquivos tocados

```
artifacts/api-server/src/routes/profiles.ts          (fix da race condition)
artifacts/api-server/src/scripts/migrate-base64-to-r2.ts  (remoção de dotenv)
CHANGES-2026-04-26-upload-fix.md                     (este arquivo)
replit.md                                            (atualizado)
```
