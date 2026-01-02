import type {
  Store,
  WallStore,
  WallState,
  WallConfig,
  ApiOpts,
} from "../types";
import localStore from "../utils/localStore";
import { api } from "../api";

export const initApp = (
  apiOpts: ApiOpts,
  config: WallConfig,
  wallState: Store<WallState>,
  entities: Store<WallStore>
) => {
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

  const siteSession = localStore.getSiteSession();
  if (siteSession) {
    entities.update({ siteSession });
  }
  apiOpts.siteSession = siteSession;

  const doReset = qParams.get("paperwall-reset");
  if (doReset) {
    localStore.resetAllData();
    const thisUrl = new URL(window.location.href);
    thisUrl.searchParams.delete("paperwall-reset");
    window.history.replaceState({}, document.title, thisUrl.toString());
  }
  const quickAuth = qParams.get("quick-auth");
  if (quickAuth) {
    wallState.set("QUICK_AUTH");
    api(apiOpts)
      .getOrCreateSiteSession(quickAuth)
      .then((resp) => {
        console.log("quickAuth resp", resp);

        entities.update({
          siteSession: resp.siteSession,
          // leaky -> need to pass the articleSessionId to preserve guest
          // sessions when coming back from redeem
          tmpData: resp.articleSessionId
            ? { articleSessionId: resp.articleSessionId }
            : {},
        });
        localStore.setSiteSession(resp.siteSession);
        const thisUrl = new URL(window.location.href);
        thisUrl.searchParams.delete("quick-auth");
        window.history.replaceState({}, document.title, thisUrl.toString());
        wallState.set("LOADING");
      });
  } else {
    wallState.set("INIT");
  }
};
