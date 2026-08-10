import { describe, test, expect, spyOn, afterEach } from "bun:test";
import { normalizeWallConfig } from "../src/utils/normalizeConfig";
import type { WallConfig } from "../src/types";

const base: WallConfig = { mode: "live", siteToken: "tok" };

const ghost = {
  articleFinder: {
    selector: ".gh-content",
    postUrls: ["^/[^/]+/?$"],
    excludeUrls: ["^/tag/", "^/author/"],
  },
};

describe("normalizeWallConfig", () => {
  afterEach(() => {
    spyOn(console, "warn").mockRestore();
  });

  test("uses the platform default when the publisher supplies none", () => {
    expect(normalizeWallConfig(base, ghost).articleFinder).toEqual(
      ghost.articleFinder,
    );
  });

  test("a complete articleFinder wins outright", () => {
    const mine = {
      selector: ".mine",
      postUrls: ["^/blog/"],
      excludeUrls: ["^/blog/drafts/"],
    };
    expect(
      normalizeWallConfig({ ...base, articleFinder: mine }, ghost).articleFinder,
    ).toEqual(mine);
  });

  // The case wholesale replacement got wrong: a custom theme with standard
  // Ghost URLs would otherwise lose postUrls and never wall anything.
  test("fills the fields a partial leaves out", () => {
    const merged = normalizeWallConfig(
      { ...base, articleFinder: { selector: ".custom" } as any },
      ghost,
    ).articleFinder;

    expect(merged).toEqual({
      selector: ".custom",
      postUrls: ghost.articleFinder.postUrls,
      excludeUrls: ghost.articleFinder.excludeUrls,
    });
  });

  test("an override of only the url rules keeps the default selector", () => {
    const merged = normalizeWallConfig(
      { ...base, articleFinder: { postUrls: ["^/news/"] } as any },
      ghost,
    ).articleFinder;

    expect(merged?.selector).toBe(".gh-content");
    expect(merged?.postUrls).toEqual(["^/news/"]);
  });

  // postUrls: [] matches nothing, which is the same silent no-wall failure a
  // publisher writing it was probably trying to avoid.
  test("treats an empty array as missing", () => {
    const merged = normalizeWallConfig(
      { ...base, articleFinder: { selector: ".custom", postUrls: [] } as any },
      ghost,
    ).articleFinder;

    expect(merged?.postUrls).toEqual(ghost.articleFinder.postUrls);
  });

  test("warns when a partial was filled in", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    normalizeWallConfig(
      { ...base, articleFinder: { selector: ".custom" } as any },
      ghost,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("postUrls");
  });

  test("stays quiet for a complete articleFinder or none at all", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    normalizeWallConfig(base, ghost);
    normalizeWallConfig({ ...base, articleFinder: ghost.articleFinder }, ghost);
    expect(warn).not.toHaveBeenCalled();
  });

  test("passes the publisher's config through when there are no defaults", () => {
    const mine = { selector: ".mine", postUrls: ["^/blog/"] };
    expect(normalizeWallConfig({ ...base, articleFinder: mine }).articleFinder).toEqual(
      mine,
    );
  });

  test("leaves the rest of the config untouched", () => {
    const config: WallConfig = { ...base, mode: "sandbox", portalUrl: "http://x" };
    const out = normalizeWallConfig(config, ghost);
    expect(out.mode).toBe("sandbox");
    expect(out.siteToken).toBe("tok");
    expect(out.portalUrl).toBe("http://x");
  });
});
