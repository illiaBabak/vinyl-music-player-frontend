import { Bar } from "src/components/Bar";
import { Player } from "src/components/Player";
import { Vinyl } from "src/components/Vinyl";
import { useGetTracks } from "src/api/queries";
import { Loader } from "src/components/Loader";
import { useState } from "react";
import { Track } from "src/types";

export const App = () => {
  const { isLoading } = useGetTracks();

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <main className="flex flex-1 px-2 py-2 overflow-hidden relative">
        <Bar setSelectedTrack={setSelectedTrack} />
        <Vinyl selectedTrack={selectedTrack} />

        {isLoading && <Loader />}
      </main>
      <Player
        setSelectedTrack={setSelectedTrack}
        selectedTrack={selectedTrack}
      />
    </div>
  );
};
