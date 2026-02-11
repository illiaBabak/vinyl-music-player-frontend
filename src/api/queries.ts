import { API_URL } from "src/utils/constants";
import { isTracksResponse } from "src/utils/guards";
import { Track } from "src/types";
import { GET_TRACKS_QUERY } from "./constants";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

const SIGNED_URL_TIMEOUT = 3600;

const getTracks = async (): Promise<Track[]> => {
  const response = await fetch(`${API_URL}/tracks`);

  if (!response.ok) {
    throw new Error("Failed to fetch tracks");
  }

  const data = await response.json();

  return isTracksResponse(data) ? data.data : [];
};

export const useGetTracks = (): UseQueryResult<Track[], Error> =>
  useQuery({
    queryKey: [GET_TRACKS_QUERY],
    queryFn: getTracks,
    staleTime: SIGNED_URL_TIMEOUT,
  });
