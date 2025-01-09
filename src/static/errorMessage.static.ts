<<<<<<< PATCH SET (c7cca7 [FM-10] Add fetchCLIArguments method to handle CLI parameter)
export class ErrorMessageStatic {
  public static readonly MULTIPLE_SR_TEMPLATE_FILES_ERROR = 'Multiple SR Template files found: {rootSrTemplate}. Cannot proceed.';
  public static readonly SR_TEMPLATE_NOT_FOUND_ERROR = 'Cannot find SR Template: {rootSrTemplate}.';
  public static readonly NO_RULE_FILE_TO_MERGE = 'No rule file need to merged, exit.';
  public static readonly FILE_READ_FAILED_ERROR = 'Reading file failed: {filePath} by {error}';
  public static readonly REQUIRED_PARAMETERS_MISSING_MESSAGE = 'Missing required parameters.';
  public static readonly REQUIRED_PARAMETERS_UNEXPECTED_MESSAGE = 'Unexpected argument: ';
  public static readonly REQUIRED_PARAMETERS_DUPLICATED_MESSAGE = 'Duplicate argument found';
=======
export enum ErrorMessageStatic {
  MULTIPLE_SR_TEMPLATE_FILES_ERROR = 'Multiple SR Template files found: {rootSrTemplate}. Cannot proceed.',
  SR_TEMPLATE_NOT_FOUND_ERROR = 'Cannot find SR Template: {rootSrTemplate}.',
  NO_RULE_FILE_TO_MERGE = 'No rule file need to merged, exit.',
  FILE_READ_FAILED_ERROR = 'Reading file failed: {filePath} by {error}',
  CUSTOM_FEAD_FILE_FAIL_ERROR = 'ENOENT:no such file or directory'
>>>>>>> BASE      (c91297 [FM-7] Implement readFileContent and mergeSecurityRules to h)
}
