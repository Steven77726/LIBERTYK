import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Waves } from 'lucide-react';

export const AudioAmbience = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startAmbience = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Create gentle river water pink noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter for soft water lap
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();

      // Soft harmonic bell every few seconds for lounge vibe
      const playChime = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        const freqs = [329.63, 392.00, 493.88, 587.33, 659.25]; // E, G, B, D, E pentatonic lounge
        const note = freqs[Math.floor(Math.random() * freqs.length)];
        osc.frequency.setValueAtTime(note, ctx.currentTime);
        
        noteGain.gain.setValueAtTime(0.015, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 3.6);
      };

      intervalRef.current = window.setInterval(playChime, 6000);
      setIsPlaying(true);
    } catch {
      console.warn("Audio ambience couldn't be initialized");
    }
  };

  const stopAmbience = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.suspend();
    }
    setIsPlaying(false);
  };

  const toggleAmbience = () => {
    if (isPlaying) {
      stopAmbience();
    } else {
      startAmbience();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <button
      onClick={toggleAmbience}
      className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs tracking-wider transition-all duration-300 ${
        isPlaying
          ? 'bg-gold-500/15 border-gold-500/60 text-gold-300 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
          : 'bg-obsidian-900/60 border-white/10 text-slate-400 hover:text-gold-200 hover:border-gold-500/30'
      }`}
      title={isPlaying ? "Désactiver l'ambiance sonore" : "Activer l'ambiance sonore feutrée de la Seine"}
    >
      <Waves className={`w-3.5 h-3.5 transition-transform ${isPlaying ? 'text-gold-400 animate-pulse' : 'text-slate-500'}`} />
      <span className="hidden md:inline font-sans text-[11px] uppercase">
        {isPlaying ? 'Ambiance Flottante' : 'Son Ambiant'}
      </span>
      {isPlaying ? (
        <Volume2 className="w-3.5 h-3.5 text-gold-400" />
      ) : (
        <VolumeX className="w-3.5 h-3.5 text-slate-500 group-hover:text-gold-300" />
      )}
    </button>
  );
};
