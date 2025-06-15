import {
  addService,
  systemctl,
  type SystemctlAction,
} from "./src/systemctl.ts";
import { lls } from "@nucleic/turtle";
import { log } from "@nucleic/sna";

export const SERVICES_PATH = "/etc/systemd/system";

export function servicePath(name: string): string {
  return `${SERVICES_PATH}/${name}.service`;
}

export class Matter {
  constructor(
    public serviceName: string,
    private exec: string,
    private cwd: string,
  ) {
    log(`\n${serviceName}\n`);

    this.check();
  }

  async check() {
    const status = await this.action("status", this.serviceName);

    if (status instanceof Error) {
      const dir = await Deno.readFile(
        servicePath(this.serviceName),
      )
        .catch(() => false);

      if (!dir) {
        addService(
          this.serviceName,
          this.exec,
          this.cwd,
        );
      } else {
        log(status);
      }
    } else {
      log((status as { stdout: string })?.stdout);
    }
  }

  async action(action: SystemctlAction, service: string) {
    const command = systemctl(action, service);
    return await lls(command[0], { args: command.slice(1) })
      .catch((error) => error);
  }
}
