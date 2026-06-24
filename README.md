# KanbanFlow - Premium Glassmorphic Kanban Board

A modern, high-performance, Trello-style Kanban board built with a **Laravel API (backend)** and **React Vite (frontend)** using SQLite for data persistence and rich dark-mode glassmorphic aesthetics.

Developed autonomously in collaboration with AI coding agents (OpenClaw + Hermes).

---

## Features
- **Board Management**: Create, select, and delete boards. Default boards are seeded with standard lists.
- **Lists (Columns)**: Dynamic list creation, reordering, and deletion.
- **Cards**: Add tasks with titles, descriptions, due dates, tags, and member assignments.
- **Drag and Drop**: Smooth native HTML5 drag-and-drop to move cards between columns.
- **Overdue Indicator**: Visual warnings for cards with past due dates.
- **Tagging System**: Many-to-many relationship allowing custom tag creation with distinct colors.
- **Member Assignment**: Assign multiple team members to a task with dynamic avatars.

---

## Tech Stack
- **Frontend**: React (Vite), Lucide Icons, Vanilla CSS (Glassmorphism layout).
- **Backend**: Laravel API, SQLite Database.
- **Orchestration**: OpenClaw Gateway (Google Gemini 2.5 Flash), Hermes Autonomous Agent.

---

## Setup & Running Locally

### Step 1: Install System Dependencies (Arch Linux)
Ensure PHP SQLite drivers are installed and active.

1. Install `php-sqlite`:
   ```bash
   sudo pacman -S php-sqlite
   ```
2. Enable SQLite extensions in `/etc/php/php.ini`:
   Open `/etc/php/php.ini` in your editor (with sudo) and uncomment the following lines (remove the leading `;`):
   ```ini
   extension=pdo_sqlite
   extension=sqlite3
   ```

### Step 2: Set up Backend (Laravel API)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Initialize the SQLite database and run migrations with seed data:
   ```bash
   touch database/database.sqlite
   php artisan migrate --seed
   ```
4. Start the Laravel development server:
   ```bash
   php artisan serve
   ```
   The backend will run at `http://localhost:8000`.

### Step 3: Set up Frontend (React + Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173`. Open this URL in your web browser.

---

## API Endpoints Reference

### Boards
- `GET /api/boards` - List all boards.
- `POST /api/boards` - Create a new board (automatically seeds default columns).
- `GET /api/boards/{id}` - Show board with its lists, cards, tags, and members.
- `DELETE /api/boards/{id}` - Delete a board.

### Lists
- `POST /api/lists` - Create a list.
- `PUT /api/lists/{id}` - Update list name or position.
- `DELETE /api/lists/{id}` - Delete a list.

### Cards
- `POST /api/cards` - Create a card.
- `PUT /api/cards/{id}` - Update card (position, column, title, due_date, description).
- `DELETE /api/cards/{id}` - Delete a card.
- `POST /api/cards/{id}/tags` - Sync tags on a card.
- `POST /api/cards/{id}/members` - Sync members on a card.
