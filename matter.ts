import { lls } from "@nucleic/turtle";
import {
  addService,
  systemctl,
  type SystemctlAction,
} from "./src/systemctl.ts";

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

export class Matter {
  constructor(
    public serviceName: string,
    private exec: string,
    private cwd: string,
  ) {}

  async check(): Promise<{ stdout: string; stderr: string }> {
    const status = await this.action("status", this.serviceName);
    const { stdout, stderr } = status as { stdout: string; stderr: string };

    return {
      stderr,
      stdout: stdout.split("\n").filter((l) =>
        ["Active", "Memory", "CPU"].some((k) => l.includes(k))
      )
        .join("\n"),
    };
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
        );
      }
    }
  }

  async action(action: SystemctlAction, service: string) {
    const command = systemctl(action, service);
    return await lls(command[0], { args: command.slice(1) })
      .catch((error) => error);
  }
}
