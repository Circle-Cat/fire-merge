import fs, { Stats } from 'fs';
import path from 'path';
import { CommonStatic } from './static/common.static';
import {ErrorMessageStatic} from './static/errorMessage.static'

/**
 * Scan the directory and its subdirectories for all '.rules' files
 * 
 * @param dir workspace path
 * @param rootSrTemplate  root SR template file name
 * @returns The path of all `.rules` files 
 */
export function findRulesFiles(dir: string, rootSrTemplate: string,isRootDir=true): { rootSrTemplateFile: string, subSrFiles: string[] } {
  let results: string[] = [];
  let rootSrTemplateFile: string = CommonStatic.EMPTY_STRING;
  const templatePath: string = path.join(dir,rootSrTemplate);
  const list: string[] = fs.readdirSync(dir);

  list.forEach(file => { 
    const filePath: string = path.join(dir, file);
    const stat: Stats = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const { subSrFiles } = findRulesFiles(filePath, rootSrTemplate,false);
      results = results.concat(subSrFiles);
    } else if (filePath.endsWith(CommonStatic.RULES_FILE_SUFFIX)) {
      results.push(filePath);
    } else if (filePath === templatePath && isRootDir) {
      if (rootSrTemplateFile) {
        throw new Error(ErrorMessageStatic.MULTIPLE_SR_TEMPLATE_FILES_ERROR.replace('{rootSrTemplate}',rootSrTemplate));
      }
      rootSrTemplateFile = filePath;
    }
  });

  if (rootSrTemplateFile === CommonStatic.EMPTY_STRING && isRootDir) {
    throw new Error(ErrorMessageStatic.SR_TEMPLATE_NOT_FOUND_ERROR.replace('{rootSrTemplate}',rootSrTemplate));
  }
  if (results.length === CommonStatic.NO_ELEMENT) {
    throw new Error (ErrorMessageStatic.NO_RULE_FILE_TO_MERGE);
  }
  return { rootSrTemplateFile, subSrFiles: results };
}

// export default function mergeSecurityRules() {
//   // TODO
//   return "example: merged security rules"
// }
