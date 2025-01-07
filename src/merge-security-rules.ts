import fs, { Stats } from 'fs';
import path from 'path';
import { CommonStatic } from './static/common.static';
import { ErrorMessageStatic } from './static/errorMessage.static';

function isEmptyString(str: string): boolean {
  return str === null || str === undefined || str.trim() === CommonStatic.EMPTY_STRING;
}

function isEmptyArray(arry: string[]): boolean {
  return arry === null || arry === undefined || arry.length === CommonStatic.NO_ELEMENT;
}

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

  if (isEmptyString(rootSrTemplateFile) && isRootDir) {
    throw new Error(ErrorMessageStatic.SR_TEMPLATE_NOT_FOUND_ERROR.replace('{rootSrTemplate}', rootSrTemplate));
  }
  if (isEmptyArray(results)) {
    throw new Error(ErrorMessageStatic.NO_RULE_FILE_TO_MERGE);
  }
  return { rootSrTemplateFile, subSrFiles: results };
}

// export default function mergeSecurityRules() {
//   // TODO
//   return "example: merged security rules"
// }
