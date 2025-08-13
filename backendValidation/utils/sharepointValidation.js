// utils/executePermissionGrant.js
import axios from "axios";
import { getAzureToken } from "./getAzureToken.js";

/**
 * Safely revalidates and prepares a permission grant from an approved form.
 * Throws error if anything is invalid or missing.
 */
export async function executePermissionGrant(form) {
  const { type_of, site, who_to_add, permission, status } = form;

  if (status !== 'fixed') {
    throw new Error("Form is not approved yet");
  }

  const token = await getAzureToken();
  const headers = { Authorization: `Bearer ${token}` };

  if (type_of === 'azure permissions') {
    const validAzurePerms = ['Owner', 'Member'];
    if (!validAzurePerms.includes(permission)) {
      throw new Error(`Invalid Azure permission: ${permission}`);
    }

    for (const entity of who_to_add) {
      if (entity.type !== 'user') {
        throw new Error("Azure only supports user assignments");
      }

      const userRes = await axios.get(`https://graph.microsoft.com/v1.0/users/${entity.id}`, { headers });
      if (!userRes.data) {
        throw new Error(`User ${entity.id} not found`);
      }

      // ✅ [Here you'd perform the actual role assignment]
      // await assignAzureRoleToUser(entity.id, permission);
    }

    return true;
  }

  if (type_of === 'sharepoint permissions') {
    const siteRes = await axios.get(`https://graph.microsoft.com/v1.0/sites/${site.id}`, { headers });
    const siteId = siteRes.data.id;

    const [roleDefs, spGroups] = await Promise.all([
      axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/roleDefinitions`, { headers }),
      axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/groups`, { headers })
    ]);

    const classicRoles = ['Owner', 'Member', 'Visitor'];
    const customSPGroupNames = spGroups.data.value.map(g => g.name);
    const allValidPermissions = [...classicRoles, ...customSPGroupNames];

    if (!allValidPermissions.includes(permission)) {
      throw new Error(`Invalid SharePoint permission: ${permission}`);
    }

    for (const entity of who_to_add) {
      if (entity.type === 'user') {
        const userRes = await axios.get(`https://graph.microsoft.com/v1.0/users/${entity.id}`, { headers });
        if (!userRes.data) {
          throw new Error(`User ${entity.id} not found`);
        }
      } else if (entity.type === 'group') {
        const groupRes = await axios.get(`https://graph.microsoft.com/v1.0/groups/${entity.id}`, { headers });
        const membersRes = await axios.get(`https://graph.microsoft.com/v1.0/groups/${entity.id}/members`, { headers });

        if (!groupRes.data || !membersRes.data.value.length) {
          throw new Error(`Group ${entity.id} is invalid or has no members`);
        }
        
      } else {
        throw new Error(`Invalid entity type '${entity.type}'`);
      }

      // ✅ [Here you'd perform the actual permission grant]
      // await assignSharePointRole(entity.id, permission, siteId);
    }

    return true;
  }

  throw new Error("Unsupported type_of in form");
}
