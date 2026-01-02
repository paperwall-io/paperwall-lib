import type { WallStore, WallState, WallConfig } from "./types";
import store from "./utils/store";
import localStore from "./utils/localStore";
import ops from "./operations";
import { api } from "./api";
import { urlListener } from "./utils/urlListener";
import { explainPastThreshold, explainWhyFree } from "./utils/explainThreshold";

const configDefaults = {
  apiBaseUrl: "https://api.paperwall.io",
  portalUrl: "https://paperwall.io",
};

const initPaperwall = (_config: WallConfig) => {
  let config: WallConfig = Object.assign(configDefaults, _config);

  const wallState = store<WallState>("LOADING");
  const entities = store<WallStore>({});
  let articleEl: HTMLElement | null = null;

  const setArticleEl = (selector?: string) => {
    if (!config.articleFinder) {
      return console.warn("articleFinder not configured");
    }
    articleEl = document.getElementById(
      selector || config.articleFinder?.selector
    );
  };
  const resetArticleEl = () => {
    articleEl = null;
  };

  const detectIsPost = () => {
    if (!config.articleFinder) {
      console.warn("articleFinder not configured");
      return false;
    }
    return (
      !!articleEl &&
      !!config.articleFinder.postUrls?.length &&
      !!config.articleFinder.postUrls.find((re: string) =>
        new RegExp(re).exec(window.location.pathname)
      )
    );
  };

  const checkWallState = (): WallState => {
    if (config.articleFinder?.selector && !articleEl) {
      console.warn("checkWallState: Post DOM element not found");
      return "NO_WALL";
    }

    const { article, flags, articleSession } = entities.get();
    if (article && flags) {
      // article is live OR article/site is in preview mode AND a site-member is visiting
      if (
        !flags.previewMode ||
        (flags.previewMode && articleSession?.data.is_site_member)
      ) {
        return articleSession?.data.has_purchased
          ? "SHOW_ARTICLE"
          : "SHOW_WALL";
      }
    }
    return "NO_WALL";
  };

  const calcReadingTime = () => {
    if (!articleEl) {
      console.warn("calcReadingTime: Post DOM element not found");
      return;
    }
    const wpm = 225;
    const words = articleEl.innerText.trim().split(/\s+/).length;
    return Math.ceil(words / wpm);
  };

  const getReadingTime = () => {
    const { article } = entities.get();
    return article?.reading_time || (articleEl && calcReadingTime());
  };

  const loadSiteSession = () => {
    const { siteSession } = entities.get();
    if (!siteSession) {
      entities.update({
        siteSession: localStore.getSiteSession(),
      });
    }
  };

  return {
    config,
    entities,
    wallState,
    articleFinder: {
      getEl: () => articleEl,
      setEl: setArticleEl,
      reset: resetArticleEl,
    },
    reset: () => {
      resetArticleEl();
      wallState.set("LOADING");
    },
    detectIsPost,
    getReadingTime,
    getCta: () => {
      const { articleSession, article } = entities.get();
      if (!article) {
        return console.warn("getCta: article not found");
      }
      if (articleSession) {
        return (
          config.portalUrl +
          "/redeem?" +
          new URLSearchParams({
            session_id: articleSession.id,
            article_id: article.id,
            redirect: window.location.toString(),
          }).toString()
        );
      } else {
        return (
          config.portalUrl +
          "/redeem?" +
          new URLSearchParams({
            article_id: article.id,
            redirect: window.location.toString(),
            mode: "member",
          }).toString()
        );
      }
    },
    resetOnNav: () =>
      urlListener(() => {
        setTimeout(() => {
          console.log("resetOnNav triggered");
          resetArticleEl();
          wallState.set("LOADING");
        }, 10);
      }),
    isFree: () => {
      const { article } = entities.get();
      if (!article) {
        throw new Error("isFree: Article not found");
      }
      return article.num_tickets === 0;
    },
    isPreviewMode: () => {
      const { article, flags } = entities.get();
      if (!(article && flags)) {
        throw new Error("isPreviewMode: Article/flags not found");
      }
      return flags?.previewMode;
    },
    thresholds: {
      whyUnder: explainWhyFree,
      whyOver: explainPastThreshold,
    },
    rateArticle: async (
      ...opts: [articleId: string, sessionId: string, rating: number]
    ) => {
      const apiOpts = {
        apiBaseUrl: config.apiBaseUrl,
        siteSession: entities.get().siteSession ?? null,
      };
      const { articleSession, report, article } = await api(
        apiOpts
      ).rateArticle(...opts);

      entities.update({
        articleSession,
        report,
        article,
      });
    },
    initArticle: async () => {
      loadSiteSession();
      const apiOpts = {
        apiBaseUrl: config.apiBaseUrl,
        siteSession: entities.get().siteSession ?? null,
      };
      await ops.initArticleSession(apiOpts, entities, wallState);
      wallState.set(checkWallState());
    },
    initApp: () => {
      if (config.articleFinder?.selector) {
        setArticleEl();
      }
      const apiOpts = {
        apiBaseUrl: config.apiBaseUrl,
        siteSession: entities.get().siteSession ?? null,
      };
      ops.initApp(apiOpts, config, wallState, entities);
    },
  };
};

export type {
  WallConfig,
  WallState,
  WallStore,
  Article,
  ArticleSession,
  ArticleReport,
  ArticleFlags,
  Pricing,
  ThresholdType,
  StoreCallback,
} from "./types";

export { initPaperwall };
