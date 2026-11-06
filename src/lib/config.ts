import type { ChairConfig } from "./catalog";

export const INITIAL_CONFIG: ChairConfig = {
  frameColor: "#0B1F3B", upholsteryColor: "#202628", seatWidth: 42, seatDepth: 43, seatHeight: 49,
  wheelSize: 24, wheelStyle: "spoke", footrest: "single", pushHandles: true, frameType: "rigid",
  backrestHeight: 42, seatAngle: 3, camber: 2, casterSize: 5, armrest: "none", antiTip: true,
  cushion: "standard", seatBaseThickness: 5, seatFrontRise: 2, seatLateralSupport: 1, seatPommelHeight: 0,
  frameTubeDiameter: 28.6, frameWallThickness: 2, rearAxlePosition: -5, casterTrail: 4.5,
  backrestRecline: 8, backrestLumbarSupport: 2, backrestWingDepth: 3, axlePlateThickness: 6,
  axlePlateTravel: 5, footrestHeight: 14, footrestAngle: 5, footrestExtension: 4,
  susReferenceProfile: "custom", designCapacityKg: 100, printAssemblyMode: "integrated",
  printConnectorDiameter: 8, printClearance: 0.35,
};
