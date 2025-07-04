import fs from 'fs';
import path from 'path';
import { CommonStatic } from './static/common.static';
import { ErrorMessageStatic } from './static/errorMessage.static';

/**
 * This regular expression is used to split a root security rule template into two parts:
 *
 * 1. The first part contains everything before the closing curly braces '}}'.
 *    This part includes service declarations, rules version, and any other rule-related content (or empty content if no rules) before the final closing brackets.
 *
 * 2. The second part contains just the closing curly braces '}}', allowing us to replace or insert content only within the rule body.
 *
 * Use case example:
 *
 * Input:
 *
 * ```text
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // some rules here (or empty content if no rules)
 *   }
 * }
 * ```
 *
 * After applying the regular expression, we split this into:
 *
 * - Group 1 (before `}}`):
 *    ```text
 *    rules_version = '2';
 *    service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // some rules here (or empty content if no rules)
 *   }
 * ```
 *
 * - Group 2 (trailing `}}`):
 *    ```text
 *   }
 * }
 * ```
 */
const REGEX_CONTENT_WITH_TRAILING_CLOSING_BRACES = /(.*)(\s*\}\s*\}\s*)$/;

function isEmptyString(str: string): boolean {
  return str === null || str === undefined || str.trim() === CommonStatic.EMPTY_STRING;
}

function isEmptyArray(arry: string[]): boolean {
  return arry === null || arry === undefined || arry.length === CommonStatic.NO_ELEMENT;
}

/**
 * Scan the directory and its subdirectories for all '.rules' files
 *
 * This function will skip `firestore.rules` and `storage.rules` files, as we do not want to include them
 * in the repository. If any of these files are found, they will be ignored.
 *
 * @param dir workspace path
 * @param rootSrTemplate  root SR template file name
 * @returns The path of all `.rules` files
 */
export function findRulesFiles(dir: string, rootSrTemplate: string, isRootDir = true): { rootSrTemplateFile: string, subSrFiles: string[] } {
  if (!fs.existsSync(dir)) {
    throw new Error(ErrorMessageStatic.DIR_NOT_EXIST.replace('{dir}', dir));
  }

  let results: string[] = [];
  let rootSrTemplateFile: string = CommonStatic.EMPTY_STRING;
  const templatePath = path.join(dir, rootSrTemplate);
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const message = filePath.endsWith(CommonStatic.RULES_FILE_SUFFIX) ? "matched" : "not matched"
    console.log(`Current file: ${file} is ${message}`);

    if (stat.isDirectory()) {
      const { subSrFiles } = findRulesFiles(filePath, rootSrTemplate, false);
      results = results.concat(subSrFiles);
    } else if (filePath.endsWith(CommonStatic.RULES_FILE_SUFFIX)) {
      if (file === 'firestore.rules' || file === 'storage.rules') {
        return;
      }
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
    throw new Error(ErrorMessageStatic.FILE_READ_FAILED_ERROR.replace('{filePath}', filePath).replace('{error}', (error as Error).message));
  }
}

/**
 * Merges the contents of multiple sub-rule files with a specified template file and generates a new root rule file.
 * If the root rule file already exists, it will be overwritten.
 *
 * @param workspacePath - The repository path where the security rule files are located.
 * @param rootSrTemplate - The file name of the root security rule template that will be used as the base.
 * @param rootSrFile - The name of the output file where the final merged security rules will be saved. If this file exists, it will be overwritten.
 */
export async function mergeSecurityRules(workspacePath: string, rootSrTemplate: string, rootSrFile: string) {
  const { rootSrTemplateFile, subSrFiles } = findRulesFiles(workspacePath, rootSrTemplate);
  const subSrContents: string[] = await Promise.all(
    subSrFiles.map((file: string) => readFileContent(file))
  );
  const mergedSubSrContent: string = subSrContents.join(CommonStatic.NEW_LINE_SYMBOL);
  const rootSrTemplateContent: string = await readFileContent(rootSrTemplateFile);

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
