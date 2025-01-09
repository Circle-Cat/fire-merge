export class ErrorMessageStatic {
  public static readonly MULTIPLE_SR_TEMPLATE_FILES_ERROR = 'Multiple SR Template files found: {rootSrTemplate}. Cannot proceed.';
  public static readonly SR_TEMPLATE_NOT_FOUND_ERROR = 'Cannot find SR Template: {rootSrTemplate}.';
  public static readonly NO_RULE_FILE_TO_MERGE = 'No rule file need to merged, exit.';
  public static readonly FILE_READ_FAILED_ERROR = 'Reading file failed: {filePath} by {error}';
  public static readonly REQUIRED_PARAMETERS_MISSING_MESSAGE = 'Missing required parameters.';
  public static readonly REQUIRED_PARAMETERS_UNEXPECTED_MESSAGE = 'Unexpected argument: ';
  public static readonly REQUIRED_PARAMETERS_DUPLICATED_MESSAGE = 'Duplicate argument found';
}
