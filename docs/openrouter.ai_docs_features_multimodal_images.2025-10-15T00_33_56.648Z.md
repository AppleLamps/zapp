[![Logo](https://files.buildwithfern.com/openrouter.docs.buildwithfern.com/docs/2025-10-14T14:15:13.880Z/content/assets/logo.svg)![Logo](https://files.buildwithfern.com/openrouter.docs.buildwithfern.com/docs/2025-10-14T14:15:13.880Z/content/assets/logo-white.svg)](https://openrouter.ai/)

Search
`/`
Ask AI

[API](https://openrouter.ai/docs/api-reference/overview) [Models](https://openrouter.ai/models) [Chat](https://openrouter.ai/chat) [Ranking](https://openrouter.ai/rankings) [Login](https://openrouter.ai/settings/credits)

- Overview

  - [Quickstart](https://openrouter.ai/docs/quickstart)
  - [FAQ](https://openrouter.ai/docs/faq)
  - [Principles](https://openrouter.ai/docs/overview/principles)
  - [Models](https://openrouter.ai/docs/overview/models)
  - [Enterprise](https://openrouter.ai/enterprise)
- Features

  - [Privacy and Logging](https://openrouter.ai/docs/features/privacy-and-logging)
  - [Zero Data Retention (ZDR)](https://openrouter.ai/docs/features/zdr)
  - [Model Routing](https://openrouter.ai/docs/features/model-routing)
  - [Provider Routing](https://openrouter.ai/docs/features/provider-routing)
  - [Latency and Performance](https://openrouter.ai/docs/features/latency-and-performance)
  - [Presets](https://openrouter.ai/docs/features/presets)
  - [Prompt Caching](https://openrouter.ai/docs/features/prompt-caching)
  - [Structured Outputs](https://openrouter.ai/docs/features/structured-outputs)
  - [Tool Calling](https://openrouter.ai/docs/features/tool-calling)
  - Multimodal

- [Overview](https://openrouter.ai/docs/features/multimodal/overview)
- [Images](https://openrouter.ai/docs/features/multimodal/images)
- [Image Generation](https://openrouter.ai/docs/features/multimodal/image-generation)
- [PDFs](https://openrouter.ai/docs/features/multimodal/pdfs)
- [Audio](https://openrouter.ai/docs/features/multimodal/audio)

  - [Message Transforms](https://openrouter.ai/docs/features/message-transforms)
  - [Uptime Optimization](https://openrouter.ai/docs/features/uptime-optimization)
  - [Web Search](https://openrouter.ai/docs/features/web-search)
  - [Zero Completion Insurance](https://openrouter.ai/docs/features/zero-completion-insurance)
  - [Provisioning API Keys](https://openrouter.ai/docs/features/provisioning-api-keys)
  - [App Attribution](https://openrouter.ai/docs/app-attribution)
- API Reference

  - [Overview](https://openrouter.ai/docs/api-reference/overview)
  - [Streaming](https://openrouter.ai/docs/api-reference/streaming)
  - [Limits](https://openrouter.ai/docs/api-reference/limits)
  - [Authentication](https://openrouter.ai/docs/api-reference/authentication)
  - [Parameters](https://openrouter.ai/docs/api-reference/parameters)
  - [Errors](https://openrouter.ai/docs/api-reference/errors)
  - Responses API Alpha

  - [POSTCompletion](https://openrouter.ai/docs/api-reference/completion)
  - [POSTChat completion](https://openrouter.ai/docs/api-reference/chat-completion)
  - [GETGet a generation](https://openrouter.ai/docs/api-reference/get-a-generation)
  - [GETList available models](https://openrouter.ai/docs/api-reference/list-available-models)
  - [GETList endpoints for a model](https://openrouter.ai/docs/api-reference/list-endpoints-for-a-model)
  - [GETList models filtered by user provider preferences](https://openrouter.ai/docs/api-reference/list-models-filtered-by-user-provider-preferences)
  - [GETList available providers](https://openrouter.ai/docs/api-reference/list-available-providers)
  - [GETGet credits](https://openrouter.ai/docs/api-reference/get-credits)
  - [POSTCreate a Coinbase charge](https://openrouter.ai/docs/api-reference/create-a-coinbase-charge)
  - Analytics

  - Authentication

  - API Keys
- Use Cases

  - [BYOK](https://openrouter.ai/docs/use-cases/byok)
  - [Crypto API](https://openrouter.ai/docs/use-cases/crypto-api)
  - [OAuth PKCE](https://openrouter.ai/docs/use-cases/oauth-pkce)
  - [MCP Servers](https://openrouter.ai/docs/use-cases/mcp-servers)
  - [Organization Management](https://openrouter.ai/docs/use-cases/organization-management)
  - [For Providers](https://openrouter.ai/docs/use-cases/for-providers)
  - [Reasoning Tokens](https://openrouter.ai/docs/use-cases/reasoning-tokens)
  - [Usage Accounting](https://openrouter.ai/docs/use-cases/usage-accounting)
  - [User Tracking](https://openrouter.ai/docs/use-cases/user-tracking)
- Community

  - [Frameworks and Integrations Overview](https://openrouter.ai/docs/community/frameworks-and-integrations-overview)
  - [Effect AI SDK](https://openrouter.ai/docs/community/effect-ai-sdk)
  - [LangChain](https://openrouter.ai/docs/community/lang-chain)
  - [Langfuse](https://openrouter.ai/docs/community/langfuse)
  - [Mastra](https://openrouter.ai/docs/community/mastra)
  - [OpenAI SDK](https://openrouter.ai/docs/community/open-ai-sdk)
  - [PydanticAI](https://openrouter.ai/docs/community/pydantic-ai)
  - [Vercel AI SDK](https://openrouter.ai/docs/community/vercel-ai-sdk)
  - [Xcode](https://openrouter.ai/docs/community/xcode)
  - [Zapier](https://openrouter.ai/docs/community/zapier)
  - [Discord](https://discord.gg/openrouter)

[API](https://openrouter.ai/docs/api-reference/overview) [Models](https://openrouter.ai/models) [Chat](https://openrouter.ai/chat) [Ranking](https://openrouter.ai/rankings) [Login](https://openrouter.ai/settings/credits)

System

On this page

- [Using Image URLs](https://openrouter.ai/docs/features/multimodal/images#using-image-urls)
- [Using Base64 Encoded Images](https://openrouter.ai/docs/features/multimodal/images#using-base64-encoded-images)

[Features](https://openrouter.ai/docs/features/privacy-and-logging) [Multimodal](https://openrouter.ai/docs/features/multimodal/overview)

# Image Inputs

Copy page

How to send images to OpenRouter models

Requests with images, to multimodel models, are available via the `/api/v1/chat/completions` API with a multi-part `messages` parameter. The `image_url` can either be a URL or a base64-encoded image. Note that multiple images can be sent in separate content array entries. The number of images you can send in a single request varies per provider and per model. Due to how the content is parsed, we recommend sending the text prompt first, then the images. If the images must come first, we recommend putting it in the system prompt.

OpenRouter supports both **direct URLs** and **base64-encoded data** for images:

- **URLs**: More efficient for publicly accessible images as they don’t require local encoding
- **Base64**: Required for local files or private images that aren’t publicly accessible

### Using Image URLs

Here’s how to send an image using a URL:

PythonTypeScript

```code-block text-sm

```

### Using Base64 Encoded Images

For locally stored images, you can send them using base64 encoding. Here’s how to do it:

PythonTypeScript

```code-block text-sm

```

Supported image content types are:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`

Was this page helpful?

YesNo

[Previous](https://openrouter.ai/docs/features/multimodal/overview) [**Image Generation** \\
\\
How to generate images with OpenRouter models\\
\\
Next](https://openrouter.ai/docs/features/multimodal/image-generation) [Built with](https://buildwithfern.com/?utm_campaign=buildWith&utm_medium=docs&utm_source=openrouter.ai)

Ask AI

Assistant

Hi, I'm an AI assistant with access to documentation and other content.

Tip: you can toggle this pane with

`⌘`

+

`/`

Suggestions

How do I integrate my existing API keys from other AI providers with OpenRouter?

What are the main differences between OpenRouter's API and OpenAI's Chat API?

How does OpenRouter's uptime optimization work and what happens when a provider goes down?

Can I use OpenRouter's presets to manage model configurations and system prompts?

What audio file formats are supported and how do I send audio to speech-capable models?