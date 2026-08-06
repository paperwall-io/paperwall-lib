/**
 * Decides whether a path is one of the publisher's articles.
 *
 * Kept out of `detectIsPost` and free of `window` so the rule can be tested
 * directly. Getting this wrong shows up as a wall on a publisher's contact
 * page, which nobody reports as a bug — they just quietly remove the snippet.
 *
 * Patterns are regex sources, matched unanchored, exactly as `postUrls` has
 * always been treated.
 */
export const isPostUrl = (
  path: string,
  finder: {
    readonly postUrls?: string[];
    readonly excludeUrls?: string[];
  },
): boolean => {
  const matchesAny = (patterns?: string[]) =>
    !!patterns?.length && patterns.some((re) => new RegExp(re).test(path));

  // An exclude never rescues a path the includes did not claim, and an absent
  // or empty excludeUrls leaves the old behaviour exactly as it was.
  return matchesAny(finder.postUrls) && !matchesAny(finder.excludeUrls);
};
