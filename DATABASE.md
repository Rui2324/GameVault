# Arquitetura de Base de Dados - GameVault

## Visão Geral

O **GameVault** utiliza **MySQL** como sistema de gestão de base de dados relacional, com uma arquitetura bem estruturada que separa responsabilidades entre configuração, models e controllers.

## Stack Tecnológico

- **SGBD**: MySQL 8.0+
- **Driver**: `mysql2/promise` - Cliente MySQL com suporte a Promises e async/await
- **Padrão**: Connection Pool para gestão eficiente de conexões
- **ORM**: Nenhum - SQL direto através do driver para máximo controle e performance

## Configuração da Conexão

### Connection Pool

```javascript
// src/config/db.js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,      // Máximo 10 conexões simultâneas
  queueLimit: 0             // Sem limite de fila de espera
});
```

**Vantagens do Connection Pool:**
- Reutilização de conexões para melhor performance
- Gestão automática de conexões ativas e inativas
- Previne esgotamento de recursos do servidor MySQL
- Suporta múltiplos pedidos concorrentes

## Arquitetura em Camadas

### 1. **Camada de Configuração** (`config/db.js`)
- Configuração central do pool de conexões
- Variáveis de ambiente para segurança
- Exportação do pool para uso em toda a aplicação

### 2. **Camada de Models** (`models/`)
Responsável por encapsular a lógica de acesso a dados. Cada model representa uma entidade do sistema:

**Exemplos de Models:**
- `userModel.js` - Gestão de utilizadores
- `gameModel.js` - Operações sobre jogos
- `collectionModel.js` - Coleção pessoal de jogos
- `wishlistModel.js` - Lista de desejos
- `reviewModel.js` - Reviews e avaliações
- `achievementModel.js` - Sistema de conquistas
- `followModel.js` - Sistema social de seguidores

**Padrão utilizado:**
```javascript
async function findUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}
```

### 3. **Camada de Controllers** (`controllers/`)
Consome os models e implementa a lógica de negócio, orquestrando múltiplas operações quando necessário.

**Exemplos:**
- `authController.js` - Autenticação e registo
- `gameController.js` - CRUD de jogos
- `adminController.js` - Funcionalidades administrativas
- `steamController.js` - Integração com Steam API

## Estrutura de Dados

### Principais Tabelas

#### **users**
- Armazena utilizadores do sistema
- Campos: id, name, email, password_hash, avatar_url, bio, role, is_public, total_xp
- Suporta sistema de roles (user/admin)
- Perfis públicos/privados

#### **games**
- Catálogo de jogos
- Campos: id, external_id, rawg_id, steam_appid, title, slug, platform, genre, release_date, cover_url, description
- Suporta múltiplas fontes (RAWG, Steam, manual)
- IDs externos para sincronização com APIs

#### **collection_entries**
- Jogos na coleção de cada utilizador
- Campos: user_id, game_id, status, hours_played, rating, start_date, completion_date
- UNIQUE constraint (user_id, game_id)
- Estados: por_jogar, a_jogar, concluido, abandonado

#### **wishlist_entries**
- Lista de desejos dos utilizadores
- Campos: user_id, game_id, priority, notes, added_at
- Sistema de prioridades (low, medium, high)

#### **reviews**
- Reviews escritas pelos utilizadores
- Campos: user_id, game_id, rating, title, content, spoiler, likes_count
- UNIQUE constraint (user_id, game_id) - uma review por jogo por user
- Sistema de likes integrado

#### **achievements**
- Definição de conquistas do sistema
- Categorias: collection, playtime, social, special
- Campos: code, name, description, icon, category, requirement_value, xp_reward

#### **user_achievements**
- Conquistas desbloqueadas por utilizador
- Relação many-to-many entre users e achievements
- Timestamp de desbloqueio

#### **follows**
- Sistema social de seguidores
- Relação many-to-many entre users
- Campos: follower_id, following_id, created_at

#### **admin_logs**
- Auditoria de ações administrativas
- Campos: admin_id, action, target_type, target_id, details, ip_address
- Rastreabilidade completa

## Gestão de Transações

Para operações críticas que envolvem múltiplas tabelas, utilizamos transações:

```javascript
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  
  // Operação 1: Criar jogo
  const [gameResult] = await conn.query(
    "INSERT INTO games (title, slug) VALUES (?, ?)",
    [title, slug]
  );
  
  // Operação 2: Adicionar à coleção
  await conn.query(
    "INSERT INTO collection_entries (user_id, game_id) VALUES (?, ?)",
    [userId, gameResult.insertId]
  );
  
  await conn.commit();
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release();
}
```

**Casos de uso:**
- Importação em massa de jogos da Steam
- Sincronização de conquistas
- Operações administrativas críticas
- Transferência de dados entre tabelas

## Migrações

Sistema de migrações SQL manuais em `src/migrations/`:

- `add_user_role.sql` - Sistema de roles
- `add_reviews_achievements.sql` - Reviews e conquistas
- `add_follows.sql` - Sistema social
- `add_admin_features.sql` - Funcionalidades admin

**Execução:**
```bash
mysql -u root -p gamevault < src/migrations/add_reviews_achievements.sql
```

## Segurança

### 1. **Prepared Statements**
Todas as queries usam prepared statements para prevenir SQL Injection:
```javascript
// ✅ SEGURO
await pool.query("SELECT * FROM users WHERE email = ?", [email]);

// ❌ INSEGURO (nunca fazer)
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### 2. **Sanitização de Inputs**
- Validação no controller antes de passar aos models
- Tipos de dados corretos nos parâmetros
- Constraints de integridade na BD

### 3. **Senhas**
- Hashing com `bcrypt` (salt rounds: 10)
- Nunca armazenar senhas em plain text
- Coluna `password_hash` na tabela users

### 4. **Credenciais**
- Variáveis de ambiente (`.env`)
- Nunca committadas no Git
- Valores diferentes por ambiente (dev/prod)

## Otimizações

### Índices
- Primary keys em todas as tabelas
- Unique constraints em campos cruciais (email, slug)
- Foreign keys para integridade referencial
- Índices compostos em queries frequentes

### Boas Práticas
- `LIMIT` em queries de listagem
- Seleção apenas dos campos necessários (evitar `SELECT *`)
- Paginação em listagens grandes
- Cache de queries pesadas em memória (quando aplicável)

### Performance
- Connection pool evita overhead de conexões
- Queries otimizadas com JOINs apropriados
- Aggregations (COUNT, SUM) na BD em vez de código
- Batch operations para operações múltiplas

## Integrações Externas

### RAWG API
- Enriquecimento de dados de jogos
- Campos: external_id, description, metacritic, platforms, genres
- Sincronização on-demand

### Steam API
- Importação de biblioteca pessoal
- Campo: steam_appid
- Sincronização de conquistas Steam
- Horas jogadas

**Estratégia de dados:**
1. Importar jogo da Steam (apenas steam_appid e título)
2. Enriquecer com dados da RAWG (platforms, genres, cover)
3. Manter referências cruzadas (steam_appid + rawg_id)

## Exemplos de Queries Complexas

### Estatísticas do Utilizador
```javascript
const [stats] = await pool.query(`
  SELECT 
    (SELECT COUNT(*) FROM collection_entries WHERE user_id = ?) as total_games,
    (SELECT COUNT(*) FROM collection_entries WHERE user_id = ? AND status = 'concluido') as completed,
    (SELECT SUM(hours_played) FROM collection_entries WHERE user_id = ?) as total_hours
  FROM users WHERE id = ?
`, [userId, userId, userId, userId]);
```

### Top Jogos por Rating
```javascript
const [games] = await pool.query(`
  SELECT g.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
  FROM games g
  LEFT JOIN reviews r ON g.id = r.game_id
  GROUP BY g.id
  HAVING review_count >= 5
  ORDER BY avg_rating DESC
  LIMIT 10
`);
```

### Feed de Atividade
```javascript
const [activities] = await pool.query(`
  SELECT 'review' as type, r.created_at, u.name, g.title
  FROM reviews r
  JOIN users u ON r.user_id = u.id
  JOIN games g ON r.game_id = g.id
  WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
  UNION ALL
  SELECT 'game_added' as type, c.created_at, u.name, g.title
  FROM collection_entries c
  JOIN users u ON c.user_id = u.id
  JOIN games g ON c.game_id = g.id
  WHERE c.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
  ORDER BY created_at DESC
  LIMIT 20
`, [userId, userId]);
```

## Manutenção e Monitoring

### Logs
- Console.error para erros de BD
- Logs de admin no sistema próprio (`admin_logs`)
- Tracking de IPs em ações sensíveis

### Backup
- Dumps regulares da BD
- Estratégia: mysqldump com compressão
- Retenção: diária (7 dias), semanal (4 semanas)

### Schema Evolution
- Migrações versionadas
- Sempre testadas em ambiente de dev
- ALTER TABLE com cuidado (pode causar locks)

## Conclusão

A arquitetura de BD do GameVault é:
- **Robusta**: Transações, constraints, foreign keys
- **Segura**: Prepared statements, hashing, validação
- **Performante**: Connection pool, índices, otimizações
- **Escalável**: Estrutura modular, separação de responsabilidades
- **Manutenível**: Código limpo, migrações claras, documentação

O uso de **SQL direto** (sem ORM) oferece máximo controle e performance, essencial para queries complexas e operações em batch. A **arquitetura em camadas** mantém o código organizado e facilita manutenção e testes.
