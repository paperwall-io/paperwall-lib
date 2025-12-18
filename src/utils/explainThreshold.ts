import type { IArticle } from "../types";

export const explainWhyFree = (article: IArticle) => {
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

export const explainPastThreshold = (article: IArticle) => {
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
