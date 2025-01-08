
import path from 'path';
import { FileType } from '../src/static/common.static';
import { ErrorMessageStatic } from '../src/static/errorMessage.static';

type State = {
  isDirectory(): boolean;
}

interface MockedFS {
  __setMockFiles(newMockFiles: Array<{ filePath: string; content: string | null; type: string }>): void;
  readdirSync(directoryPath: string): string[];
  statSync(filePath: string): State;
  promises: {
    readFile(filePath: string, encoding: string): Promise<string>;
  };
  writeFileSync(outputPath: string, content: string): void;
  existsSync(directoryPath: string): boolean;
}

let mockFiles: Record<string, Array<{ fileName: string; content: string; type: string; }>> = {};
let fs = jest.createMockFromModule('fs') as MockedFS;

fs = {
  /**
   * Sets the mock files for the test environment.
   * This function processes an array of file information and organizes it into a mock file structure.
   * The structure is organized by directories, where each directory holds an array of files and directories.
   * Each file contains a `filePath`, `content`, and `type` (file or directory).
  *
  * Example input for `MOCK_FILE_INFO`:
  * ```typescript
  * const MOCK_FILE_INFO: Array<{ filePath: string; content: string | null; type: string }> = [
  *     { filePath: /mock/workspace/firestore.rules.template, content: TEST_ROOT_TEMPLATE_FILE_NO_RULES_CONTENT, type: FileType.File },
  *     { filePath: /mock/workspace/file1.rules, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
  *     { filePath: /mock/workspace/subdir/subfile1.rules, content: TEST_FIRST_RULES_FILE_CONTENT, type: FileType.File },
  *     { filePath: /mock/workspace/subdir/subfile2.rules, content: TEST_SECOND_RULES_FILE_CONTENT, type: FileType.File },
  *     { filePath: /mock/workspace/subdir, content: null, type: FileType.Directory },
  *     { filePath: /mock/workspace/subdir/nestedsubdir, content: null, type: FileType.Directory },
  *     { filePath: /mock/workspace/subdir/nestedsubdir/nestedsubdirfile1.rules, content: CommonStatic.EMPTY_STRING as string, type: FileType.File },
  *     { filePath: /mock/workspace/subdir/nestedsubdir/nestedsubdirfile2.rules, content: CommonStatic.EMPTY_STRING as string, type: FileType.File },
  * ];
  * ```
  *
  * This input represents the following structure:
  * - `/mock/workspace` directory contains:
  *   - `firestore.rules.template` and `file1.rules` as files.
  *   - `subdir` as a subdirectory.
  * - `/mock/workspace/subdir` contains:
  *   - `subfile1.rules` and `subfile2.rules` as files.
  *   - `nestedsubdir` as a subdirectory.
  * - `/mock/workspace/subdir/nestedsubdir` contains:
  *   - `nestedsubdirfile1.rules` and `nestedsubdirfile2.rules` as files.
  *
  * Example output for `mockFiles` structure:
  * ```typescript
  * {
  *   '/mock/workspace': [
  *     { fileName: 'file1.rules', content: '...', type: 'file' },
  *     { fileName: 'firestore.rules.template', content: '...', type: 'file' },
  *     { fileName: 'subdir', content: null, type: 'directory' }
  *   ],
  *   '/mock/workspace/subdir': [
  *     { fileName: 'subfile1.rules', content: '...', type: 'file' },
  *     { fileName: 'subfile2.rules', content: '...', type: 'file' },
  *     { fileName: 'nestedsubdir', content: null, type: 'directory' }
  *   ],
  *   '/mock/workspace/subdir/nestedsubdir': [
  *     { fileName: 'nestedsubdirfile1.rules', content: '', type: 'file' },
  *     { fileName: 'nestedsubdirfile2.rules', content: '', type: 'file' }
  *   ]
  * }
  * ```
  *
  * @param newMockFiles - An array of objects containing `filePath`, `content`, and `type` (either 'file' or 'directory').
   */
  __setMockFiles(newMockFiles: Array<{ filePath: string; content: string; type: string }>): void {
    mockFiles = {};

    newMockFiles.forEach(({ filePath, content, type }) => {
      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath);

      if (!mockFiles[dir]) {
        mockFiles[dir] = [];
      }

      mockFiles[dir].push({
        fileName,
        content: content,
        type: type
      });
    });
  },


  readdirSync(directoryPath: string): string[] {
    const dirEntries = mockFiles[directoryPath];
    if (dirEntries) {
      return dirEntries.map(entry => entry.fileName);
    }
    return [];
  },

  statSync(filePath: string): { isDirectory: () => boolean } {
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const directory = mockFiles[dir];

    if (directory) {
      const fileEntry = directory.find(entry => entry.fileName === fileName);

      if (fileEntry) {
        return {
          isDirectory: () => fileEntry.type === FileType.Directory,
        };
      }
    }

    throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
  },

  promises: {
    readFile(filePath: string, encoding: string): Promise<string> {
      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath);
      const directory = mockFiles[dir];

      if (directory && encoding) {
        const fileEntry = directory.find(entry => entry.fileName === fileName);
        if (fileEntry) {
          return Promise.resolve(fileEntry.content);
        }
      }
      return Promise.reject(new Error(ErrorMessageStatic.CUSTOM_FEAD_FILE_FAIL_ERROR));
    },
  },

  writeFileSync: jest.fn(),

  existsSync(directoryPath: string): boolean {
    return !!mockFiles[directoryPath];
  }
}

export default fs;
