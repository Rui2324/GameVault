-- =============================================
-- MIGRATION: Reviews, Achievements, Public Profile
-- =============================================

-- Tabela de Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    game_id INT UNSIGNED NOT NULL,
    rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
    title VARCHAR(255),
    content TEXT,
    spoiler BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game_review (user_id, game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Likes nas Reviews
CREATE TABLE IF NOT EXISTS review_likes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    review_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_review_like (user_id, review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de definição de Conquistas
CREATE TABLE IF NOT EXISTS achievements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category ENUM('collection', 'playtime', 'social', 'special') DEFAULT 'collection',
    requirement_value INT DEFAULT 1,
    xp_reward INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Conquistas desbloqueadas pelos utilizadores
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    achievement_id INT UNSIGNED NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campos ao perfil do utilizador
-- (Se der erro de coluna duplicada, significa que já existe - pode ignorar)
ALTER TABLE users ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN total_xp INT DEFAULT 0;

-- =============================================
-- INSERIR CONQUISTAS PREDEFINIDAS
-- =============================================

INSERT INTO achievements (code, name, description, icon, category, requirement_value, xp_reward) VALUES
-- Coleção
('first_game', 'Primeiro Passo', 'Adicionaste o teu primeiro jogo à coleção', '🎮', 'collection', 1, 10),
('collector_10', 'Colecionador', 'Tens 10 jogos na coleção', '📚', 'collection', 10, 25),
('collector_50', 'Colecionador Sério', 'Tens 50 jogos na coleção', '🏆', 'collection', 50, 50),
('collector_100', 'Mestre Colecionador', 'Tens 100 jogos na coleção', '👑', 'collection', 100, 100),
('first_complete', 'Missão Cumprida', 'Concluíste o teu primeiro jogo', '✅', 'collection', 1, 15),
('completionist_10', 'Completista', 'Concluíste 10 jogos', '🎯', 'collection', 10, 50),
('completionist_25', 'Completista Dedicado', 'Concluíste 25 jogos', '💎', 'collection', 25, 100),

-- Tempo de Jogo
('playtime_10', 'Casual Gamer', '10 horas de jogo registadas', '⏰', 'playtime', 10, 15),
('playtime_100', 'Dedicado', '100 horas de jogo registadas', '🔥', 'playtime', 100, 50),
('playtime_500', 'Veterano', '500 horas de jogo registadas', '⚡', 'playtime', 500, 100),
('playtime_1000', 'Lenda', '1000 horas de jogo registadas', '🌟', 'playtime', 1000, 200),

-- Social
('first_review', 'Crítico', 'Escreveste a tua primeira review', '✍️', 'social', 1, 15),
('reviewer_10', 'Crítico Ativo', 'Escreveste 10 reviews', '📝', 'social', 10, 50),
('helpful_10', 'Útil', 'As tuas reviews receberam 10 likes', '👍', 'social', 10, 30),
('helpful_50', 'Influenciador', 'As tuas reviews receberam 50 likes', '⭐', 'social', 50, 75),

-- Especiais
('early_adopter', 'Early Adopter', 'Juntaste-te ao GameVault nos primeiros 30 dias', '🚀', 'special', 1, 50),
('wishlist_5', 'Sonhador', 'Tens 5 jogos na wishlist', '💭', 'special', 5, 10),
('perfect_rating', 'Exigente', 'Deste a classificação máxima a um jogo', '💯', 'special', 1, 20)
ON DUPLICATE KEY UPDATE name = VALUES(name);
