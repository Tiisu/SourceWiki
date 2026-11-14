# WikiSourceVerifier

[English](README.md) | Français

Une plateforme communautaire de vérification de références pour les contributeurs de Wikipédia et du mouvement Wikimédia.

## 🎯 Présentation du projet

WikiSourceVerifier aide les contributeurs de Wikipédia à créer et organiser de manière collaborative des bases de données de références fiables par pays, afin d'encourager de meilleures pratiques de citation sur Wikipédia.

### Fonctionnalités clés
- **Soumission de références** : Soumettez des URL, des PDF ou d'autres références pour vérification
- **Vérification par pays** : Des experts locaux examinent les sources pertinentes pour leur région
- **Répertoire public** : Base de données interrogeable de sources fiables et vérifiées
- **Indicateurs communautaires** : Ludification avec points, badges et classements

## 🏗️ Stack technique

- **Frontend** : React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Node.js + Express, MariaDB (via Sequelize), authentification JWT
- **Hébergement** : [Toolforge](https://wikitech.wikimedia.org/wiki/Help:Toolforge), avec données dans ToolsDB (MariaDB)
- **Développement** : Rechargement à chaud (Hot reload), modules ESM, outillage moderne

## 📋 Prérequis

Avant de configurer le projet, assurez-vous de disposer de :

- **Node.js** (v18+ recommandé)
- **npm** (inclus avec Node.js)
- **MariaDB** (installation locale), ou utilisez le mode SQLite intégré pour des tests locaux rapides
- **Git**

### Installation des prérequis

#### Node.js & npm
```bash
# Check if already installed
node --version


# If not installed, download from https://nodejs.org/
# Or use a version manager like nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24
nvm use 24
```

#### MariaDB
```bash
# macOS (Homebrew)
brew install mariadb
brew services start mariadb

# Ubuntu / Debian
sudo apt install mariadb-server

# Create the database
mariadb -u root -e "CREATE DATABASE sourcewiki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Pas de MariaDB ? Définissez `DB_DIALECT=sqlite` et `DB_STORAGE=./dev.sqlite` dans `backend/.env`
et le backend enregistrera tout dans un fichier local à la place (exécutez d'abord `npm install sqlite3` dans
`backend/`). Les tables sont créées automatiquement au démarrage.

## 🚀 Démarrage rapide

### 1. Cloner le dépôt
```bash
git clone <repository-url>
cd wikisource-verifier
```

### 2. Configuration du backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Variables d'environnement requises :**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (MariaDB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sourcewiki

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Configuration du frontend

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit frontend environment
nano .env
```

**Variables d'environnement frontend** (facultatif) :
```env
# Defaults to /api. The Vite dev server forwards /api to http://localhost:5000.
VITE_API_URL=/api
```

### 4. Démarrer l'application

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend  
npm run dev
```

### 5. Accéder à l'application

- **Frontend** : http://localhost:5173
- **API Backend** : http://localhost:5000
- **Documentation de l'API** : http://localhost:5000/api (voir backend/API_DOCUMENTATION.md)

## 🛠️ Développement

### Scripts disponibles

#### Scripts backend
```bash
npm run dev      # Start development server with hot reload
npm start        # Start production server
npm test         # Run tests (not implemented yet)
```

#### Scripts frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Structure du projet

```
wikisource-verifier/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/         # Sequelize models (MariaDB)
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Authentication & validation
│   │   ├── config/         # Database configuration
│   │   └── server.js       # Express app entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API client & utilities
│   │   └── styles/        # CSS files
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Base de données

Le backend utilise MariaDB via [Sequelize](https://sequelize.org/). Les tables sont
créées automatiquement au démarrage (`sequelize.sync()`) ; les tables existantes ne sont jamais
supprimées ni modifiées, les modifications de schéma sur les tables existantes nécessitent donc un
`ALTER TABLE` manuel.

Sur Toolforge, la base de données est ToolsDB. Voir [Déploiement sur Toolforge](#-déploiement-sur-toolforge).

### Explication des variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `PORT` | Port du serveur backend | 5000 |
| `DB_HOST` / `DB_PORT` | Serveur MariaDB | 127.0.0.1 / 3306 |
| `DB_USER` / `DB_PASSWORD` | Identifiants MariaDB | root / (vide) |
| `DB_NAME` | Nom de la base de données | sourcewiki |
| `DB_DIALECT` | `mariadb` ou `sqlite` | mariadb |
| `JWT_SECRET` | Clé secrète pour les jetons JWT | À changer en production |
| `FRONTEND_URL` | URL frontend pour CORS | http://localhost:5173 |
| `TRUST_PROXY` | Définir à `1` derrière un proxy inverse (Toolforge) | non défini |
| `ANON_RATE_LIMIT_MAX` | Requêtes par tranche de 15 min pour les visiteurs non connectés | 50 |
| `VITE_API_URL` | URL de l'API backend | /api |

## 🧪 Tests

### Tests manuels
1. Démarrez les serveurs backend et frontend
2. Ouvrez http://localhost:5173
3. Testez le flux d'inscription, de connexion et de soumission

### Tests d'API
```bash
# Test server health
curl http://localhost:5000/api/health

# Test authentication endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"contributor"}'
```

## 🚀 Déploiement sur Toolforge

L'application s'exécute sur Toolforge en tant que service web unique : Express sert l'API sous
`/api` et l'application React compilée pour tous les autres chemins. Elle est compilée à partir du
miroir GitLab avec le service de build Toolforge (`package.json` et `Procfile` à
la racine du dépôt).

**Configuration initiale** (sur `login.toolforge.org`) :
```bash
become sourcewiki

# Create the ToolsDB database. Its name must start with the tool's DB user
# (the "user = s12345" line in ~/replica.my.cnf), e.g. s12345__sourcewiki
grep user ~/replica.my.cnf
mariadb --defaults-file=$HOME/replica.my.cnf -h tools.db.svc.wikimedia.cloud
#   MariaDB> CREATE DATABASE s12345__sourcewiki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#   MariaDB> exit

# Secrets and settings (each command prompts for the value)
toolforge envvars create JWT_SECRET            # long random string
toolforge envvars create JWT_REFRESH_SECRET    # a different long random string
toolforge envvars create NODE_ENV              # production
toolforge envvars create FRONTEND_URL          # https://sourcewiki.toolforge.org
toolforge envvars create TRUST_PROXY           # 1
toolforge envvars create ANON_RATE_LIMIT_MAX   # e.g. 2000
```

Les identifiants ToolsDB proviennent des variables `TOOL_TOOLSDB_USER` / `TOOL_TOOLSDB_PASSWORD`
fournies par Toolforge, et le nom de la base de données est par défaut
`<user>__sourcewiki`. Vérifiez qu'elles existent avec `toolforge envvars list` ; sinon, définissez
`DB_USER` / `DB_PASSWORD` depuis `~/replica.my.cnf`.

**Déploiement / mise à jour :**
```bash
toolforge build start https://gitlab.wikimedia.org/toolforge-repos/sourcewiki.git
toolforge webservice buildservice start --mount=none   # first time
toolforge webservice restart                           # later deploys
toolforge webservice logs -f                           # "Database connected successfully"
```

Le site est accessible sur https://sourcewiki.toolforge.org.

## 🚨 Dépannage

### Problèmes courants

#### Port déjà utilisé
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

#### Problèmes de connexion à la base de données
- Assurez-vous que MariaDB est en cours d'exécution : `brew services list | grep mariadb` ou `systemctl status mariadb`
- Vérifiez `DB_HOST`, `DB_USER`, `DB_PASSWORD` et `DB_NAME` dans `.env`
- Assurez-vous que la base de données existe (voir la commande `CREATE DATABASE` ci-dessus)

#### Échecs d'installation npm
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Problèmes de build frontend
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Ressources additionnelles

- [Documentation de l'API](backend/API_DOCUMENTATION.md)
- [Directives frontend](frontend/src/guidelines/Guidelines.md)
- [Directives de contribution](#) (À venir)

## 🤝 Contribuer

1. Forkez le dépôt
2. Créez une branche de fonctionnalité : `git checkout -b feature/amazing-feature`
3. Committez vos modifications : `git commit -m 'Add amazing feature'`
4. Poussez vers la branche : `git push origin feature/amazing-feature`
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

---

## 🌍 Vision du projet

### Fonctionnalités principales

#### 1. Formulaire de soumission de référence
Formulaire web simple permettant aux contributeurs de :
- Coller une URL ou téléverser une référence (ex. PDF, DOI, informations de livre)
- Sélectionner le pays d'origine
- Suggérer une catégorie :
  - 📗 Source primaire (données originales/de première main)
  - 📘 Source secondaire (reportage ou analyse)
  - 🚫 Non fiable (blog, désinformation, source biaisée)
- Lier facultativement l'article Wikipédia où elle a été utilisée

#### 2. Tableau de bord de vérification (Administrateurs par pays)
Chaque pays dispose de vérificateurs désignés (membres de la communauté Wikimédia, éditeurs, bibliothécaires) qui peuvent :
- Examiner les soumissions en attente
- Marquer comme « Fiable » / « Non fiable »
- Réassigner ou signaler pour examen global
- Ajouter de courtes notes (« Appartient au gouvernement », « Éditeur académique », etc.)

#### 3. Répertoire public de références
Une liste interrogeable et filtrable des sources vérifiées :
- Filtrer par pays, catégorie, fiabilité ou type de média
- Point de terminaison API pour les outils externes (afin que les éditeurs puissent l'intégrer dans les modèles de citation ou gadgets Wikipédia)
- Chaque entrée comprend : Titre/Éditeur, URL/DOI, Pays, Catégorie de fiabilité, Date de vérification, Nom du vérificateur (facultatif)

#### 4. Indicateurs communautaires / Ludification
- Les contributeurs gagnent des points ou des badges pour les soumissions vérifiées
- Les tableaux de bord par pays affichent les classements d'engagement

### Exemple de parcours utilisateur
1. Un contributeur trouve une source en modifiant un article Wikipédia
2. Il visite WikiSourceVerifier.org
3. Il soumet le lien + sélectionne « Ghana » + le marque comme « Secondaire »
4. Un administrateur ghanéen l'examine → la marque comme « Fiable »
5. Elle apparaît dans la liste publique « Ghana - Sources vérifiées »
6. Les autres contributeurs savent désormais qu'il s'agit d'une source digne de confiance

### Bénéfices pour le mouvement Wikimédia
- Réduit la propagation de sources non fiables sur Wikipédia
- Encourage la collaboration transfrontalière pour un référencement crédible
- Soutient les Wikipédias dans les langues plus petites grâce à une vérification localisée des références
- Crée un ensemble de données ouvertes de références crédibles et vérifiées par pays
