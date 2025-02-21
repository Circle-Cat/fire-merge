import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { CommonStatic } from './static/common.static.js';
import { ErrorMessageStatic } from './static/errorMessage.static.js';

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

/**
 * This function processes command line arguments passed to the script and
 * calls the provided callback with specific arguments extracted from the command line.
 * It looks for three specific arguments:
 * - `--workspace_path`: The repository path where the security rule files are located.
 * - `--root_sr_template`: The file name of the root security rule template that will be used as the base.
 * - `--root_sr_file`: The name of the output file where the final merged security rules will be saved.
 *
 * The function checks if the required parameters are provided. If any of the parameters
 * are missing, it logs an error and exits without calling the callback.
 *
 * @param callback - The callback function to be invoked once the command line
 * arguments are successfully parsed. The callback should accept three parameters:
 *  - `workspacePath` (string)
 *  - `rootSrTemplate` (string)
 *  - `rootSrFile` (string)
 *
 * @returns {Promise<void>} A promise that resolves when the callback is called with the parsed arguments.
 * If required arguments are missing, the promise will not resolve, and the function will log an error.
 *
 * @throws {Error} If any of the required command line arguments are missing, an error message will be logged.
 *
 */
export async function fetchCLIArguments(
  callback: (workspacePath: string, rootSrTemplate: string, rootSrFile: string) => Promise<void>,
): Promise<void> {
  const program = new Command();

  program
    .requiredOption('--workspace_path <path>', 'The repository path where the security rule files are located')
    .requiredOption('--root_sr_template <path>', 'The root security rule template file name')
    .requiredOption('--root_sr_file <path>', 'The output file name for merged security rules')
    .action(async () => {
      const { workspace_path, root_sr_template, root_sr_file } = program.opts();
      callback(workspace_path, root_sr_template, root_sr_file);
    });

  program.parse(process.argv);
}
