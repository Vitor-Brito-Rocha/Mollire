import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execa } from 'execa';
import * as fs from 'node:fs/promises';
import * as readline from 'node:readline';

@Injectable()
export class DockerBuildService {
  private readonly logger = new Logger(DockerBuildService.name);
  private readonly image: string;
  private readonly memory: string;
  private readonly cpus: string;
  private readonly pidsLimit: number;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.image = config.get('BUILD_DOCKER_IMAGE', 'node:20-alpine');
    this.memory = config.get('BUILD_MEMORY_LIMIT', '512m');
    this.cpus = config.get('BUILD_CPU_LIMIT', '0.5');
    this.pidsLimit = Number(config.get('BUILD_PIDS_LIMIT', '100'));
    this.timeoutMs = Number(config.get('BUILD_TIMEOUT_MS', '300000'));
  }

  async run(
    repoPath: string,
    rootDir: string,
    buildCommand: string,
    outputDir: string,
    outputHostPath: string,
    log: (chunk: string) => void,
    envVars: Record<string, string> = {},
  ): Promise<void> {
    await fs.mkdir(outputHostPath, { recursive: true });

    // Install and build run in the project's folder (rootDir, "" = repo root);
    // outputDir is relative to it. rootDir is validated to plain path
    // characters (see ROOT_DIR_PATTERN), so it can't break out of /workspace.
    const workdir = rootDir ? `/workspace/${rootDir}` : '/workspace';
    // `npm install` is always part of the build, not something the tenant configures.
    // cp -r .../. /output/ copies the contents of outputDir, not the dir itself
    const shellCmd = `npm install && ${buildCommand} && cp -r ${workdir}/${outputDir}/. /output/`;

    this.logger.log(`starting build container (image=${this.image})`);

    const subprocess = execa(
      'docker',
      [
        'run', '--rm',
        '--security-opt', 'no-new-privileges',
        '--memory', this.memory,
        '--cpus', this.cpus,
        '--pids-limit', String(this.pidsLimit),
        '-e', 'NPM_CONFIG_PREFER_OFFLINE=true',
        '-e', 'NODE_OPTIONS=--max-old-space-size=896',
        ...Object.entries(envVars).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
        '-v', `${repoPath}:/workspace`,
        '-v', `${outputHostPath}:/output`,
        '-v', 'mollire-npm-cache:/root/.npm',
        '--workdir', workdir,
        this.image,
        'sh', '-c', shellCmd,
      ],
      { reject: false, timeout: this.timeoutMs },
    );

    const streamLines = (stream: NodeJS.ReadableStream | null): Promise<void> =>
      new Promise((resolve) => {
        if (!stream) { resolve(); return; }
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
        rl.on('line', (line) => log(`${new Date().toISOString()} ${line}\n`));
        rl.on('close', resolve);
      });

    const [, , result] = await Promise.all([
      streamLines(subprocess.stdout ?? null),
      streamLines(subprocess.stderr ?? null),
      subprocess,
    ]);

    if (result.timedOut) {
      throw new Error(`build timed out after ${this.timeoutMs / 1000}s`);
    }
    if (result.exitCode !== 0) {
      throw new Error(`build container exited with code ${result.exitCode ?? 'unknown'}`);
    }
  }
}
