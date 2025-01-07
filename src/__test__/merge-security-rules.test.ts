import fs from 'fs';
import path from 'path';
import {findRulesFiles } from "../merge-security-rules";
import {ErrorMessageStatic} from '../static/errorMessage.static'


jest.mock('fs');
jest.mock('path');

const TEST_DIR = '/mock/workspace';
const TEST_SUB_DIR = 'subdir';
const TEST_ROOT_SR_TEMPLATE = 'firebase.rules.template';
const TEST_FIRST_RULES_FILE = 'file1.rules';
const TEST_SECOND_RULES_FILE = 'file2.rules';
const TEST_FIRST_TS_FILE = 'file3.ts';
const TEST_SUB_DIR_PARTH = '/mock/workspace/subdir';
const TEST_ROOT_TEMPLATE_PATH = '/mock/workspace/firebase.rules.template';
const TEST_FIRST_RULES_FILE_PATH = '/mock/workspace/file1.rules';
const TEST_SECOND_RULES_FILE_PATH = '/mock/workspace/file2.rules';
const TEST_FIRST_TS_FILE_PATH = '/mock/workspace/file3.ts';
const TEST_FIRST_SUB_RULES_FILE = 'subfile1.rules';
const TEST_SECOND_SUB_RULES_FILE = 'subfile2.rules';
const TEST_FIRST_SUB_RULES_FILE_PATH = '/mock/workspace/subdir/subfile1.rules';
const TEST_SECOND_SUB_RULES_FILE_PATH = '/mock/workspace/subdir/subfile2.rules';


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

    expect(() => findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(
      ErrorMessageStatic.MULTIPLE_SR_TEMPLATE_FILES_ERROR.replace('{rootSrTemplate}',TEST_ROOT_SR_TEMPLATE)
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

    expect(() => findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(ErrorMessageStatic.SR_TEMPLATE_NOT_FOUND_ERROR.replace('{rootSrTemplate}',TEST_ROOT_SR_TEMPLATE));
  });

  test('find a root SR template file and no .rules files then throw error', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([TEST_ROOT_SR_TEMPLATE]);
    (path.join as jest.Mock).mockReturnValue(TEST_ROOT_TEMPLATE_PATH);
    (fs.statSync as jest.Mock).mockImplementation(() => {
      return { isDirectory: () => false } as fs.Stats;
    });

    expect(() => findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE)).toThrow(ErrorMessageStatic.NO_RULE_FILE_TO_MERGE);
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

    const result = findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

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

    const result = findRulesFiles(TEST_DIR, TEST_ROOT_SR_TEMPLATE);

    expect(result.rootSrTemplateFile).toBe(TEST_ROOT_TEMPLATE_PATH);
    expect(result.subSrFiles).toEqual([TEST_FIRST_SUB_RULES_FILE_PATH, TEST_SECOND_SUB_RULES_FILE_PATH]);
  });

});
