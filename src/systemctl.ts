import { log } from "@nucleic/turtle";
import { servicePath } from "../matter.ts";

export type SystemctlAction =
  | "status"
  | "start"
  | "stop"
  | "restart"
  | "enable"
  | "disable"
  | "reload"
  | "is-active"
  | "is-enabled"
  | "list-units"
  | "list-unit-files"
  | "daemon-reload"
  | "mask"
  | "unmask"
  | "logs";

export function addService(serviceName: string, exec: string, cwd: string) {
  const unit = [
    "[Unit]",
    // 'Description="test"',
    "After=network.target",
  ];
  const service = [
    "[Service]",
    "Type=simple",
    `WorkingDirectory=${cwd}`,
    `ExecStart=${exec}`,
    'Environment="LLAMA_LOG_LEVEL=info"',
    // "Restart=always",
  ];

  const install = [
    "[Install]",
    "WantedBy=multi-user.target",
  ];

  const final = [unit, service, install].map((c) => c.join("\n")).join("\n\n");

  Deno.writeFile(servicePath(serviceName), new TextEncoder().encode(final))
    .then(() => {
      log(`Service ${serviceName} created`);
    }).catch((error) => {
      log(`Error creating service ${serviceName}: ${error.message}`);
    });
}

export function systemctl(action: SystemctlAction, service: string): string[] {
  switch (action) {
    case "status":
      return ["systemctl", "status", service];
    case "start":
      return ["sudo", "systemctl", "start", service];
    case "stop":
      return ["sudo", "systemctl", "stop", service];
    case "restart":
      return ["sudo", "systemctl", "restart", service];
    case "enable":
      return ["sudo", "systemctl", "enable", service];
    case "disable":
      return ["sudo", "systemctl", "disable", service];
    case "reload":
      return ["sudo", "systemctl", "reload", service];
    case "is-active":
      return ["systemctl", "is-active", service];
    case "is-enabled":
      return ["systemctl", "is-enabled", service];
    case "list-units":
      return ["systemctl", "list-units", "--type=service"];
    case "list-unit-files":
      return ["systemctl", "list-unit-files", "--type=service"];
    case "daemon-reload":
      return ["sudo", "systemctl", "daemon-reload"];
    case "mask":
      return ["sudo", "systemctl", "mask", service];
    case "unmask":
      return ["sudo", "systemctl", "unmask", service];
    default:
      throw new Error(`Unknown systemctl action: ${action}`);
  }
}

/*

    case "logs":
      return ["journalctl", "-u", `${service}.service`, "-b"];
*/
