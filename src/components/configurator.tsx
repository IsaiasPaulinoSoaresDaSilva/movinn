"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  AlertTriangle,
  Armchair,
  Box,
  Check,
  ChevronLeft,
  CircleGauge,
  Download,
  Expand,
  Eye,
  FolderOpen,
  Info,
  Maximize2,
  Menu,
  Plus,
  Copy,
  RotateCcw,
  Ruler,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import {
  evaluateCompatibility,
  FOOTREST_CATALOG,
  getBillOfMaterials,
  getEstimatedWeight,
  SUS_REFERENCE_PROFILES,
  WHEEL_CATALOG,
  type ChairConfig,
  type SusReferenceProfileId,
} from "@/lib/catalog";
import {
  createMovinnProject,
  loadProjectLibrary,
  projectFileName,
  saveProjectLibrary,
  updateProject,
  type MovinnProject,
} from "@/lib/projects";
import { MovinnLogo, MovinnMark } from "./movinn-logo";

const ChairViewer = dynamic(() => import("./wheelchair-model").then((mod) => mod.ChairViewer), {
  ssr: false,
  loading: () => <div className="viewer-loading">Preparando modelo 3D…</div>,
});

const initialConfig: ChairConfig = {
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

type Section = "medidas" | "assento" | "estrutura" | "rodas" | "acabamento";

const sections: { id: Section; label: string; icon: typeof Ruler }[] = [
  { id: "medidas", label: "Medidas", icon: Ruler },
  { id: "assento", label: "Assento", icon: Armchair },
  { id: "estrutura", label: "Estrutura", icon: SlidersHorizontal },
  { id: "rodas", label: "Rodas", icon: CircleGauge },
  { id: "acabamento", label: "Acabamento", icon: Sparkles },
];

const exportParts = [
  { id: "MODULE_SEATING", name: "Assento modelado", note: "Superfície paramétrica fechada", suffix: "assento" },
  { id: "MODULE_BACKREST", name: "Encosto", note: "Painel traseiro estofado", suffix: "encosto" },
  { id: "MODULE_FRAME", name: "Chassi", note: "Estrutura tubular configurada", suffix: "chassi" },
  { id: "MODULE_AXLE_PLATES", name: "Placas de eixo", note: "Conjunto regulável de fixação", suffix: "placas-eixo" },
  { id: "MODULE_REAR_WHEELS", name: "Rodas traseiras", note: "Par de rodas e aros de propulsão", suffix: "rodas-traseiras" },
  { id: "MODULE_CASTERS", name: "Rodízios dianteiros", note: "Rodas e garfos dianteiros", suffix: "rodizios" },
  { id: "MODULE_FOOTREST", name: "Apoio para os pés", note: "Plataforma ou apoios separados", suffix: "apoio-pes" },
  { id: "MODULE_ARMRESTS", name: "Apoios de braço", note: "Conjunto lateral configurado", suffix: "apoios-braco" },
  { id: "MODULE_PUSH_HANDLES", name: "Manoplas", note: "Conjunto traseiro de condução", suffix: "manoplas" },
  { id: "MODULE_ANTI_TIP", name: "Anti-tombo", note: "Conjunto de segurança traseiro", suffix: "anti-tombo" },
  { id: "MODULE_BRAKES", name: "Freios", note: "Par de freios manuais", suffix: "freios" },
  { id: "MODULE_CONNECTORS", name: "Kit de conectores", note: "Pinos de alinhamento para montagem impressa", suffix: "conectores" },
  { id: "ALL", name: "Cadeira completa", note: "Todos os módulos visíveis", suffix: "completa" },
] as const;

type ExportPartId = (typeof exportParts)[number]["id"];
type ModelPartId = Exclude<ExportPartId, "ALL">;

const modelParts = exportParts.filter((part): part is Exclude<(typeof exportParts)[number], { id: "ALL" }> => part.id !== "ALL");

const partSections: Record<ModelPartId, Section> = {
  MODULE_SEATING: "assento",
  MODULE_BACKREST: "medidas",
  MODULE_FRAME: "estrutura",
  MODULE_AXLE_PLATES: "estrutura",
  MODULE_REAR_WHEELS: "rodas",
  MODULE_CASTERS: "rodas",
  MODULE_FOOTREST: "estrutura",
  MODULE_ARMRESTS: "estrutura",
  MODULE_PUSH_HANDLES: "estrutura",
  MODULE_ANTI_TIP: "estrutura",
  MODULE_BRAKES: "estrutura",
  MODULE_CONNECTORS: "estrutura",
};

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function RangeControl({ label, value, min, max, unit = "cm", step = 1, onChange }: { label: string; value: number; min: number; max: number; unit?: string; step?: number; onChange: (value: number) => void }) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <label className="range-control">
      <span><b>{label}</b><output>{value}{unit === "\"" ? unit : ` ${unit}`}</output></span>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ "--range": `${percentage}%` } as React.CSSProperties} />
      <small><span>{min}</span><span>{max}</span></small>
    </label>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; name: string; note: string; unavailable?: boolean; unavailableNote?: string }[]; onChange: (value: T) => void }) {
  return (
    <fieldset className="choice-group">
      <legend>{label}</legend>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} disabled={option.unavailable} className={value === option.value ? "choice active" : "choice"} onClick={() => onChange(option.value)}>
          <span className="choice-indicator">{value === option.value && <Check size={13} strokeWidth={3} />}</span>
          <span><b>{option.name}</b><small>{option.unavailable ? option.unavailableNote : option.note}</small></span>
        </button>
      ))}
    </fieldset>
  );
}

export function Configurator() {
  const [config, setConfig] = useState<ChairConfig>(initialConfig);
  const [active, setActive] = useState<Section>("medidas");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projects, setProjects] = useState<MovinnProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [modelObject, setModelObject] = useState<THREE.Group | null>(null);
  const [exportPart, setExportPart] = useState<ExportPartId>("MODULE_SEATING");
  const [selectedPart, setSelectedPart] = useState<ModelPartId>("MODULE_SEATING");
  const [notice, setNotice] = useState("");
  const viewerRef = useRef<HTMLElement>(null);
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const projectName = activeProject?.name ?? "MOVINN Active 01";
  const update = <K extends keyof ChairConfig>(key: K, value: ChairConfig[K]) => {
    const changesReference = ["seatWidth", "seatDepth", "backrestHeight", "seatBaseThickness", "designCapacityKg"].includes(key);
    setConfig((current) => ({ ...current, [key]: value, susReferenceProfile: changesReference ? "custom" : current.susReferenceProfile }));
    setDirty(true);
  };
  const compatibility = useMemo(() => evaluateCompatibility(config), [config]);
  const billOfMaterials = useMemo(() => getBillOfMaterials(config), [config]);
  const estimatedWeight = useMemo(() => getEstimatedWeight(config), [config]);
  const externalWidth = config.seatWidth + (config.designCapacityKg === 160 ? 20 : 18);
  const completion = compatibility.status === "incompatible" ? 78 : compatibility.status === "review" ? 90 : 100;

  const isPartAvailable = (part: ModelPartId) => !(
    (part === "MODULE_ARMRESTS" && config.armrest === "none")
    || (part === "MODULE_PUSH_HANDLES" && !config.pushHandles)
    || (part === "MODULE_ANTI_TIP" && !config.antiTip)
    || (part === "MODULE_CONNECTORS" && config.printAssemblyMode !== "kit")
  );

  const selectPart = (part: ModelPartId) => {
    setSelectedPart(part);
    setExportPart(part);
    setActive(partSections[part]);
  };

  const applySeatPreset = (preset: "flat" | "wedge" | "postural") => {
    const values = preset === "flat"
      ? { seatBaseThickness: 5, seatFrontRise: 0, seatLateralSupport: 0, seatPommelHeight: 0 }
      : preset === "wedge"
        ? { seatBaseThickness: 4, seatFrontRise: 5, seatLateralSupport: 1, seatPommelHeight: 0 }
        : { seatBaseThickness: 5, seatFrontRise: 3, seatLateralSupport: 4, seatPommelHeight: 5 };
    setConfig((current) => ({ ...current, ...values }));
    setDirty(true);
  };

  const applySusReference = (profile: SusReferenceProfileId) => {
    if (profile === "custom") {
      update("susReferenceProfile", "custom");
      return;
    }
    const reference = SUS_REFERENCE_PROFILES[profile];
    setConfig((current) => ({
      ...current,
      susReferenceProfile: profile,
      seatWidth: reference.seatWidth,
      seatDepth: reference.seatDepth ?? current.seatDepth,
      backrestHeight: reference.backrestHeight ?? current.backrestHeight,
      designCapacityKg: reference.designCapacityKg,
      seatBaseThickness: Math.max(3, current.seatBaseThickness),
      frameType: "folding",
      footrest: reference.designCapacityKg === 160 ? "split" : current.footrest,
      frameTubeDiameter: reference.designCapacityKg === 160 ? 31.8 : current.frameTubeDiameter,
      frameWallThickness: reference.designCapacityKg === 160 ? 2.6 : current.frameWallThickness,
    }));
    setDirty(true);
  };

  useEffect(() => {
    const library = loadProjectLibrary(initialConfig);
    const selected = library.projects.find((project) => project.id === library.activeProjectId) ?? library.projects[0];
    const restored = { ...initialConfig, ...selected.config };
    if (restored.frameColor.toLowerCase() === "#187c91") restored.frameColor = initialConfig.frameColor;
    const frame = window.requestAnimationFrame(() => {
      setProjects(library.projects);
      setActiveProjectId(selected.id);
      setConfig(restored);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const modalOpen = exportOpen || technicalOpen || projectsOpen;
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (exportOpen) setExportOpen(false);
      else if (technicalOpen) setTechnicalOpen(false);
      else setProjectsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [exportOpen, technicalOpen, projectsOpen]);

  const saveProject = () => {
    if (!activeProject) return;
    const nextProjects = projects.map((project) => project.id === activeProject.id ? updateProject(project, config) : project);
    setProjects(nextProjects);
    saveProjectLibrary(nextProjects, activeProject.id);
    setDirty(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const exportProject = () => {
    const file = new Blob([JSON.stringify({
      schemaVersion: 2,
      project: { id: activeProjectId, name: projectName, product: "Active 01" },
      config,
      compatibility,
      billOfMaterials,
      estimatedWeightKg: Number(estimatedWeight.toFixed(2)),
    }, null, 2)], { type: "application/json" });
    triggerDownload(file, projectFileName(projectName));
    setExportOpen(false);
  };

  const downloadTechnicalSheet = () => {
    const fileBase = projectFileName(projectName).replace(/\.json$/, "");
    const dimensions = [
      ["Largura do assento", `${config.seatWidth} cm`],
      ["Profundidade do assento", `${config.seatDepth} cm`],
      ["Altura do assento", `${config.seatHeight} cm`],
      ["Altura do encosto", `${config.backrestHeight} cm`],
      ["Largura externa estimada", `${externalWidth} cm`],
      ["Roda traseira", `${config.wheelSize}\"`],
      ["Capacidade de referência", `${config.designCapacityKg} kg`],
      ["Referência SUS", config.susReferenceProfile === "custom" ? "Personalizado" : SUS_REFERENCE_PROFILES[config.susReferenceProfile].name],
      ["Montagem", config.printAssemblyMode === "kit" ? `Kit impresso · pino Ø${config.printConnectorDiameter} mm · folga ${config.printClearance.toFixed(2).replace(".", ",")} mm` : "Modelo integrado"],
    ];
    const content = [
      "MOVINN — FICHA TÉCNICA DE CONFIGURAÇÃO",
      `Projeto: ${projectName}`,
      `Gerado: ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`,
      "",
      "DIMENSÕES E CONFIGURAÇÃO",
      ...dimensions.map(([label, value]) => `${label}: ${value}`),
      "",
      "COMPONENTES",
      ...billOfMaterials.map((item) => `${item.code} — ${item.name}: ${item.specification} (${item.weightKg.toFixed(2).replace(".", ",")} kg)`),
      `Peso estimado do conjunto: ${estimatedWeight.toFixed(2).replace(".", ",")} kg`,
      "",
      "AVISOS",
      "Documento de configuração e prototipagem; não certifica segurança clínica, estrutural ou de fabricação.",
      "Medidas de referência SUS não substituem prescrição individual por profissional habilitado.",
      ...(config.printAssemblyMode === "kit" ? ["Pinos e encaixes impressos exigem validação física; não são uniões estruturais para transporte de pessoa."] : []),
    ].join("\n");
    triggerDownload(new Blob([content], { type: "text/plain;charset=utf-8" }), `${fileBase}-ficha-tecnica.txt`);
    setNotice("Ficha técnica baixada.");
  };

  const getExportObject = () => {
    if (!modelObject) return null;
    modelObject.updateWorldMatrix(true, true);
    const root = new THREE.Group();
    root.name = exportPart === "ALL" ? "MOVINN_COMPLETE" : exportPart;
    const sourceModules = exportPart === "ALL"
      ? modelObject.children.filter((child) => child.name !== "EDITOR_OVERLAY")
      : modelObject.children.filter((child) => child.name === exportPart);
    for (const sourceModule of sourceModules) {
      sourceModule.traverse((sourceObject) => {
        if (!(sourceObject instanceof THREE.Mesh) || !sourceObject.visible) return;
        const geometry = sourceObject.geometry.clone();
        geometry.applyMatrix4(sourceObject.matrixWorld);
        const material = Array.isArray(sourceObject.material)
          ? sourceObject.material.map((item) => item.clone())
          : sourceObject.material.clone();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = sourceObject.name;
        mesh.userData = { ...sourceObject.userData };
        root.add(mesh);
      });
    }
    if (root.children.length === 0) return null;
    root.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    const offset = new THREE.Vector3(-center.x, -bounds.min.y, -center.z);
    const translation = new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.applyMatrix4(translation);
        object.geometry.computeBoundingBox();
        object.geometry.computeBoundingSphere();
      }
    });
    root.updateWorldMatrix(true, true);
    return root;
  };

  const downloadGeometry = async (format: "glb" | "stl" | "blend") => {
    if (!modelObject) return;
    setExporting(format);
    try {
      const exportObject = getExportObject();
      if (!exportObject) {
        setNotice("Este módulo não está presente na configuração atual.");
        return;
      }
      const fileBase = projectFileName(projectName).replace(/\.json$/, "");
      const part = exportParts.find((item) => item.id === exportPart) ?? exportParts[0];
      if (format === "glb" || format === "blend") {
        const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
        const data = await new GLTFExporter().parseAsync(exportObject, {
          binary: true,
          onlyVisible: true,
          trs: false,
          copyright: "MOVINN modular wheelchair configurator",
        });
        const blob = new Blob([data as ArrayBuffer], { type: "model/gltf-binary" });
        if (format === "glb") {
          triggerDownload(blob, `${fileBase}-${part.suffix}.glb`);
        } else {
          const response = await fetch("/api/export/blend", { method: "POST", headers: { "Content-Type": "model/gltf-binary" }, body: blob });
          if (!response.ok) {
            const result = await response.json() as { error?: string };
            setNotice(result.error ?? "O worker Blender não conseguiu gerar o arquivo.");
            return;
          }
          triggerDownload(await response.blob(), `${fileBase}-${part.suffix}.blend`);
        }
      } else {
        const { STLExporter } = await import("three/addons/exporters/STLExporter.js");
        exportObject.scale.setScalar(1000);
        exportObject.updateWorldMatrix(true, true);
        const data = new STLExporter().parse(exportObject, { binary: true });
        const blob = new Blob([data.buffer as ArrayBuffer], { type: "model/stl" });
        triggerDownload(blob, `${fileBase}-${part.suffix}.stl`);
      }
      setNotice(`${part.name} exportado em ${format.toUpperCase()}.`);
    } finally {
      setExporting(null);
      setExportOpen(false);
    }
  };

  const shareProject = async () => {
    const shareData = { title: projectName, text: `Projeto ${projectName} criado no MOVINN Studio.`, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); setNotice("Projeto compartilhado."); } catch { /* User cancelled. */ }
    } else {
      try { await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); setNotice("Link do projeto copiado."); }
      catch { setNotice("Não foi possível copiar o link neste navegador."); }
    }
  };

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewerRef.current.requestFullscreen();
    } catch { setNotice("A tela cheia não está disponível neste navegador."); }
  };

  const selectProject = (project: MovinnProject) => {
    let nextProjects = projects;
    const selectedConfig = project.id === activeProjectId ? config : project.config;
    if (activeProject && dirty) {
      nextProjects = projects.map((item) => item.id === activeProject.id ? updateProject(item, config) : item);
    }
    saveProjectLibrary(nextProjects, project.id);
    setProjects(nextProjects);
    setActiveProjectId(project.id);
    setConfig({ ...initialConfig, ...selectedConfig });
    setDirty(false);
    setProjectsOpen(false);
  };

  const newProject = () => {
    const project = createMovinnProject(`Projeto MOVINN ${String(projects.length + 1).padStart(2, "0")}`, initialConfig);
    const nextProjects = [project, ...projects];
    saveProjectLibrary(nextProjects, project.id);
    setProjects(nextProjects);
    setActiveProjectId(project.id);
    setConfig(project.config);
    setDirty(false);
    setProjectsOpen(false);
  };

  const duplicateProject = (source: MovinnProject) => {
    const sourceConfig = source.id === activeProjectId ? config : source.config;
    const duplicate = createMovinnProject(`${source.name} — cópia`, sourceConfig);
    const nextProjects = [duplicate, ...projects];
    saveProjectLibrary(nextProjects, duplicate.id);
    setProjects(nextProjects);
    setActiveProjectId(duplicate.id);
    setConfig(duplicate.config);
    setDirty(false);
    setProjectsOpen(false);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" aria-label="Abrir projetos" onClick={() => setProjectsOpen(true)}><MovinnLogo /></button>
        <div className="project-title">
          <span className="status-dot" />
          <div><b>{projectName}</b><small>{dirty ? "Alterações não salvas" : "Seu projeto está salvo"}</small></div>
        </div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Compartilhar projeto" onClick={shareProject}><Share2 size={18} /></button>
          <button className="outline-button" onClick={() => setExportOpen(true)}><Download size={17} /> Exportar</button>
          <button className="primary-button" onClick={saveProject}>{saved ? <Check size={17} /> : null}{saved ? "Projeto salvo" : "Salvar projeto"}</button>
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <aside className={menuOpen ? "tool-rail open" : "tool-rail"}>
        <button className="back-button" onClick={() => { setProjectsOpen(true); setMenuOpen(false); }}><ChevronLeft size={19} /> Projetos</button>
        <nav>
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} aria-current={active === id ? "page" : undefined} className={active === id ? "rail-item active" : "rail-item"} onClick={() => { setActive(id); setMenuOpen(false); }}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="progress-block">
          <div className="progress-copy"><span>Configuração</span><b>{completion}%</b></div>
          <div className="progress-track"><span style={{ width: `${completion}%` }} /></div>
          <small>{compatibility.status === "compatible" ? "Configuração concluída" : `${compatibility.issues.length} ${compatibility.issues.length === 1 ? "item precisa" : "itens precisam"} de atenção`}</small>
        </div>
      </aside>

      <section className="controls-panel">
        <div className="panel-heading">
          <span>{sections.find((section) => section.id === active)?.label}</span>
          <h1>{active === "medidas" ? "Ajuste ao seu corpo" : active === "assento" ? "Modele a superfície" : active === "estrutura" ? "Defina a estrutura" : active === "rodas" ? "Escolha o conjunto de rodas" : "Dê identidade à cadeira"}</h1>
          <p>{active === "medidas" ? "Use suas medidas reais. O modelo responde em tempo real." : active === "assento" ? "Crie elevações e declives diretamente na peça exportável." : active === "estrutura" ? "Defina os componentes que sustentam a configuração antes da validação física." : "Cada escolha atualiza o modelo e as especificações do projeto."}</p>
        </div>

        <div className="panel-content">
          <section className="part-workbench" aria-labelledby="part-workbench-title">
            <div className="part-workbench-head">
              <div><span>Peça ativa</span><b id="part-workbench-title">{exportParts.find((part) => part.id === selectedPart)?.name}</b></div>
              <button type="button" onClick={() => setExportOpen(true)}><Download size={14} /> Exportar</button>
            </div>
            <p>Clique no modelo ou escolha um módulo para editar e exportar apenas esta peça.</p>
            <div className="part-picker" role="list" aria-label="Módulos da cadeira">
              {modelParts.map((part) => {
                const unavailable = !isPartAvailable(part.id);
                return <button key={part.id} type="button" disabled={unavailable} aria-pressed={selectedPart === part.id} onClick={() => selectPart(part.id)}>{part.name}</button>;
              })}
            </div>
          </section>
          {selectedPart === "MODULE_BACKREST" && (
            <section className="part-parameters" aria-labelledby="backrest-modeling-title">
              <div className="part-parameters-heading"><span>Modelagem do encosto</span><b id="backrest-modeling-title">Superfície, suporte e contenção</b></div>
              <RangeControl label="Reclinação do encosto" value={config.backrestRecline} min={0} max={18} unit="°" onChange={(value) => update("backrestRecline", value)} />
              <RangeControl label="Suporte lombar" value={config.backrestLumbarSupport} min={0} max={5} onChange={(value) => update("backrestLumbarSupport", value)} />
              <RangeControl label="Profundidade das abas" value={config.backrestWingDepth} min={0} max={7} onChange={(value) => update("backrestWingDepth", value)} />
              <div className="tip"><Info size={17} /><span><b>Peça independente</b> Inclinação, curvatura lombar e abas são aplicadas ao encosto exportado.</span></div>
            </section>
          )}
          {selectedPart === "MODULE_AXLE_PLATES" && (
            <section className="part-parameters" aria-labelledby="axle-modeling-title">
              <div className="part-parameters-heading"><span>Modelagem das placas</span><b id="axle-modeling-title">Fixação e faixa de regulagem</b></div>
              <RangeControl label="Espessura da placa" value={config.axlePlateThickness} min={4} max={10} unit="mm" onChange={(value) => update("axlePlateThickness", value)} />
              <RangeControl label="Faixa de regulagem" value={config.axlePlateTravel} min={3} max={9} onChange={(value) => update("axlePlateTravel", value)} />
              <RangeControl label="Posição do eixo" value={config.rearAxlePosition} min={-12} max={8} onChange={(value) => update("rearAxlePosition", value)} />
              <div className="tip"><Info size={17} /><span><b>Conjunto exportável</b> As duas placas, furos e receptores acompanham os parâmetros desta peça.</span></div>
            </section>
          )}
          {selectedPart === "MODULE_FOOTREST" && (
            <section className="part-parameters" aria-labelledby="footrest-modeling-title">
              <div className="part-parameters-heading"><span>Modelagem do apoio</span><b id="footrest-modeling-title">Alcance, altura e inclinação</b></div>
              <RangeControl label="Altura da plataforma" value={config.footrestHeight} min={8} max={20} onChange={(value) => update("footrestHeight", value)} />
              <RangeControl label="Inclinação da plataforma" value={config.footrestAngle} min={-10} max={15} unit="°" onChange={(value) => update("footrestAngle", value)} />
              <RangeControl label="Extensão frontal" value={config.footrestExtension} min={0} max={12} onChange={(value) => update("footrestExtension", value)} />
              <div className="tip"><Info size={17} /><span><b>Geometria modular</b> Hastes e plataforma são reposicionadas sem alterar os demais módulos.</span></div>
            </section>
          )}
          {selectedPart === "MODULE_CONNECTORS" && config.printAssemblyMode === "kit" && (
            <section className="part-parameters" aria-labelledby="connector-modeling-title">
              <div className="part-parameters-heading"><span>Kit de montagem</span><b id="connector-modeling-title">Pinos de alinhamento impressos</b></div>
              <RangeControl label="Diâmetro do pino" value={config.printConnectorDiameter} min={8} max={10} step={2} unit="mm" onChange={(value) => update("printConnectorDiameter", value as 8 | 10)} />
              <Choice label="Folga de encaixe" value={String(config.printClearance)} onChange={(value) => update("printClearance", Number(value) as ChairConfig["printClearance"])} options={[
                { value: "0.25", name: "Precisa · 0,25 mm", note: "Impressora bem calibrada" },
                { value: "0.35", name: "Padrão · 0,35 mm", note: "Recomendado para FDM" },
                { value: "0.5", name: "Solta · 0,50 mm", note: "Para protótipos rápidos" },
              ]} />
              <div className="tip"><Info size={17} /><span><b>Sequência de montagem</b> Exporte o chassi, o assento e este kit. Os pinos alinham as interfaces; a versão impressa não é homologada para carga humana.</span></div>
            </section>
          )}
          {active === "medidas" && (
            <>
              <fieldset className="sus-reference">
                <legend>Referência SUS</legend>
                <p>Medidas de dispensação pública; a prescrição final continua sendo individual.</p>
                <div className="sus-reference-options">
                  <button type="button" aria-pressed={config.susReferenceProfile === "custom"} onClick={() => applySusReference("custom")}><b>Personalizado</b><small>Sem referência aplicada</small></button>
                  {(Object.entries(SUS_REFERENCE_PROFILES) as [Exclude<SusReferenceProfileId, "custom">, (typeof SUS_REFERENCE_PROFILES)[Exclude<SusReferenceProfileId, "custom">]][]).map(([id, profile]) => (
                    <button key={id} type="button" aria-pressed={config.susReferenceProfile === id} onClick={() => applySusReference(id)}><b>{profile.name}</b><small>{profile.note}</small></button>
                  ))}
                </div>
                {config.susReferenceProfile !== "custom" && <div className="sus-reference-note"><Check size={15} /><span>Referência aplicada. Alterar uma medida torna o projeto personalizado.</span></div>}
              </fieldset>
              <div className="measure-figure" aria-hidden="true">
                <div className="body-silhouette"><span /><i className="measure-line horizontal">{config.seatWidth}</i><i className="measure-line vertical">{config.seatHeight}</i></div>
                <div><b>Referência de postura</b><small>As medidas estão em centímetros.</small></div>
              </div>
              <RangeControl label="Largura do assento" value={config.seatWidth} min={34} max={60} step={0.5} onChange={(value) => update("seatWidth", value)} />
              <RangeControl label="Profundidade do assento" value={config.seatDepth} min={36} max={52} onChange={(value) => update("seatDepth", value)} />
              <RangeControl label="Altura do assento" value={config.seatHeight} min={42} max={56} onChange={(value) => update("seatHeight", value)} />
              <RangeControl label="Altura do encosto" value={config.backrestHeight} min={30} max={55} onChange={(value) => update("backrestHeight", value)} />
              <RangeControl label="Inclinação do assento" value={config.seatAngle} min={0} max={10} unit="°" onChange={(value) => update("seatAngle", value)} />
              <Choice label="Capacidade estrutural de referência" value={String(config.designCapacityKg)} onChange={(value) => update("designCapacityKg", Number(value) as 100 | 160)} options={[{ value: "100", name: "Até 100 kg", note: "Perfil padrão de referência" }, { value: "160", name: "Até 160 kg", note: "Exige assento de 60 cm e estrutura reforçada" }]} />
              <div className="tip"><Info size={17} /><span><b>Dica de medição</b> Mantenha 2 cm de folga entre o assento e a parte posterior dos joelhos.</span></div>
            </>
          )}
          {active === "assento" && (
            <>
              <fieldset className="seat-presets">
                <legend>Perfis rápidos</legend>
                <div>
                  <button type="button" aria-pressed={config.seatFrontRise === 0 && config.seatLateralSupport === 0} onClick={() => applySeatPreset("flat")}><b>Plano</b><small>Base uniforme</small></button>
                  <button type="button" aria-pressed={config.seatFrontRise === 5 && config.seatPommelHeight === 0} onClick={() => applySeatPreset("wedge")}><b>Declive</b><small>Frente elevada</small></button>
                  <button type="button" aria-pressed={config.seatLateralSupport === 4 && config.seatPommelHeight === 5} onClick={() => applySeatPreset("postural")}><b>Postural</b><small>Contorno completo</small></button>
                </div>
              </fieldset>
              <Choice label="Material da almofada" value={config.cushion} onChange={(value) => update("cushion", value)} options={[{ value: "standard", name: "Conforto diário", note: "Espuma respirável" }, { value: "pressure", name: "Alívio de pressão", note: "Perfil multicamada" }]} />
              <RangeControl label="Espessura da base" value={config.seatBaseThickness} min={3} max={8} onChange={(value) => update("seatBaseThickness", value)} />
              <RangeControl label="Elevação frontal" value={config.seatFrontRise} min={0} max={8} onChange={(value) => update("seatFrontRise", value)} />
              <RangeControl label="Apoios laterais" value={config.seatLateralSupport} min={0} max={6} onChange={(value) => update("seatLateralSupport", value)} />
              <RangeControl label="Elevação central" value={config.seatPommelHeight} min={0} max={8} onChange={(value) => update("seatPommelHeight", value)} />
              <div className="tip"><Info size={17} /><span><b>Geometria exportável</b> A superfície é reconstruída como uma malha fechada sempre que um parâmetro muda.</span></div>
            </>
          )}
          {active === "estrutura" && (
            <>
              <Choice label="Produção / montagem" value={config.printAssemblyMode} onChange={(value) => update("printAssemblyMode", value)} options={[
                { value: "integrated", name: "Modelo integrado", note: "Visualização e exportação convencional" },
                { value: "kit", name: "Kit de impressão", note: "Módulos separados + pinos de alinhamento" },
              ]} />
              {config.printAssemblyMode === "kit" && <section className="print-kit-note"><Box size={17} /><span><b>Kit ativo: 8 encaixes paramétricos</b><small>Exporte cada módulo e o “Kit de conectores”. Para a cadeira SUS, preserve as medidas prescritas e valide material, ferragens e resistência fora do configurador.</small></span></section>}
              <Choice label="Tipo de chassi" value={config.frameType} onChange={(value) => update("frameType", value)} options={[{ value: "rigid", name: "Chassi rígido", note: "Resposta direta e menor peso" }, { value: "folding", name: "Chassi dobrável", note: "Facilita transporte e armazenamento" }]} />
              <Choice label="Apoio para os pés" value={config.footrest} onChange={(value) => update("footrest", value)} options={(Object.entries(FOOTREST_CATALOG) as [ChairConfig["footrest"], (typeof FOOTREST_CATALOG)[ChairConfig["footrest"]]][]).map(([value, item]) => ({
                value,
                name: item.name,
                note: `${item.note} · ${item.code}`,
                unavailable: config.seatWidth > item.maxSeatWidth,
                unavailableNote: `Disponível até ${item.maxSeatWidth} cm de largura`,
              }))} />
              <Choice label="Apoios de braço" value={config.armrest} onChange={(value) => update("armrest", value)} options={[{ value: "none", name: "Sem apoios", note: "Configuração ativa e leve" }, { value: "desk", name: "Apoios curtos", note: "Aproximação de mesas" }, { value: "full", name: "Apoios integrais", note: "Maior área de suporte" }]} />
              <RangeControl label="Diâmetro externo do tubo" value={config.frameTubeDiameter} min={25.4} max={31.8} step={3.2} unit="mm" onChange={(value) => update("frameTubeDiameter", value)} />
              <RangeControl label="Espessura da parede do tubo" value={config.frameWallThickness} min={1.6} max={2.6} step={0.2} unit="mm" onChange={(value) => update("frameWallThickness", value)} />
              <RangeControl label="Posição longitudinal do eixo" value={config.rearAxlePosition} min={-12} max={8} unit="cm" onChange={(value) => update("rearAxlePosition", value)} />
              <RangeControl label="Trail do rodízio" value={config.casterTrail} min={3} max={7} step={0.5} unit="cm" onChange={(value) => update("casterTrail", value)} />
              <label className="toggle-row"><span><b>Manoplas para condução</b><small>Adiciona alças traseiras ao encosto</small></span><input type="checkbox" checked={config.pushHandles} onChange={(e) => update("pushHandles", e.target.checked)} /><i /></label>
              <label className="toggle-row"><span><b>Conjunto anti-tombo</b><small>Adiciona rodas auxiliares traseiras</small></span><input type="checkbox" checked={config.antiTip} onChange={(e) => update("antiTip", e.target.checked)} /><i /></label>
              <div className="spec-note"><Box size={19} /><span><b>Geometria mecânica local</b><small>Placas de eixo, garfos e travessas respondem aos parâmetros. Ainda requer validação física e normativa.</small></span></div>
            </>
          )}
          {active === "rodas" && (
            <>
              <RangeControl label="Diâmetro da roda" value={config.wheelSize} min={22} max={26} unit={'"'} onChange={(value) => update("wheelSize", value)} />
              <RangeControl label="Cambagem" value={config.camber} min={0} max={6} unit="°" onChange={(value) => update("camber", value)} />
              <RangeControl label="Rodízios dianteiros" value={config.casterSize} min={4} max={6} unit={'"'} onChange={(value) => update("casterSize", value)} />
              <Choice label="Desenho da roda" value={config.wheelStyle} onChange={(value) => update("wheelStyle", value)} options={(Object.entries(WHEEL_CATALOG) as [ChairConfig["wheelStyle"], (typeof WHEEL_CATALOG)[ChairConfig["wheelStyle"]]][]).map(([value, item]) => ({
                value,
                name: item.name,
                note: `${item.note} · ${item.code}`,
                unavailable: !item.sizes.includes(config.wheelSize),
                unavailableNote: `Não disponível em ${config.wheelSize}”`,
              }))} />
            </>
          )}
          {active === "acabamento" && (
            <>
              <ColorPicker label="Cor da estrutura" value={config.frameColor} onChange={(value) => update("frameColor", value)} colors={["#0B1F3B", "#FF6B3D", "#2ECCB0", "#667281", "#25282a"]} />
              <ColorPicker label="Cor do estofamento" value={config.upholsteryColor} onChange={(value) => update("upholsteryColor", value)} colors={["#202628", "#0B1F3B", "#596B78", "#72545C", "#DAD5CD"]} />
              <div className="finish-swatch"><span style={{ background: config.frameColor }} /><div><b>Pintura eletrostática acetinada</b><small>Resistente a riscos e fácil de limpar</small></div></div>
            </>
          )}
        </div>
        <div className="panel-footer">
          <button onClick={() => { setConfig(initialConfig); setDirty(true); }}><RotateCcw size={16} /> Restaurar padrão</button>
          <span>V10 · kit de impressão</span>
        </div>
      </section>

      <section className="viewer-panel" ref={viewerRef}>
        <ChairViewer config={config} onModelReady={setModelObject} selectedModule={selectedPart} onSelectModule={selectPart} />
        <div className="viewer-caption"><Eye size={16} /><span>Arraste para girar · role para aproximar</span></div>
        <div className="selection-readout"><span>Em edição</span><b>{exportParts.find((part) => part.id === selectedPart)?.name}</b><small>Clique em outro módulo para trocar</small></div>
        <button className="viewer-export-button" aria-label="Exportar uma peça" onClick={() => setExportOpen(true)}><Download size={17} /><span>Exportar peça</span></button>
        <button className="viewer-technical-button" aria-label="Abrir especificação técnica" onClick={() => setTechnicalOpen(true)}><Wrench size={17} /><span>Ficha técnica</span></button>
        <button className="fullscreen-button" aria-label="Alternar tela cheia" onClick={toggleFullscreen}><Maximize2 size={18} /></button>
        <div className="axis" aria-hidden="true"><span className="axis-y">Y</span><span className="axis-x">X</span><span className="axis-z">Z</span></div>
      </section>

      <aside className="summary-panel">
        <div className="summary-head"><span>Resumo do projeto</span><button aria-label="Abrir resumo técnico" onClick={() => setTechnicalOpen(true)}><Expand size={17} /></button></div>
        <div className="chair-id"><span><MovinnMark inverse /></span><div><b>Active 01</b><small>Uso diário · adulto</small></div></div>
        <dl className="spec-list">
          <div><dt>Largura total</dt><dd>{externalWidth} cm</dd></div>
          <div><dt>Profundidade</dt><dd>{config.seatDepth + 26} cm</dd></div>
          <div><dt>Altura do assento</dt><dd>{config.seatHeight} cm</dd></div>
          <div><dt>Rodas traseiras</dt><dd>{config.wheelSize}&quot;</dd></div>
          <div><dt>Cambagem</dt><dd>{config.camber}°</dd></div>
          <div><dt>Chassi</dt><dd>{config.frameType === "rigid" ? "Rígido" : "Dobrável"}</dd></div>
          <div><dt>Capacidade de referência</dt><dd>{config.designCapacityKg} kg</dd></div>
          <div><dt>Montagem</dt><dd>{config.printAssemblyMode === "kit" ? "Kit impresso" : "Integrada"}</dd></div>
          <div><dt>Peso estimado</dt><dd>{estimatedWeight.toFixed(1).replace(".", ",")} kg</dd></div>
        </dl>
        <div className="material-row"><span style={{ background: config.frameColor }} /><div><b>Estrutura</b><small>Alumínio acetinado</small></div></div>
        <div className="material-row"><span style={{ background: config.upholsteryColor }} /><div><b>Estofamento</b><small>Tecido respirável</small></div></div>
        <div className="summary-spacer" />
        <button className={`validation ${compatibility.status}`} onClick={() => compatibility.issues[0] ? setActive(compatibility.issues[0].section) : setTechnicalOpen(true)}>
          {compatibility.status === "compatible" ? <Check size={17} /> : <AlertTriangle size={17} />}
          <span>
            <b>{compatibility.status === "compatible" ? "Geometria compatível" : compatibility.status === "review" ? "Revisão técnica necessária" : "Combinação incompatível"}</b>
            <small>{compatibility.status === "compatible" ? "Todas as regras do catálogo foram atendidas." : compatibility.issues[0].detail}</small>
          </span>
        </button>
        <button className="technical-button" onClick={() => setTechnicalOpen(true)}><Box size={17} /> Ver especificação técnica</button>
      </aside>

      {exportOpen && (
        <div className="export-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setExportOpen(false)}>
          <section className="export-sheet" role="dialog" aria-modal="true" aria-labelledby="export-title">
            <header>
              <div><span>MOVINN Print</span><h2 id="export-title">Escolha a peça</h2><p>{config.printAssemblyMode === "kit" ? "Exporte os módulos separadamente e inclua o Kit de conectores para os encaixes de montagem." : "O arquivo conterá somente o módulo selecionado, centralizado na origem."}</p></div>
              <button className="sheet-close" aria-label="Fechar exportação" autoFocus onClick={() => setExportOpen(false)}><X size={20} /></button>
            </header>
            <div className="export-part-list" role="radiogroup" aria-label="Peça para exportar">
              {exportParts.map((part) => {
                const unavailable = (part.id === "MODULE_ARMRESTS" && config.armrest === "none")
                  || (part.id === "MODULE_PUSH_HANDLES" && !config.pushHandles)
                  || (part.id === "MODULE_ANTI_TIP" && !config.antiTip)
                  || (part.id === "MODULE_CONNECTORS" && config.printAssemblyMode !== "kit");
                return <button key={part.id} type="button" role="radio" aria-checked={exportPart === part.id} disabled={unavailable} className={exportPart === part.id ? "export-part active" : "export-part"} onClick={() => {
                  setExportPart(part.id);
                  if (part.id !== "ALL") selectPart(part.id);
                }}>
                  <span className="export-part-indicator">{exportPart === part.id && <Check size={13} strokeWidth={3} />}</span>
                  <span><b>{part.name}</b><small>{unavailable ? "Não está presente nesta configuração" : part.note}</small></span>
                </button>;
              })}
            </div>
            <div className="export-formats">
              <div><span>Formato de saída</span><small>STL é convertido para milímetros; GLB permanece em metros.</small></div>
              <button onClick={() => downloadGeometry("stl")} disabled={!modelObject || exporting !== null}><b>{exporting === "stl" ? "Gerando…" : "Baixar STL"}</b><small>Prototipagem e impressão 3D</small></button>
              <button onClick={() => downloadGeometry("glb")} disabled={!modelObject || exporting !== null}><b>{exporting === "glb" ? "Gerando…" : "Baixar GLB"}</b><small>Materiais e hierarquia 3D</small></button>
              <button onClick={exportProject}><b>Baixar JSON</b><small>Parâmetros técnicos do projeto</small></button>
              <button onClick={downloadTechnicalSheet}><b>Baixar ficha técnica</b><small>Dimensões, materiais e avisos em texto</small></button>
              <button onClick={() => downloadGeometry("blend")} disabled={!modelObject || exporting !== null}><b>{exporting === "blend" ? "Gerando…" : "Baixar BLEND"}</b><small>Conversão pelo worker Blender</small></button>
            </div>
          </section>
        </div>
      )}

      {technicalOpen && (
        <div className="technical-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setTechnicalOpen(false)}>
          <section className="technical-sheet" role="dialog" aria-modal="true" aria-labelledby="technical-title">
            <header>
              <div><span>Especificação do projeto</span><h2 id="technical-title">{projectName}</h2></div>
              <button aria-label="Fechar especificação" onClick={() => setTechnicalOpen(false)}><X size={20} /></button>
            </header>
            <div className={`technical-status ${compatibility.status}`}>
              {compatibility.status === "compatible" ? <Check size={19} /> : <AlertTriangle size={19} />}
              <div><b>{compatibility.status === "compatible" ? "Configuração aprovada pelas regras do catálogo" : "Configuração precisa de atenção"}</b><small>Validação preliminar do configurador; não substitui avaliação clínica ou de engenharia.</small></div>
            </div>
            {compatibility.issues.length > 0 && (
              <div className="issue-list">
                {compatibility.issues.map((issue) => <button key={issue.id} onClick={() => { setActive(issue.section); setTechnicalOpen(false); }}><AlertTriangle size={16} /><span><b>{issue.title}</b><small>{issue.detail}</small></span></button>)}
              </div>
            )}
            <div className="bom-heading"><span><Wrench size={16} /> Componentes selecionados</span><b>{estimatedWeight.toFixed(2).replace(".", ",")} kg</b></div>
            <div className="bom-list">
              {billOfMaterials.map((item) => (
                <article key={item.code}>
                  <span>{item.category}</span><div><b>{item.name}</b><small>{item.specification}</small></div><code>{item.code}</code><strong>{item.weightKg.toFixed(2).replace(".", ",")} kg</strong>
                </article>
              ))}
            </div>
            <footer><small>Documento conceitual · revisão 02</small><button onClick={downloadTechnicalSheet}><Download size={16} /> Baixar ficha técnica</button></footer>
          </section>
        </div>
      )}

      {projectsOpen && (
        <div className="projects-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProjectsOpen(false)}>
          <section className="projects-sheet" role="dialog" aria-modal="true" aria-labelledby="projects-title">
            <header>
              <div><span>Área de projetos</span><h2 id="projects-title">Seus projetos MOVINN</h2><p>Crie variações sem perder a configuração atual.</p></div>
              <button className="sheet-close" aria-label="Fechar projetos" onClick={() => setProjectsOpen(false)}><X size={20} /></button>
            </header>
            <button className="new-project-button" onClick={newProject}><Plus size={18} /><span><b>Novo projeto</b><small>Começar com a configuração padrão</small></span></button>
            <div className="project-list">
              {projects.map((project) => {
                const isActive = project.id === activeProjectId;
                const projectWeight = getEstimatedWeight(isActive ? config : project.config);
                return (
                  <article key={project.id} className={isActive ? "project-row active" : "project-row"}>
                    <button className="project-open" onClick={() => selectProject(project)}>
                      <span className="project-mark"><MovinnMark inverse /></span>
                      <span className="project-copy"><b>{project.name}</b><small>{project.product} · {project.config.seatWidth} cm · {projectWeight.toFixed(1).replace(".", ",")} kg</small><time>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(project.updatedAt))}</time></span>
                      <span className="project-state">{isActive ? "Em edição" : <FolderOpen size={17} />}</span>
                    </button>
                    <button className="duplicate-project" aria-label={`Duplicar ${project.name}`} onClick={() => duplicateProject(project)}><Copy size={16} /></button>
                  </article>
                );
              })}
            </div>
            <footer><span>{projects.length} {projects.length === 1 ? "projeto salvo" : "projetos salvos"} neste dispositivo</span><small>Sincronização em nuvem será adicionada na próxima integração.</small></footer>
          </section>
        </div>
      )}
      {notice && <div className="app-notice" role="status"><span>{notice}</span><button aria-label="Fechar aviso" onClick={() => setNotice("")}><X size={15} /></button></div>}
    </main>
  );
}

function ColorPicker({ label, value, colors, onChange }: { label: string; value: string; colors: string[]; onChange: (value: string) => void }) {
  return (
    <fieldset className="color-picker">
      <legend>{label}</legend>
      <div>{colors.map((color) => <button key={color} type="button" aria-pressed={value === color} onClick={() => onChange(color)} aria-label={`Selecionar cor ${color}`} className={value === color ? "selected" : ""} style={{ backgroundColor: color }}>{value === color && <Check size={17} />}</button>)}</div>
    </fieldset>
  );
}
