# Quill · AnythingLLM

Open the quill in the lower-right corner, or **More → Quill → Connection settings**.

1. On your own AnythingLLM installation, create a Developer API key. API availability depends on the installation.
2. Enter its server URL, API key, and workspace slug. A base URL or a URL ending in `/api` or `/api/v1` works, including installations under a path prefix.
3. Use **Test / load workspaces**, then **Save connection**. Switch to Chat.

Each browser profile has its own server and workspace settings. NovelWeaver has no user accounts: people sharing a browser session also share that connection. Keys stay in memory by default. The optional checkbox keeps a key in sessionStorage for the tab session. Keys and connection settings are excluded from manuscript exports and Drive sync. **Forget connection** removes them and clears the local chat; it does not delete server history.

## Writing help

- **Ask / Suggest / Review / Continuity:** choose a mode, enter an instruction, and press Send.
- **Context:** question only (default), selected text, current chapter, current book, or entire series. Expand the context preview or refresh it before sending. Linked thread names and notes for the selected paragraphs are included. No text is sent automatically. Requests over 100,000 context characters are blocked, without truncation; choose a smaller scope.
- **Rewrite selection:** select text in a paragraph in Write, open Quill, optionally enter instructions, and request a rewrite. This sends the selection and its linked thread notes, regardless of the ordinary chat context picker. Review/edit the proposed replacement, then Apply or Discard. Only that original selection changes. If its paragraph changed in the meantime, applying is blocked.
- **Revision history:** applying and undoing use the existing editor history and linked-thread review alerts. **Undo last Quill edit** works while the paragraph still matches the applied version; paragraph revision history remains available afterward.
- **New chat:** starts fresh AnythingLLM sessions and clears the displayed conversation. It does not delete messages from the server. Earlier manuscript context can remain in the current server session even when switching to Question only.
- **Quiet by default:** no unsolicited messages, animation, polling, or automatic manuscript uploads. Minimize with × or Escape. Hide the corner icon in Settings and reopen from More.

## Hosting and connectivity

GitHub Pages is static and cannot proxy API requests. Your browser must be able to reach your server, and the server or your own gateway must permit your NovelWeaver origin through CORS. Allow the Authorization and Content-Type headers and the GET/POST methods. Remote servers need HTTPS when NovelWeaver is opened over HTTPS. A loopback URL refers to the device running the browser, not a different computer on your network; local-network access may also require browser permission.

The client calls `GET /api/v1/workspaces` and `POST /api/v1/workspace/{slug}/chat` with a Bearer API key and a separate external session ID. Requests omit browser cookies, reject redirects, bypass caches, support Stop, and time out after 90 seconds. Stopping a request may not stop the server from processing it. Quill uses chat mode rather than automatic agent mode.

AnythingLLM and its configured model provider may retain submitted writing and chat history according to their settings. Suggestions are plain text and must be reviewed for accuracy. Replies never execute HTML or modify manuscripts automatically.

## Verification

Run `node tests/quill.test.cjs` for URL validation, context isolation and limits, stale selection protection, request errors/options, rewrite application, and project isolation. Browser QA with a preview-only mock additionally covers workspace discovery, chat, Apply, and Undo. A real server still needs to be tested with the user's connection details.
