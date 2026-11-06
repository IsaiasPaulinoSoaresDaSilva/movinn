import { create } from "zustand";
import type { ChairConfig } from "./catalog";
import { INITIAL_CONFIG } from "./config";

type ConfigUpdater = ChairConfig | ((current: ChairConfig) => ChairConfig);

type ConfigStore = {
  config: ChairConfig;
  setConfig: (updater: ConfigUpdater) => void;
  resetConfig: () => void;
};

export const useConfigStore = create<ConfigStore>((set) => ({
  config: INITIAL_CONFIG,
  setConfig: (updater) => set((state) => ({ config: typeof updater === "function" ? updater(state.config) : updater })),
  resetConfig: () => set({ config: INITIAL_CONFIG }),
}));
