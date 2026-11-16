let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  return (
    voices.find((v) => v.lang === "en-GB" && /premium|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US" && /premium|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang === "en-US") ??
    voices[0] ??
    null
  );
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  voice = pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    voice = pickVoice();
  });
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, rate = 0.92): void {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-GB";
  u.rate = rate;
  speechSynthesis.speak(u);
}
