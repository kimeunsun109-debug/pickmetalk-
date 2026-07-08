import scenariosKo from "@/data/photoPush/scenarios.ko.json";
import type { EmotionState } from "@/types";

export interface PhotoFollowupTemplate {
  afterMinutes?: number;
  afterHours?: number;
  message: string;
}

export interface PhotoScenario {
  id: string;
  category: string;
  tags: string[];
  emotion: EmotionState;
  timeWindow: { startHour: number; endHour: number };
  weekdayAffinity: number[];
  captions: string[];
  followups: PhotoFollowupTemplate[];
}

const catalog = scenariosKo.scenarios as PhotoScenario[];

export function listPhotoScenarios(): PhotoScenario[] {
  return catalog;
}

export function getPhotoScenario(id: string): PhotoScenario | undefined {
  return catalog.find((s) => s.id === id);
}

export function scenariosForWeekday(weekday: number): PhotoScenario[] {
  return catalog.filter((s) => s.weekdayAffinity.includes(weekday));
}
