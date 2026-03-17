import { describe, test, expect, beforeAll } from "bun:test";

// Mock window for apiFetch (uses window.location.origin in request headers)
(globalThis as any).window = { location: { origin: "http://localhost" } };

import { api } from "../../src/api";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3003";
const PORTAL_API_KEY =
  process.env.PORTAL_API_KEY || "8D492654-F25F-439C-917D-D9DE3217DBC7";

// Seeded data (from api/tests/fixtures/seed-data.ts)
const ARTICLE_ID = "article-001";

describe("Embed API Integration", () => {
  let siteSession: string;
  let embedApi: ReturnType<typeof api>;

  beforeAll(async () => {
    // Get a quick-auth token for the seeded article
    const quickAuthRes = await fetch(
      `${API_BASE_URL}/account/quick-auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "portal-api-key": PORTAL_API_KEY,
        },
        body: JSON.stringify({ articleId: ARTICLE_ID, articleSessionId: null }),
      },
    );
    const { quickAuth } = await quickAuthRes.json();
    expect(!!quickAuth).toBeTrue();

    // Exchange quick-auth for a site session
    const sessionRes = await fetch(
      `${API_BASE_URL}/account/site-session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickAuth }),
      },
    );
    const sessionData = await sessionRes.json();
    expect(!!sessionData.siteSession).toBeTrue();
    siteSession = sessionData.siteSession;

    embedApi = api({ apiBaseUrl: API_BASE_URL, siteSession });
  });

  test("creates a new article session", async () => {
    const result = await embedApi.getOrCreateArticleSession(ARTICLE_ID, null);
    expect(result.articleSession).toBeDefined();
    expect(result.articleSession.id).toBeString();
    expect(result.articleSession.article_id).toBe(ARTICLE_ID);
    expect(typeof result.balance).toBe("number");
  });

  test("retrieves an existing session", async () => {
    const first = await embedApi.getOrCreateArticleSession(ARTICLE_ID, null);
    const result = await embedApi.getOrCreateArticleSession(
      ARTICLE_ID,
      first.articleSession.id,
    );
    expect(result.articleSession.id).toBe(first.articleSession.id);
  });

  test("returns undefined for non-existent article", async () => {
    const result = await embedApi.getOrCreateArticleSession(
      "non-existent-id",
      null,
    );
    expect(result.articleSession).toBeUndefined();
  });

  test("returns undefined when rating an unpurchased article", async () => {
    // Create a fresh session — if the article costs tickets, it won't be purchased
    const session = await embedApi.getOrCreateArticleSession(ARTICLE_ID, null);
    if (!session.articleSession?.data?.has_purchased) {
      const result = await embedApi.rateArticle(
        ARTICLE_ID,
        session.articleSession.id,
        4,
      );
      expect(result.article).toBeUndefined();
    } else {
      // Article was free (0 tickets) so it's auto-purchased — rate it successfully
      const result = await embedApi.rateArticle(
        ARTICLE_ID,
        session.articleSession.id,
        4,
      );
      expect(result.article).toBeDefined();
      expect(result.articleSession).toBeDefined();
      expect(result.report).toBeDefined();
    }
  });
});
