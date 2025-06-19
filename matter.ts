import { lls } from "@nucleic/turtle";
import {
  addService,
  systemctl,
  type SystemctlAction,
} from "./src/systemctl.ts";
import { EventEmitter } from "node:events";

export const SERVICES_PATH = "/etc/systemd/system";

export function servicePath(name: string): string {
  return `${SERVICES_PATH}/${name}.service`;
}

export const MATTER_CONFIG_NAME = "setup.matter.json";

export interface MatterConfig {
  name: string;
  exec: string;
  cwd: string;
}

export class Matter extends EventEmitter {
  constructor(
    public serviceName: string,
    private exec: string,
    private cwd: string,
    public port: number,
  ) {
    super();
    this.check();
  }

  async start() {
    return await this.action("start", this.serviceName);
  }

  async stop() {
    return await this.action("stop", this.serviceName);
  }

  async restart() {
    return await this.action("restart", this.serviceName);
  }

  update(part: Partial<Matter>) {
    this.emit("update", part);
    Object.assign(this, part);
  }

  installed: boolean = false;
  active: boolean = false;
  failed: boolean = false;

  memory?: string;
  cpu?: string;

  async check(): Promise<{ stdout: string; stderr: string }> {
    const status = await this.action("status", this.serviceName);
    const { stdout, stderr } = status as { stdout: string; stderr: string };

    const response = {
      stderr,
      stdout: stdout.split("\n").filter((l) =>
        ["Active", "Memory", "CPU", "Duration"].some((k) => l.includes(k))
      )
        .join("\n"),
    };

    let update: Partial<Matter> = {};

    if (response.stdout) {
      update = { ...update, installed: !!response.stdout.includes("Active:") };

      if (response.stdout.includes("failed")) {
        update = { ...update, active: false, failed: true };
      } else if (response.stdout.includes("inactive")) {
        update = { ...update, active: false, failed: false };
      } else if (response.stdout.includes("active")) {
        update = { ...update, active: true, failed: false };
      }
      // !!response.stdout.includes("dead");

      this.update(update);
    }

    return response;
  }

  async install() {
    const status = await this.check();

    if (status instanceof Error) {
      const dir = await Deno.readFile(
        servicePath(this.serviceName),
      )
        .catch(() => false);

      if (!dir) {
        return addService(
          this.serviceName,
          this.exec,
          this.cwd,
          this.port,
        );
      } else {
        return status;
      }
    } else {
      const { stderr, stdout } = status;

      if (!stdout && stderr) {
        return addService(
          this.serviceName,
          this.exec,
          this.cwd,
          this.port,
        );
      } else {
        return stdout;
      }
    }
  }

  async action(action: SystemctlAction, service: string) {
    const command = systemctl(action, service);
    return await lls(command[0], { args: command.slice(1) })
      .catch((error) => error);
  }
}
