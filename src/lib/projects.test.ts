import { describe, expect, it } from "vitest";
import { INITIAL_CONFIG } from "./config";
import { createMovinnProject, updateProject } from "./projects";

describe("biblioteca de projetos", () => {
  it("inicia cada projeto com um evento de histórico", () => {
    const project = createMovinnProject("Teste", INITIAL_CONFIG);
    expect(project.history).toHaveLength(1);
    expect(project.history[0].summary).toBe("Projeto criado");
  });

  it("registra uma alteração sem mutar a configuração anterior", () => {
    const project = createMovinnProject("Teste", INITIAL_CONFIG);
    const updated = updateProject(project, { ...INITIAL_CONFIG, seatWidth: 45 });
    expect(project.config.seatWidth).toBe(42);
    expect(updated.config.seatWidth).toBe(45);
    expect(updated.history.at(-1)?.summary).toBe("1 parâmetro atualizado");
  });
});
