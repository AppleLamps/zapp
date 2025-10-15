[fal Sandbox is here - run all your models together! 🏖️](https://fal.ai/sandbox)

2. [Home](https://fal.ai/)
4. [Explore](https://fal.ai/models)
6. fal-ai/flux/dev

[Docs](https://docs.fal.ai/) [Blog](https://blog.fal.ai/) [Pricing](https://fal.ai/pricing) [Enterprise](https://fal.ai/enterprise) [Careers](https://fal.ai/careers) [Research Grants](https://fal.ai/grants)

[Log-in](https://fal.ai/login?returnTo=/models/fal-ai/flux/dev/api) [Sign-up](https://fal.ai/login?returnTo=/models/fal-ai/flux/dev/api)

1. [Back to Gallery](https://fal.ai/models)

# FLUX.1 \[dev\] Text to Image

fal-ai/flux/dev

Text to Image \[dev\]

FLUX.1 \[dev\] is a 12 billion parameter flow transformer that generates high-quality images from text. It is suitable for personal and commercial use.

Inference

Commercial use

Streaming

[Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/flux/dev)

[LLMs](https://fal.ai/models/fal-ai/flux/dev/llms.txt)

[Playground](https://fal.ai/models/fal-ai/flux/dev/playground) [API](https://fal.ai/models/fal-ai/flux/dev/api) [Examples](https://fal.ai/models/fal-ai/flux/dev/examples)

### Table of contents

JavaScript / Node.js

[**1\. Calling the API**](https://fal.ai/models/fal-ai/flux/dev/api#api-call)

- [Install the client](https://fal.ai/models/fal-ai/flux/dev/api#api-call-install)
- [Setup your API Key](https://fal.ai/models/fal-ai/flux/dev/api#api-call-setup)
- [Submit a request](https://fal.ai/models/fal-ai/flux/dev/api#api-call-submit-request)
- [Streaming](https://fal.ai/models/fal-ai/flux/dev/api#api-call-streaming)

[**2\. Authentication**](https://fal.ai/models/fal-ai/flux/dev/api#auth)

- [API Key](https://fal.ai/models/fal-ai/flux/dev/api#auth-api-key)

[**3\. Queue**](https://fal.ai/models/fal-ai/flux/dev/api#queue)

- [Submit a request](https://fal.ai/models/fal-ai/flux/dev/api#queue-submit)
- [Fetch request status](https://fal.ai/models/fal-ai/flux/dev/api#queue-status)
- [Get the result](https://fal.ai/models/fal-ai/flux/dev/api#queue-result)

[**4\. Files**](https://fal.ai/models/fal-ai/flux/dev/api#files)

- [Data URI (base64)](https://fal.ai/models/fal-ai/flux/dev/api#files-data-uri)
- [Hosted files (URL)](https://fal.ai/models/fal-ai/flux/dev/api#files-from-url)
- [Uploading files](https://fal.ai/models/fal-ai/flux/dev/api#files-upload)

[**5\. Schema**](https://fal.ai/models/fal-ai/flux/dev/api#schema)

- [Input](https://fal.ai/models/fal-ai/flux/dev/api#schema-input)
- [Output](https://fal.ai/models/fal-ai/flux/dev/api#schema-output)
- [Other](https://fal.ai/models/fal-ai/flux/dev/api#schema-other)

### About

FLUX.1 \[dev\], next generation text-to-image model.

### 1\. Calling the API [\#](https://fal.ai/models/fal-ai/flux/dev/api\#api-call-install)

### Install the client [\#](https://fal.ai/models/fal-ai/flux/dev/api\#api-call-install)

The client provides a convenient way to interact with the model API.

npmyarnpnpmbun

```bg-transparent leading-normal whitespace-pre-wrap
npm install --save @fal-ai/client
```

##### Migrate to @fal-ai/client

The `@fal-ai/serverless-client` package has been deprecated in favor of `@fal-ai/client`. Please check the [migration guide](https://docs.fal.ai/clients/javascript#migration-from-serverless-client-to-client) for more information.

### Setup your API Key [\#](https://fal.ai/models/fal-ai/flux/dev/api\#api-call-setup)

Set `FAL_KEY` as an environment variable in your runtime.

```bg-transparent leading-normal whitespace-pre-wrap
export FAL_KEY="YOUR_API_KEY"
```

### Submit a request [\#](https://fal.ai/models/fal-ai/flux/dev/api\#api-call-submit-request)

The client API handles the API submit protocol. It will handle the request status updates and return the result when the request is completed.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt: "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```

### Streaming [\#](https://fal.ai/models/fal-ai/flux/dev/api\#api-call-streaming)

This model supports streaming requests. You can stream data directly to the model and get the result in real-time.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

const stream = await fal.stream("fal-ai/flux/dev", {
  input: {
    prompt: "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
  }
});

for await (const event of stream) {
  console.log(event);
}

const result = await stream.done();
```

## 2\. Authentication [\#](https://fal.ai/models/fal-ai/flux/dev/api\#auth)

The API uses an API Key for authentication. It is recommended you set the `FAL_KEY` environment variable in your runtime when possible.

### API Key [\#](https://fal.ai/models/fal-ai/flux/dev/api\#auth-api-key)

In case your app is running in an environment where you cannot set environment variables, you can set the API Key manually as a client configuration.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

fal.config({
  credentials: "YOUR_FAL_KEY"
});
```

##### Protect your API Key

When running code on the client-side (e.g. in a browser, mobile app or GUI applications), make sure to not expose your `FAL_KEY`. Instead, **use a server-side proxy** to make requests to the API. For more information, check out our [server-side integration guide](https://docs.fal.ai/model-endpoints/server-side).

## 3\. Queue [\#](https://fal.ai/models/fal-ai/flux/dev/api\#queue)

##### Long-running requests

For long-running requests, such as _training_ jobs or models with slower inference times, it is recommended to check the [Queue](https://docs.fal.ai/model-endpoints/queue) status and rely on [Webhooks](https://docs.fal.ai/model-endpoints/webhooks) instead of blocking while waiting for the result.

### Submit a request [\#](https://fal.ai/models/fal-ai/flux/dev/api\#queue-submit)

The client API provides a convenient way to submit requests to the model.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/flux/dev", {
  input: {
    prompt: "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
  },
  webhookUrl: "https://optional.webhook.url/for/results",
});
```

### Fetch request status [\#](https://fal.ai/models/fal-ai/flux/dev/api\#queue-status)

You can fetch the status of a request to check if it is completed or still in progress.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

const status = await fal.queue.status("fal-ai/flux/dev", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  logs: true,
});
```

### Get the result [\#](https://fal.ai/models/fal-ai/flux/dev/api\#queue-result)

Once the request is completed, you can fetch the result. See the [Output Schema](https://fal.ai/models/fal-ai/flux/dev/api#schema-output) for the expected result format.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

const result = await fal.queue.result("fal-ai/flux/dev", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
});
console.log(result.data);
console.log(result.requestId);
```

## 4\. Files [\#](https://fal.ai/models/fal-ai/flux/dev/api\#files)

Some attributes in the API accept file URLs as input. Whenever that's the case you can pass your own URL or a Base64 data URI.

### Data URI (base64) [\#](https://fal.ai/models/fal-ai/flux/dev/api\#files-data-uri)

You can pass a Base64 data URI as a file input. The API will handle the file decoding for you. Keep in mind that for large files, this alternative although convenient can impact the request performance.

### Hosted files (URL) [\#](https://fal.ai/models/fal-ai/flux/dev/api\#files-from-url)

You can also pass your own URLs as long as they are publicly accessible. Be aware that some hosts might block cross-site requests, rate-limit, or consider the request as a bot.

### Uploading files [\#](https://fal.ai/models/fal-ai/flux/dev/api\#files-upload)

We provide a convenient file storage that allows you to upload files and use them in your requests. You can upload files using the client API and use the returned URL in your requests.

```bg-transparent leading-normal whitespace-pre-wrap
import { fal } from "@fal-ai/client";

const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
const url = await fal.storage.upload(file);
```

##### Auto uploads

The client will auto-upload the file for you if you pass a binary object (e.g. `File`, `Data`).

Read more about file handling in our [file upload guide](https://docs.fal.ai/model-endpoints#file-uploads).

## 5\. Schema [\#](https://fal.ai/models/fal-ai/flux/dev/api\#schema)

### Input [\#](https://fal.ai/models/fal-ai/flux/dev/api\#schema-input)

`prompt` `string`\\* required

The prompt to generate an image from.

`image_size` `[ImageSize](https://fal.ai/models/fal-ai/flux/dev/api#type-ImageSize) | [Enum](https://fal.ai/models/fal-ai/flux/dev/api#type-Enum)`

The size of the generated image. Default value: `landscape_4_3`

Possible enum values: `square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9`

**Note:** For custom image sizes, you can pass the `width` and `height` as an object:

```bg-transparent leading-normal whitespace-pre-wrap
"image_size": {
  "width": 1280,
  "height": 720
}
```

`num_inference_steps` `integer`

The number of inference steps to perform. Default value: `28`

`seed` `integer`

The same seed and the same prompt given to the same version of the model
will output the same image every time.

`guidance_scale` `float`

The CFG (Classifier Free Guidance) scale is a measure of how close you want
the model to stick to your prompt when looking for a related image to show you. Default value: `3.5`

`sync_mode` `boolean`

If set to true, the function will wait for the image to be generated and uploaded
before returning the response. This will increase the latency of the function but
it allows you to get the image directly in the response without going through the CDN.

`num_images` `integer`

The number of images to generate. Default value: `1`

`enable_safety_checker` `boolean`

If set to true, the safety checker will be enabled. Default value: `true`

`output_format` `OutputFormatEnum`

The format of the generated image. Default value: `"jpeg"`

Possible enum values: `jpeg, png`

`acceleration` `AccelerationEnum`

The speed of the generation. The higher the speed, the faster the generation. Default value: `"none"`

Possible enum values: `none, regular, high`

```bg-transparent leading-normal whitespace-pre-wrap
{
  "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture.",
  "image_size": "landscape_4_3",
  "num_inference_steps": 28,
  "guidance_scale": 3.5,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "jpeg",
  "acceleration": "none"
}
```

### Output [\#](https://fal.ai/models/fal-ai/flux/dev/api\#schema-output)

`images` `list< [Image](https://fal.ai/models/fal-ai/flux/dev/api#type-Image) >`\\* required

The generated image files info.

`timings` `[Timings](https://fal.ai/models/fal-ai/flux/dev/api#type-Timings)`\\* required

`seed` `integer`\\* required

Seed of the generated Image. It will be the same value of the one passed in the
input or the randomly generated that was used in case none was passed.

`has_nsfw_concepts` `list< [boolean](https://fal.ai/models/fal-ai/flux/dev/api#type-boolean) >`\\* required

Whether the generated images contain NSFW concepts.

`prompt` `string`\\* required

The prompt used for generating the image.

```bg-transparent leading-normal whitespace-pre-wrap
{
  "images": [\
    {\
      "url": "",\
      "content_type": "image/jpeg"\
    }\
  ],
  "prompt": ""
}
```

### Other types [\#](https://fal.ai/models/fal-ai/flux/dev/api\#schema-other)

#### Image [\#](https://fal.ai/models/fal-ai/flux/dev/api\#type-Image)

`url` `string`\\* required

`width` `integer`\\* required

`height` `integer`\\* required

`content_type` `string`

Default value: `"image/jpeg"`

#### ImageSize [\#](https://fal.ai/models/fal-ai/flux/dev/api\#type-ImageSize)

`width` `integer`

The width of the generated image. Default value: `512`

`height` `integer`

The height of the generated image. Default value: `512`

## Related Models

#### Learn More

[Status](https://status.fal.ai/) [Documentation](https://docs.fal.ai/) [Pricing](https://fal.ai/pricing) [Enterprise](https://fal.ai/enterprise) [Grants](https://fal.ai/grants) [Learn](https://fal.ai/learn) [About Us](https://fal.ai/about) [Careers](https://fal.ai/careers) [Blog](https://blog.fal.ai/) [Get in touch](mailto:support@fal.ai)

Models [AuraFlow](https://fal.ai/models/fal-ai/aura-flow) [Flux.1 \[schnell\]](https://fal.ai/models/fal-ai/flux/schnell) [Flux.1 \[dev\]](https://fal.ai/models/fal-ai/flux/dev) [Flux Realism LoRA](https://fal.ai/models/fal-ai/flux-realism) [Flux LoRA](https://fal.ai/models/fal-ai/flux-lora) [Explore More](https://fal.ai/models)

#### Playgrounds

[Training](https://fal.ai/models/fal-ai/flux-lora-fast-training) [Workflows](https://fal.ai/workflows) [Demos](https://fal.ai/demos)

#### Socials

[Discord](https://discord.gg/fal-ai) [GitHub](https://github.com/fal-ai) [Twitter](https://twitter.com/fal) [Linkedin](https://www.linkedin.com/company/features-and-labels/)

features and labels, 2025. All Rights Reserved. [Terms of Service](https://fal.ai/terms.html) and [Privacy Policy](https://fal.ai/privacy.html)