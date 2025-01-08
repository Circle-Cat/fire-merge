import fs from "../../__mocks__/fs";
import { findRulesFiles, mergeSecurityRules, readFileContent } from "../merge-security-rules";
import { CommonStatic, FileType } from "../static/common.static";
import { ErrorMessageStatic } from "../static/errorMessage.static";

jest.mock('fs', () => fs);

const TEST_DIR = '/mock/workspace';
const TEST_ROOT_SR_TEMPLATE = 'firestore.rules.template';
const TEST_OUT_PUT_FILE = 'firestore.rules'
const TEST_OUT_PUT_FILE_PATH = '/mock/workspace/firestore.rules'
const TEST_SUB_DIR_PARTH = '/mock/workspace/subdir';
const TEST_ROOT_TEMPLATE_PATH = '/mock/workspace/firestore.rules.template';
const TEST_FIRST_RULES_FILE_PATH = '/mock/workspace/file1.rules';
const TEST_SECOND_RULES_FILE_PATH = '/mock/workspace/file2.rules';
const TEST_FIRST_TS_FILE_PATH = '/mock/workspace/file3.ts';
const TEST_FIRST_SUB_RULES_FILE_PATH = '/mock/workspace/subdir/subfile1.rules';
const TEST_SECOND_SUB_RULES_FILE_PATH = '/mock/workspace/subdir/subfile2.rules';
const TEST_FIRST_RULES_FILE_CONTENT = `
match /articles/{article} {
  allow read: if request.auth != null;
  allow create, update: if request.auth.token.admin == true;
}`;

const TEST_SECOND_RULES_FILE_CONTENT = `
match /images/{imageId} {
  allow read: if true;
  allow write: if request.auth != null;
}`;

const TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

  }
}`;
const TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_NO_FULES_CONTENT = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /articles/{article} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.token.admin == true;
    }

    match /images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

  }
}`;

const TEST_ROOT_TEMPLATE_FILE_HAS_RULES_CONTENT = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /articles/{id} {
      allow read: if request.auth != null;
      allow create, update: if request.auth == false;
    }

  }
}`;

const TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_HAS_RULES_CONTENT = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /articles/{id} {
      allow read: if request.auth != null;
      allow create, update: if request.auth == false;
    }

    match /articles/{article} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.token.admin == true;
    }

    match /images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

  }
}`;

describe('findRulesFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('there are multiple SR templates then throw error', () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);
    expect(() => findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(
      ErrorMessageStatic.MULTIPLE_SR_TEMPLATE_FILES_ERROR.replace('{rootSrTemplate}', TEST_ROOT_SR_TEMPLATE)
    );
  });

  test('find only .rules files and no template file then throw error', () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_SECOND_RULES_FILE_PATH, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    expect(() => findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(ErrorMessageStatic.SR_TEMPLATE_NOT_FOUND_ERROR.replace('{rootSrTemplate}', TEST_ROOT_SR_TEMPLATE));
  });

  test('find a root SR template file and no .rules files then throw error', () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);
    expect(() => findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(ErrorMessageStatic.NO_RULE_FILE_TO_MERGE);
  });

  test('should find a root SR template and multiple .rules files in a directory', () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_SECOND_RULES_FILE_PATH, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_FIRST_TS_FILE_PATH, content: CommonStatic.EMPTY_STRING as string, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    const result = findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_RULES_FILE_PATH, TEST_SECOND_RULES_FILE_PATH]);
  });

  test('should recursively find .rules files in subdirectories', () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string | null; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_FIRST_SUB_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_SECOND_SUB_RULES_FILE_PATH, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
      { filePath: TEST_SUB_DIR_PARTH, content: null, type: FileType.Directory },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    const result = findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_RULES_FILE_PATH, TEST_FIRST_SUB_RULES_FILE_PATH, TEST_SECOND_SUB_RULES_FILE_PATH]);
  });

  test('there are multiple nested subdirectories and files in the repo', () => {
    const nestedSubDirPath = TEST_SUB_DIR_PARTH + '/nestedsubdir';
    const nestedsubdirfile1 = '/mock/workspace/subdir/nestedsubdir/nestedsubdirfile1.rules'
    const nestedsubdirfile2 = '/mock/workspace/subdir/nestedsubdir/nestedsubdirfile2.rules'
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string | null; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_FIRST_SUB_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_SECOND_SUB_RULES_FILE_PATH, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
      { filePath: TEST_SUB_DIR_PARTH, content: null, type: FileType.Directory },
      { filePath: nestedSubDirPath, content: null, type: FileType.Directory },
      { filePath: nestedsubdirfile1, content: CommonStatic.EMPTY_STRING as string, type: FileType.File },
      { filePath: nestedsubdirfile2, content: CommonStatic.EMPTY_STRING as string, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    const result = findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_RULES_FILE_PATH, TEST_FIRST_SUB_RULES_FILE_PATH, TEST_SECOND_SUB_RULES_FILE_PATH, nestedsubdirfile1, nestedsubdirfile2]);
  })

  test('there is a firestore.rules in the repo', () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
      { filePath: TEST_OUT_PUT_FILE_PATH, content: TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_HAS_RULES_CONTENT, type: FileType.File }
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    const result = findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_RULES_FILE_PATH]);
  })
})

describe('readFileContent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);
  })

  test('reading success', async () => {
    const result = await readFileContent(TEST_FIRST_RULES_FILE_PATH);

    expect(result).toBe(TEST_FIRST_RULES_FILE_CONTENT);
  });

  test('should throw an error when reading the file fails', async () => {
    const TEST_INVALID_FILE_PATH = 'invalid.txt';

    await expect(readFileContent(TEST_INVALID_FILE_PATH)).rejects.toThrow(
      ErrorMessageStatic.FILE_READ_FAILED_ERROR.replace('{filePath}', TEST_INVALID_FILE_PATH).replace('{error}', ErrorMessageStatic.CUSTOM_FEAD_FILE_FAIL_ERROR)
    );
  });
});

describe('Test mergeSecurityRules', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  })
  test('should merge security rules correctly and template does not have any rules', async () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_SECOND_RULES_FILE_PATH, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    await mergeSecurityRules(TEST_DIR, TEST_ROOT_SR_TEMPLATE, TEST_OUT_PUT_FILE);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      TEST_OUT_PUT_FILE_PATH,
      TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_NO_FULES_CONTENT
    );
  });

  test('should merge security rules correctly and template contain some rules', async () => {
    const MOCK_FILE_INFO: Array<{ filePath: string; content: string; type: string }> = [
      { filePath: TEST_FIRST_RULES_FILE_PATH, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_SECOND_RULES_FILE_PATH, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
      { filePath: TEST_ROOT_TEMPLATE_PATH, content: TEST_ROOT_TEMPLATE_FILE_HAS_RULES_CONTENT, type: FileType.File },
    ];
    fs.__setMockFiles(MOCK_FILE_INFO);

    await mergeSecurityRules(TEST_DIR, TEST_ROOT_SR_TEMPLATE, TEST_OUT_PUT_FILE);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      TEST_OUT_PUT_FILE_PATH,
      TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_HAS_RULES_CONTENT
    );
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
