import { TIMEFRAMES } from './constants.js';

export const getTimeframeConfig = (id) => TIMEFRAMES.find((tf) => tf.id === id);

export const timeframeDurationSeconds = (id) => getTimeframeConfig(id)?.durationSeconds;

export const isSyntheticTimeframe = (id) => Boolean(getTimeframeConfig(id)?.synthetic);

export const baseIntervalFor = (id) => getTimeframeConfig(id)?.baseInterval;

export const computeAggregationFactor = (targetId, sourceId) => {
  const targetDuration = timeframeDurationSeconds(targetId);
  const sourceDuration = timeframeDurationSeconds(sourceId);
  if (!targetDuration || !sourceDuration) return null;
  return Math.max(1, Math.round(targetDuration / sourceDuration));
};
