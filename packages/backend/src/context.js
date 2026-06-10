import { databaseManager } from "./database.js";
export { databaseManager };
import { ProfilesRepository } from "./modules/profiles/profiles.repository.js";
import { ProfileRuntimeManager } from "./runtime/profile-runtime-manager.js";
import { VncWsBridge } from "./proxy/ws-bridge.js";
import { CdpWsBridge } from "./proxy/cdp-proxy.js";

import { GroupsRepository } from "./modules/groups/groups.repository.js";
import { ProxiesRepository } from "./modules/proxy/proxies.repository.js";

export const runtimeManager = new ProfileRuntimeManager();
export const vncBridge = new VncWsBridge(runtimeManager);
export const cdpBridge = new CdpWsBridge(runtimeManager);

export let profilesRepository;
export let groupsRepository;
export let proxiesRepository;

export async function initContext() {
  await databaseManager.init();
  profilesRepository = new ProfilesRepository(databaseManager);
  groupsRepository = new GroupsRepository(databaseManager);
  proxiesRepository = new ProxiesRepository(databaseManager);
}

