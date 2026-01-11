-- Tabela para sistema de seguir utilizadores
CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,           -- quem segue
  following_id INT NOT NULL,          -- quem é seguido
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Chaves estrangeiras
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Não pode seguir a mesma pessoa duas vezes
  UNIQUE KEY unique_follow (follower_id, following_id),
  
  -- Índices para queries rápidas
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
);

-- Verificar se não pode seguir a si próprio (constraint via trigger)
DELIMITER //
CREATE TRIGGER prevent_self_follow
BEFORE INSERT ON follows
FOR EACH ROW
BEGIN
  IF NEW.follower_id = NEW.following_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não podes seguir-te a ti próprio';
  END IF;
END//
DELIMITER ;
