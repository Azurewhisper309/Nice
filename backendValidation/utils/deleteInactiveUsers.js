import pool from '../db.js'; // Database connection pool
//i have to schedule this function to run every 365 days
export async function deleteInactiveUsers(maxDays=365) {
    try{
       const res_to_delete_Inactive= await pool.query(`DELETE FROM users WHERE created_at <NOW() - INTERVAL $1 days`,[maxDays]);
        console.log(`Inactive users deleted: ${res_to_delete_Inactive.rowCount} users`);
        if(res_to_delete_Inactive.rowCount > 0) {
            res_to_delete_Inactive.rows.forEach(user=> {console.log(`user ${user.name} - ${user.email} deleted`)});
        }
       }
       catch(err){
            console.error('❌ Error deleting inactive users:', err.message);
       }
    }