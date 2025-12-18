import type { WallStore, WallState, WallConfig } from "./types";
import store from "./utils/store";
import localStore from "./utils/localStore";
import ops from "./operations";
import { api } from "./api";

const configDefaults = {
  apiBaseUrl: "https://api.paperwall.io",
  portalUrl: "https://paperwall.io",
};

const initPaperWall = (_config: WallConfig) => {
  let config: WallConfig = Object.assign(configDefaults, _config);

  const wallState = store<WallState>("LOADING");
  const entities = store<WallStore>({});
  let articleEl: HTMLElement | null = null;

  const setArticleEl = (selector?: string) => {
    if (!config.articleInit) {
      return console.warn("articleInit not configured");
    }
    articleEl = document.getElementById(
      selector || config.articleInit?.selector
    );
  };
  const resetArticleEl = () => {
    articleEl = null;
  };

  const detectIsPost = () => {
    if (!config.articleInit) {
      console.warn("articleInit not configured");
      return false;
    }
    return (
      !!articleEl &&
      !!config.articleInit.postUrls?.length &&
      !!config.articleInit.postUrls.find((re: string) =>
        new RegExp(re).exec(window.location.pathname)
      )
    );
  };

  const checkWallState = (): WallState => {
    if (config.articleInit?.selector && !articleEl) {
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
    articleInit: {
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
      if (config.articleInit?.selector) {
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

export { initPaperWall };
