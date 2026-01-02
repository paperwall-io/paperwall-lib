// src/utils/store.ts
var store_default = (initialState) => {
  let state = initialState;
  let subscribers = [];
  const notify = (newState) => {
    for (let i = 0;i < subscribers.length; i++) {
      const subscriber = subscribers[i];
      if (subscriber) {
        subscriber(newState);
      }
    }
  };
  function set(newState) {
    state = newState;
    notify(state);
    return state;
  }
  function update(newState) {
    state = {
      ...state,
      ...newState
    };
    notify(state);
    return state;
  }
  function subscribe(callback) {
    subscribers.push(callback);
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }
  return {
    get: () => state,
    update,
    set,
    sub: subscribe
  };
};

// src/utils/localStore.ts
var articleSessionKey = "paperwallArticleSessions";
var siteSessionKey = "paperwallSiteSession";
var localStore_default = {
  resetAllData: () => {
    window.localStorage.removeItem(articleSessionKey);
    window.localStorage.removeItem(siteSessionKey);
  },
  setSiteSession: (siteSession) => {
    window.localStorage.setItem(siteSessionKey, siteSession);
  },
  getSiteSession: () => {
    return window.localStorage.getItem(siteSessionKey);
  },
  setArticleData: (articleId, data) => {
    const jsonSessions = window.localStorage.getItem(articleSessionKey);
    let sessionData = {};
    if (jsonSessions) {
      sessionData = JSON.parse(jsonSessions);
    }
    window.localStorage.setItem(articleSessionKey, JSON.stringify(Object.assign(sessionData, {
      [articleId]: { ...sessionData[articleId], ...data }
    })));
  },
  getArticleData: (articleId) => {
    const jsonSessions = window.localStorage.getItem(articleSessionKey);
    if (!jsonSessions) {
      return null;
    }
    let sessions = {};
    sessions = JSON.parse(jsonSessions);
    return sessions[articleId];
  }
};

// src/utils/apiFetch.ts
var apiFetch = (baseUrl, headers) => async (path, opts) => {
  let reqArgs = {};
  if (!["GET", "HEAD"].includes(opts.method)) {
    reqArgs.body = JSON.stringify(opts.body);
  }
  return fetch(`${baseUrl}${path}`, {
    method: opts.method,
    mode: "cors",
    credentials: "include",
    headers: new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: window.location.origin,
      "App-Origin": "embed",
      ...headers
    }),
    referrerPolicy: "origin",
    ...reqArgs
  }).then(async (resp) => {
    const respJson = await resp.json();
    return respJson;
  });
};

// src/api.ts
var api = ({
  apiBaseUrl,
  siteSession
}) => {
  const apiClient = apiFetch(apiBaseUrl, {
    "App-Site-Session": siteSession || ""
  });
  return {
    getOrCreateArticleSession: async (articleId, sessionId) => {
      const { articleSession, balance } = await apiClient(`/articles/${articleId}/session`, {
        method: "POST",
        body: { sessionId }
      });
      return { articleSession, balance };
    },
    visitArticle: async (url) => {
      try {
        const { article, report, flags } = await apiClient(`/visit-article?url=${url}`, { method: "GET" });
        return { article, report, flags };
      } catch (err) {
        console.log("visitArticle error", err);
        return { article: null, report: null, flags: null };
      }
    },
    verifySite: (domain, token) => apiClient(`/sites/verify`, {
      method: "POST",
      body: {
        token,
        domain
      }
    }).then((resp) => {
      console.log("site verify", resp);
    }),
    rateArticle: (articleId, articleSessionId, rating) => apiClient(`/articles/${articleId}/session/${articleSessionId}/rate`, {
      body: { rating },
      method: "POST"
    }).then((resp) => {
      return {
        articleSession: resp.articleSession,
        article: resp.article,
        report: resp.report
      };
    }),
    getOrCreateSiteSession: async (quickAuth) => {
      const { siteSession: siteSession2, articleSessionId } = await apiClient(`/account/site-session`, {
        method: "POST",
        body: { quickAuth }
      });
      return { siteSession: siteSession2, articleSessionId };
    }
  };
};

// src/operations/initArticleSession.ts
var initArticleSession = async (apiOpts, entities, wallState) => {
  const wallStatus = wallState.get();
  let { tmpData, siteSession } = entities.get();
  if (wallStatus !== "INIT") {
    return console.warn("loadArticleSession: Not loading", {
      wallStatus,
      siteSession
    });
  }
  wallState.set("INIT_SESSION");
  const thisOrigin = window.location.origin;
  const thisUrl = thisOrigin + window.location.pathname;
  const articleResp = await api(apiOpts).visitArticle(thisUrl);
  console.log("visitArticle", thisUrl, articleResp);
  entities.update({
    report: articleResp.report,
    article: articleResp.article,
    flags: articleResp.flags
  });
  const { article, report, flags } = entities.get();
  if (!article) {
    return console.warn("Article not found", thisUrl);
  }
  if (!siteSession) {
    return console.warn("No siteSession, not retrieving articleSession");
  }
  try {
    const articleSessionId = tmpData?.articleSessionId || localStore_default.getArticleData(article.id)?.articleSessionId || null;
    const sessionResp = await api(apiOpts).getOrCreateArticleSession(article.id, articleSessionId);
    if (!sessionResp.articleSession) {
      entities.set({ article, report, flags });
      localStore_default.resetAllData();
      return console.warn("initArticleSession: articleSession not initiated");
    }
    console.log("sessionLoaded", {
      sentSessionId: articleSessionId,
      sessionReturned: sessionResp.articleSession
    });
    localStore_default.setArticleData(article.id, {
      articleSessionId: sessionResp.articleSession.id
    });
    entities.update({
      articleSession: sessionResp.articleSession,
      balance: sessionResp.balance,
      tmpData: {}
    });
  } catch (err) {
    console.warn("Error initializing session, resetting all localStorage data", err);
    entities.set({});
    localStore_default.resetAllData();
  }
};

// src/operations/initApp.ts
var initApp = (apiOpts, config, wallState, entities) => {
  const wallStatus = wallState.get();
  if (wallStatus !== "LOADING") {
    return console.warn(`App in invalid initialization state: ${wallStatus}`);
  }
  const qParams = new URLSearchParams(window.location.search);
  const pwToken = qParams.get("paperwall-token");
  if (pwToken && pwToken === config.siteToken) {
    console.log("verifying site");
    api(apiOpts).verifySite(window.location.origin, pwToken);
  }
  const siteSession = localStore_default.getSiteSession();
  if (siteSession) {
    entities.update({ siteSession });
  }
  apiOpts.siteSession = siteSession;
  const doReset = qParams.get("paperwall-reset");
  if (doReset) {
    localStore_default.resetAllData();
    const thisUrl = new URL(window.location.href);
    thisUrl.searchParams.delete("paperwall-reset");
    window.history.replaceState({}, document.title, thisUrl.toString());
  }
  const quickAuth = qParams.get("quick-auth");
  if (quickAuth) {
    wallState.set("QUICK_AUTH");
    api(apiOpts).getOrCreateSiteSession(quickAuth).then((resp) => {
      console.log("quickAuth resp", resp);
      entities.update({
        siteSession: resp.siteSession,
        tmpData: resp.articleSessionId ? { articleSessionId: resp.articleSessionId } : {}
      });
      localStore_default.setSiteSession(resp.siteSession);
      const thisUrl = new URL(window.location.href);
      thisUrl.searchParams.delete("quick-auth");
      window.history.replaceState({}, document.title, thisUrl.toString());
      wallState.set("LOADING");
    });
  } else {
    wallState.set("INIT");
  }
};

// src/operations/index.ts
var operations_default = { initArticleSession, initApp };

// src/utils/urlListener.ts
var urlListener = (onNav) => {
  window.addEventListener("hashchange", onNav);
  window.addEventListener("popstate", onNav);
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    onNav();
  };
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    onNav();
  };
  return () => {
    window.removeEventListener("hashchange", onNav);
    window.removeEventListener("popstate", onNav);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
};

// src/utils/explainThreshold.ts
var explainWhyFree = (article) => {
  if (article.threshold_type === "DAYS") {
    return "FREE! Early bird special";
  }
  if (article.threshold_type === "RATING") {
    return "Read for FREE! Rate it after";
  }
  if (article.threshold_type === "READS") {
    return "Be one of the first to read, for Free!";
  }
  return "Random draw!";
};
var explainPastThreshold = (article) => {
  if (article.threshold_type === "DAYS") {
    return "Has been live for a while";
  }
  if (article.threshold_type === "RATING") {
    return "Rated highly by other readers";
  }
  if (article.threshold_type === "READS") {
    return "Reade by many already";
  }
  return "Random draw!";
};

// src/index.ts
var configDefaults = {
  apiBaseUrl: "https://api.paperwall.io",
  portalUrl: "https://paperwall.io"
};
var initPaperwall = (_config) => {
  let config = Object.assign(configDefaults, _config);
  const wallState = store_default("LOADING");
  const entities = store_default({});
  let articleEl = null;
  const setArticleEl = (selector) => {
    if (!config.articleFinder) {
      return console.warn("articleFinder not configured");
    }
    articleEl = document.getElementById(selector || config.articleFinder?.selector);
  };
  const resetArticleEl = () => {
    articleEl = null;
  };
  const detectIsPost = () => {
    if (!config.articleFinder) {
      console.warn("articleFinder not configured");
      return false;
    }
    return !!articleEl && !!config.articleFinder.postUrls?.length && !!config.articleFinder.postUrls.find((re) => new RegExp(re).exec(window.location.pathname));
  };
  const checkWallState = () => {
    if (config.articleFinder?.selector && !articleEl) {
      console.warn("checkWallState: Post DOM element not found");
      return "NO_WALL";
    }
    const { article, flags, articleSession } = entities.get();
    if (article && flags) {
      if (!flags.previewMode || flags.previewMode && articleSession?.data.is_site_member) {
        return articleSession?.data.has_purchased ? "SHOW_ARTICLE" : "SHOW_WALL";
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
    return article?.reading_time || articleEl && calcReadingTime();
  };
  const loadSiteSession = () => {
    const { siteSession } = entities.get();
    if (!siteSession) {
      entities.update({
        siteSession: localStore_default.getSiteSession()
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
      reset: resetArticleEl
    },
    reset: () => {
      resetArticleEl();
      wallState.set("LOADING");
    },
    detectIsPost,
    getReadingTime,
    resetOnNav: () => urlListener(() => {
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
      whyOver: explainPastThreshold
    },
    rateArticle: async (...opts) => {
      const apiOpts = {
        apiBaseUrl: config.apiBaseUrl,
        siteSession: entities.get().siteSession ?? null
      };
      const { articleSession, report, article } = await api(apiOpts).rateArticle(...opts);
      entities.update({
        articleSession,
        report,
        article
      });
    },
    initArticle: async () => {
      loadSiteSession();
      const apiOpts = {
        apiBaseUrl: config.apiBaseUrl,
        siteSession: entities.get().siteSession ?? null
      };
      await operations_default.initArticleSession(apiOpts, entities, wallState);
      wallState.set(checkWallState());
    },
    initApp: () => {
      if (config.articleFinder?.selector) {
        setArticleEl();
      }
      const apiOpts = {
        apiBaseUrl: config.apiBaseUrl,
        siteSession: entities.get().siteSession ?? null
      };
      operations_default.initApp(apiOpts, config, wallState, entities);
    }
  };
};
export {
  initPaperwall
};
