import axios from "axios";
import pool from "../db.js";
import { getAzureToken } from "./Token_Admins.js";

export async function azurePermissionsHandler(formId) {
  const validPermissions = ['member', 'owner'];

  try {
    // 1. Fetch the form by ID
    const result = await pool.query('SELECT * FROM forms WHERE id = $1', [formId]);
    if (result.rowCount === 0) {
      throw new Error(`Form ${formId} not found.`);
    }

    const form = result.rows[0];

    // 2. Validate form type
    if (form.type_of !== 'azure permissions') {
      throw new Error(`Form ${formId} is not an Azure permissions type.`);
    }

   // 3. Validate admin approval
    if (form.approved_by_admin === null) {
    console.log(`⏳ Form ${formId} is still pending admin approval`);
    return { success: false, message: "Form is pending admin review." };
    }

    if (form.approved_by_admin === false) {
    await pool.query('DELETE FROM forms WHERE id = $1', [formId]);
    console.log(`🗑️ Form ${formId} deleted after admin rejection`);
    return { success: false, message: "Form was denied. Deleted." };
    }
    // 4. Validate permission value
    if (!validPermissions.includes(form.permission)) {
      throw new Error(`Invalid permission '${form.permission}'. Must be 'member' or 'owner'.`);
    }

    const groupId = form.group;
    let whoToAdd = form.who_to_add;

    // 5. Default to form submitter if who_to_add is empty
    if (!Array.isArray(whoToAdd) || whoToAdd.length === 0) {
      whoToAdd = [form.submitted_by];
      console.log(`📌 Defaulted who_to_add to submitted_by: ${form.submitted_by}`);
    }

    // 6. Validate all users exist in local DB
    for (const userId of whoToAdd) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rowCount === 0) {
        throw new Error(`User ${userId} not found in local database.`);
      }
    }

    // 7. Get Azure token and validate group exists
    const token = await getAzureToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const groupCheck = await axios.get(`https://graph.microsoft.com/v1.0/groups/${groupId}`, { headers });
    if (!groupCheck?.data?.id) {
      throw new Error(`Azure group ${groupId} not found.`);
    }

    // 8. Add users to Azure group
    const roleEndpoint = form.permission === 'owners' ? 'owners' : 'members';
    const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/${roleEndpoint}/$ref`;

    let successCount = 0;

    for (const userId of whoToAdd) {
      const refBody = {
        "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
      };

      try {
        await axios.post(url, refBody, { headers });
        console.log(`✅ Added user ${userId} as ${form.permission}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to add user ${userId}:`, err.response?.data || err.message);
      }
    }

    return {
      success: true,
      message: `Processed ${whoToAdd.length} user(s), success: ${successCount}`
    };

  } catch (err) {
    console.error("❌ azurePermissionsHandler error:", err.message);
    throw err;
  }
}
