# The PaperWall library

The easiest way to integrate PaperWall into your site or publication.

## Installation

Paperwall is not published to npm. Install it straight from the git repository.

### Using bun

```bash
bun add github:paperwall-io/paperwall-lib
```

### Using npm

```bash
npm install github:paperwall-io/paperwall-lib
```

### Using pnpm

```bash
pnpm add github:paperwall-io/paperwall-lib
```

The package name stays `paperwall`, so imports are unchanged:

```js
import { initPaperwall } from 'paperwall';
```

## Usage

Documentation provided for [Svelte](./docs/svelte-usage.md) and [NextJS](./docs/nextjs-usage.md).

## Development

To install dependencies:

```bash
bun install
```

## License

MIT
