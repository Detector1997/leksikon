/**
 * Pronunciation through the device's own speech engine (Web Speech API).
 *
 * iPhone quirks this module works around:
 * - Speech must start inside the tap that asked for it, so speak() runs synchronously.
 * - An utterance queued right after cancel() is often dropped by WebKit, so we only
 *   cancel when something is actually speaking, and then speak on the next tick.
 * - Safari can stay silent with no voice set, or with a voice that is listed but unusable,
 *   so we set a plain local English voice explicitly.
 * - The ring/silent switch can mute web speech. We ask Safari for a "playback" audio session
 *   (ignores the switch where supported) and, if speech still never starts, tell the user why.
 */

let voice: SpeechSynthesisVoice | null = null;
let unlocked = false;
const listeners = new Set<(msg: string) => void>();

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null;
  const en = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  const local = en.filter((v) => v.localService);
  const pool = local.length ? local : en;
  const byLang = (lang: string) => pool.filter((v) => v.lang.replace("_", "-").toLowerCase() === lang);
  // Prefer the system default for the language, then well-known built-in voices, then anything English.
  for (const lang of ["en-gb", "en-us"]) {
    const list = byLang(lang);
    const pick = list.find((v) => v.default) ?? list.find((v) => /daniel|samantha|karen|arthur|martha/i.test(v.name)) ?? list[0];
    if (pick) return pick;
  }
  return pool[0] ?? null;
}

if (canSpeak()) {
  voice = pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    voice = pickVoice();
  });
}

/** Ask iOS to treat this page's sound as media playback, which is not silenced by the ring switch. */
function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* not supported: fine */
  }
}

/** Subscribe to user-facing hints about sound (e.g. «выключи беззвучный режим»). */
export function onSpeechHint(fn: (msg: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function hint(msg: string) {
  for (const l of listeners) l(msg);
}

let failures = 0;

/** `fromTap: false` for automatic speech, which iOS may block; then silence is not reported. */
export function speak(text: string, { rate = 0.9, fromTap = true } = {}): void {
  if (!canSpeak()) {
    if (fromTap) hint("Этот браузер не умеет озвучивать слова. Открой Лексикон в Safari.");
    return;
  }
  unlockAudio();
  if (!voice) voice = pickVoice();

  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.rate = rate;
  u.volume = 1;

  let started = false;
  u.onstart = () => {
    started = true;
    failures = 0;
  };
  u.onerror = (e) => {
    if (e.error === "interrupted" || e.error === "canceled") return;
    started = true;
    if (fromTap) report();
  };

  // Everything stays synchronous: iOS only lets speech start inside the tap itself.
  const busy = speechSynthesis.speaking || speechSynthesis.pending;
  if (busy) speechSynthesis.cancel();
  // A stuck queue (common after the app was in the background) blocks every later utterance.
  if (speechSynthesis.paused) speechSynthesis.resume();
  speechSynthesis.speak(u);

  // WebKit does not reliably fire events for an utterance queued right after cancel(),
  // so only judge silence when the queue was idle.
  if (!busy && fromTap) {
    setTimeout(() => {
      if (!started) report();
    }, 1800);
  }
}

function report() {
  failures++;
  hint(
    failures === 1
      ? "Не слышно? Проверь, что на iPhone выключен беззвучный режим (переключатель или кнопка сбоку) и прибавлена громкость."
      : "Озвучка не запускается. Выключи беззвучный режим, прибавь громкость и попробуй открыть Лексикон в Safari.",
  );
}
