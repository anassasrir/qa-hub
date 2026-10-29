import fs from "fs";
import path from "path";
import {
  TestCase,
  TestSuite,
  consolidateTestSuites,
} from "./utils";

export type { TestCase, TestSuite };
export { consolidateTestSuites };

export interface TestStep {
  title: string;
}

function findNextQuoteIndex(content: string, startIndex: number): number {
  let i = startIndex;
  while (i < content.length && (/\s/.test(content[i]) || content[i] === ",")) {
    i++;
  }
  return i;
}

function extractString(content: string, startIndex: number): { value: string, endIndex: number } | null {
  const quoteIndex = findNextQuoteIndex(content, startIndex);
  const quote = content[quoteIndex];
  
  if (quote !== "'" && quote !== '"' && quote !== '`') return null;

  let value = "";
  let i = quoteIndex + 1;
  while (i < content.length) {
    if (content[i] === quote && content[i - 1] !== '\\') {
      return { value, endIndex: i + 1 };
    }
    value += content[i];
    i++;
  }
  return null;
}

export function parseSpecFile(filePath: string, relativePath: string): TestSuite[] {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const suites: TestSuite[] = [];

    const stepDefinitions: Record<string, string> = {};
    const stepsMatch = /const\s+STEPS\s*=\s*{([\s\S]+?)}/.exec(content);
    if (stepsMatch) {
      const stepsBody = stepsMatch[1];
      const stepRegex = /([A-Z0-9_]+)\s*:\s*/g;
      let m;
      while ((m = stepRegex.exec(stepsBody)) !== null) {
        const key = m[1];
        const val = extractString(stepsBody, m.index + m[0].length);
        if (val) stepDefinitions[key] = val.value;
      }
    }

    const describeRegex = /test\.describe\(/g;
    let describeMatch;

    while ((describeMatch = describeRegex.exec(content)) !== null) {
      const suiteTitleObj = extractString(content, describeMatch.index + "test.describe(".length);
      if (!suiteTitleObj) continue;

      const suiteTitle = suiteTitleObj.value.trim();
      
      const testCases: TestCase[] = [];
      
      const nextDescribeIdx = content.indexOf('test.describe(', describeMatch.index + 1);
      const suiteContent = content.substring(describeMatch.index, nextDescribeIdx > -1 ? nextDescribeIdx : undefined);
      
      const loopRegex = /for\s*\(\s*const\s+(\w+)\s+of\s+(\w+)\s*\)\s*{([\s\S]+?)\n\s*}/g;
      let loopMatch;
      while ((loopMatch = loopRegex.exec(suiteContent)) !== null) {
        const itemVar = loopMatch[1];
        const arrayVar = loopMatch[2];
        const loopBody = loopMatch[3];

        const arrayDefRegex = new RegExp(`const\\s+${arrayVar}\\s*=\\s*\\[([\\s\\S]+?)\\]\\s*;`, 'g');
        const arrayDefMatch = arrayDefRegex.exec(content);
        
        if (arrayDefMatch) {
          try {
             const arrayStr = arrayDefMatch[1];
             const objectRegex = /{\s*([\s\S]+?)\s*}/g;
             let objMatch;
             const dataArray: Record<string, string>[] = [];
             while ((objMatch = objectRegex.exec(arrayStr)) !== null) {
               const objBody = objMatch[1];
               const kvRegex = /(\w+)\s*:\s*(?:['"`](.*?)['"`]|([\d\w\.]+))/g;
               let kvMatch;
               const dataItem: Record<string, string> = {};
               while ((kvMatch = kvRegex.exec(objBody)) !== null) {
                 const key = kvMatch[1];
                 const val = kvMatch[2] || kvMatch[3];
                 dataItem[key] = val;
               }
               if (Object.keys(dataItem).length > 0) dataArray.push(dataItem);
             }

             const innerTestRegex = /test(\.(skip|only|fixme))?\(\s*[`'"]([\s\S]+?)[`'"]\s*,\s*(async|{)/g;
             let innerMatch;
             while ((innerMatch = innerTestRegex.exec(loopBody)) !== null) {
              const variant = innerMatch[2] as 'skip' | 'only' | 'fixme' | undefined;
              const status = variant || 'run';
              const rawTitle = innerMatch[3];

              dataArray.forEach((dataItem: Record<string, string>) => {
                let resolvedTitle = rawTitle;
                Object.keys(dataItem).forEach(key => {
                  const val = dataItem[key];
                  resolvedTitle = resolvedTitle.replace(new RegExp(`\\$\\{${itemVar}(\\.${key}|\\['${key}'\\]|\\["${key}"\\])\\}`, 'g'), val);
                });

                testCases.push({
                  id: `${suiteTitle}-${resolvedTitle}-${testCases.length}`,
                  title: resolvedTitle.replace(/@[\w-]+/g, '').trim(),
                  steps: [],
                  file: relativePath,
                  status
                });
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      
      const testRegex = /test(\.(skip|only|fixme))?\(/g;
      let testMatch;

      while ((testMatch = testRegex.exec(suiteContent)) !== null) {
        // Skip common false positives
        if (testMatch[0].includes('test.step') || testMatch[0].includes('test.describe') || 
            testMatch[0].includes('test.before') || testMatch[0].includes('test.after')) continue;

        const variant = testMatch[2] as 'skip' | 'only' | 'fixme' | undefined;
        const status = variant || 'run';

        const prevChar = suiteContent[testMatch.index - 1];
        if (prevChar === '.') continue;

        const testTitleObj = extractString(suiteContent, testMatch.index + testMatch[0].length);
        if (!testTitleObj) continue;

        const testTitle = testTitleObj.value.trim().replace(/@[\w-]+/g, '').trim();

        const steps: TestStep[] = [];
        const nextTestIdx = suiteContent.indexOf('test(', testTitleObj.endIndex);
        const testBody = suiteContent.substring(testTitleObj.endIndex, nextTestIdx > -1 ? nextTestIdx : undefined);
        
        const stepRegex = /test\.step\(\s*/g;
        let stepMatch;
        while ((stepMatch = stepRegex.exec(testBody)) !== null) {
          const startIdx = stepMatch.index + stepMatch[0].length;
          const firstChar = testBody[startIdx];
          
          let stepTitle = "";
          if (firstChar === "'" || firstChar === '"' || firstChar === '`') {
            const res = extractString(testBody, startIdx);
            if (res) stepTitle = res.value;
          } else {
            const varMatch = /^([A-Z0-9._]+)/.exec(testBody.substring(startIdx));
            if (varMatch) {
              const fullVarName = varMatch[1];
              const key = fullVarName.includes('.') ? fullVarName.split('.')[1] : fullVarName;
              stepTitle = stepDefinitions[key] || fullVarName;
            }
          }
          if (stepTitle && !stepTitle.includes('async')) {
            steps.push({ title: stepTitle });
          }
        }

        testCases.push({
          id: `${suiteTitle}-${testTitle}-${testCases.length}`,
          title: testTitle,
          steps,
          file: relativePath,
          status
        });
      }

      suites.push({
        id: `${suiteTitle}-${suites.length}`,
        title: suiteTitle,
        testCases,
        file: relativePath
      });
    }

    return suites;
  } catch (e) {
    console.error(`Error parsing spec file ${filePath}:`, e);
    return [];
  }
}

/**
 * Parse un fichier Markdown de spécification
 */
export function parseMarkdownSpec(filePath: string, relativePath: string): TestSuite[] {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const suites: TestSuite[] = [];
    
    // On divise par Feature (H3)
    const features = content.split(/^### /m).slice(1);
    
    features.forEach((featureBlock, fIdx) => {
      const lines = featureBlock.split('\n');
      const featureTitle = lines[0].trim();
      
      const testCases: TestCase[] = [];
      
      // On divise par Scénario (H4)
      const scenarios = featureBlock.split(/^#### /m).slice(1);
      
      scenarios.forEach((scenarioBlock, sIdx) => {
        const sLines = scenarioBlock.split('\n');
        const scenarioTitle = sLines[0].trim();
        
        const steps: TestStep[] = [];
        let inSteps = false;
        
        sLines.forEach(line => {
          if (line.includes('**Steps:**')) {
            inSteps = true;
            return;
          }
          if (inSteps) {
            const stepMatch = /^\s*\d+\.\s+(.*)/.exec(line);
            if (stepMatch) {
              steps.push({ title: stepMatch[1].trim() });
            } else if (line.trim() === "" || line.startsWith('#') || line.includes('**')) {
              // On sort du bloc steps si on rencontre un autre titre ou une ligne vide après des steps
              if (steps.length > 0 && !line.trim().startsWith('-')) inSteps = false;
            }
          }
        });

        testCases.push({
          id: `${featureTitle}-${scenarioTitle}-${sIdx}`,
          title: scenarioTitle,
          steps,
          file: relativePath
        });
      });

      suites.push({
        id: `${featureTitle}-${fIdx}`,
        title: featureTitle,
        testCases,
        file: relativePath
      });
    });

    return suites;
  } catch (e) {
    console.error(`Error parsing markdown spec ${filePath}:`, e);
    return [];
  }
}

/**
 * Parse un fichier Gherkin (.feature)
 */
export function parseGherkinSpec(filePath: string, relativePath: string): TestSuite[] {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const suites: TestSuite[] = [];
    
    // Extraction des tags globaux (avant Fonctionnalité)
    const globalTags: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('@')) {
        globalTags.push(...trimmed.split(/\s+/));
      } else if (trimmed.startsWith('Fonctionnalité:')) {
        break;
      }
    }

    // Extraction du Contexte s'il existe
    const contextMatch = /Contexte:\s*([\s\S]*?)(?=Scénario:|$)/i.exec(content);
    const contextSteps: TestStep[] = [];
    if (contextMatch) {
      const bgLines = contextMatch[1].split('\n');
      bgLines.forEach(line => {
        const trimmed = line.trim();
        if (/^(Étant donné que|Etant donné que|Étant donné|Etant donné|Quand|Lorsque|Alors|Donc|Et que|Et|Mais)\b/i.test(trimmed)) {
          contextSteps.push({ title: trimmed });
        }
      });
    }

    // Extraction de la Feature
    const featureMatch = /Fonctionnalité:\s*(.*)/.exec(content);
    if (!featureMatch) return [];
    
    const featureTitle = featureMatch[1].trim();
    const testCases: TestCase[] = [];
    
    // On divise par Scénario
    const scenarios = content.split(/^\s*Scénario:\s*/m).slice(1);
    
    scenarios.forEach((scenarioBlock, sIdx) => {
      const sLines = scenarioBlock.split('\n');
      const scenarioTitle = sLines[0].trim();
      
      // Extraction des tags du scénario (juste avant le scénario)
      const scenarioTags: string[] = [];
      const contentBeforeScenario = content.split(`Scénario: ${scenarioTitle}`)[0];
      const beforeScenarioLines = contentBeforeScenario.split('\n');
      for (let i = beforeScenarioLines.length - 1; i >= 0; i--) {
        const line = beforeScenarioLines[i].trim();
        if (line === "") continue;
        if (line.startsWith('@')) {
          scenarioTags.push(...line.split(/\s+/));
        } else {
          break;
        }
      }

      const steps: TestStep[] = [...contextSteps];
      
      sLines.slice(1).forEach(line => {
        const trimmedLine = line.trim();
        if (/^(Étant donné que|Etant donné que|Étant donné|Etant donné|Quand|Lorsque|Alors|Donc|Et que|Et|Mais)\b/i.test(trimmedLine)) {
          steps.push({ title: trimmedLine });
        }
      });

      testCases.push({
        id: `${featureTitle}-${scenarioTitle}-${sIdx}`,
        title: scenarioTitle,
        steps,
        file: relativePath,
        tags: [...new Set([...globalTags, ...scenarioTags])]
      });
    });

    suites.push({
      id: `${featureTitle}-0`,
      title: featureTitle,
      testCases,
      file: relativePath
    });

    return suites;
  } catch (e) {
    console.error(`Error parsing gherkin spec ${filePath}:`, e);
    return [];
  }
}

export function getProjectTestPlan(projectKeywords?: string[]): TestSuite[] {
  const specsBaseDir = path.resolve(process.cwd(), "../../packages/playwright-tests/specs");
  const testsBaseDir = path.resolve(process.cwd(), "../../packages/playwright-tests/tests");
  const allSuites: TestSuite[] = [];

  if (!fs.existsSync(specsBaseDir)) return [];

  // 1. Scanner les IMPLEMENTATIONS pour le matching
  const implementedTests: Record<string, Map<string, TestCase>> = {};
  
  const scanTests = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.lstatSync(fullPath);
      if (stat.isDirectory()) {
        scanTests(fullPath);
      } else if (file.endsWith(".spec.ts")) {
        const relPath = path.relative(testsBaseDir, fullPath);
        const parsed = parseSpecFile(fullPath, relPath);
        const titlesMap = new Map<string, TestCase>();
        parsed.forEach(s => s.testCases.forEach(tc => titlesMap.set(tc.title.toLowerCase(), tc)));
        implementedTests[relPath] = titlesMap;
      }
    }
  };
  scanTests(testsBaseDir);

  // 2. Scanner les SPECS (Source de vérité)
  const scanSpecs = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.lstatSync(fullPath);

      if (stat.isDirectory()) {
        scanSpecs(fullPath);
      } else if (file.endsWith(".md") || file.endsWith(".feature")) {
        const relativePath = path.relative(specsBaseDir, fullPath);
        if (!projectKeywords || projectKeywords.some(kw => relativePath.toLowerCase().includes(kw.toLowerCase()))) {
           let suites: TestSuite[] = [];
           if (file.endsWith(".feature")) {
             suites = parseGherkinSpec(fullPath, relativePath);
           } else {
             suites = parseMarkdownSpec(fullPath, relativePath);
           }
           
           // Matching Logic
           suites.forEach(suite => {
             let automatedInSuite = 0;
             suite.testCases.forEach(tc => {
               // On cherche le fichier .spec.ts correspondant
               // On retire .plan.md ou .feature et on ajoute .spec.ts
               const expectedTestFile = relativePath
                 .replace(".plan.md", ".spec.ts")
                 .replace(".feature", ".spec.ts");
                 
               const implementationTitlesMap = implementedTests[expectedTestFile];
               
               let matchedTestCase: TestCase | null = null;
               if (implementationTitlesMap) {
                 const lowerTitle = tc.title.toLowerCase();
                 if (implementationTitlesMap.has(lowerTitle)) {
                   matchedTestCase = implementationTitlesMap.get(lowerTitle)!;
                 } else {
                   // Fallback to regex matching for dynamic tests (containing ${...})
                   for (const [implTitle, implTc] of implementationTitlesMap.entries()) {
                     if (implTitle.includes('${')) {
                       const pattern = implTitle
                        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
                        .replace(/\\\$\\\{.*?\\\}/g, '.*')    // Convert ${...} to .*
                       const regex = new RegExp(`^${pattern}$`);
                       if (regex.test(lowerTitle)) {
                         matchedTestCase = implTc;
                         break;
                       }
                     }
                   }
                 }
               }

               if (matchedTestCase) {
                 tc.automated = true;
                 tc.status = matchedTestCase.status;
                 automatedInSuite++;
               } else if (file.endsWith(".feature")) {
                 tc.automated = true;
                 tc.status = "run";
                 automatedInSuite++;
               } else {
                 tc.automated = false;
               }
             });
             suite.automatedCount = automatedInSuite;
             allSuites.push(suite);
           });
        }
      }
    }
  };

  scanSpecs(specsBaseDir);
  return consolidateTestSuites(allSuites);
}
