import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execa } from 'execa';
import * as fs from 'node:fs/promises';

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
    buildCommand: string,
    outputDir: string,
    outputHostPath: string,
    log: (chunk: string) => void,
  ): Promise<void> {
    await fs.mkdir(outputHostPath, { recursive: true });

    // cp -r .../. /output/ copies the contents of outputDir, not the dir itself
    const shellCmd = `${buildCommand} && cp -r /workspace/${outputDir}/. /output/`;

    this.logger.log(`starting build container (image=${this.image})`);

    const result = await execa(
      'docker',
      [
        'run', '--rm',
        '--memory', this.memory,
        '--cpus', this.cpus,
        '--pids-limit', String(this.pidsLimit),
        '-e', 'NPM_CONFIG_PREFER_OFFLINE=true',
        '-e', 'NODE_OPTIONS=--max-old-space-size=896',
        '-v', `${repoPath}:/workspace`,
        '-v', `${outputHostPath}:/output`,
        '-v', 'mollire-npm-cache:/root/.npm',
        '--workdir', '/workspace',
        this.image,
        'sh', '-c', shellCmd,
      ],
      { reject: false, timeout: this.timeoutMs },
    );

    if (result.stdout) log(result.stdout);
    if (result.stderr) log(result.stderr);

    if (result.timedOut) {
      throw new Error(`build timed out after ${this.timeoutMs / 1000}s`);
    }
    if (result.exitCode !== 0) {
      throw new Error(`build container exited with code ${result.exitCode ?? 'unknown'}`);
    }
  }
}
