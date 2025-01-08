import fs, { Stats } from 'fs';
import path from 'path';
import { CommonStatic } from './static/common.static';
import { ErrorMessageStatic } from './static/errorMessage.static';

const REGEX_CONTENT_WITH_TRAILING_CLOSING_BRACES = /(.*)(\s*\}\s*\}\s*)$/;
/**
 * Scan the directory and its subdirectories for all '.rules' files
 *
 * @param dir workspace path
 * @param rootSrTemplate  root SR template file name
 * @returns The path of all `.rules` files
 */
export function findRulesFiles(dir: string, rootSrTemplate: string, isRootDir = true): { rootSrTemplateFile: string, subSrFiles: string[] } {
  let results: string[] = [];
  let rootSrTemplateFile: string = CommonStatic.EMPTY_STRING;
  const templatePath: string = path.join(dir, rootSrTemplate);
  const list: string[] = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath: string = path.join(dir, file);
    const stat: Stats = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const { subSrFiles } = findRulesFiles(filePath, rootSrTemplate, false);
      results = results.concat(subSrFiles);
    } else if (filePath.endsWith(CommonStatic.RULES_FILE_SUFFIX)) {
      results.push(filePath);
    } else if (filePath === templatePath && isRootDir) {
      if (rootSrTemplateFile) {
        throw new Error(ErrorMessageStatic.MULTIPLE_SR_TEMPLATE_FILES_ERROR.replace('{rootSrTemplate}', rootSrTemplate));
      }
      rootSrTemplateFile = filePath;
    }
  });

  if (rootSrTemplateFile === CommonStatic.EMPTY_STRING && isRootDir) {
    throw new Error(ErrorMessageStatic.SR_TEMPLATE_NOT_FOUND_ERROR.replace('{rootSrTemplate}', rootSrTemplate));
  }
  if (results.length === CommonStatic.NO_ELEMENT) {
    throw new Error(ErrorMessageStatic.NO_RULE_FILE_TO_MERGE);
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
    return await fs.promises.readFile(filePath, CommonStatic.ENCODING_UTF8);
  } catch (error) {
    throw new Error(ErrorMessageStatic.FILE_READ_FAILED_ERROR.replace('{filePath}', filePath).replace('{error}', (error as Error).toString()));
  }
}

/**
 * Merges the contents of multiple sub-rule files with a specified template file and generates a new root rule file.
 * If the root rule file already exists, it will be overwritten.
 *
 * @param workspacePath - The repository path where the security rule files are located.
 * @param rootSrTemplate - The file name of the root security rule template that will be used as the base.
 * @param rootSrFile - The name of the output file where the final merged security rules will be saved. 
 *If this file exists, it will be overwritten.
 */
export async function mergeSecurityRules(workspacePath: string, rootSrTemplate: string, rootSrFile: string) {
  const { rootSrTemplateFile, subSrFiles } = exports.findRulesFiles(workspacePath, rootSrTemplate);

  const subSrContents: string[] = await Promise.all(
    subSrFiles.map((file: string) => exports.readFileContent(file))
  );

  const mergedSubSrContent: string = subSrContents.join(CommonStatic.NEW_LINE_SYMBOL);

  const rootSrTemplateContent: string = await exports.readFileContent(rootSrTemplateFile);

  const finalContent: string = rootSrTemplateContent.replace(
    REGEX_CONTENT_WITH_TRAILING_CLOSING_BRACES,
    (_, start, end) => {
      const cleanedSubRules = mergedSubSrContent
        .split(CommonStatic.NEW_LINE_SYMBOL)
        .map(line => line.trim() ? `    ${line}` : CommonStatic.EMPTY_STRING)
        .join(CommonStatic.NEW_LINE_SYMBOL)
      return `${start}\n${cleanedSubRules}${end}`;
    }
  );
  fs.writeFileSync(path.join(workspacePath, rootSrFile), finalContent);
}
