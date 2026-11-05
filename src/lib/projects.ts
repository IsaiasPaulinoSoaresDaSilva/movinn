import type { ChairConfig } from "./catalog";

export type MovinnProject = {
  id: string;
  name: string;
  product: "Active 01";
  createdAt: string;
  updatedAt: string;
  config: ChairConfig;
};

type ProjectLibrary = {
  schemaVersion: 1;
  activeProjectId: string;
  projects: MovinnProject[];
};

const LIBRARY_KEY = "movinn-project-library";
const LEGACY_CONFIG_KEYS = ["movinn-config", "hotwheels-config"];

export function createMovinnProject(name: string, config: ChairConfig): MovinnProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    product: "Active 01",
    createdAt: now,
    updatedAt: now,
    config: { ...config },
  };
}

export function loadProjectLibrary(defaultConfig: ChairConfig): ProjectLibrary {
  const stored = window.localStorage.getItem(LIBRARY_KEY);
  if (stored) {
    try {
      const library = JSON.parse(stored) as ProjectLibrary;
      if (library.schemaVersion === 1 && Array.isArray(library.projects) && library.projects.length > 0) {
        const projects = library.projects.map((project) => ({ ...project, config: { ...defaultConfig, ...project.config } }));
        const activeExists = library.projects.some((project) => project.id === library.activeProjectId);
        return { ...library, projects, activeProjectId: activeExists ? library.activeProjectId : projects[0].id };
      }
    } catch { /* Fall through to migration. */ }
  }

  let migratedConfig = defaultConfig;
  for (const key of LEGACY_CONFIG_KEYS) {
    const legacy = window.localStorage.getItem(key);
    if (!legacy) continue;
    try {
      migratedConfig = { ...defaultConfig, ...JSON.parse(legacy) };
      break;
    } catch { /* Try the next legacy key. */ }
  }

  const firstProject = createMovinnProject("MOVINN Active 01", migratedConfig);
  const library: ProjectLibrary = {
    schemaVersion: 1,
    activeProjectId: firstProject.id,
    projects: [firstProject],
  };
  saveProjectLibrary(library.projects, library.activeProjectId);
  return library;
}

export function saveProjectLibrary(projects: MovinnProject[], activeProjectId: string) {
  const library: ProjectLibrary = { schemaVersion: 1, activeProjectId, projects };
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function updateProject(project: MovinnProject, config: ChairConfig): MovinnProject {
  return { ...project, config: { ...config }, updatedAt: new Date().toISOString() };
}

export function projectFileName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "movinn-project"}.json`;
}
