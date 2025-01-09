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

  const args: string[] = process.argv.slice(CommonStatic.COMMAND_LINE_ARGS);

  if (args.length !== CommonStatic.EXPECTED_ARG_COUNT) {
    console.error(ErrorMessageStatic.REQUIRED_PARAMETERS_MISSING_MESSAGE);
    return;
  }

  const cliArgs = {
    workspacePath: '',
    rootSrTemplate: '',
    rootSrFile: ''
  };
  const seenArgs = new Set<string>();
  const validFlags = new Set([
    CommonStatic.CLI_ARG_WORKSPACE_PATH,
    CommonStatic.CLI_ARG_ROOT_SR_TEMPLATE,
    CommonStatic.CLI_ARG_ROOT_SR_FILE
  ]);

  for (let i = CommonStatic.LOOP_START; i < args.length; i++) {
    const currentArg: string = args[i]?.trim() || '';
    const nextArg: string = args[i + CommonStatic.INDEX_INCREMENT]?.trim() || '';

    if (!validFlags.has(currentArg)) {
      console.error(`${ErrorMessageStatic.REQUIRED_PARAMETERS_UNEXPECTED_MESSAGE}${currentArg}`);
      return;
    }

    if (seenArgs.has(currentArg)) {
      console.error(ErrorMessageStatic.REQUIRED_PARAMETERS_DUPLICATED_MESSAGE);
      return;
    }

    seenArgs.add(currentArg);

    switch (currentArg) {
      case CommonStatic.CLI_ARG_WORKSPACE_PATH:
        cliArgs.workspacePath = nextArg;
        break;
      case CommonStatic.CLI_ARG_ROOT_SR_TEMPLATE:
        cliArgs.rootSrTemplate = nextArg;
        break;
      case CommonStatic.CLI_ARG_ROOT_SR_FILE:
        cliArgs.rootSrFile = nextArg;
        break;
    }

    i++;
  }

  const { workspacePath, rootSrTemplate, rootSrFile } = cliArgs;

  await callback(workspacePath, rootSrTemplate, rootSrFile);

}
