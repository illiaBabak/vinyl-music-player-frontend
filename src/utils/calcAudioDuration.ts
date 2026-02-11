export const calcAudioDuration = async (audioPath: string): Promise<number> => {
  const audio = new Audio(audioPath);

  return await new Promise((resolve) => {
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
    });
  });
};
