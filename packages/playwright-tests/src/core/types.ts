export type IssueTrackerType = 'jira' | 'linear' | 'github' | 'gitlab' | 'azure-boards' | 'none';
export type CIProvider = 'github-actions' | 'gitlab-ci' | 'azure-pipelines' | 'bitbucket-pipelines' | 'local';
export type SecretsProvider = 'env' | 'infisical' | 'vault' | 'doppler';

export interface BrandingConfig {
  displayName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor?: string;
}

export interface IssueTrackerConfig {
  type: IssueTrackerType;
  baseUrl: string;
  ticketRegex: string;
  exampleTicket?: string;
}

export interface GitConfig {
  scopes: string[];
  branchPattern?: string;
}

export interface CIConfig {
  provider: CIProvider;
  pipelineUrl?: string;
}

export interface TargetEnvironment {
  baseUrl: string;
  apiBaseUrl?: string;
  extra?: Record<string, unknown>;
}

export interface EnvironmentsConfig {
  default: string;
  targets: Record<string, TargetEnvironment>;
}

export interface SecretsConfig {
  provider?: SecretsProvider;
  prefix?: string;
}

export interface PlaywrightProjectConfig {
  testDir: string;
  pageObjectsDir: string;
  fixturesDir?: string;
  defaultTimeout?: number;
  retries?: {
    ci?: number;
    local?: number;
  };
}

export interface ProjectConfig {
  $schema?: string;
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  branding: BrandingConfig;
  issueTracker: IssueTrackerConfig;
  git: GitConfig;
  ci: CIConfig;
  environments: EnvironmentsConfig;
  secrets?: SecretsConfig;
  playwright: PlaywrightProjectConfig;
}
