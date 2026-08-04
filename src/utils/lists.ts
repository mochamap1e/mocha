import { PointercrateIntegration } from "@/integrations/pointercrate";
import { GlobalIntegration } from "@/integrations/global";
import { AREDLIntegration } from "@/integrations/aredl";

export const pointercrate = new PointercrateIntegration();
export const global = new GlobalIntegration();
export const aredl = new AREDLIntegration();

async function updateLists() {
    await pointercrate.updateList();
    await global.updateList();
    await aredl.updateList();

    console.log("Updated lists.");
}

updateLists();
setInterval(updateLists, 86400000);