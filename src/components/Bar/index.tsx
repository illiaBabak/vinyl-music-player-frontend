import { useGetTracks } from "src/api/queries";
import { Accordion } from "../Accordion";
import { Track } from "src/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { calcAudioDuration } from "src/utils/calcAudioDuration";

type Props = {
  setSelectedTrack: Dispatch<SetStateAction<Track | null>>;
};

export const Bar = ({ setSelectedTrack }: Props) => {
  const { data: tracks } = useGetTracks();

  const [durations, setDurations] = useState<
    { duration: string; audioPath: string }[]
  >([]);

  useEffect(() => {
    if (!tracks) return;

    tracks.forEach(async (track) => {
      const duration = await calcAudioDuration(track.audioPath);

      const formattedDuration = `${Math.floor(duration / 60)}:${Math.floor(
        duration % 60
      )}`;

      setDurations((prev) => [
        ...prev,
        { duration: formattedDuration, audioPath: track.audioPath },
      ]);
    });
  }, [tracks]);

  const genres = [...new Set(tracks?.map((track) => track.genre) || [])];

  return (
    <div className="flex flex-col gap-3 bg-white/40 h-full overflow-y-auto w-[30%]">
      {genres.map((genre) => (
        <Accordion key={genre} title={genre}>
          <div className="flex flex-col gap-2">
            {tracks
              ?.filter((track) => track.genre === genre)
              .map((track) => (
                <div
                  onClick={() => setSelectedTrack(track)}
                  key={`${track.artist}-${track.name}-${track._id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-white/50 px-3 py-2 transition hover:bg-amber-50/80 hover:border-amber-100"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-200 to-orange-200">
                    {track.previewPath ? (
                      <img src={track.previewPath} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-amber-600">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {track.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {track.artist}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400 tabular-nums">
                    {durations?.find(
                      (duration) => duration.audioPath === track.audioPath
                    )?.duration || "0:00"}
                  </span>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-amber-400/90 text-white shadow-sm transition hover:bg-amber-500 hover:shadow"
                    aria-label="Play"
                  >
                    <svg
                      className="h-4 w-4 translate-x-[1px]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        </Accordion>
      ))}
    </div>
  );
};
