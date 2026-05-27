# evaluate-kana-writing

Supabase Edge Function for AI kana handwriting evaluation.

Request:

```json
{
  "collageBase64": "...",
  "expectedKanaOrder": ["お", "う", "え", "い", "あ"]
}
```

Deploy:

```bash
supabase functions deploy evaluate-kana-writing --no-verify-jwt
```

This function is called from Expo with the frontend publishable key. New
`sb_publishable_*` keys are not JWTs, so JWT verification must be disabled for
this unauthenticated function. The same setting is also declared in
`supabase/config.toml`.

Configure OpenAI:

```bash
supabase secrets set OPENAI_API_KEY=...
```

If `OPENAI_API_KEY` is missing, the function returns:

```json
{
  "error": "OPENAI_API_KEY is not configured"
}
```
