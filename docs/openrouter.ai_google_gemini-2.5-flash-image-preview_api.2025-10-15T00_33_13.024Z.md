[Skip to content](https://openrouter.ai/google/gemini-2.5-flash-image-preview/api#skip)

[OpenRouterOpenRouter](https://openrouter.ai/)

`/`

[Models](https://openrouter.ai/models) [Chat](https://openrouter.ai/chat) [Rankings](https://openrouter.ai/rankings) [Enterprise](https://openrouter.ai/enterprise) [Docs](https://openrouter.ai/docs/quick-start)

Sign in

# Google: Gemini 2.5 Flash Image Preview (Nano Banana)

### [google](https://openrouter.ai/google)/gemini-2.5-flash-image-preview

[Chat](https://openrouter.ai/chat?models=google/gemini-2.5-flash-image-preview) [Compare](https://openrouter.ai/compare/google/gemini-2.5-flash-image-preview)

Created Aug 26, 202532,768 context

$0.30/M input tokens$2.50/M output tokens$1.238/K input imgs$0.03/K output imgs

Gemini 2.5 Flash Image Preview, a.k.a. "Nano Banana," is a state of the art image generation model with contextual understanding. It is capable of image generation, edits, and multi-turn conversations.

[Chat](https://openrouter.ai/chat?models=google/gemini-2.5-flash-image-preview) [Compare](https://openrouter.ai/compare/google/gemini-2.5-flash-image-preview)

Overview

Providers

Performance

Apps

Activity

Uptime

API

## Sample code and API for Gemini 2.5 Flash Image Preview (Nano Banana)

### OpenRouter normalizes requests and responses across providers for you.

[Create API key](https://openrouter.ai/settings/keys)

OpenRouter provides an OpenAI-compatible completion API to 400+ models & providers that you can call directly, or using the OpenAI SDK. Additionally, some third-party SDKs are available.

In the examples below, the [OpenRouter-specific headers](https://openrouter.ai/docs/requests#request-headers) are optional. Setting them allows your app to appear on the OpenRouter leaderboards.

openai-pythonpythontypescriptopenai-typescriptcurl

Copy

```python
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  extra_body={},
  model="google/gemini-2.5-flash-image-preview",
  messages=[\
    {\
      "role": "user",\
      "content": [\
        {\
          "type": "text",\
          "text": "What is in this image?"\
        },\
        {\
          "type": "image_url",\
          "image_url": {\
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"\
          }\
        }\
      ]\
    }\
  ]
)
print(completion.choices[0].message.content)
```

## Using third-party SDKs

For information about using third-party SDKs and frameworks with OpenRouter, please see our [frameworks documentation](https://openrouter.ai/docs/community/frameworks-and-integrations-overview).

See the [Request docs](https://openrouter.ai/docs/api-reference/overview) for all possible fields, and [Parameters](https://openrouter.ai/docs/api-reference/parameters) for explanations of specific sampling parameters.

## More models from [Google](https://openrouter.ai/google)

[Gemini 2.5 Flash Image\\
\\
Gemini 2.5 Flash Image, a.k.a. "Nano Banana," is now generally available. It is a state of the art image generation model with contextual understanding. It is capable of image generation, edits, and multi-turn conversations. Aspect ratios can be controlled with the image\_config API Parameter](https://openrouter.ai/google/gemini-2.5-flash-image)

[Gemini 2.5 Flash Preview 09-2025\\
\\
Gemini 2.5 Flash Preview September 2025 Checkpoint is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.\\
\\
Additionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).](https://openrouter.ai/google/gemini-2.5-flash-preview-09-2025)

[Gemini 2.5 Flash Lite Preview 09-2025\\
\\
Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the Reasoning API parameter to selectively trade off cost for intelligence.](https://openrouter.ai/google/gemini-2.5-flash-lite-preview-09-2025)

[Gemini 2.5 Flash Lite\\
\\
Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the Reasoning API parameter to selectively trade off cost for intelligence.](https://openrouter.ai/google/gemini-2.5-flash-lite)

[Gemma 3n 2B\\
\\
Gemma 3n E2B IT is a multimodal, instruction-tuned model developed by Google DeepMind, designed to operate efficiently at an effective parameter size of 2B while leveraging a 6B architecture. Based on the MatFormer architecture, it supports nested submodels and modular composition via the Mix-and-Match framework. Gemma 3n models are optimized for low-resource deployment, offering 32K context length and strong multilingual and reasoning performance across common benchmarks. This variant is trained on a diverse corpus including code, math, web, and multimodal data.](https://openrouter.ai/google/gemma-3n-e2b-it:free)

[Gemini 2.5 Flash Lite Preview 06-17\\
\\
Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the Reasoning API parameter to selectively trade off cost for intelligence.](https://openrouter.ai/google/gemini-2.5-flash-lite-preview-06-17)

[Gemini 2.5 Flash\\
\\
Gemini 2.5 Flash is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.\\
\\
Additionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).](https://openrouter.ai/google/gemini-2.5-flash)

[Gemini 2.5 Pro\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro)

[Gemini 2.5 Pro Preview 06-05\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro-preview)

[Gemma 1 2B\\
\\
Gemma 1 2B by Google is an open model built from the same research and technology used to create the Gemini models.\\
\\
Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.\\
\\
Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-2b-it)

[Gemma 3n 4B\\
\\
Gemma 3n E4B-it is optimized for efficient execution on mobile and low-resource devices, such as phones, laptops, and tablets. It supports multimodal inputs—including text, visual data, and audio—enabling diverse tasks such as text generation, speech recognition, translation, and image analysis. Leveraging innovations like Per-Layer Embedding (PLE) caching and the MatFormer architecture, Gemma 3n dynamically manages memory usage and computational load by selectively activating model parameters, significantly reducing runtime resource requirements.\\
\\
This model supports a wide linguistic range (trained in over 140 languages) and features a flexible 32K token context window. Gemma 3n can selectively load parameters, optimizing memory and computational efficiency based on the task or device capabilities, making it well-suited for privacy-focused, offline-capable applications and on-device AI solutions. Read more in the blog post](https://openrouter.ai/google/gemma-3n-e4b-it)

[Gemini 2.5 Flash Preview 05-20\\
\\
Gemini 2.5 Flash May 20th Checkpoint is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.\\
\\
Note: This model is available in two variants: thinking and non-thinking. The output pricing varies significantly depending on whether the thinking capability is active. If you select the standard variant (without the ":thinking" suffix), the model will explicitly avoid generating thinking tokens.\\
\\
To utilize the thinking capability and receive thinking tokens, you must choose the ":thinking" variant, which will then incur the higher thinking-output pricing.\\
\\
Additionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).](https://openrouter.ai/google/gemini-2.5-flash-preview-05-20)

[Gemini 2.5 Pro Preview 05-06\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro-preview-05-06)

[Gemini 2.5 Flash Preview 04-17\\
\\
Gemini 2.5 Flash is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.\\
\\
Note: This model is available in two variants: thinking and non-thinking. The output pricing varies significantly depending on whether the thinking capability is active. If you select the standard variant (without the ":thinking" suffix), the model will explicitly avoid generating thinking tokens.\\
\\
To utilize the thinking capability and receive thinking tokens, you must choose the ":thinking" variant, which will then incur the higher thinking-output pricing.\\
\\
Additionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).](https://openrouter.ai/google/gemini-2.5-flash-preview)

[Gemini 2.5 Pro Experimental\\
\\
This model has been deprecated by Google in favor of the (paid Preview model)\[google/gemini-2.5-pro-preview\]\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro-exp-03-25)

[Gemma 3 1B\\
\\
Gemma 3 1B is the smallest of the new Gemma 3 family. It handles context windows up to 32k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Note: Gemma 3 1B is not multimodal. For the smallest multimodal Gemma 3 model, please see Gemma 3 4B](https://openrouter.ai/google/gemma-3-1b-it)

[Gemma 3 4B\\
\\
Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling.](https://openrouter.ai/google/gemma-3-4b-it)

[Gemma 3 12B\\
\\
Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 12B is the second largest in the family of Gemma 3 models after Gemma 3 27B](https://openrouter.ai/google/gemma-3-12b-it)

[Gemma 3 27B\\
\\
Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to Gemma 2](https://openrouter.ai/google/gemma-3-27b-it)

[Gemini 2.0 Flash Lite\\
\\
Gemini 2.0 Flash Lite offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5, all at extremely economical token prices.](https://openrouter.ai/google/gemini-2.0-flash-lite-001)

[Gemini 2.0 Flash\\
\\
Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.](https://openrouter.ai/google/gemini-2.0-flash-001)

[Gemini 2.0 Flash Experimental\\
\\
Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.](https://openrouter.ai/google/gemini-2.0-flash-exp:free)

[Gemini Experimental 1121\\
\\
Experimental release (November 21st, 2024) of Gemini.](https://openrouter.ai/google/gemini-exp-1121)

[Gemini Experimental 1114\\
\\
Gemini 11-14 (2024) experimental model features "quality" improvements.](https://openrouter.ai/google/gemini-exp-1114)

[Gemini 1.5 Flash 8B\\
\\
Gemini Flash 1.5 8B is optimized for speed and efficiency, offering enhanced performance in small prompt tasks like chat, transcription, and translation. With reduced latency, it is highly effective for real-time and large-scale operations. This model focuses on cost-effective solutions while maintaining high-quality results.\\
\\
Click here to learn more about this model.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.](https://openrouter.ai/google/gemini-flash-1.5-8b)

[Gemini 1.5 Flash Experimental\\
\\
Gemini 1.5 Flash Experimental is an experimental version of the Gemini 1.5 Flash model.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.\\
\\
#multimodal\\
\\
Note: This model is experimental and not suited for production use-cases. It may be removed or redirected to another model in the future.](https://openrouter.ai/google/gemini-flash-1.5-exp)

[Gemini 1.5 Pro Experimental\\
\\
Gemini 1.5 Pro Experimental is a bleeding-edge version of the Gemini 1.5 Pro model. Because it's currently experimental, it will be **heavily rate-limited** by Google.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.\\
\\
#multimodal](https://openrouter.ai/google/gemini-pro-1.5-exp)

[Gemma 2 27B\\
\\
Gemma 2 27B by Google is an open model built from the same research and technology used to create the Gemini models.\\
\\
Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.\\
\\
See the launch announcement for more details. Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-2-27b-it)

[Gemma 2 9B\\
\\
Gemma 2 9B by Google is an advanced, open-source language model that sets a new standard for efficiency and performance in its size class.\\
\\
Designed for a wide variety of tasks, it empowers developers and researchers to build innovative applications, while maintaining accessibility, safety, and cost-effectiveness.\\
\\
See the launch announcement for more details. Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-2-9b-it)

[Gemini 1.5 Flash \\
\\
Gemini 1.5 Flash is a foundation model that performs well at a variety of multimodal tasks such as visual understanding, classification, summarization, and creating content from image, audio and video. It's adept at processing visual and text inputs such as photographs, documents, infographics, and screenshots.\\
\\
Gemini 1.5 Flash is designed for high-volume, high-frequency tasks where cost and latency matter. On most common tasks, Flash achieves comparable quality to other Gemini Pro models at a significantly reduced cost. Flash is well-suited for applications like chat assistants and on-demand content generation where speed and scale matter.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.\\
\\
#multimodal](https://openrouter.ai/google/gemini-flash-1.5)

[Gemini 1.5 Pro\\
\\
Google's latest multimodal model, supports image and video\[0\] in text or chat prompts.\\
\\
Optimized for language tasks including:\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.](https://openrouter.ai/google/gemini-pro-1.5)

[Gemma 7B\\
\\
Gemma by Google is an advanced, open-source language model family, leveraging the latest in decoder-only, text-to-text technology. It offers English language capabilities across text generation tasks like question answering, summarization, and reasoning. The Gemma 7B variant is comparable in performance to leading open source models.\\
\\
Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-7b-it)

[PaLM 2 Chat 32k\\
\\
PaLM 2 is a language model by Google with improved multilingual, reasoning and coding capabilities.](https://openrouter.ai/google/palm-2-chat-bison-32k)

[PaLM 2 Code Chat 32k\\
\\
PaLM 2 fine-tuned for chatbot conversations that help with code-related questions.](https://openrouter.ai/google/palm-2-codechat-bison-32k)

[PaLM 2 Chat\\
\\
PaLM 2 is a language model by Google with improved multilingual, reasoning and coding capabilities.](https://openrouter.ai/google/palm-2-chat-bison)

[PaLM 2 Code Chat\\
\\
PaLM 2 fine-tuned for chatbot conversations that help with code-related questions.](https://openrouter.ai/google/palm-2-codechat-bison)

Previous slideNext slide

[Status](https://status.openrouter.ai/)
[Announcements](https://openrouter.ai/announcements)
[Docs](https://openrouter.ai/docs)
[Support](https://openrouter.ai/support)
[About](https://openrouter.ai/about)
[Partners](https://openrouter.ai/partners)
[Enterprise](https://openrouter.ai/enterprise)
[Careers](https://openrouter.ai/careers)
[Pricing](https://openrouter.ai/models?fmt=table)
[Privacy](https://openrouter.ai/privacy)
[Terms](https://openrouter.ai/terms)

© 2023 – 2025 OpenRouter, Inc

[Discord](https://discord.gg/fVyRaUDgxW) [GitHub](https://github.com/OpenRouterTeam) [LinkedIn](https://www.linkedin.com/company/104068329) [X](https://twitter.com/openrouterai)

Google: Gemini 2.5 Flash Image Preview (Nano Banana) – Run with an API