export type WheelStyle = "spoke" | "solid" | "sport";
export type FootrestStyle = "single" | "split";
export type FrameType = "rigid" | "folding";
export type ArmrestStyle = "none" | "desk" | "full";
export type CushionType = "standard" | "pressure";
export type PrintAssemblyMode = "integrated" | "kit";
export type SusReferenceProfileId = "custom" | "sus-38" | "sus-40" | "sus-42" | "sus-45" | "sus-bariatric";

export const SUS_REFERENCE_PROFILES: Record<Exclude<SusReferenceProfileId, "custom">, {
  name: string;
  note: string;
  seatWidth: number;
  seatDepth?: number;
  backrestHeight?: number;
  designCapacityKg: 100 | 160;
}> = {
  "sus-38": { name: "SUS 38", note: "38,5 × 40 × 40 cm", seatWidth: 38.5, seatDepth: 40, backrestHeight: 40, designCapacityKg: 100 },
  "sus-40": { name: "SUS 40", note: "40,5 × 40 × 40 cm", seatWidth: 40.5, seatDepth: 40, backrestHeight: 40, designCapacityKg: 100 },
  "sus-42": { name: "SUS 42", note: "42,5 × 40 × 40 cm", seatWidth: 42.5, seatDepth: 40, backrestHeight: 40, designCapacityKg: 100 },
  "sus-45": { name: "SUS 45", note: "45,5 × 40 × 40 cm", seatWidth: 45.5, seatDepth: 40, backrestHeight: 40, designCapacityKg: 100 },
  "sus-bariatric": { name: "SUS bariátrica", note: "60 cm de assento · 160 kg", seatWidth: 60, designCapacityKg: 160 },
};

export type ChairConfig = {
  frameColor: string;
  upholsteryColor: string;
  seatWidth: number;
  seatDepth: number;
  seatHeight: number;
  wheelSize: number;
  wheelStyle: WheelStyle;
  footrest: FootrestStyle;
  pushHandles: boolean;
  frameType: FrameType;
  backrestHeight: number;
  seatAngle: number;
  camber: number;
  casterSize: number;
  armrest: ArmrestStyle;
  antiTip: boolean;
  cushion: CushionType;
  seatBaseThickness: number;
  seatFrontRise: number;
  seatLateralSupport: number;
  seatPommelHeight: number;
  frameTubeDiameter: number;
  frameWallThickness: number;
  rearAxlePosition: number;
  casterTrail: number;
  backrestRecline: number;
  backrestLumbarSupport: number;
  backrestWingDepth: number;
  axlePlateThickness: number;
  axlePlateTravel: number;
  footrestHeight: number;
  footrestAngle: number;
  footrestExtension: number;
  susReferenceProfile: SusReferenceProfileId;
  designCapacityKg: 100 | 160;
  printAssemblyMode: PrintAssemblyMode;
  printConnectorDiameter: 8 | 10;
  printClearance: 0.25 | 0.35 | 0.5;
};

export type CatalogItem = {
  code: string;
  category: "Estrutura" | "Assento" | "Rodas" | "Apoio" | "Condução";
  name: string;
  specification: string;
  weightKg: number;
  version: string;
  validationStatus: "demonstrative" | "prototype" | "validated";
};

export type CompatibilityIssue = {
  id: string;
  level: "error" | "warning";
  title: string;
  detail: string;
  section: "medidas" | "assento" | "estrutura" | "rodas";
};

export type CompatibilityResult = {
  status: "compatible" | "review" | "incompatible";
  issues: CompatibilityIssue[];
};

export const WHEEL_CATALOG: Record<WheelStyle, {
  name: string;
  code: string;
  note: string;
  sizes: number[];
  weightKg: number;
}> = {
  spoke: {
    name: "Raios clássicos",
    code: "WHL-SPK",
    note: "Leve e de fácil manutenção",
    sizes: [22, 23, 24, 25, 26],
    weightKg: 2.15,
  },
  solid: {
    name: "Disco fechado",
    code: "WHL-DSC",
    note: "Proteção e baixa manutenção",
    sizes: [22, 24],
    weightKg: 2.65,
  },
  sport: {
    name: "Seis raios sport",
    code: "WHL-SPT",
    note: "Maior rigidez lateral",
    sizes: [24, 25, 26],
    weightKg: 2.35,
  },
};

export const FOOTREST_CATALOG: Record<FootrestStyle, {
  name: string;
  code: string;
  note: string;
  maxSeatWidth: number;
  weightKg: number;
}> = {
  single: {
    name: "Plataforma única",
    code: "FTR-UNI",
    note: "Mais leve e rígida",
    maxSeatWidth: 48,
    weightKg: 0.62,
  },
  split: {
    name: "Apoios separados",
    code: "FTR-SPL",
    note: "Facilita transferências",
    maxSeatWidth: 60,
    weightKg: 0.84,
  },
};

export function evaluateCompatibility(config: ChairConfig): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];
  const wheel = WHEEL_CATALOG[config.wheelStyle];
  const footrest = FOOTREST_CATALOG[config.footrest];

  if (!wheel.sizes.includes(config.wheelSize)) {
    issues.push({
      id: "wheel-size-style",
      level: "error",
      title: "Roda indisponível neste diâmetro",
      detail: `${wheel.name} está disponível em ${wheel.sizes.map((size) => `${size}”`).join(", ")}.`,
      section: "rodas",
    });
  }

  if (config.seatWidth > footrest.maxSeatWidth) {
    issues.push({
      id: "seat-width-footrest",
      level: "error",
      title: "Apoio incompatível com a largura",
      detail: `${footrest.name} aceita assentos de até ${footrest.maxSeatWidth} cm. Selecione apoios separados.`,
      section: "estrutura",
    });
  }

  if (config.wheelSize === 26 && config.seatHeight < 45) {
    issues.push({
      id: "wheel-seat-clearance",
      level: "warning",
      title: "Verificar folga entre roda e assento",
      detail: "Rodas de 26” com assento abaixo de 45 cm exigem revisão do posicionamento do eixo.",
      section: "medidas",
    });
  }

  if (config.seatWidth >= 52) {
    issues.push({
      id: "wide-frame-review",
      level: "warning",
      title: "Revisar dimensionamento da estrutura",
      detail: "Larguras a partir de 52 cm precisam de validação estrutural antes da fabricação.",
      section: "medidas",
    });
  }

  if (config.frameType === "folding" && config.camber > 3) {
    issues.push({
      id: "folding-camber",
      level: "error",
      title: "Cambagem indisponível no chassi dobrável",
      detail: "O chassi dobrável aceita cambagem de até 3°. Reduza o ângulo ou selecione o chassi rígido.",
      section: "estrutura",
    });
  }

  if (config.casterSize === 4 && config.seatHeight > 52) {
    issues.push({
      id: "caster-height",
      level: "warning",
      title: "Revisar estabilidade dianteira",
      detail: "Rodízios de 4” com assento acima de 52 cm precisam de revisão de estabilidade.",
      section: "rodas",
    });
  }

  if (config.rearAxlePosition > 3) {
    issues.push({
      id: "rear-axle-stability",
      level: "warning",
      title: "Revisar estabilidade traseira",
      detail: "O eixo está à frente do centro do assento. Confirme o centro de gravidade com o usuário e o conjunto anti-tombo.",
      section: "estrutura",
    });
  }

  if (config.casterTrail < 3.5) {
    issues.push({
      id: "caster-trail",
      level: "warning",
      title: "Trail reduzido no rodízio",
      detail: "Trails menores que 3,5 cm podem reduzir o autocentramento do garfo. Valide a dirigibilidade em protótipo.",
      section: "rodas",
    });
  }

  if (config.seatWidth >= 52 && config.frameWallThickness < 2.2) {
    issues.push({
      id: "wide-frame-wall",
      level: "warning",
      title: "Parede do tubo para largura ampla",
      detail: "Para assentos a partir de 52 cm, avalie tubo com parede de pelo menos 2,2 mm e análise estrutural.",
      section: "estrutura",
    });
  }

  if (config.designCapacityKg === 160 && config.seatWidth < 60) {
    issues.push({
      id: "bariatric-width",
      level: "warning",
      title: "Perfil de 160 kg requer assento amplo",
      detail: "A referência pública consultada para 160 kg utiliza assento de 60 cm. Revise a prescrição e a capacidade estrutural.",
      section: "medidas",
    });
  }

  if (config.susReferenceProfile !== "custom" && config.seatBaseThickness < 3) {
    issues.push({
      id: "sus-cushion-minimum",
      level: "error",
      title: "Almofada abaixo da referência mínima",
      detail: "O perfil padrão de referência prevê almofada de espuma de alta densidade com pelo menos 3 cm.",
      section: "assento",
    });
  }

  if (config.seatFrontRise + config.seatBaseThickness > 14) {
    issues.push({
      id: "seat-front-height",
      level: "warning",
      title: "Perfil frontal elevado",
      detail: "A soma da base e da elevação frontal ultrapassa 14 cm. Revise transferências e apoio das pernas.",
      section: "assento",
    });
  }

  if (config.seatPommelHeight > 6) {
    issues.push({
      id: "seat-pommel-review",
      level: "warning",
      title: "Elevação central acentuada",
      detail: "Elevações centrais acima de 6 cm exigem validação postural individual.",
      section: "assento",
    });
  }

  if (config.printAssemblyMode === "kit") {
    issues.push({
      id: "print-kit-prototype",
      level: "warning",
      title: "Kit de impressão exige validação física",
      detail: "Os encaixes paramétricos servem para maquete e prototipagem. Não use pinos impressos como união estrutural ou para transportar um usuário sem projeto, ferragens e ensaio.",
      section: "estrutura",
    });
  }

  return {
    status: issues.some((issue) => issue.level === "error")
      ? "incompatible"
      : issues.length > 0
        ? "review"
        : "compatible",
    issues,
  };
}

export function getBillOfMaterials(config: ChairConfig): CatalogItem[] {
  const wheel = WHEEL_CATALOG[config.wheelStyle];
  const footrest = FOOTREST_CATALOG[config.footrest];
  const frameSizeFactor = Math.max(0, config.seatWidth - 42) * 0.035
    + Math.max(0, config.seatDepth - 43) * 0.02;
  const tubeMassFactor = (config.frameTubeDiameter - 28.6) * 0.045
    + (config.frameWallThickness - 2) * 0.42;

  const items: Omit<CatalogItem, "version" | "validationStatus">[] = [
    {
      code: "FRM-A01",
      category: "Estrutura",
      name: `Chassi ${config.frameType === "rigid" ? "rígido" : "dobrável"} Active 01`,
      specification: `Alumínio 6061-T6 · tubo Ø${config.frameTubeDiameter} × ${config.frameWallThickness} mm · ${config.seatWidth} × ${config.seatDepth} cm · ref. ${config.designCapacityKg} kg`,
      weightKg: 6.18 + frameSizeFactor + tubeMassFactor + (config.frameType === "folding" ? 0.74 : 0),
    },
    {
      code: "AXL-ADJ",
      category: "Estrutura",
      name: "Placas de eixo reguláveis",
      specification: `Par usinado ${config.axlePlateThickness} mm · faixa ${config.axlePlateTravel} cm · eixo a ${config.rearAxlePosition >= 0 ? "+" : ""}${config.rearAxlePosition} cm do centro do assento`,
      weightKg: 0.38,
    },
    {
      code: "SET-BRT",
      category: "Assento",
      name: "Assento respirável",
      specification: `${config.seatWidth} × ${config.seatDepth} cm · base ${config.seatBaseThickness} cm · elevação frontal ${config.seatFrontRise} cm`,
      weightKg: (config.cushion === "pressure" ? 2.18 : 1.72) + config.seatLateralSupport * 0.025 + config.seatPommelHeight * 0.018,
    },
    {
      code: `${wheel.code}-${config.wheelSize}`,
      category: "Rodas",
      name: wheel.name,
      specification: `Par traseiro · ${config.wheelSize}”`,
      weightKg: wheel.weightKg,
    },
    {
      code: footrest.code,
      category: "Apoio",
      name: footrest.name,
      specification: footrest.note,
      weightKg: footrest.weightKg,
    },
  ];

  if (config.pushHandles) {
    items.push({
      code: "PSH-STD",
      category: "Condução",
      name: "Manoplas traseiras",
      specification: "Par integrado ao encosto",
      weightKg: 0.28,
    });
  }


  if (config.armrest !== "none") {
    items.push({
      code: config.armrest === "desk" ? "ARM-DSK" : "ARM-FUL",
      category: "Apoio",
      name: config.armrest === "desk" ? "Apoios de braço curtos" : "Apoios de braço integrais",
      specification: "Par removível · acabamento em PU",
      weightKg: config.armrest === "desk" ? 0.48 : 0.62,
    });
  }

  if (config.antiTip) {
    items.push({
      code: "SAF-ANT",
      category: "Apoio",
      name: "Conjunto anti-tombo",
      specification: "Par traseiro regulável",
      weightKg: 0.32,
    });
  }

  if (config.printAssemblyMode === "kit") {
    items.push({
      code: "PRT-KIT",
      category: "Estrutura",
      name: "Kit de conectores de impressão",
      specification: `8 pinos Ø${config.printConnectorDiameter} mm · folga ${config.printClearance.toFixed(2).replace(".", ",")} mm · apenas protótipo`,
      weightKg: 0.08,
    });
  }

  return items.map((item) => ({
    ...item,
    version: "MVP-0.1",
    validationStatus: item.code === "PRT-KIT" ? "prototype" : "demonstrative",
  }));
}

export function getEstimatedWeight(config: ChairConfig) {
  return getBillOfMaterials(config).reduce((total, item) => total + item.weightKg, 0);
}
