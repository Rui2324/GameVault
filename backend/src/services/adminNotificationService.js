// src/services/adminNotificationService.js
const pool = require("../config/db");

/**
 * Criar uma notificação para admins
 */
async function createNotification(type, title, message, severity = 'info', relatedType = null, relatedId = null) {
  try {
    await pool.query(
      "INSERT INTO admin_notifications (type, title, message, severity, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)",
      [type, title, message, severity, relatedType, relatedId]
    );
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
}

/**
 * Obter notificações não lidas
 */
async function getUnreadNotifications() {
  const [notifications] = await pool.query(
    "SELECT * FROM admin_notifications WHERE is_read = FALSE ORDER BY created_at DESC LIMIT 20"
  );
  return notifications;
}

/**
 * Obter todas as notificações com paginação
 */
async function getAllNotifications(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const [notifications] = await pool.query(
    "SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  
  const [count] = await pool.query("SELECT COUNT(*) as total FROM admin_notifications");
  
  return {
    notifications,
    total: count[0].total,
    page,
    totalPages: Math.ceil(count[0].total / limit)
  };
}

/**
 * Marcar notificação como lida
 */
async function markAsRead(notificationId) {
  await pool.query(
    "UPDATE admin_notifications SET is_read = TRUE WHERE id = ?",
    [notificationId]
  );
}

/**
 * Marcar todas como lidas
 */
async function markAllAsRead() {
  await pool.query("UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE");
}

/**
 * Eliminar notificação
 */
async function deleteNotification(notificationId) {
  await pool.query("DELETE FROM admin_notifications WHERE id = ?", [notificationId]);
}

/**
 * Verificar atividade suspeita e criar notificações automáticas
 */
async function checkSuspiciousActivity() {
  try {
    // Reviews múltiplas do mesmo user nas últimas 24h
    const [spamReviews] = await pool.query(`
      SELECT user_id, COUNT(*) as count, u.name, u.email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY user_id
      HAVING count > 10
    `);
    
    for (const spam of spamReviews) {
      await createNotification(
        'SPAM_DETECTION',
        'Possível spam de reviews',
        `User ${spam.name} (${spam.email}) criou ${spam.count} reviews nas últimas 24h`,
        'warning',
        'user',
        spam.user_id
      );
    }
    
    // Logins falhados múltiplos (precisa de tabela de login_attempts)
    // Registo massivo de users
    const [massSignups] = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    if (massSignups[0].count > 20) {
      await createNotification(
        'MASS_SIGNUP',
        'Registo massivo de users',
        `${massSignups[0].count} novos users na última hora`,
        'critical',
        null,
        null
      );
    }
  } catch (error) {
    console.error("Erro ao verificar atividade suspeita:", error);
  }
}

module.exports = {
  createNotification,
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkSuspiciousActivity
};
