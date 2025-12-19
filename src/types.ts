export interface WallConfig {
  siteToken: string;
  articleInit?: {
    selector: string;
    postUrls: string[];
  };
  apiBaseUrl: string;
  portalUrl: string;
}

export type WallState =
  | "LOADING"
  | "INIT"
  | "QUICK_AUTH"
  | "INIT_SESSION"
  | "NO_WALL"
  | "SHOW_WALL"
  | "SHOW_ARTICLE";

export type StoreCallback = (newState: any) => any;
export type Store<T> = {
  get: () => T;
  set: (args: T) => T;
  update: (args: T) => T;
  sub: (callback: StoreCallback) => () => void;
};

export interface IUser {
  id: string;
  balance: number;
  username: string;
}
export type Pricing = {
  num_tickets: number;
  threshold_value: number;
};

export type ThresholdType = "NONE" | "RATING" | "VISITS" | "DAYS" | "READS";

export interface IArticle {
  id: string;
  use_ratings: number;
  rating_score: number;
  num_visits: number;
  date_published: string;
  threshold_type: ThresholdType;
  pricing: Pricing[];
  threshold_value: number;
  num_tickets: number;
  reading_time: number | null;
  poster: {
    posterUrl: string;
    label: string;
    description?: string;
  };
}

export interface IArticleSession {
  id: string;
  rating: number;
  session_token: string;
  user_id: string | null;
  data: {
    is_site_member: boolean;
    has_purchased: boolean;
    pricing: {
      pricing_id: string;
      threshold_value: number;
      num_tickets: number;
    };
  };
}

export type SiteSession = string; // is JWT

export interface IArticleReport {
  numRatings: number;
  numVisits: number;
  score: number;
}

export interface IArticleFlags {
  isPromoMode: true;
  previewMode: true;
}

// used by current article
export type WallStore = {
  // user: IUser
  article?: IArticle;
  report?: IArticleReport;
  articleSession?: IArticleSession;
  siteSession?: string | null;
  balance?: number;
  flags?: IArticleFlags;
  tmpData?: {
    articleSessionId?: string;
  };
};

export type ApiOpts = {
  apiBaseUrl: string;
  siteSession: string | null;
};
