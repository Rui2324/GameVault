const pool = require("../config/db");

/**
 * Regista uma ação de admin
 */
async function logAdminAction(adminId, action, targetType = null, targetId = null, details = null, ipAddress = null) {
  try {
    await pool.query(
      "INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [adminId, action, targetType, targetId, details, ipAddress]
    );
  } catch (error) {
    console.error("Erro ao registar log de admin:", error);
  }
}

/**
 * Obter logs com paginação e filtros
 */
async function getAdminLogs(filters = {}) {
  const { page = 1, limit = 50, adminId = null, action = null, startDate = null, endDate = null } = filters;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      al.*,
      u.name as admin_name,
      u.email as admin_email
    FROM admin_logs al
    LEFT JOIN users u ON al.admin_user_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (adminId) {
    query += " AND al.admin_user_id = ?";
    params.push(adminId);
  }
  
  if (action) {
    query += " AND al.action LIKE ?";
    params.push(`%${action}%`);
  }
  
  if (startDate) {
    query += " AND al.created_at >= ?";
    params.push(startDate);
  }
  
  if (endDate) {
    query += " AND al.created_at <= ?";
    params.push(endDate);
  }
  
  query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const [logs] = await pool.query(query, params);
  
  // Contagem total
  let countQuery = "SELECT COUNT(*) as total FROM admin_logs WHERE 1=1";
  const countParams = [];
  
  if (adminId) {
    countQuery += " AND admin_user_id = ?";
    countParams.push(adminId);
  }
  
  if (action) {
    countQuery += " AND action LIKE ?";
    countParams.push(`%${action}%`);
  }
  
  if (startDate) {
    countQuery += " AND created_at >= ?";
    countParams.push(startDate);
  }
  
  if (endDate) {
    countQuery += " AND created_at <= ?";
    countParams.push(endDate);
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  
  return {
    logs,
    total: countResult[0].total,
    page,
    totalPages: Math.ceil(countResult[0].total / limit)
  };
}

/**
 * Obter estatísticas de logs
 */
async function getLogStats() {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) as total_actions,
      COUNT(DISTINCT admin_user_id) as active_admins,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7d
    FROM admin_logs
  `);
  
  const [topActions] = await pool.query(`
    SELECT action, COUNT(*) as count
    FROM admin_logs
    GROUP BY action
    ORDER BY count DESC
    LIMIT 5
  `);
  
  return {
    ...stats[0],
    topActions
  };
}

module.exports = {
  logAdminAction,
  getAdminLogs,
  getLogStats
};
