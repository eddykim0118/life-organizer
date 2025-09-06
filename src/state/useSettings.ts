import { create } from "zustand";

interface SettingsState {
  workingHoursStart: string; // HH:mm
  workingHoursEnd: string; // HH:mm
  defaultDurationMinutes: number;
  bufferPercent: number;
  timezone: string;
  weeklyBudget: number;
  featureServerStub: boolean;
  set: (patch: Partial<SettingsState>) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  workingHoursStart: "07:00",
  workingHoursEnd: "22:00",
  defaultDurationMinutes: 30,
  bufferPercent: 15,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  weeklyBudget: 300,
  featureServerStub: false,
  set: (patch) => set(patch),
}));


