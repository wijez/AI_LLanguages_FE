import { createSelector } from "@reduxjs/toolkit";

const selectLearn = (s) => s.learn;
export const selectAbbr = createSelector(selectLearn, (l) => l.abbr);
export const selectStatus = createSelector(selectLearn, (l) => l.status);
export const selectOffline = createSelector(selectLearn, (l) => l.offline);
export const selectError = createSelector(selectLearn, (l) => l.error);

export const selectTopics = createSelector(
  [selectLearn, selectAbbr],
  (l, abbr) => {
    const pack = l.topicsByAbbr[abbr];
    return pack?.items || [];
  }
);
export const selectTopicCount = createSelector(
  selectTopics,
  (items) => items.length
);
export const makeSelectTopicByIndex = () =>
  createSelector(
    [selectTopics, (_, idx) => idx],
    (items, idx) => items[idx] || null
  );
