export enum ErrorMessageStatic {
  MULTIPLE_SR_TEMPLATE_FILES_ERROR = 'Multiple SR Template files found: {rootSrTemplate}. Cannot proceed.',
  SR_TEMPLATE_NOT_FOUND_ERROR = 'Cannot find SR Template: {rootSrTemplate}.',
  NO_RULE_FILE_TO_MERGE = 'No rule file need to merged, exit.',
  FILE_READ_FAILED_ERROR = 'Reading file failed: {filePath} by {error}',
  CUSTOM_FEAD_FILE_FAIL_ERROR = 'ENOENT:no such file or director.y',
  PROCESS_EXIT_ERROR = 'process.exit() was called.',
}
