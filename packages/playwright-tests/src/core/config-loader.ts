import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProjectConfig, TargetEnvironment } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolves path to projects directory (../../../../projects from src/core)
const PROJECTS_DIR = path.resolve(__dirname, '../../../../projects');

export class ConfigLoader {
  private static cachedProjects: Map<string, ProjectConfig> | null = null;

  public static loadAllProjects(): ProjectConfig[] {
    if (this.cachedProjects) {
      return Array.from(this.cachedProjects.values());
    }

    const projects = new Map<string, ProjectConfig>();

    if (!fs.existsSync(PROJECTS_DIR)) {
      console.warn(`[ConfigLoader] Directory not found: ${PROJECTS_DIR}`);
      return [];
    }

    const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(PROJECTS_DIR, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as ProjectConfig;
        if (parsed.id && (parsed.active === undefined || parsed.active === true)) {
          projects.set(parsed.id, parsed);
        }
      } catch (err) {
        console.error(`[ConfigLoader] Error reading ${filePath}:`, err);
      }
    }

    this.cachedProjects = projects;
    return Array.from(projects.values());
  }

  public static getProject(projectId: string): ProjectConfig {
    const all = this.loadAllProjects();
    const found = all.find((p) => p.id === projectId);
    if (!found) {
      throw new Error(`[ConfigLoader] Project with id '${projectId}' not found in ${PROJECTS_DIR}`);
    }
    return found;
  }

  public static getTargetEnvironment(
    project: ProjectConfig,
    envName?: string
  ): { name: string; env: TargetEnvironment } {
    const selected = envName || process.env.TARGET_ENV || project.environments.default;
    const target = project.environments.targets[selected];

    if (!target) {
      const available = Object.keys(project.environments.targets).join(', ');
      throw new Error(
        `[ConfigLoader] Environment '${selected}' not found for project '${project.id}'. Available: [${available}]`
      );
    }

    return { name: selected, env: target };
  }
}
