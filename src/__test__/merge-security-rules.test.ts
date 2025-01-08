import fs from 'fs';
import path from 'path';
import * as mergeSecurityRules from "../merge-security-rules";
import { CommonStatic } from '../static/common.static';
import { ErrorMessageStatic } from '../static/errorMessage.static';


jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('path');

const TEST_DIR = '/mock/workspace';
const TEST_SUB_DIR = 'subdir';
const TEST_ROOT_SR_TEMPLATE = 'firebase.rules.template';
const TEST_FIRST_RULES_FILE = 'file1.rules';
const TEST_SECOND_RULES_FILE = 'file2.rules';
const TEST_FIRST_TS_FILE = 'file3.ts';
const TEST_OUT_PUT_FILE = 'firebase.rules'
const TEST_SUB_DIR_PARTH = '/mock/workspace/subdir';
const TEST_ROOT_TEMPLATE_PATH = '/mock/workspace/firebase.rules.template';
const TEST_FIRST_RULES_FILE_PATH = '/mock/workspace/file1.rules';
const TEST_SECOND_RULES_FILE_PATH = '/mock/workspace/file2.rules';
const TEST_FIRST_TS_FILE_PATH = '/mock/workspace/file3.ts';
const TEST_FIRST_SUB_RULES_FILE = 'subfile1.rules';
const TEST_SECOND_SUB_RULES_FILE = 'subfile2.rules';
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


afterEach(() => {
  jest.clearAllMocks();
});

describe('findRulesFiles', () => {
  test('there are multiple SR templates then throw error', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([TEST_ROOT_SR_TEMPLATE, TEST_ROOT_SR_TEMPLATE]);
    (path.join as jest.Mock).mockReturnValue(TEST_ROOT_TEMPLATE_PATH);

    (fs.statSync as jest.Mock).mockImplementation(() => {
      return { isDirectory: () => false } as fs.Stats;
    });

    expect(() => mergeSecurityRules.findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(
      ErrorMessageStatic.MULTIPLE_SR_TEMPLATE_FILES_ERROR.replace('{rootSrTemplate}', TEST_ROOT_SR_TEMPLATE)
    );
  });

  test('find only .rules files and no template file then throw error', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([TEST_FIRST_RULES_FILE, TEST_SECOND_RULES_FILE]);
    (path.join as jest.Mock)
      .mockReturnValueOnce(TEST_ROOT_TEMPLATE_PATH)
      .mockReturnValueOnce(TEST_FIRST_RULES_FILE_PATH)
      .mockReturnValueOnce(TEST_SECOND_RULES_FILE_PATH);
    (fs.statSync as jest.Mock).mockImplementation(() => {
      return { isDirectory: () => false } as fs.Stats;
    });

    expect(() => mergeSecurityRules.findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(ErrorMessageStatic.SR_TEMPLATE_NOT_FOUND_ERROR.replace('{rootSrTemplate}', TEST_ROOT_SR_TEMPLATE));
  });

  test('find a root SR template file and no .rules files then throw error', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([TEST_ROOT_SR_TEMPLATE]);
    (path.join as jest.Mock).mockReturnValue(TEST_ROOT_TEMPLATE_PATH);
    (fs.statSync as jest.Mock).mockImplementation(() => {
      return { isDirectory: () => false } as fs.Stats;
    });

    expect(() => mergeSecurityRules.findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(ErrorMessageStatic.NO_RULE_FILE_TO_MERGE);
  });

  test('should find a root SR template and multiple .rules files in a directory', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([TEST_ROOT_SR_TEMPLATE, TEST_FIRST_RULES_FILE, TEST_SECOND_RULES_FILE, TEST_FIRST_TS_FILE]);
    (path.join as jest.Mock)
      .mockReturnValueOnce(TEST_ROOT_TEMPLATE_PATH)
      .mockReturnValueOnce(TEST_ROOT_TEMPLATE_PATH)
      .mockReturnValueOnce(TEST_FIRST_RULES_FILE_PATH)
      .mockReturnValueOnce(TEST_SECOND_RULES_FILE_PATH)
      .mockReturnValueOnce(TEST_FIRST_TS_FILE_PATH);
    (fs.statSync as jest.Mock).mockImplementation(() => {
      return { isDirectory: () => false } as fs.Stats;
    });

    const result = mergeSecurityRules.findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_RULES_FILE_PATH, TEST_SECOND_RULES_FILE_PATH]);
  });

  test('should recursively find .rules files in subdirectories', () => {
    (fs.readdirSync as jest.Mock).mockReturnValueOnce([TEST_ROOT_SR_TEMPLATE, TEST_SUB_DIR]).mockReturnValueOnce([TEST_FIRST_SUB_RULES_FILE, TEST_SECOND_SUB_RULES_FILE]);
    (path.join as jest.Mock)
      .mockReturnValueOnce(TEST_ROOT_TEMPLATE_PATH)
      .mockReturnValueOnce(TEST_ROOT_TEMPLATE_PATH)
      .mockReturnValueOnce(TEST_SUB_DIR_PARTH)
      .mockReturnValueOnce(TEST_ROOT_TEMPLATE_PATH)
      .mockReturnValueOnce(TEST_FIRST_SUB_RULES_FILE_PATH)
      .mockReturnValueOnce(TEST_SECOND_SUB_RULES_FILE_PATH);

    (fs.statSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath === TEST_SUB_DIR_PARTH) {
        return { isDirectory: () => true } as fs.Stats;
      } else {
        return { isDirectory: () => false } as fs.Stats;
      }
    });

    const result = mergeSecurityRules.findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_SUB_RULES_FILE_PATH, TEST_SECOND_SUB_RULES_FILE_PATH]);
  });
});

describe('readFileContent', () => {
  test('reading success', async () => {
    const mockReadFile = (fs.promises.readFile as jest.Mock).mockImplementation(async () =>
      Promise.resolve(TEST_FIRST_RULES_FILE_CONTENT)
    );

    const result = await mergeSecurityRules.readFileContent(TEST_FIRST_RULES_FILE_PATH);

    expect(result).toBe(TEST_FIRST_RULES_FILE_CONTENT);
    expect(mockReadFile).toHaveBeenCalledWith(TEST_FIRST_RULES_FILE_PATH, CommonStatic.ENCODING_UTF8);
  });

  test('should throw an error when reading the file fails', async () => {
    const TEST_INVALID_FILE_PATH = 'invalid.txt';

    const mockReadFile = (fs.promises.readFile as jest.Mock).mockImplementation(async () =>
      Promise.reject(new Error(`reading file failed: ${TEST_INVALID_FILE_PATH}`))
    );

    await expect(mergeSecurityRules.readFileContent(TEST_INVALID_FILE_PATH)).rejects.toThrow(
      `reading file failed: ${TEST_INVALID_FILE_PATH}`
    );
    expect(mockReadFile).toHaveBeenCalledWith(TEST_INVALID_FILE_PATH, CommonStatic.ENCODING_UTF8);
  });
});

describe('Test mergeSecurityRules', () => {
  let findRulesFilesSpy: jest.SpyInstance;;
  let readFileContentSpy: jest.SpyInstance;;

  beforeEach(() => {
    findRulesFilesSpy = jest.spyOn(mergeSecurityRules, 'findRulesFiles');
    readFileContentSpy = jest.spyOn(mergeSecurityRules, 'readFileContent');
  });

  test('should merge security rules correctly and template does not have any rules', async () => {
    findRulesFilesSpy.mockImplementation(() => ({
      rootSrTemplateFile: TEST_ROOT_TEMPLATE_PATH,
      subSrFiles: [TEST_FIRST_RULES_FILE_PATH, TEST_SECOND_RULES_FILE_PATH],
    }));

    readFileContentSpy
      .mockImplementationOnce(() => { return TEST_FIRST_RULES_FILE_CONTENT })
      .mockImplementationOnce(() => { return TEST_SECOND_RULES_FILE_CONTENT })
      .mockImplementationOnce(() => { return TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT });

    await mergeSecurityRules.mergeSecurityRules(TEST_DIR, TEST_ROOT_SR_TEMPLATE, TEST_OUT_PUT_FILE);

    expect(findRulesFilesSpy).toHaveBeenCalledWith(TEST_DIR, TEST_ROOT_SR_TEMPLATE);
    expect(findRulesFilesSpy).toHaveBeenCalledTimes(CommonStatic.FUNCTION_CALLED_ONCE);

    expect(readFileContentSpy).toHaveBeenCalledTimes(CommonStatic.FUNCTION_CALLED_THREE_TIMES);
    expect(readFileContentSpy).toHaveBeenCalledWith(TEST_ROOT_TEMPLATE_PATH);
    expect(readFileContentSpy).toHaveBeenCalledWith(TEST_FIRST_RULES_FILE_PATH);
    expect(readFileContentSpy).toHaveBeenCalledWith(TEST_SECOND_RULES_FILE_PATH);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(TEST_DIR, TEST_OUT_PUT_FILE),
      TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_NO_FULES_CONTENT
    );
  });

  test('should merge security rules correctly and template contain some rules', async () => {
    findRulesFilesSpy.mockImplementation(() => ({
      rootSrTemplateFile: TEST_ROOT_TEMPLATE_PATH,
      subSrFiles: [TEST_FIRST_RULES_FILE_PATH, TEST_SECOND_RULES_FILE_PATH],
    }));
    readFileContentSpy
      .mockImplementationOnce(() => { return TEST_FIRST_RULES_FILE_CONTENT })
      .mockImplementationOnce(() => { return TEST_SECOND_RULES_FILE_CONTENT })
      .mockImplementationOnce(() => { return TEST_ROOT_TEMPLATE_FILE_HAS_RULES_CONTENT });

    await mergeSecurityRules.mergeSecurityRules(TEST_DIR, TEST_ROOT_SR_TEMPLATE, TEST_OUT_PUT_FILE);

    expect(findRulesFilesSpy).toHaveBeenCalledWith(TEST_DIR, TEST_ROOT_SR_TEMPLATE);
    expect(findRulesFilesSpy).toHaveBeenCalledTimes(CommonStatic.FUNCTION_CALLED_ONCE);

    expect(readFileContentSpy).toHaveBeenCalledTimes(CommonStatic.FUNCTION_CALLED_THREE_TIMES);
    expect(readFileContentSpy).toHaveBeenCalledWith(TEST_ROOT_TEMPLATE_PATH);
    expect(readFileContentSpy).toHaveBeenCalledWith(TEST_FIRST_RULES_FILE_PATH);
    expect(readFileContentSpy).toHaveBeenCalledWith(TEST_SECOND_RULES_FILE_PATH);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(TEST_DIR, TEST_OUT_PUT_FILE),
      TEST_EXPECTED_OUT_PUT_FILE_TEMPLATE_HAS_RULES_CONTENT
    );
  });
});
