
```typescript
import { initPaperWall } from 'paperwall-lib';
import type { WallConfig } from 'paperwall-lib/types';

const config: WallConfig = {
  siteToken: 'your-site-token',
  articleFinder: {
    selector: 'blog-post',
    postUrls: ['/posts/.*', '/articles/.*'],
    // Optional. Applied after postUrls matches, so it can only ever remove
    // pages. Useful when your posts have no path prefix to anchor on — a
    // platform that serves posts at the root needs a broad include and a list
    // of the pages that are not posts.
    excludeUrls: ['^/(about|contact|privacy)/?$']
  }
};

// In your src/server.ts

const paperwall = initPaperWall(config);

// Initialize the app

// In the layout.svelte page

import pw from 'src/server.ts'

useEffect(() => {

    // create listeners in the store
    const unsubEntities = pw.entities.sub((state) => {
      $wallStore.entities = state;
    });
    const unsubWallState = pw.wallState.sub((state) => {
      console.log("WallState", state);
      $wallStore.wallState = state;
    });

    // optional url listener that handles reset scenarios
    const urlUnsub = urlListener();

    return () => {
      unsubEntities();
      unsubWallState();
      urlUnsub();
    };
}, [])

useEffect(() => {
  if(pw.init){
    pw.initApp()
  }
}, [])

```