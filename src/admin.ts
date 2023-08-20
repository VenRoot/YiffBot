import { Context } from "grammy";
import path from "path";
import fs from "fs";

type ConfigKeys = "media.count" | "media.notifications" | "beta.user.count";
type ConfigValues = string | number | boolean;
type AdminId = number;

class Admin {
  private static readonly configPath = path.join(__dirname, "..", "data", "adminconfig.json");
  private static configs = new Map<AdminId, Map<ConfigKeys, ConfigValues>>();

  public static loadAdminConfigs(): void {
    try {
      const configFile = fs.readFileSync(Admin.configPath, "utf-8");
      Admin.configs = new Map(JSON.parse(configFile));
    } catch (error) {
      console.log("Error loading admin configs:", error);
    }
  }

  public static saveAdminConfigs(): void {
    try {
      const configFile = JSON.stringify(Object.fromEntries(Admin.configs), null, 2);
      fs.writeFileSync(Admin.configPath, configFile);
    } catch (error) {
      console.log("Error saving admin configs:", error);
    }
  }

  public static getAdminConfig(adminId: AdminId, key: ConfigKeys): ConfigValues | undefined {
    return Admin.configs.get(adminId)?.get(key);
  }

  public static setAdminConfig(adminId: AdminId, key: ConfigKeys, value: ConfigValues ): void {
    if (!Admin.configs.has(adminId)) {
      Admin.configs.set(adminId, new Map<ConfigKeys, ConfigValues>());
    }
    console.log(Admin.configs);
    Admin.configs.get(adminId)?.set(key, value);
    Admin.saveAdminConfigs();
    console.log(JSON.stringify(Admin.configs, null, 2));
  }

  public static readonly _config_keys = new Map<ConfigKeys, string>([
    ["media.count", "How many media submissions you want to get per request <number>"],
    ["media.notifications", "Do you want to get notifications when a new media is submitted? If yes, every <number> minutes? <number/false>"],
    ["beta.user.count", "How many beta user applications you want to get per request <number>"],
  ]);

  private static commands = new Map<string, string>([
    ["/configs", "List all configs"],
    ["/configs get <key>", "Get a config"],
    ["/configs set <key> <value>", "Set a config"],
  ]);

  public static getConfigKeys = () => Admin._config_keys;
}

Admin.loadAdminConfigs();
setTimeout(() => { 
    Admin.setAdminConfig(0, "media.count", 5);
    Admin.setAdminConfig(0, "media.notifications", true);

}, 1000);