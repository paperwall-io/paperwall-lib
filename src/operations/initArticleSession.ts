import type {
  Store,
  WallStore,
  WallState,
  Article,
  ArticleFlags,
  ArticleReport,
  ApiOpts,
} from "../types";
import localStore from "../utils/localStore";
import { api } from "../api";

export const initArticleSession = async (
  apiOpts: ApiOpts,
  entities: Store<WallStore>,
  wallState: Store<WallState>
) => {
  const wallStatus = wallState.get();

  let { tmpData, siteSession } = entities.get();
  if (wallStatus !== "INIT") {
    return console.warn("loadArticleSession: Not loading", {
      wallStatus,
      siteSession,
    });
  }
  // needs to move past INIT to not have an infinite loop, especially
  // when entities and wallState are the same store
  wallState.set("INIT_SESSION");

  const thisOrigin = window.location.origin;
  const thisUrl = thisOrigin + window.location.pathname;
  const articleResp = await api(apiOpts).visitArticle(thisUrl);
  console.log("visitArticle", thisUrl, articleResp);

  entities.update({
    report: articleResp.report as ArticleReport,
    article: articleResp.article as Article,
    flags: articleResp.flags as ArticleFlags,
  });

  const { article, report, flags } = entities.get();

  if (!article) {
    return console.warn("Article not found", thisUrl);
  }

  if (!siteSession) {
    return console.warn("No siteSession, not retrieving articleSession");
  }

  try {
    const articleSessionId =
      tmpData?.articleSessionId ||
      localStore.getArticleData(article.id)?.articleSessionId ||
      null;
    const sessionResp = await api(apiOpts).getOrCreateArticleSession(
      article.id,
      articleSessionId
    );
    if (!sessionResp.articleSession) {
      entities.set({ article, report, flags });
      localStore.resetAllData();
      return console.warn("initArticleSession: articleSession not initiated");
    }

    console.log("sessionLoaded", {
      sentSessionId: articleSessionId,
      sessionReturned: sessionResp.articleSession,
    });

    localStore.setArticleData(article.id, {
      articleSessionId: sessionResp.articleSession.id,
    });

    entities.update({
      articleSession: sessionResp.articleSession,
      balance: sessionResp.balance,
      tmpData: {},
    });
  } catch (err) {
    console.warn("Error initializing session, resetting all localStorage data", err);
    entities.set({});
    localStore.resetAllData();
  }
};
