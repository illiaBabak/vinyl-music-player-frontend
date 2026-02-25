import { Bar } from "src/components/Bar";
import { Player } from "src/components/Player";
import { Vinyl } from "src/components/Vinyl";
import { useGetTracks } from "src/api/queries";
import { Loader } from "src/components/Loader";
import { useState, useMemo } from "react";
import { Track } from "src/types";

export const App = () => {
  const { isLoading, data: tracks } = useGetTracks();

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [shouldPlaying, setShouldPlaying] = useState(true);

  const playlists = useMemo(() => {
    if (!tracks) return {};

    return tracks.reduce((acc, track) => {
      (acc[track.genre] ??= []).push(track);
      return acc;
    }, {} as Record<string, Track[]>);
  }, [tracks]);

  const orderedTracks = useMemo(
    () => Object.values(playlists).flat(),
    [playlists]
  );

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <main className="flex flex-1 px-2 py-2 overflow-hidden relative">
        <Bar
          playlists={playlists}
          setSelectedTrack={setSelectedTrack}
          shouldPlaying={shouldPlaying}
        />
        <Vinyl
          selectedTrack={selectedTrack}
          setShouldPlaying={setShouldPlaying}
        />

        {isLoading && <Loader />}
      </main>
      <Player
        setSelectedTrack={setSelectedTrack}
        selectedTrack={selectedTrack}
        shouldPlaying={shouldPlaying}
        tracks={orderedTracks}
      />
    </div>
  );
};
