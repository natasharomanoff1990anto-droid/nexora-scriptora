import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  defaultState,
  feed as feedFn,
  drink as drinkFn,
  sleep as sleepFn,
  play as playFn,
  tick,
  type MollyState,
  type MollyVisual,
} from "./mollyEngine";
import { decideBehavior, pickFlowLine } from "./mollyBehavior";
import { loadState, saveState } from "./mollyStorage";
import { askMolly, type ChatTurn } from "./mollyAI";

export interface MollyMessage {
  id: string;
  role: "molly" | "user";
  text: string;
  ts: number;
}

interface MollyContextValue {
  state: MollyState;
  messages: MollyMessage[];
  isThinking: boolean;
  feed: () => void;
  drink: () => void;
  sleep: () => void;
  play: () => void;
  sendUserMessage: (text: string) => Promise<void>;
  notifyUserWroteText: (text: string) => void;
  clearMessages: () => void;
}

const MollyContext = createContext<MollyContextValue | null>(null);
const MAX_MESSAGES = 30;
const TICK_MS = 30000;
const FLOW_MIN_LEN = 200;
const FLOW_COOLDOWN_MS = 60000;
const ACTION_VISUAL_MS = 4500;

export function MollyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MollyState>(() => loadState() ?? defaultState());
  const [messages, setMessages] = useState<MollyMessage[]>([]);
  const [isThinking, setThinking] = useState(false);

  const lastSpokeAtRef = useRef(0);
  const lastFlowAtRef = useRef(0);
  const actionVisualUntilRef = useRef(0);

  useEffect(() => { saveState(state); }, [state]);

  const pushMolly = useCallback((text: string) => {
    lastSpokeAtRef.current = Date.now();
    setMessages(prev => [
      ...prev,
      { id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role: "molly" as const, text, ts: Date.now() },
    ].slice(-MAX_MESSAGES));
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user" as const, text, ts: Date.now() },
    ].slice(-MAX_MESSAGES));
  }, []);

  // Tick loop — decay + behavior decision
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setState(prev => {
        const decayed = tick(prev, now);
        if (now < actionVisualUntilRef.current) return decayed; // hold action visual briefly
        const decision = decideBehavior(decayed, lastSpokeAtRef.current, now);
        if (decision.message) pushMolly(decision.message);
        return { ...decayed, visual: decision.visual };
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [pushMolly]);

  const lockVisualFor = (ms: number) => {
    actionVisualUntilRef.current = Date.now() + ms;
  };

  const feed = useCallback(() => {
    setState(prev => feedFn(prev));
    lockVisualFor(ACTION_VISUAL_MS);
    pushMolly("Mmm. Thank you.");
  }, [pushMolly]);

  const drink = useCallback(() => {
    setState(prev => drinkFn(prev));
    lockVisualFor(3500);
    pushMolly("Better.");
  }, [pushMolly]);

  const sleep = useCallback(() => {
    setState(prev => sleepFn(prev));
    lockVisualFor(7000);
    pushMolly("Just a quick nap…");
  }, [pushMolly]);

  const play = useCallback(() => {
    setState(prev => playFn(prev));
    lockVisualFor(ACTION_VISUAL_MS);
    pushMolly("Yes! Again!");
  }, [pushMolly]);

  const sendUserMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushUser(trimmed);
    setThinking(true);
    const history: ChatTurn[] = messages.slice(-6).map(m => ({
      role: m.role === "molly" ? "assistant" : "user",
      content: m.text,
    }));
    try {
      const reply = await askMolly(trimmed, history, state.mood, state.bond);
      pushMolly(reply);
      setState(prev => ({ ...prev, bond: Math.min(100, prev.bond + 1) }));
    } finally {
      setThinking(false);
    }
  }, [messages, state.mood, state.bond, pushMolly, pushUser]);

  const notifyUserWroteText = useCallback((text: string) => {
    if (!text || text.length < FLOW_MIN_LEN) return;
    const now = Date.now();
    if (now - lastFlowAtRef.current < FLOW_COOLDOWN_MS) return;
    if (Math.random() < 0.35) {
      lastFlowAtRef.current = now;
      pushMolly(pickFlowLine());
    }
  }, [pushMolly]);

  const clearMessages = useCallback(() => setMessages([]), []);

  const value = useMemo<MollyContextValue>(() => ({
    state, messages, isThinking,
    feed, drink, sleep, play,
    sendUserMessage, notifyUserWroteText, clearMessages,
  }), [state, messages, isThinking, feed, drink, sleep, play, sendUserMessage, notifyUserWroteText, clearMessages]);

  return <MollyContext.Provider value={value}>{children}</MollyContext.Provider>;
}

export function useMolly(): MollyContextValue {
  const ctx = useContext(MollyContext);
  if (!ctx) throw new Error("useMolly must be used inside MollyProvider");
  return ctx;
}

export type { MollyState, MollyVisual };
