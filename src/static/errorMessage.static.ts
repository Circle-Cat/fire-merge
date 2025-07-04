export enum ErrorMessageStatic {
  DIR_NOT_EXIST = "Error: Directory '{dir}' does not exist.",
  MULTIPLE_SR_TEMPLATE_FILES_ERROR = 'Multiple SR Template files found: {rootSrTemplate}. Cannot proceed.',
  SR_TEMPLATE_NOT_FOUND_ERROR = 'Cannot find SR Template: {rootSrTemplate}.',
  NO_RULE_FILE_TO_MERGE = 'No rule file need to merged, exit.',
  FILE_READ_FAILED_ERROR = 'Reading file failed: {filePath} by {error}',
  CUSTOM_FEAD_FILE_FAIL_ERROR = 'ENOENT:no such file or directory',
}
