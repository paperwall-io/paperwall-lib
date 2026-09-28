import { describe, test, expect, beforeEach, afterEach } from "bun:test";

// Minimal browser surface: location for URLs, localStorage for the site session.
const storage = new Map<string, string>();
(globalThis as any).window = {
  location: {
    origin: "https://blog.example.com",
    pathname: "/a-post/",
    toString: () => "https://blog.example.com/a-post/",
  },
  localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  },
};

import { initPaperwall } from "../src/index";

const realFetch = globalThis.fetch;

const article = (access_mode?: string) => ({
  id: "article-1",
  num_tickets: 3,
  pricing: [{ num_tickets: 3, threshold_value: 0 }],
  ...(access_mode ? { access_mode } : {}),
});

const session = (data: Record<string, unknown> = {}) => ({
  id: "session-1",
  data: { is_site_member: false, has_purchased: false, ...data },
});

/** Answers /visit-article and the session call; nothing else is expected. */
const mockApi = (visit: Record<string, unknown>, articleSession?: unknown) => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes("/visit-article")
      ? { flags: { previewMode: false, isPromoMode: false }, ...visit }
      : { articleSession, balance: 0 };
    return new Response(JSON.stringify(body));
  }) as typeof fetch;
};

const load = async () => {
  const pw = initPaperwall({ mode: "local", siteToken: "token" });
  pw.wallState.set("@paperwall/app_pending");
  await pw.initArticle();
  return pw;
};

describe("post-read support state", () => {
  beforeEach(() => storage.clear());
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("a POST_READ_SUPPORT article shows support, not the wall", async () => {
    mockApi({ article: article("POST_READ_SUPPORT"), supportOptions: [4, 8, 20] });
    const pw = await load();
    expect(pw.wallState.get()).toBe("@paperwall/show_support");
    expect(pw.getSupportOptions()).toEqual([4, 8, 20]);
    expect(pw.hasContributed()).toBe(false);
  });

  test("an article from an API without access_mode is still walled", async () => {
    mockApi({ article: article() });
    const pw = await load();
    expect(pw.wallState.get()).toBe("@paperwall/show_wall");
    expect(pw.getSupportOptions()).toEqual([]);
  });

  test("a reader who has paid is recognised", async () => {
    storage.set("paperwallSiteSession", "site-session-jwt");
    mockApi(
      { article: article("POST_READ_SUPPORT"), supportOptions: [4, 8, 20] },
      session({ contributed: true }),
    );
    const pw = await load();
    expect(pw.wallState.get()).toBe("@paperwall/show_support");
    expect(pw.hasContributed()).toBe(true);
  });

  test("the contribute link carries the amount, session and return URL", async () => {
    storage.set("paperwallSiteSession", "site-session-jwt");
    mockApi(
      { article: article("POST_READ_SUPPORT"), supportOptions: [4, 8, 20] },
      session(),
    );
    const pw = await load();
    const link = new URL(pw.getContributeCta(8) as string);
    expect(link.origin + link.pathname).toBe(
      "http://portal.pw.local:5173/contribute",
    );
    expect(link.searchParams.get("article_id")).toBe("article-1");
    expect(link.searchParams.get("tickets")).toBe("8");
    expect(link.searchParams.get("session_id")).toBe("session-1");
    expect(link.searchParams.get("redirect")).toBe(
      "https://blog.example.com/a-post/",
    );
  });

  test("an anonymous reader's link has no session", async () => {
    mockApi({ article: article("POST_READ_SUPPORT"), supportOptions: [4] });
    const pw = await load();
    const link = new URL(pw.getContributeCta(4) as string);
    expect(link.searchParams.has("session_id")).toBe(false);
  });
});
