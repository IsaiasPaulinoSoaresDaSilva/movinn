import { describe, expect, it } from "vitest";
import { INITIAL_CONFIG } from "./config";
import { useConfigStore } from "./config-store";

describe("store de configuração", () => {
  it("atualiza e restaura a configuração centralizada", () => {
    useConfigStore.getState().resetConfig();
    useConfigStore.getState().setConfig((current) => ({ ...current, seatDepth: 48 }));
    expect(useConfigStore.getState().config.seatDepth).toBe(48);
    useConfigStore.getState().resetConfig();
    expect(useConfigStore.getState().config).toEqual(INITIAL_CONFIG);
  });
});
