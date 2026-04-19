"use client";

import { create } from "zustand";

interface ShellState {
  selectedCategoryCode: string;
  selectedTeamName: string;
  cashBalance: number;
  currentDateIso: string;
  setSelectedCategoryCode: (value: string) => void;
  setSelectedTeamName: (value: string) => void;
  setCashBalance: (value: number) => void;
  tickDate: (nextDateIso: string) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  selectedCategoryCode: "F1",
  selectedTeamName: "Apex Quantum GP",
  cashBalance: 42_500_000,
  currentDateIso: "2026-03-08",
  setSelectedCategoryCode: (selectedCategoryCode) => set({ selectedCategoryCode }),
  setSelectedTeamName: (selectedTeamName) => set({ selectedTeamName }),
  setCashBalance: (cashBalance) => set({ cashBalance }),
  tickDate: (currentDateIso) => set({ currentDateIso }),
}));
