# SuperAI Startup Roadmap

## Current MVP

- React + TypeScript + Vite frontend
- Gemini chat with streaming and model fallback
- Agent profiles and cross-chat local memory
- Image analysis, image generation, voice, translator and document chat
- Chat history, pinning, search, export and code snippets
- Usage counters and response feedback
- Responsive mobile navigation and accessibility improvements

## Production architecture

```text
Web app (React/Vite)
        |
        v
API gateway / backend
  |       |        |
  |       |        +-- Rate limits and usage metering
  |       +----------- Authentication and authorization
  +------------------- AI provider adapters
        |
        v
Gemini / future AI providers

PostgreSQL: users, workspaces, chats, messages, feedback
Object storage: uploaded documents and generated images
Vector store: document chunks and embeddings
Queue: long document processing and image jobs
```

## Before public launch

- Move Gemini API calls behind a backend proxy.
- Replace demo local authentication with a real identity provider.
- Move IndexedDB chat persistence to a server database with workspace access rules.
- Add file malware scanning, MIME validation and retention limits.
- Add Markdown/HTML sanitization before rendering model output.
- Add server-side rate limiting, quotas and abuse monitoring.
- Add privacy policy, terms of service and account deletion.
- Add error tracking and request metrics without logging secrets or document content.
- Add unit, integration and mobile end-to-end tests.

## Product priorities

1. Make first session useful: onboarding, sample prompts and a fast first answer.
2. Focus on document workflows for a clear paid use case.
3. Add citations and source previews to improve trust.
4. Add saved workflows such as `upload -> summarize -> export`.
5. Add team workspaces, billing and usage limits only after retention is measured.

## Success metrics

- Time to first successful answer
- First-session activation rate
- Weekly active users
- Answers rated helpful
- Document workflow completion rate
- Seven-day retention
- Average cost per active user
- API error and fallback rate
