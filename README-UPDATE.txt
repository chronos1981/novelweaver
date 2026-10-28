NovelWeaver — Google Drive direct overwrite (no conflict check)

INSTALL: Upload exactly index.html and service-worker.js to the root of
https://github.com/chronos1981/novelweaver/ and replace those two files.
Commit to main. Reload GitHub Pages after deployment.

DO NOT replace or delete novelweaver-config.js! It holds your one-time
Google OAuth Client ID (and optional Picker configuration).

CHANGES:
- Auto-sync writes local edits directly to the linked Drive file after 3 seconds idle.
- Save to Drive directly updates the linked file.
- Removed Drive revision/conflict checks and conflict dialogs.
- Preserved Drive file linking, local autosave, offline queue/retry, OAuth settings,
  Drive Open, Save new copy, custom fonts, mobile/desktop layout, and TTS.
- Warning in the Drive panel clarifies that the last uploaded version wins.

IMPORTANT: On multiple devices, the last upload can overwrite work from
another device. Export regular local .novel.json backups or use Save new copy.
Cloud autosave only runs while this browser page is open, online, and authorized.

Files include no manuscript and no Google credentials.
