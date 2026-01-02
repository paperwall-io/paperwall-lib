export interface WallConfig {
  siteToken: string;
  articleFinder?: {
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

export interface PaperwallUser {
  id: string;
  balance: number;
  username: string;
}
export type Pricing = {
  num_tickets: number;
  threshold_value: number;
};

export type ThresholdType = "NONE" | "RATING" | "VISITS" | "DAYS" | "READS";

export interface Article {
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

export interface ArticleSession {
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

export interface ArticleReport {
  numRatings: number;
  numVisits: number;
  score: number;
}

export interface ArticleFlags {
  isPromoMode: true;
  previewMode: true;
}

// used by current article
export type WallStore = {
  // user: IUser
  article?: Article;
  report?: ArticleReport;
  articleSession?: ArticleSession;
  siteSession?: string | null;
  balance?: number;
  flags?: ArticleFlags;
  tmpData?: {
    articleSessionId?: string;
  };
};

export type ApiOpts = {
  apiBaseUrl: string;
  siteSession: string | null;
};
