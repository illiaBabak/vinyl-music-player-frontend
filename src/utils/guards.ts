import { isObject } from "motion";
import { Track, TrackResponse } from "src/types";

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isNumber = (value: unknown): value is number =>
  typeof value === "number";

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

export const isTrack = (value: unknown): value is Track =>
  typeof value === "object" &&
  value !== null &&
  "name" in value &&
  "artist" in value &&
  "genre" in value &&
  "audioPath" in value &&
  "previewPath" in value &&
  isString(value.name) &&
  isString(value.artist) &&
  isString(value.genre) &&
  isString(value.audioPath) &&
  isString(value.previewPath);

export const isTracksResponse = (value: unknown): value is TrackResponse =>
  isObject(value) &&
  "data" in value &&
  Array.isArray(value.data) &&
  value.data.every(isTrack);
