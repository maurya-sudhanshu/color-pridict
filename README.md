<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:064E3B,45:059669,100:34D399&height=210&section=header&text=Color%20Predict&fontSize=44&fontColor=FFFFFF&fontAlignY=38&desc=Color%20Game%20Platform%20%7C%20Next.js%20%7C%20Prisma&descAlignY=60&descSize=16" width="100%" alt="Color Predict project banner" />

<p>
  <img src="https://img.shields.io/badge/Next.js-15-111827?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-18-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Database-Configurable-059669?style=for-the-badge&logo=databricks&logoColor=white" alt="Database" />
</p>

**A web-based color prediction game application with game, wallet, authentication, and admin areas.**

</div>

---

## 🎯 About the Project

**Color Predict** is a web application built with Next.js and React. The codebase includes game pages, user authentication, wallet-related screens, support pages, and an admin area. Prisma is used for database access and schema management.

This README describes the repository structure and how to set up the project locally. Game rules, wallet behavior, and deployment configuration depend on the current implementation and environment.

## ✨ Main Areas

- 🎮 **Game interface** — the user-facing game experience.
- 🔐 **Authentication** — authentication-related pages and utilities.
- 💳 **Wallet** — wallet interface routes.
- 🛠️ **Admin area** — administrative pages.
- 💬 **Support** — user support section.
- 🗄️ **Database layer** — Prisma Client and schema workflow.
- ✅ **Validation and utilities** — Zod and shared frontend utilities.

## 🧰 Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,prisma&theme=dark" alt="Next.js, React, TypeScript, Tailwind CSS and Prisma" />

<br/>

<img src="https://img.shields.io/badge/Next.js-15-111827?style=flat-square&logo=nextdotjs" alt="Next.js" />
<img src="https://img.shields.io/badge/React-18-149ECA?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Auth-JWT-111827?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />

</div>

| Technology | Role |
|---|---|
| Next.js 15 | Web framework and application routing |
| React 18 | User interface components |
| TypeScript | Typed application code |
| Tailwind CSS | UI styling |
| Prisma | Database ORM and schema tooling |
| Prisma Client | Database queries from application code |
| JSON Web Token | Token authentication utilities |
| bcryptjs | Password hashing utilities |
| Zod | Data validation |
| Lucide React | UI icons |

## 📁 Project Structure

```text
color-pridict/
├── app/
│   ├── admin/          # Admin pages
│   ├── api/            # API route handlers
│   ├── auth/           # Authentication pages
│   ├── game/           # Game interface
│   ├── support/        # Support pages
│   ├── wallet/         # Wallet pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # Reusable UI components
├── lib/                # Shared utilities and application logic
├── prisma/             # Prisma schema and database setup
├── public/             # Static assets
├── scripts/            # Utility and seed scripts
├── package.json        # Dependencies and commands
└── next.config.js      # Next.js configuration
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- A database supported by the Prisma schema
- Environment variables required by the app and database

### 1. Clone the repository

```bash
git clone https://github.com/maurya-sudhanshu/color-pridict.git
cd color-pridict
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file in the project root and supply the values required by the project. At minimum, inspect `prisma/schema.prisma` and the application code to identify the required database connection variable and any authentication settings.

```env
# Example placeholders only — use the exact variable names expected by the code.
DATABASE_URL="your-database-connection-string"
JWT_SECRET="replace-with-a-long-random-secret"
```

**Do not use these placeholders in production, commit real credentials, or expose secrets in screenshots or logs.**

### 4. Generate Prisma Client and sync the schema

```bash
npx prisma generate
npm run db:push
```

Use `db:push` only when it fits your workflow. For production databases, review schema changes and use a deliberate migration process.

### 5. Seed initial data (optional)

```bash
npm run db:seed
```

Run the seed script only after reviewing what data it creates or changes.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Generate Prisma Client and build the application |
| `npm start` | Start the production server |
| `npm run lint` | Run the configured lint script |
| `npm run db:push` | Push Prisma schema changes to the configured database |
| `npm run db:seed` | Run the seed script |

## 🔒 Security & Responsible Use

- Keep `.env` files and secrets out of version control.
- Use strong, private authentication secrets and rotate any exposed credentials.
- Validate all client-supplied data on the server.
- Enforce authorization for admin and wallet-related APIs.
- Use transactions and server-side validation for any balance-changing operation.
- Never rely on frontend-only checks for access control.
- Test thoroughly with a non-production database before deploying schema changes.

## 🧭 Development Notes

Before deploying, review the API routes under `app/api/`, the database schema under `prisma/`, and the authentication and wallet logic. Configure environment variables in your hosting provider and verify all protected routes server-side.

---

<div align="center">

**Color Predict** · Built with Next.js, React, TypeScript, and Prisma.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:064E3B,45:059669,100:34D399&height=100&section=footer" width="100%" alt="Footer decoration" />

</div>
