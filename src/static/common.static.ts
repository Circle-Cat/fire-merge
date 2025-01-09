<<<<<<< PATCH SET (c7cca7 [FM-10] Add fetchCLIArguments method to handle CLI parameter)
export class CommonStatic {
  public static readonly EMPTY_STRING = '';
  public static readonly RULES_FILE_SUFFIX = '.rules';
  public static readonly NO_ELEMENT = 0;
  public static readonly ENCODING_UTF8 = 'utf-8';
  public static readonly NEW_LINE_SYMBOL = '\n';
  public static readonly FUNCTION_CALLED_ONCE = 1;
  public static readonly FUNCTION_CALLED_THREE_TIMES = 3;
  public static readonly CLI_ARG_WORKSPACE_PATH = '--workspace_path';
  public static readonly CLI_ARG_ROOT_SR_TEMPLATE = '--root_sr_template';
  public static readonly CLI_ARG_ROOT_SR_FILE = '--root_sr_file';
  public static readonly INDEX_INCREMENT = 1;
  public static readonly LOOP_START = 0;
  public static readonly COMMAND_LINE_ARGS = 2;
  public static readonly EXPECTED_ARG_COUNT = 6;
=======
export enum CommonStatic {
  EMPTY_STRING = '',
  RULES_FILE_SUFFIX = '.rules',
  NO_ELEMENT = 0,
  ENCODING_UTF8 = 'utf-8',
  NEW_LINE_SYMBOL = '\n',
  FUNCTION_CALLED_ONCE = 1,
  FUNCTION_CALLED_THREE_TIMES = 3,
}

export enum FileType {
  File = "file",
  Directory = "directory"
>>>>>>> BASE      (c91297 [FM-7] Implement readFileContent and mergeSecurityRules to h)
}
