import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PROJECTS_DIR = path.join(ROOT_DIR, 'projects');
const REGISTRY_OUT = path.join(ROOT_DIR, 'apps/qa-dashboard/lib/projects-registry.json');
const PROJECTS_JSON_OUT = path.join(ROOT_DIR, 'apps/qa-dashboard/lib/projects.json');

export function syncProjects(): void {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.warn(`[sync-projects] Dossier introuvable: ${PROJECTS_DIR}`);
    return;
  }

  const projectFiles = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'));
  const projectsConfig = [{ id: 'all', label: 'Tous les projets' }];
  const externalProjects: Array<{ id: string; projectId: string; url: string; branch: string }> = [];

  for (const file of projectFiles) {
    try {
      const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.id && (parsed.active === undefined || parsed.active === true)) {
        const keywords = [parsed.id, ...(parsed.git?.scopes || [])];
        projectsConfig.push({
          id: parsed.id,
          label: parsed.branding?.displayName || parsed.name || parsed.id,
          keywords,
        });

        externalProjects.push({
          id: parsed.id,
          projectId: parsed.id,
          url: parsed.ci?.pipelineUrl || '',
          branch: 'main',
        });
      }
    } catch (e) {
      console.error(`[sync-projects] Erreur lors de la lecture de ${file}:`, e);
    }
  }

  fs.writeFileSync(REGISTRY_OUT, JSON.stringify(projectsConfig, null, 2), 'utf-8');
  fs.writeFileSync(PROJECTS_JSON_OUT, JSON.stringify(externalProjects, null, 2), 'utf-8');
  console.log(`✅ [sync-projects] Synchronisé ${projectsConfig.length - 1} projet(s) vers ${path.relative(ROOT_DIR, REGISTRY_OUT)}`);
}

syncProjects();
