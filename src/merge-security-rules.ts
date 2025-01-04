import fs, { Stats } from 'fs';
import path from 'path';

/**
 * Scan the directory and its subdirectories for all '.rules' files
 * 
 * @param dir workspace path
 * @param rootSrTemplate  root SR template file name
 * @returns The path of all `.rules` files 
 */
export function findRulesFiles(dir: string, rootSrTemplate: string,isRootDir=true): { rootSrTemplateFile: string, subSrFiles: string[] } {
  let results: string[] = [];
  let rootSrTemplateFile: string = '';
  const templatePath: string = path.join(dir,rootSrTemplate);
  const list: string[] = fs.readdirSync(dir);

  list.forEach(file => { 
    const filePath: string = path.join(dir, file);
    const stat: Stats = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const { subSrFiles } = findRulesFiles(filePath, rootSrTemplate,false)
      results = results.concat(subSrFiles);
    } else if (filePath.endsWith('.rules')) {
      results.push(filePath);
    } else if (filePath === templatePath && isRootDir) {
      if (rootSrTemplateFile) {
        throw new Error(`Multiple SR Template files found: ${rootSrTemplate}. Cannot proceed.`)
      }
      rootSrTemplateFile = filePath
    }
  });

  if (rootSrTemplateFile === '' && isRootDir) {
    throw new Error(`Cannot find SR Template: ${rootSrTemplate}.`)
  }
  if (results.length === 0) {
    throw new Error ('No rule file need to merged, exit.')
  }
  return { rootSrTemplateFile, subSrFiles: results };
}

/**
 * reading specific file content
 *  
 * @param filePath file path
 * @returns the certain file content
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`reading file failed: ${filePath} by ${error}`);
  }
}

/**
 * 
 * @param workspacePath 
 * @param rootSrTemplate 
 * @param rootSrFile 
 * @returns 
 */
export async function mergeSecurityRules(workspacePath: string, rootSrTemplate: string, rootSrFile: string) {
  const { rootSrTemplateFile, subSrFiles } = findRulesFiles(workspacePath, rootSrTemplate);

  const subSrContents: string[] = await Promise.all(
    subSrFiles.map(file => readFileContent(file))
  );

  const mergedSubSrContent: string = subSrContents.join('\n');

  const rootSrTemplateContent: string = await readFileContent(rootSrTemplateFile);

  const finalContent: string = rootSrTemplateContent.replace(
    /(\{[\s\S]*\})/,
    (match) => {
      return match.replace(
        /(\})/,
        `\n${mergedSubSrContent.trim()}\n$1`
      );
    }
  );

  fs.writeFileSync(path.join(workspacePath, rootSrFile), finalContent);

  return "example: merged security rules"
}
