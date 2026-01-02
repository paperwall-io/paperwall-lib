import type {
  ArticleSession,
  Article,
  ArticleFlags,
  ArticleReport,
  SiteSession,
} from "./types";
import { apiFetch } from "./utils/apiFetch";

export const api = ({
  apiBaseUrl,
  siteSession,
}: {
  apiBaseUrl: string;
  siteSession: string | null;
}) => {

  const apiClient = apiFetch(apiBaseUrl, {
    "App-Site-Session": siteSession || "",
  });

  return {
    /**
     */
    getOrCreateArticleSession: async (
      articleId: string,
      sessionId: string | null
    ): Promise<{
      articleSession: ArticleSession;
      balance: number;
    }> => {
      const { articleSession, balance } = await apiClient(
        `/articles/${articleId}/session`,
        {
          method: "POST",
          body: { sessionId },
        }
      );
      return { articleSession, balance };
    },

    /**
     */
    visitArticle: async (
      url: string
    ): Promise<{
      article: Article | null;
      report: ArticleReport | null;
      flags: ArticleFlags | null;
    }> => {
      try {
        const { article, report, flags } = await apiClient(
          `/visit-article?url=${url}`,
          { method: "GET" }
        );
        return { article, report, flags };
      } catch (err) {
        console.log("visitArticle error", err);
        return { article: null, report: null, flags: null };
      }
    },

    /**
     */
    verifySite: (domain: string, token: string) =>
      apiClient(`/sites/verify`, {
        method: "POST",
        body: {
          token: token,
          domain: domain,
        },
      }).then((resp) => {
        console.log("site verify", resp);
      }),

    /**
     */
    rateArticle: (
      articleId: string,
      articleSessionId: string,
      rating: number
    ) =>
      apiClient(`/articles/${articleId}/session/${articleSessionId}/rate`, {
        body: { rating },
        method: "POST",
      }).then((resp) => {
        return {
          articleSession: resp.articleSession,
          article: resp.article,
          report: resp.report,
        };
      }),

    /**
     */
    getOrCreateSiteSession: async (
      quickAuth: string
    ): Promise<{ articleSessionId: string; siteSession: SiteSession }> => {
      const { siteSession, articleSessionId } = await apiClient(
        `/account/site-session`,
        {
          method: "POST",
          body: { quickAuth },
        }
      );
      return { siteSession, articleSessionId };
    },
  };
};
