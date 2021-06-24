# Blockstack Stats

**This project is in early days, and is a work in progress.**

Blockstack Stats is a client/server framework for convient, privacy-preserving analytics.

## TLDR;

To get started:

### Use Docker

1. build the image

```sh
  yarn build:docker
```

2. launch the container

```sh
  docker run --publish 5555:5555 --detach --name stats s:1.0
```

### Use custom server

Configure your node server, clone and run:

```sh
  yarn
  yarn bootstrap
  yarn build
  yarn start:server
```

---

<!-- TOC depthFrom:2 -->

- [The Why](#the-why)
- [The What](#the-what)
  - [`@blockstack/stats-server`](#blockstackstats-server)
  - [`@blockstack/stats`](#blockstackstats)
- [Usage](#usage)
  - [Setup the server](#setup-the-server)
  - [Setup the client-side code.](#setup-the-client-side-code)
  - [Trigger events to be sent to analytics services](#trigger-events-to-be-sent-to-analytics-services)
  - [Tracking pages](#tracking-pages)
- [Providers](#providers)
  - [Segment](#segment)
- [Development](#development)
  - [Using the test app](#using-the-test-app)
  - [Adding new providers](#adding-new-providers)
    - [Update Typescript types for this provider.](#update-typescript-types-for-this-provider)
    - [Implement the Provider on the server](#implement-the-provider-on-the-server)

<!-- /TOC -->

## The Why

At Blockstack, we often struggle with figuring out the best way to gather analytics in our web properties. We aim to be data-driven, so collecting no information at all is problematic. At the same time, we have a strong sense of privacy, and we don't want to be sending user's data arbitrarily to third parties. We definitely don't want to let third parties inject their javascript on our pages, which may contain sensitive information.

We also want the convienient user interfaces provided by popular analytics services. We don't want to have to re-invent the wheel, or limit ourselves to open source projects that aren't as feature complete.

## The What

As a result of these problems, we've built a framework for easily collecting analytics, while proxying it through to a configurable list of destinations. We strip out all sensitive data, like IP Address, before proxying. We don't set any cookies, and we don't collect identifiable information.

Our architecture is setup just like [Segment](https://segment.com/), except that you don't need to embed a third-party script, or send unproxied data through to external services.

This framework consists of two components:

### `@blockstack/stats-server`

The server component provides a simple API for collecting analytics. It follows the adapter pattern for passing data along to external services, so you can make a single API call, and pass through that data to whatever service you use.

### `@blockstack/stats`

Our client-side library is what you'll use in your web applications. It has a simple API, and works with modern Javascript, so you can use Typescript and import the library from NPM.

## Usage

### Setup the server

First, you'll need to get the server running.

The simplest way to do this in development is by running:

```bash
npx @blockstack/stats-server blockstack-stats-server
```

This will get the server running on port 5555.

### Setup the client-side code.

In your web application, install the package `@blockstack/stats` with `npm` or `yarn`.

```bash
yarn add @blockstack/stats
# or
npm install --save @blockstack/stats
```

Then, in your application, call the `setConfig` method.

```javascript
import { setConfig } from '@blockstack/stats';

setConfig({
  host: 'https://myserver.com', // where the server can be found. Defaults to http://localhost:5555
  providers: [
    {
      name: 'segment',
      writeKey: 'your-segment-write-key',
    },
  ],
});
```

### Trigger events to be sent to analytics services

The `event` method is used for event tracking.

```javascript
import { event } from '@blockstack/stats';

const eventName = 'clicked_login';
event({
  name: eventName,
});

// You can also pass any properties with events:

event({
  name: 'purchased',
  product: 'Fuzzy Hat',
  price: '$10.00',
});
```

### Tracking pages

The `page` method is used to track page visits.

Call this method for every page load. Or, in a single-page-app, call this method whenever your app's screen changes.

`@blockstack/stats` will automatically attach basic page data, like the `origin` and `path`. Other aspects of the URL that are not tracked include the `search`, `hash`, and `document.title`, which often contain sensitive information.

```javascript
page({
  name: 'Home Page',
});
```

## Providers

"Providers" are external services that consume your (privacy-enhanced) analytics. You can configure as many as you'd like. Each provider has a specific `name` and configuration variables.

### Segment

[Segment](https://segment.com/) is a service that allows you to pass your data through to one service, and it'll forward that information along to hundreds of external providers. It's what this project is modeled after!

To use the "Segment" provider, you **must** include a `writeKey`.

```javascript
import { setConfig } from '@blockstack/stats';

setConfig({
  providers: [
    {
      name: 'segment',
      writeKey: 'your-segment-write-key',
    },
  ],
});
```

## Development

First, clone this repository, then run in the command line:

```bash
yarn lerna run bootstrap
```

### Using the test app

We've included a simple app for testing out the package. This is very handy for when you're developing, because it requires building the client and the server at the same time.

To run everything at once (the test app, the server, while compiling the client), run in the command line:

```bash
yarn dev:watch
```

**Note:** If you've never built the client package before, you'll probably run into some errors with the above command. First, run `yarn build:client`. Then, try running `yarn dev:watch`.

This will open the test app at http://localhost:3333.

### Adding new providers

To add a new provider, it only takes a few steps:

#### Update Typescript types for this provider.

In [types.ts](./packages/client/src/types.ts), add a new key to the `Providers` enum:

```typescript
export enum Providers {
  // ...existing providers...
  MyProvider = 'my-provider',
}
```

Then add whatever configuration is required, like API keys:

```typescript
export interface MyProviderConfig {
  name: typeof Providers.MyProvider;
  apiKey: string;
}
```

Update the `Provider` type to use your new one:

```typescript
export type Provider = SegmentConfig | MyProviderConfig;
```

#### Implement the Provider on the server

To follow along, it's best to look at existing implementations, like [SegmentProvider](./packages/server/src/providers/segment.ts).

The server needs to know how to pass this data to the provider. Create a new file in [packages/server/src/providers](./packages/server/src/providers) for your implementation.

You'll need to extend the `BaseProvider` class, then implement the static `event` and `page` methods. You must follow the same method signature as `BaseProvider`. The `event` method accepts a `eventData` parameter, whose [type can be found here](./packages/client/src/types.ts).

Most analytics services provide a package for passing events in node.js, and it's best to use that, if available.

Finally, update `nameToProvider` in [utils.ts](./packages/server/src/utils.ts).

```typescript
const nameToProvider = {
  // existing providers...
  [Providers.MyProvider]: MyProviderProvider,
};
```
