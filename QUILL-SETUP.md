# Quill · Open WebUI

Open the quill in the lower-right corner, or **More → Quill → Connection settings**.

1. In your Open WebUI account settings, create an API key. Your administrator may need to enable API keys and permit your account to use them. If API endpoint restrictions are enabled, allow `/api/models` and `/api/chat/completions`.
2. Enter your Open WebUI server URL and API key. A base URL or an address ending in `/api` or `/api/v1` works, including installations under a path prefix.
3. Use **Test / load models**, select or enter the exact model ID, then **Save connection**. Switch to Chat.

Quill now connects to Open WebUI. Earlier AnythingLLM settings and credentials are not reused. Each browser profile has its own settings. NovelWeaver has no user accounts, so people sharing a browser session also share its connection.

Keys stay in memory by default. The optional checkbox keeps a key in sessionStorage for the tab session. Connection details are excluded from manuscript exports and Drive sync. **Forget connection** clears the current connection and in-memory chat; it does not delete server or provider logs.

## Writing help

- **Ask / Suggest / Review / Continuity:** choose a mode, enter an instruction, and press Send.
- **Context:** question only (default), selected text, current chapter, current book, or entire series. Expand the preview or refresh it before sending. Linked thread names and notes for the selected paragraphs are included. No text is sent automatically. Context over 100,000 characters is blocked, without truncation; select a smaller scope.
- **Follow-up questions:** Quill resends earlier exchanges in the same conversation. Context is separated by project, book, model, and help mode. If total conversation text would exceed 160,000 characters, sending is blocked; start New chat or choose a smaller context. These character limits do not guarantee compatibility with your model's token limit.
- **Rewrite selection:** select text in a paragraph in Write, open Quill, optionally enter instructions, and request a rewrite. This sends the selection and its linked thread notes, regardless of the ordinary chat context picker. Review/edit the replacement before Apply or Discard. Only the original selection changes. Applying is blocked if its paragraph has changed in the meantime.
- **Revision history:** Apply and Undo use the editor's existing revision history and linked-thread review alerts. Undo works while the paragraph still matches the applied version; paragraph revision history remains available afterward.
- **New chat:** clears the displayed conversation and all conversation context held in memory. It does not delete server or provider logs. Earlier manuscript context is resent on follow-ups even if you change to Question only; use New chat for a fresh conversation.
- **Quiet behavior:** no unsolicited messages, animation, polling, or automatic uploads. Minimize with × or Escape. Hide the corner icon in Settings and reopen from More.

## Hosting and connectivity

GitHub Pages cannot proxy API requests. Your browser must reach your Open WebUI server, and the server or your own gateway must permit your NovelWeaver origin through CORS. Allow Authorization and Content-Type headers and GET/POST methods. Remote servers need HTTPS when NovelWeaver is opened over HTTPS. A localhost address means the device running the browser, not another computer on your network. Local-network access may also require browser permission.

The client calls `GET /api/models` and `POST /api/chat/completions` with a Bearer API key. Chat requests use `{model, messages, stream: false}` and read `choices[0].message.content`. They omit cookies, reject redirects, bypass caches, support Stop, and time out after 90 seconds. Stopping may not stop the server from processing a request.

Quill includes chosen manuscript text directly in messages. It does not automatically upload books to Open WebUI Knowledge or import existing Open WebUI chat history. Models configured in Open WebUI may have their own server-side context or behavior. Your server and model provider may retain submitted text according to their settings. Suggestions are plain text, never execute HTML, and never change your manuscript without Apply.

## Verification

Run `node tests/quill.test.cjs` for API URL normalization, model discovery, chat payloads and reply parsing, follow-up history, context boundaries and limits, stale selections, error handling, guarded rewrite application, and exclusion of connection details from project data. Browser QA uses a preview-only mock; users still need to test their own live server connection.
