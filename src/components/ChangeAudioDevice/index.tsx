import { useEffect, useState } from "react";

const getDeviceIcon = (label: string) => {
  const lower = label.toLowerCase();

  if (lower.includes("airpods") || lower.includes("headphone")) {
    return (
      <svg
        className="h-4 w-4 text-amber-500"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 3C7.59 3 4 6.59 4 11v2c0 1.1.9 2 2 2h1v-5H5c.22-3.06 2.76-5.5 6-5.5s5.78 2.44 6 5.5h-2v5h1c1.1 0 2-.9 2-2v-2c0-4.41-3.59-8-8-8zM7 14v3c0 1.1.9 2 2 2h1v-7H9c-1.1 0-2 .9-2 2zm9-2h-1v7h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2z" />
      </svg>
    );
  }

  if (lower.includes("speaker") || lower.includes("monitor")) {
    return (
      <svg
        className="h-4 w-4 text-amber-500"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 3.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM12 19c-2.21 0-4-1.79-4-4h2a2 2 0 0 0 4 0h2c0 2.21-1.79 4-4 4z" />
      </svg>
    );
  }

  return (
    <svg
      className="h-4 w-4 text-amber-500"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v9H4V6zm-2 11h20v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1z" />
    </svg>
  );
};

type Props = {
  audio: HTMLAudioElement;
};

export const ChangeAudioDevice = ({ audio }: Props) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(
          (device) => device.kind === "audiooutput"
        );

        setAudioDevices(outputs);

        setSelectedDevice(outputs[0]);
      } catch {
        setAudioDevices([]);
      }
    };

    loadDevices();
  }, []);

  const hasDevices = audioDevices.length > 0;

  const handleSelectDevice = (device: MediaDeviceInfo) => {
    audio.setSinkId(device.deviceId);
    setSelectedDevice(device);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hasDevices && setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ring-1 transition ${
          hasDevices
            ? "cursor-pointer bg-white/80 text-slate-700 ring-amber-100 hover:bg-amber-50 hover:ring-amber-200"
            : "cursor-default bg-zinc-100 text-zinc-400 ring-zinc-100"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50">
          {selectedDevice
            ? getDeviceIcon(selectedDevice.label || "Device")
            : getDeviceIcon("Default")}
        </span>
        <div className="hidden text-left sm:block">
          <p className="max-w-[140px] truncate text-[11px] font-semibold text-slate-900">
            {selectedDevice
              ? selectedDevice.label || "Audio device"
              : "No audio devices"}
          </p>
          <p className="max-w-[140px] truncate text-[10px] text-slate-500">
            {hasDevices ? "Audio device selection" : "Audio devices not found"}
          </p>
        </div>
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && hasDevices && (
        <div className="absolute left-0 bottom-full z-20 w-60 rounded-2xl border border-amber-100 bg-white/95 p-2 text-xs shadow-lg backdrop-blur-md">
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-500">
            Audio devices
          </p>

          <div className="max-h-64 space-y-1.5 overflow-auto pr-1">
            {audioDevices.map((device) => {
              const isActive = device.deviceId === selectedDevice?.deviceId;

              return (
                <button
                  key={device.deviceId || device.label}
                  type="button"
                  onClick={() => handleSelectDevice(device)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition ${
                    isActive
                      ? "bg-amber-50 text-slate-900 ring-1 ring-amber-200"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50">
                    {getDeviceIcon(device.label || "Device")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold">
                      {device.label || "Unknown device"}
                    </p>
                  </div>
                  {isActive && (
                    <svg
                      className="h-3.5 w-3.5 flex-shrink-0 text-amber-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.333a1 1 0 0 1-1.44-.006L3.29 9.29A1 1 0 0 1 4.704 7.88l3.01 3.02 6.54-6.56a1 1 0 0 1 1.45-.05z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
