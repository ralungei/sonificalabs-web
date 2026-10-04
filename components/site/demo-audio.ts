"use client";
import { useSyncExternalStore } from "react";

/**
 * One audio element for every demo on the page: starting a bubble stops the
 * one that was playing, and every bubble can read the shared progress to draw
 * its ring.
 */
interface DemoAudioState {
  playingId: string | null;
  /** 0-100 for the demo that is playing. */
  progress: number;
}

let state: DemoAudioState = { playingId: null, progress: 0 };
let audio: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

function set(next: DemoAudioState) {
  state = next;
  listeners.forEach((l) => l());
}

export function stopDemo() {
  if (audio) {
    audio.pause();
    audio = null;
  }
  if (state.playingId) set({ playingId: null, progress: 0 });
}

export function toggleDemo(id: string, src: string) {
  if (state.playingId === id) {
    stopDemo();
    return;
  }
  stopDemo();
  const a = new Audio(src);
  audio = a;
  a.ontimeupdate = () => {
    if (audio === a && a.duration) set({ playingId: id, progress: (a.currentTime / a.duration) * 100 });
  };
  a.onended = () => {
    if (audio === a) stopDemo();
  };
  a.play().catch(() => {
    if (audio === a) stopDemo();
  });
  set({ playingId: id, progress: 0 });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER_STATE: DemoAudioState = { playingId: null, progress: 0 };

export function useDemoAudio(): DemoAudioState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
