export type Track = {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  audioPath: string;
  previewPath: string;
};

export type TrackResponse = {
  data: Track[];
  error: string;
};
