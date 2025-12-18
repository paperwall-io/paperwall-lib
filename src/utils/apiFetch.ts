type FetchOpts = {
  method: string;
  body?: Record<string, any>;
};

export const apiFetch =
  (baseUrl: string, headers: Record<string, string>) =>
  async (path: string, opts: FetchOpts) => {
    let reqArgs: RequestInit = {};
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
        Origin: window.location.origin as string,
        "App-Origin": "embed",
        ...headers,
      }),
      referrerPolicy: "origin",
      ...reqArgs,
    }).then(async (resp) => {
      const respJson = await resp.json();
      // console.log("api response", path, respJson);
      return respJson;
    });
  };
