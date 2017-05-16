// Imports
import * as cp from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as shell from 'shelljs';
import {getEnvVar} from '../common/utils';

// Constans
const SERVER_USER = 'www-data';
const TEST_AIO_BUILDS_DIR = getEnvVar('TEST_AIO_BUILDS_DIR');
const TEST_AIO_NGINX_HOSTNAME = getEnvVar('TEST_AIO_NGINX_HOSTNAME');
const TEST_AIO_NGINX_PORT_HTTP = +getEnvVar('TEST_AIO_NGINX_PORT_HTTP');
const TEST_AIO_NGINX_PORT_HTTPS = +getEnvVar('TEST_AIO_NGINX_PORT_HTTPS');
const TEST_AIO_UPLOAD_HOSTNAME = getEnvVar('TEST_AIO_UPLOAD_HOSTNAME');
const TEST_AIO_UPLOAD_MAX_SIZE = +getEnvVar('TEST_AIO_UPLOAD_MAX_SIZE');
const TEST_AIO_UPLOAD_PORT = +getEnvVar('TEST_AIO_UPLOAD_PORT');

// Interfaces - Types
export interface CmdResult { success: boolean; err: Error; stdout: string; stderr: string; }
export interface FileSpecs { content?: string; size?: number; }

export type CleanUpFn = () => void;
export type TestSuiteFactory = (scheme: string, port: number) => void;
export type VerifyCmdResultFn = (result: CmdResult) => void;

// Classes
class Helper {
  // Properties - Public
  public get buildsDir() { return TEST_AIO_BUILDS_DIR; }
  public get nginxHostname() { return TEST_AIO_NGINX_HOSTNAME; }
  public get nginxPortHttp() { return TEST_AIO_NGINX_PORT_HTTP; }
  public get nginxPortHttps() { return TEST_AIO_NGINX_PORT_HTTPS; }
  public get serverUser() { return SERVER_USER; }
  public get uploadHostname() { return TEST_AIO_UPLOAD_HOSTNAME; }
  public get uploadPort() { return TEST_AIO_UPLOAD_PORT; }
  public get uploadMaxSize() { return TEST_AIO_UPLOAD_MAX_SIZE; }

  // Properties - Protected
  protected cleanUpFns: CleanUpFn[] = [];
  protected portPerScheme: {[scheme: string]: number} = {
    http: this.nginxPortHttp,
    https: this.nginxPortHttps,
  };

  // Constructor
  constructor() {
    shell.mkdir('-p', this.buildsDir);
    shell.exec(`chown -R ${this.serverUser} ${this.buildsDir}`);
  }

  // Methods - Public
  public cleanUp() {
    while (this.cleanUpFns.length) {
      // Clean-up fns remove themselves from the list.
      this.cleanUpFns[0]();
    }

    if (fs.readdirSync(this.buildsDir).length) {
      throw new Error(`Directory '${this.buildsDir}' is not empty after clean-up.`);
    }
  }

  public createDummyArchive(pr: string, sha: string, archivePath: string): CleanUpFn {
    const inputDir = path.join(this.buildsDir, 'uploaded', pr, sha);
    const cmd1 = `tar --create --gzip --directory "${inputDir}" --file "${archivePath}" .`;
    const cmd2 = `chown ${this.serverUser} ${archivePath}`;

    const cleanUpTemp = this.createDummyBuild(`uploaded/${pr}`, sha, true);
    shell.exec(cmd1);
    shell.exec(cmd2);
    cleanUpTemp();

    return this.createCleanUpFn(() => shell.rm('-rf', archivePath));
  }

  public createDummyBuild(pr: string, sha: string, force = false): CleanUpFn {
    const prDir = path.join(this.buildsDir, pr);
    const shaDir = path.join(prDir, sha);
    const idxPath = path.join(shaDir, 'index.html');
    const barPath = path.join(shaDir, 'foo', 'bar.js');

    this.writeFile(idxPath, {content: `PR: ${pr} | SHA: ${sha} | File: /index.html`}, force);
    this.writeFile(barPath, {content: `PR: ${pr} | SHA: ${sha} | File: /foo/bar.js`}, force);
    shell.exec(`chown -R ${this.serverUser} ${prDir}`);

    return this.createCleanUpFn(() => shell.rm('-rf', prDir));
  }

  public deletePrDir(pr: string) {
    const prDir = path.join(this.buildsDir, pr);

    if (fs.existsSync(prDir)) {
      // Undocumented signature (see https://github.com/shelljs/shelljs/pull/663).
      (shell as any).chmod('-R', 'a+w', prDir);
      shell.rm('-rf', prDir);
    }
  }

  public readBuildFile(pr: string, sha: string, relFilePath: string): string {
    const absFilePath = path.join(this.buildsDir, pr, sha, relFilePath);
    return fs.readFileSync(absFilePath, 'utf8');
  }

  public runCmd(cmd: string, opts: cp.ExecFileOptions = {}): Promise<CmdResult> {
    return new Promise(resolve => {
      const proc = cp.exec(cmd, opts, (err, stdout, stderr) => resolve({success: !err, err, stdout, stderr}));
      this.createCleanUpFn(() => proc.kill());
    });
  }

  public runForAllSupportedSchemes(suiteFactory: TestSuiteFactory) {
    Object.keys(this.portPerScheme).forEach(scheme => suiteFactory(scheme, this.portPerScheme[scheme]));
  }

  public verifyResponse(status: number | [number, string], regex = /^/): VerifyCmdResultFn {
    let statusCode: number;
    let statusText: string;

    if (Array.isArray(status)) {
      statusCode = status[0];
      statusText = status[1];
    } else {
      statusCode = status;
      statusText = http.STATUS_CODES[statusCode];
    }

    return (result: CmdResult) => {
      const [headers, body] = result.stdout.
        split(/(?:\r?\n){2,}/).
        map(s => s.trim()).
        slice(-2);

      if (!result.success) {
        console.log('Stdout:', result.stdout);
        console.log('Stderr:', result.stderr);
        console.log('Error:', result.err);
      }

      expect(result.success).toBe(true);
      expect(headers).toContain(`${statusCode} ${statusText}`);
      expect(body).toMatch(regex);
    };
  }

  public writeBuildFile(pr: string, sha: string, relFilePath: string, content: string): CleanUpFn {
    const absFilePath = path.join(this.buildsDir, pr, sha, relFilePath);
    return this.writeFile(absFilePath, {content}, true);
  }

  public writeFile(filePath: string, {content, size}: FileSpecs, force = false): CleanUpFn {
    if (!force && fs.existsSync(filePath)) {
      throw new Error(`Refusing to overwrite existing file '${filePath}'.`);
    }

    let cleanUpTarget = filePath;
    while (!fs.existsSync(path.dirname(cleanUpTarget))) {
      cleanUpTarget = path.dirname(cleanUpTarget);
    }

    shell.mkdir('-p', path.dirname(filePath));
    if (size) {
      // Create a file of the specified size.
      cp.execSync(`fallocate -l ${size} ${filePath}`);
    } else {
      // Create a file with the specified content.
      fs.writeFileSync(filePath, content || '');
    }
    shell.exec(`chown ${this.serverUser} ${filePath}`);

    return this.createCleanUpFn(() => shell.rm('-rf', cleanUpTarget));
  }

  // Methods - Protected
  protected createCleanUpFn(fn: Function): CleanUpFn {
    const cleanUpFn = () => {
      const idx = this.cleanUpFns.indexOf(cleanUpFn);
      if (idx !== -1) {
        this.cleanUpFns.splice(idx, 1);
        fn();
      }
    };

    this.cleanUpFns.push(cleanUpFn);

    return cleanUpFn;
  }
}

// Exports
export const helper = new Helper();
