import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

interface ProjectSecretsConfig {
  provider?: 'env' | 'infisical' | 'doppler' | 'vault';
  env?: string;
  projectSlug?: string;
  prefix?: string;
}

interface ProjectConfig {
  id: string;
  secrets?: ProjectSecretsConfig;
  environments: {
    default: string;
  };
}

export function runWithSecrets(): void {
  const projectId = process.env.PROJECT_ID || 'demo-ecommerce';
  const targetEnv = process.env.TARGET_ENV;

  const projectConfigPath = path.join(ROOT_DIR, 'projects', `${projectId}.json`);
  let secretsConfig: ProjectSecretsConfig = { provider: 'env' };

  if (fs.existsSync(projectConfigPath)) {
    try {
      const parsed: ProjectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'));
      secretsConfig = parsed.secrets || { provider: 'env' };
      if (!secretsConfig.env) {
        secretsConfig.env = targetEnv || parsed.environments.default || 'staging';
      }
    } catch {
      // Fallback to env
    }
  }

  // Retrieve user command passed after --
  const commandArgs = process.argv.slice(2);
  if (commandArgs.length === 0) {
    console.error('❌ Aucune commande spécifiée. Utilisation: pnpm secrets:run -- <commande>');
    process.exit(1);
  }

  let executable = commandArgs[0];
  let finalArgs = commandArgs.slice(1);

  const provider = secretsConfig.provider || 'env';
  console.log(`🔐 Gestionnaire de secrets actif : [${provider.toUpperCase()}] pour le projet [${projectId}] (env: ${secretsConfig.env})`);

  switch (provider) {
    case 'infisical': {
      // Wrapper pour Infisical CLI
      executable = 'infisical';
      const infisicalArgs = ['run', '--env', secretsConfig.env || 'staging'];
      if (secretsConfig.projectSlug) {
        infisicalArgs.push('--projectId', secretsConfig.projectSlug);
      }
      infisicalArgs.push('--', ...commandArgs);
      finalArgs = infisicalArgs;
      break;
    }

    case 'doppler': {
      // Wrapper pour Doppler CLI
      executable = 'doppler';
      const dopplerArgs = ['run', '--config', secretsConfig.env || 'stg'];
      if (secretsConfig.projectSlug) {
        dopplerArgs.push('--project', secretsConfig.projectSlug);
      }
      dopplerArgs.push('--', ...commandArgs);
      finalArgs = dopplerArgs;
      break;
    }

    case 'vault': {
      // Wrapper pour HashiCorp Vault
      executable = 'vault';
      finalArgs = ['run', '--', ...commandArgs];
      break;
    }

    case 'env':
    default: {
      // Standard local execution, dotenv is handled in node runtime
      break;
    }
  }

  const child = spawn(executable, finalArgs, {
    stdio: 'inherit',
    shell: true,
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PROJECT_ID: projectId,
      ...(targetEnv ? { TARGET_ENV: targetEnv } : {}),
    },
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

runWithSecrets();
