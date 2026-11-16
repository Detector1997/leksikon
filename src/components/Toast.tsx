import { useEffect, useState } from "react";
import { onSpeechHint } from "../lib/speech";

/** One quiet line at the foot of the screen, e.g. why a word was not heard. */
export function Toast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onSpeechHint((m) => {
      setMsg(m);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 7000);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div className="toast" role="status" onClick={() => setMsg(null)}>
      {msg}
    </div>
  );
}
