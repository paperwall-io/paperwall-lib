export interface WallConfig {
  mode: "live" | "sandbox" | "local";
  siteToken: string;
  articleFinder?: {
    selector: string;
    /** Paths that are articles. A page matching none of these is never walled. */
    postUrls: string[];
    /**
     * Paths that are never articles, applied after `postUrls` matches.
     *
     * Exists because some platforms give you no prefix to anchor on. Ghost
     * serves posts at the root as `/:slug/`, so the only include pattern that
     * catches every post also catches `/about/` and `/contact/` — and the
     * alternative, folding the exceptions into the include pattern as a
     * negative lookahead, produces something a publisher cannot safely edit
     * when they add a page.
     *
     * Optional, and omitting it excludes nothing.
     */
    excludeUrls?: string[];
  };
  theme?: {
    siteName?: string;
    siteLogo?: string;
  };
  siteName?: string;
  siteLogo?: string;
  portalUrl?: string;
  apiBaseUrl?: string;
}

export type WallState =
  | "@paperwall/loading"
  | "@paperwall/app_pending"
  | "@paperwall/authenticating"
  | "@paperwall/session_pending"
  | "@paperwall/no_wall"
  | "@paperwall/show_wall"
  | "@paperwall/show_article";

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
  site: {
    title: string;
    logo: string;
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

export interface CurrencyConfig {
  readonly code: string;
  readonly symbol: string;
  readonly locale: string;
  readonly ticketPrice: number;
}

export interface PlatformSettings {
  readonly pricingMode: "tickets" | "dollars" | "mixed";
  readonly currencies: Readonly<Record<string, CurrencyConfig>>;
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
  currency?: string;
  platform?: PlatformSettings;
  tmpData?: {
    articleSessionId?: string;
  };
};

export type ApiOpts = {
  apiBaseUrl: string;
  siteSession: string | null;
};
