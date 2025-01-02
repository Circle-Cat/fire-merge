#!/usr/bin/env node

export default function run() {
  const { workspacePath, rootSrTemplate, rootSrFile } = fetchCLIArguments();

    if (!workspacePath || !rootSrTemplate || !rootSrFile) {
      console.log('Missing required parameters. Please provide the following:');
      if (!workspacePath) console.log('--workspace_path');
      if (!rootSrTemplate) console.log('--root_sr_template');
      if (!rootSrFile) console.log('--root_sr_file');
      return;
    }
}

function fetchCLIArguments(): { workspacePath?: string, rootSrTemplate?: string, rootSrFile?: string } {
  const args = process.argv.slice(2);

  let workspacePath: string | undefined;
  let rootSrTemplate: string | undefined;
  let rootSrFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--workspace_path':
        workspacePath = args[i + 1];
        i++; 
        break;
      case '--root_sr_template':
        rootSrTemplate = args[i + 1];
        i++;
        break;
      case '--root_sr_file':
        rootSrFile = args[i + 1];
        i++;
        break;
      default:
        break;
    }
  }

  return { workspacePath, rootSrTemplate, rootSrFile };
}

run();
