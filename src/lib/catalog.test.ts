import { describe, expect, it } from "vitest";
import { evaluateCompatibility, FOOTREST_CATALOG, getBillOfMaterials, type ChairConfig } from "./catalog";

const baseConfig: ChairConfig = {
  frameColor: "#0B1F3B",
  upholsteryColor: "#202628",
  seatWidth: 42,
  seatDepth: 43,
  seatHeight: 49,
  wheelSize: 24,
  wheelStyle: "spoke",
  footrest: "single",
  pushHandles: true,
  frameType: "rigid",
  backrestHeight: 42,
  seatAngle: 3,
  camber: 2,
  casterSize: 5,
  armrest: "none",
  antiTip: true,
  cushion: "standard",
  seatBaseThickness: 5,
  seatFrontRise: 2,
  seatLateralSupport: 1,
  seatPommelHeight: 0,
  frameTubeDiameter: 28.6,
  frameWallThickness: 2,
  rearAxlePosition: -5,
  casterTrail: 4.5,
  backrestRecline: 8,
  backrestLumbarSupport: 2,
  backrestWingDepth: 3,
  axlePlateThickness: 6,
  axlePlateTravel: 5,
  footrestHeight: 14,
  footrestAngle: 5,
  footrestExtension: 4,
  susReferenceProfile: "custom",
  designCapacityKg: 100,
  printAssemblyMode: "integrated",
  printConnectorDiameter: 8,
  printClearance: 0.35,
};

describe("catálogo MOVINN", () => {
  it("aceita a configuração demonstrativa base", () => {
    expect(evaluateCompatibility(baseConfig).status).toBe("compatible");
  });

  it("indica quando uma plataforma única não atende à largura", () => {
    const result = evaluateCompatibility({ ...baseConfig, seatWidth: FOOTREST_CATALOG.single.maxSeatWidth + 1 });
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "seat-width-footrest", level: "error" })]));
  });

  it("marca o kit impresso como protótipo, sem qualificá-lo para carga", () => {
    const result = evaluateCompatibility({ ...baseConfig, printAssemblyMode: "kit" });
    expect(result.status).toBe("review");
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "print-kit-prototype", level: "warning" })]));
  });

  it("inclui o kit de conectores no manifesto técnico", () => {
    const bill = getBillOfMaterials({ ...baseConfig, printAssemblyMode: "kit", printConnectorDiameter: 10, printClearance: 0.25 });
    expect(bill).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PRT-KIT", specification: expect.stringContaining("Ø10 mm") })]));
  });
});
