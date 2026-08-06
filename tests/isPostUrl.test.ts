import { describe, test, expect } from "bun:test";
import { isPostUrl } from "../src/utils/isPostUrl";

describe("isPostUrl", () => {
  const prefixed = { postUrls: ["/posts/.*"] };

  test("matches a path claimed by postUrls", () => {
    expect(isPostUrl("/posts/hello", prefixed)).toBe(true);
  });

  test("does not match a path no include claims", () => {
    expect(isPostUrl("/about", prefixed)).toBe(false);
  });

  // Behaviour that predates excludeUrls, and that some published bundles still
  // rely on: no includes means nothing is ever a post.
  test("matches nothing when postUrls is absent or empty", () => {
    expect(isPostUrl("/posts/hello", {})).toBe(false);
    expect(isPostUrl("/posts/hello", { postUrls: [] })).toBe(false);
  });

  test("is unchanged by an absent or empty excludeUrls", () => {
    expect(isPostUrl("/posts/hello", { ...prefixed, excludeUrls: [] })).toBe(true);
    expect(isPostUrl("/posts/hello", { ...prefixed, excludeUrls: undefined })).toBe(
      true,
    );
  });

  test("drops a path an exclude claims", () => {
    expect(
      isPostUrl("/posts/drafts/wip", {
        ...prefixed,
        excludeUrls: ["/posts/drafts/"],
      }),
    ).toBe(false);
  });

  // An exclude is a veto, not a second opinion — it cannot make a page an
  // article that the includes never claimed.
  test("an exclude never rescues an unclaimed path", () => {
    expect(isPostUrl("/about", { postUrls: [], excludeUrls: ["/nope/"] })).toBe(
      false,
    );
  });

  describe("the Ghost shape it exists for", () => {
    // Ghost serves posts at the root as /:slug/, so the include is broad and
    // the excludes carry the exceptions — readable, and editable by a
    // publisher who adds a static page.
    const ghost = {
      postUrls: ["^/[^/]+/?$"],
      excludeUrls: ["^/(about|contact|privacy)/?$", "^/tag/", "^/author/", "^/ghost/"],
    };

    test("walls a post at the root", () => {
      expect(isPostUrl("/my-first-post/", ghost)).toBe(true);
      expect(isPostUrl("/my-first-post", ghost)).toBe(true);
    });

    test("leaves the static pages alone", () => {
      expect(isPostUrl("/about/", ghost)).toBe(false);
      expect(isPostUrl("/contact", ghost)).toBe(false);
      expect(isPostUrl("/privacy/", ghost)).toBe(false);
    });

    test("leaves Ghost's own routes alone", () => {
      expect(isPostUrl("/tag/culture/", ghost)).toBe(false);
      expect(isPostUrl("/author/jamie/", ghost)).toBe(false);
      expect(isPostUrl("/ghost/", ghost)).toBe(false);
    });

    test("leaves the home page alone", () => {
      expect(isPostUrl("/", ghost)).toBe(false);
    });

    // A post whose slug merely starts with an excluded word is still a post.
    test("does not over-exclude on a prefix", () => {
      expect(isPostUrl("/about-our-new-funding/", ghost)).toBe(true);
      expect(isPostUrl("/tagged-for-review/", ghost)).toBe(true);
    });
  });
});
