import { describe, test, expect } from "bun:test";
import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import path from "path";

const { like, integer } = MatchersV3;

// Mock window for apiFetch (uses window.location.origin in request headers)
(globalThis as any).window = { location: { origin: "http://localhost" } };

import { api } from "../../src/api";

// Use a placeholder token — the provider's requestFilter replaces this with a
// properly authenticated siteSession during verification.
const siteSession = "valid-site-session-token";

const pact = new PactV3({
  consumer: "paperwall-lib",
  provider: "paperwall-api",
  dir: path.resolve(__dirname, "pacts"),
  logLevel: "error",
});

const commonRequestHeaders = {
  "Content-Type": "application/json",
  "app-origin": "embed",
  "app-site-session": siteSession,
};

describe("Embed Consumer Contract Tests", () => {
  test("creates a new article session", async () => {
    await pact
      .given("an article exists")
      .uponReceiving("a request to create a new article session")
      .withRequest({
        method: "POST",
        path: "/articles/pact-article-id/session",
        headers: commonRequestHeaders,
        body: { sessionId: null },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          articleSession: like({
            id: "session-id",
            article_id: "article-id",
            data: like({
              pricing: like({ num_tickets: 0, threshold_value: 100 }),
              has_purchased: true,
              is_site_member: false,
            }),
          }),
          balance: like(0),
        },
      })
      .executeTest(async (mockServer) => {
        const embedApi = api({ apiBaseUrl: mockServer.url, siteSession });
        const result = await embedApi.getOrCreateArticleSession("pact-article-id", null);
        expect(result.articleSession).toBeDefined();
        expect(result.articleSession.id).toBeString();
        expect(typeof result.balance).toBe("number");
      });
  });

  test("retrieves an existing purchased session", async () => {
    await pact
      .given("an article exists with a purchased session")
      .uponReceiving("a request to retrieve an existing purchased session")
      .withRequest({
        method: "POST",
        path: "/articles/pact-article-id/session",
        headers: commonRequestHeaders,
        body: { sessionId: "pact-session-id" },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          articleSession: like({
            id: "session-id",
            article_id: "article-id",
            data: like({ has_purchased: true }),
          }),
          balance: like(0),
        },
      })
      .executeTest(async (mockServer) => {
        const embedApi = api({ apiBaseUrl: mockServer.url, siteSession });
        const result = await embedApi.getOrCreateArticleSession("pact-article-id", "pact-session-id");
        expect(result.articleSession.data.has_purchased).toBe(true);
      });
  });

  test("rates a purchased article", async () => {
    await pact
      .given("an article exists with a purchased session")
      .uponReceiving("a request to rate a purchased article")
      .withRequest({
        method: "POST",
        path: "/articles/pact-article-id/session/pact-session-id/rate",
        headers: commonRequestHeaders,
        body: { rating: 4 },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          article: like({ id: "article-id", title: "Article Title" }),
          articleSession: like({ id: "session-id" }),
          report: {
            dailyReads: integer(0),
            numReads: integer(0),
            numRatings: integer(1),
            score: like(4.0),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const embedApi = api({ apiBaseUrl: mockServer.url, siteSession });
        const result = await embedApi.rateArticle("pact-article-id", "pact-session-id", 4);
        expect(result.article).toBeDefined();
        expect(result.articleSession).toBeDefined();
        expect(result.report).toBeDefined();
      });
  });

  test("returns 404 for a non-existent article", async () => {
    await pact
      .given("no article exists")
      .uponReceiving("a request for a non-existent article returns 404")
      .withRequest({
        method: "POST",
        path: "/articles/non-existent-id/session",
        headers: commonRequestHeaders,
        body: { sessionId: null },
      })
      .willRespondWith({
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: {
          errors: [{ message: "Article not found" }],
        },
      })
      .executeTest(async (mockServer) => {
        const embedApi = api({ apiBaseUrl: mockServer.url, siteSession });
        const result = await embedApi.getOrCreateArticleSession("non-existent-id", null);
        // api.ts destructures { articleSession, balance } — both undefined when API returns errors
        expect(result.articleSession).toBeUndefined();
        expect(result.balance).toBeUndefined();
      });
  });

  test("returns 400 when rating an unpurchased article", async () => {
    await pact
      .given("an article exists with an unpurchased session")
      .uponReceiving("a request to rate an unpurchased article returns 400")
      .withRequest({
        method: "POST",
        path: "/articles/pact-article-id/session/unpurchased-session-id/rate",
        headers: commonRequestHeaders,
        body: { rating: 4 },
      })
      .willRespondWith({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          errors: [{ message: "Article not yet purchased" }],
        },
      })
      .executeTest(async (mockServer) => {
        const embedApi = api({ apiBaseUrl: mockServer.url, siteSession });
        const result = await embedApi.rateArticle("pact-article-id", "unpurchased-session-id", 4);
        // api.ts extracts { articleSession, article, report } — all undefined when API returns errors
        expect(result.articleSession).toBeUndefined();
        expect(result.article).toBeUndefined();
      });
  });
});
