import type { WallConfig } from "../types";

/**
 * Defaults a platform-specific embed supplies for its own CMS.
 *
 * Only `articleFinder` for now — the rest of WallConfig is per-publisher by
 * nature (siteToken, mode) and has nothing a platform could sensibly guess.
 */
export type PlatformDefaults = {
  readonly articleFinder?: WallConfig["articleFinder"];
};

type ArticleFinder = NonNullable<WallConfig["articleFinder"]>;

const FINDER_FIELDS = ["selector", "postUrls", "excludeUrls"] as const;

const isMissing = (value: unknown): boolean =>
  value === undefined || value === null || (Array.isArray(value) && !value.length);

/**
 * Fills a publisher's `articleFinder` from the platform's defaults, field by
 * field rather than all-or-nothing.
 *
 * Wholesale replacement reads simpler but fails silently in the one case that
 * matters: a publisher who overrides `selector` for a custom theme and leaves
 * the URL rules alone ends up with no `postUrls`, which makes `isPostUrl`
 * reject every path. The wall then never renders, nothing throws, and nothing
 * is logged — the publisher concludes the product is broken. Merging per field
 * turns that into "the wall appears somewhere slightly wrong", which people
 * actually report.
 *
 * Empty arrays are treated as missing. `postUrls: []` matches nothing, so
 * honouring it reproduces the same silent failure it looks like a
 * publisher was trying to avoid.
 */
const mergeArticleFinder = (
  provided: WallConfig["articleFinder"],
  defaults: WallConfig["articleFinder"],
): WallConfig["articleFinder"] => {
  if (!defaults) return provided;
  if (!provided) return defaults;

  const merged = { ...defaults } as Record<string, unknown>;
  const supplied: string[] = [];
  const filled: string[] = [];

  for (const field of FINDER_FIELDS) {
    const value = (provided as Record<string, unknown>)[field];
    if (isMissing(value)) {
      if (!isMissing((defaults as Record<string, unknown>)[field])) filled.push(field);
    } else {
      merged[field] = value;
      supplied.push(field);
    }
  }

  // Only noise when a publisher actually supplied a partial. A complete
  // articleFinder, or none at all, are both deliberate and stay quiet.
  if (supplied.length && filled.length) {
    console.warn(
      `[paperwall] articleFinder is missing ${filled.join(", ")}; using the platform default. ` +
        `Supplied: ${supplied.join(", ")}.`,
    );
  }

  return merged as ArticleFinder;
};

/**
 * Applies a platform embed's defaults to the config a publisher wrote.
 *
 * Lives here rather than in each embed's entrypoint so that embed, embed-ghost
 * and embed-nextjs cannot drift into three different merge semantics.
 */
export const normalizeWallConfig = (
  config: WallConfig,
  defaults: PlatformDefaults = {},
): WallConfig => ({
  ...config,
  articleFinder: mergeArticleFinder(config.articleFinder, defaults.articleFinder),
});
