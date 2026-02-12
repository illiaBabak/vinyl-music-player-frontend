import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Track } from "src/types";
import { calcAudioDuration } from "src/utils/calcAudioDuration";
import { useGetTracks } from "src/api/queries";
import { Tooltip } from "../Tooltip";

type PlayerProps = {
  selectedTrack: Track | null;
  setSelectedTrack: Dispatch<SetStateAction<Track | null>>;
};

export const Player = ({ selectedTrack, setSelectedTrack }: PlayerProps) => {
  const isDisabled = !selectedTrack;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [hoverTime, setHoverTime] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState(0);

  const { data: tracks } = useGetTracks();

  const currentTrackIndex =
    tracks?.findIndex((t) => t._id === selectedTrack?._id) ?? -1;

  const isNextTrackAvailable =
    tracks && currentTrackIndex !== undefined && currentTrackIndex !== null
      ? currentTrackIndex < tracks.length - 1
      : false;

  const isPreviousTrackAvailable =
    tracks && currentTrackIndex !== undefined && currentTrackIndex !== null
      ? currentTrackIndex > 0
      : false;

  const playNextTrack = () => {
    const nextTrack =
      tracks && currentTrackIndex !== undefined && currentTrackIndex !== null
        ? tracks[currentTrackIndex + 1]
        : undefined;

    if (!isNextTrackAvailable || !nextTrack) return;

    setSelectedTrack(nextTrack);
  };

  const playPreviousTrack = () => {
    const previousTrack =
      tracks && currentTrackIndex !== undefined && currentTrackIndex !== null
        ? tracks[currentTrackIndex - 1]
        : undefined;

    if (!isPreviousTrackAvailable || !previousTrack) return;

    setSelectedTrack(previousTrack);
  };

  useEffect(() => {
    // Volume control
    if (!audioRef.current) return;

    audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    // Play/pause control
    if (!audioRef.current) return;

    if (isPlaying) audioRef.current.play();
    else {
      audioRef.current.pause();
      return;
    }

    // Update current time every 100ms
    const interval = setInterval(() => {
      setCurrentTime((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  useEffect(() => {
    // Load audio duration
    if (!selectedTrack) return;

    const loadAudio = async () => {
      setCurrentTime(0);
      setDuration(0);

      const duration = await calcAudioDuration(selectedTrack?.audioPath);

      setDuration(duration);
    };

    loadAudio();
  }, [selectedTrack, setDuration, setCurrentTime]);

  return (
    <header className="relative w-full bg-white/80 bg-gradient-to-br from-amber-50 via-white to-amber-50 backdrop-blur-xl shadow-sm">
      <Tooltip
        onClick={({ currentTarget, clientX }) => {
          if (!audioRef.current) return;

          const { width } = currentTarget.getBoundingClientRect();

          const progress = (clientX / width) * duration;

          setCurrentTime(progress);

          audioRef.current.currentTime = progress;
        }}
        onMouseMove={({ currentTarget, clientX }) => {
          const { width } = currentTarget.getBoundingClientRect();

          const progress = (clientX / width) * duration;

          setHoverTime(progress);
          setTooltipPosition(clientX);
        }}
        className={`h-[6px] bg-slate-200/80 cursor-pointer`}
        content={`${Math.floor(hoverTime / 60)}:${Math.floor(hoverTime % 60)
          .toString()
          .padStart(2, "0")}`}
        tooltipStyle={{ left: `${tooltipPosition}px` }}
      >
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 transition-[width] duration-200 ease-linear"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </Tooltip>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={playPreviousTrack}
              disabled={isDisabled || !isPreviousTrackAvailable}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-1 transition sm:h-9 sm:w-9 ${
                isDisabled || !isPreviousTrackAvailable
                  ? "cursor-default bg-zinc-100 text-zinc-300 ring-zinc-100"
                  : "cursor-pointer bg-white/80 text-amber-500 ring-amber-100 hover:bg-amber-50 hover:ring-amber-200"
              }`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 5v14l-7-7 7-7zm1 7l9 7V5l-9 7z" />
              </svg>
            </button>

            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              type="button"
              disabled={isDisabled}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition sm:h-11 sm:w-11 ${
                isDisabled
                  ? "cursor-default bg-zinc-200 text-zinc-400 shadow-none"
                  : "cursor-pointer bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 hover:shadow-lg hover:brightness-105"
              }`}
            >
              {isPlaying ? (
                // Pause icon
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                // Play icon
                <svg
                  className="h-4 w-4 translate-x-[1px] sm:h-5 sm:w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={playNextTrack}
              disabled={isDisabled || !isNextTrackAvailable}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-1 transition sm:h-9 sm:w-9 ${
                isDisabled || !isNextTrackAvailable
                  ? "cursor-default bg-zinc-100 text-zinc-300 ring-zinc-100"
                  : "cursor-pointer bg-white/80 text-amber-500 ring-amber-100 hover:bg-amber-50 hover:ring-amber-200"
              }`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M5 5l9 7-9 7V5zm10 0l9 7-9 7V5z" />
              </svg>
            </button>
          </div>

          {selectedTrack && (
            <audio
              onPlay={() => setIsPlaying(true)}
              ref={audioRef}
              className="hidden"
              autoPlay
              src={selectedTrack?.audioPath}
            />
          )}

          {selectedTrack && (
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <img
                className="h-10 w-10 rounded-2xl object-cover"
                src={selectedTrack?.previewPath}
                alt={selectedTrack?.name}
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                  {selectedTrack?.name}
                </p>
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {selectedTrack?.artist}
                </p>
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-1 transition sm:h-9 sm:w-9 cursor-pointer bg-white/80 text-amber-500 ring-amber-100 hover:bg-amber-50 hover:ring-amber-200"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                {volume === 0 ? (
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                ) : volume < 50 ? (
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                ) : (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                )}
              </svg>
            </button>

            <div className="flex w-24 items-center sm:w-32">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={({ currentTarget: { value } }) =>
                  setVolume(Number(value))
                }
                className={`h-1.5 w-full appearance-none rounded-full transition-all cursor-pointer bg-zinc-200 accent-amber-500 hover:bg-zinc-300 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-amber-500 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-amber-500 [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110`}
                style={{
                  background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${volume}%, rgb(228 228 231) ${volume}%, rgb(228 228 231) 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
