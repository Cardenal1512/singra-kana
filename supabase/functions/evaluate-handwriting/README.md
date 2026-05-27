# Handwriting Evaluation Edge Function

Secure backend endpoint for visual kana handwriting evaluation.

The frontend calls this endpoint through `OpenAIHandwritingEvaluationAdapter`.
OpenAI API keys live only in Supabase secrets.

Required secret:

- `OPENAI_API_KEY`

Optional env vars:

- `OPENAI_HANDWRITING_MODEL`, default `gpt-4.1-mini`
- `OPENAI_HANDWRITING_TIMEOUT_MS`, default `20000`
- `OPENAI_HANDWRITING_RETRIES`, default `1`
- `MAX_HANDWRITING_IMAGE_BYTES`, default `6291456`

Request:

```json
{
  "layout": "2x5",
  "order": "left-to-right top-to-bottom",
  "expectedKanaOrder": ["か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ"],
  "imageBase64": "...",
  "imageMimeType": "image/png"
}
```

Response:

```json
{
  "results": [],
  "summary": []
}
```

The app still uses `MockHandwritingEvaluationAdapter` by default.

To activate the real adapter in the Expo app, configure:

- `EXPO_PUBLIC_HANDWRITING_EVALUATION_PROVIDER=openai`
- `EXPO_PUBLIC_HANDWRITING_EVALUATION_ENDPOINT_URL=<supabase function url>`

Do not put `OPENAI_API_KEY` in Expo env vars.

Note: OpenAI Vision accepts PNG, JPEG, WEBP, or non-animated GIF image input.
The current SVG collage preview must be rasterized before enabling the real
adapter for production traffic.
