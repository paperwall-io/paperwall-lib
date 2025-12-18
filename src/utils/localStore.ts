export type LocalArticleData = {
  articleSessionId: string;
};
export type LocalArticleRecords = Record<string, LocalArticleData>;
const articleSessionKey = "paperwallArticleSessions";
const siteSessionKey = "paperwallSiteSession";

export default {
  resetAllData: () => {
    window.localStorage.removeItem(articleSessionKey);
    window.localStorage.removeItem(siteSessionKey);
  },
  setSiteSession: (siteSession: string) => {
    window.localStorage.setItem(siteSessionKey, siteSession);
  },
  getSiteSession: () => {
    return window.localStorage.getItem(siteSessionKey);
  },
  setArticleData: (articleId: string, data: Partial<LocalArticleData>) => {
    const jsonSessions = window.localStorage.getItem(articleSessionKey);
    let sessionData = {} as LocalArticleRecords;
    if (jsonSessions) {
      sessionData = JSON.parse(jsonSessions);
    }
    window.localStorage.setItem(
      articleSessionKey,
      JSON.stringify(
        Object.assign(sessionData, {
          [articleId]: { ...sessionData[articleId], ...data },
        })
      )
    );
  },
  getArticleData: (articleId: string) => {
    const jsonSessions = window.localStorage.getItem(articleSessionKey);
    if (!jsonSessions) {
      return null;
    }
    let sessions = {} as LocalArticleRecords;
    sessions = JSON.parse(jsonSessions);
    return sessions[articleId] as LocalArticleData;
  },
};
