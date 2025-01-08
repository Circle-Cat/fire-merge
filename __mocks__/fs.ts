
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
}

let mockFiles: Record<string, Array<{ fileName: string; content: string; type: string; }>> = {};
let fs = jest.createMockFromModule('fs') as MockedFS;

fs = {
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
}

export default fs;
