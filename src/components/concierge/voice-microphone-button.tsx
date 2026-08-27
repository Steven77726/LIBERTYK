"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

export type MicState = "idle" | "listening" | "transcribing" | "searching" | "answering" | "error";

type VoiceMicrophoneButtonProps = {
  state?: MicState;
  onStateChange?: (state: MicState) => void;
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (interim: string) => void;
  onError?: (errorMessage: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
};

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface IWindow extends Window {
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
}

export function VoiceMicrophoneButton({
  state = "idle",
  onStateChange,
  onTranscript,
  onInterimTranscript,
  onError,
  className = "",
  size = "md",
}: VoiceMicrophoneButtonProps) {
  const [internalState, setInternalState] = useState<MicState>(state);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const bestTranscriptRef = useRef<string>("");
  const dispatchedRef = useRef<boolean>(false);

  const currentState = onStateChange ? state : internalState;
  const updateState = useCallback((next: MicState) => {
    if (onStateChange) onStateChange(next);
    else setInternalState(next);
  }, [onStateChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as IWindow;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechClass) {
      setIsSupported(false);
    }
  }, []);

  const dispatchFinalTranscript = useCallback((text: string) => {
    if (dispatchedRef.current) return;
    const clean = text.trim();
    if (!clean) {
      updateState("idle");
      return;
    }
    dispatchedRef.current = true;
    updateState("searching");
    onTranscript(clean);
  }, [onTranscript, updateState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    // Si l'utilisateur arrête manuellement le micro, envoyer le résultat accumulé
    if (!dispatchedRef.current && bestTranscriptRef.current.trim()) {
      dispatchFinalTranscript(bestTranscriptRef.current);
    } else if (!dispatchedRef.current) {
      updateState("idle");
    }
  }, [dispatchFinalTranscript, updateState]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as IWindow;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      setIsSupported(false);
      onError?.("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      bestTranscriptRef.current = "";
      dispatchedRef.current = false;

      const recognition = new SpeechClass();
      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setPermissionError(false);
        bestTranscriptRef.current = "";
        dispatchedRef.current = false;
        updateState("listening");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let fullAccumulated = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res.length > 0) {
            let bestAlt = res[0].transcript;
            let highestConfidence = res[0].confidence ?? 0;
            for (let a = 1; a < res.length; a++) {
              const alt = res[a];
              if (alt && (alt.confidence ?? 0) > highestConfidence && alt.transcript) {
                bestAlt = alt.transcript;
                highestConfidence = alt.confidence ?? 0;
              }
            }
            fullAccumulated += (fullAccumulated ? " " : "") + bestAlt;
          }
        }

        const trimmed = fullAccumulated.trim();
        if (trimmed) {
          bestTranscriptRef.current = trimmed;
          // Feedback visuel en temps réel sans déclencher de recherche
          onInterimTranscript?.(trimmed);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setPermissionError(true);
          onError?.("Accès micro refusé. Veuillez autoriser le microphone dans votre navigateur.");
        } else if (event.error !== "no-speech") {
          onError?.("Une erreur vocale est survenue.");
        }
        updateState("error");
        setTimeout(() => updateState("idle"), 2000);
      };

      recognition.onend = () => {
        // UNE SEULE RECHERCHE déclenchée à la fin de la phrase
        if (!dispatchedRef.current && bestTranscriptRef.current.trim()) {
          dispatchFinalTranscript(bestTranscriptRef.current);
        } else if (!dispatchedRef.current) {
          updateState("idle");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      updateState("error");
      setTimeout(() => updateState("idle"), 2000);
    }
  }, [dispatchFinalTranscript, onError, onInterimTranscript, updateState]);

  const toggleMic = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentState === "listening") {
      stopListening();
    } else {
      startListening();
    }
  };

  const sizeClasses = {
    sm: "size-10",
    md: "size-12 sm:size-13",
    lg: "size-14 sm:size-16",
  }[size];

  const iconSizes = {
    sm: 16,
    md: 19,
    lg: 23,
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Halo lumineux Liberty K exclusif multi-états */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -inset-1.5 rounded-full transition-all duration-700 sm:-inset-2 ${
          currentState === "listening"
            ? "liberty-halo-listening opacity-100 scale-110 blur-md"
            : currentState === "searching" || currentState === "transcribing"
            ? "liberty-halo-searching opacity-95 scale-105 blur-md"
            : currentState === "error"
            ? "bg-amber-500/40 opacity-80 blur-sm"
            : "liberty-halo-idle opacity-75 group-hover:opacity-100 blur-sm sm:blur-md"
        }`}
      />

      {/* Bouton Microphone */}
      <button
        type="button"
        onClick={toggleMic}
        aria-label={
          currentState === "listening"
            ? "Arrêter l'écoute"
            : "Activer le microphone pour parler à Liberty"
        }
        title={
          !isSupported
            ? "Microphone non disponible sur ce navigateur"
            : currentState === "listening"
            ? "Je vous écoute… (cliquez pour arrêter)"
            : "Parler à Liberty K"
        }
        className={`relative z-10 grid ${sizeClasses} place-items-center rounded-full border transition-all duration-300 cursor-pointer ${
          currentState === "listening"
            ? "bg-gradient-to-tr from-[#1d3557] via-[#457b9d] to-[#e63946] border-white/80 text-white shadow-[0_0_24px_rgba(69,123,157,0.7)] scale-105"
            : currentState === "searching" || currentState === "transcribing"
            ? "bg-gradient-to-tr from-[#101a15] via-[#284636] to-[#d5bb7d] border-[#d5bb7d]/60 text-white shadow-[0_0_20px_rgba(213,187,125,0.4)]"
            : currentState === "error"
            ? "bg-stone-900 border-amber-500/60 text-amber-300"
            : "bg-gradient-to-br from-[#0c1410] via-[#16271e] to-[#0d1611] border-white/25 text-white/95 hover:border-white/55 hover:scale-105 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        }`}
      >
        {permissionError ? (
          <AlertCircle size={iconSizes} className="text-amber-400" />
        ) : !isSupported ? (
          <MicOff size={iconSizes} className="text-white/40" />
        ) : (
          <Mic
            size={iconSizes}
            className={`transition-transform duration-300 ${
              currentState === "listening" ? "animate-pulse scale-110 text-white" : "text-white"
            }`}
          />
        )}
      </button>
    </div>
  );
}
