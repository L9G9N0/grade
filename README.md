# Semester 5 — Academic OS

Welcome to the **Academic OS** for Semester 5 at IIIT-Delhi. 

This workspace is a clean, responsive, Notion-inspired academic command center designed to track course information, marks, assessments, target grades, and overall progress. 

Following key design principles, this Notion-like web app serves strictly as an **academic control center** rather than a file-storage system. Your PDFs, lecture slides, assignments, and course files remain organized on your Mac, while this dashboard tracks, analyzes, displays, and updates your performance.

---

## 🚀 How to Run the Workspace

Since this is built with modern vanilla web technologies (HTML, CSS, JS) and powered by Vite, starting it is simple and fast.

### Prerequisite
Make sure you have Node.js installed on your Mac.

### Steps
1. Open your terminal in the project directory: `/Users/legend27648/Documents/SEM_5/Notion online`
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open the local address printed in the terminal (usually `http://localhost:5173`) in your web browser.

---

## 🎨 Design & Features

1. **Notion-Like Aesthetics**: Clean layout, standard sidebar navigation, breadcrumbs, tags, and cards with subtle borders. Supports **Light Mode** and **Dark Mode** toggles.
2. **Single Source of Truth**: All databases are centralized. Updating a mark immediately updates the courses, grade tracker, progress database, and main dashboard overview.
3. **Automated Formulas**:
   * **Percentage (%)** = `Marks Obtained / Maximum Marks * 100`
   * **Weighted Score** = `Percentage * Weightage / 100`
   * **Current Marks** = Sum of weighted scores across graded assessments (cumulative out of 100%).
4. **Manual Control**: Grade boundaries and academic risks are manually editable. We do not assume boundaries since IIIT-Delhi uses relative grading.
5. **Separation of Concepts**: Track **Syllabus Progress** (lecture readings covered) independently from **Assessment Progress** (marks performance).
6. **Deadline System**: Dynamic tabbed sub-views for `Today`, `This Week`, `Upcoming`, `Overdue`, and an interactive monthly `Calendar` view.
7. **Zero Fake Data**: The application initializes with empty placeholders, waiting for your real semester results.

---

## 📁 File Structure

* `index.html`: The HTML layout for the application shell, containing the sidebar, breadcrumbs, content viewport, and modal forms.
* `style.css`: The central stylesheet containing theme variables (light/dark), grids, typography, badge colors, and scrollbar layouts.
* `app.js`: Core logic containing local storage state management, formulas, page routing, calendar generation, and table updates.
* `package.json`: Script definitions and Vite dev server dependencies.

---

## 🛠️ Data Schema & Persistence

All database entries are persisted in your browser's `localStorage` under `academic_os_state`. If you ever need to start fresh, you can use the **Reset All Data** button in the sidebar footer, which resets the system back to clean course templates with zero marks or assessments.

### Courses Loaded:
1. `BIP398` — Independent Project (4 Credits)
2. `COM301A` — Technical Communication (2 Credits)
3. `CSE232` — Computer Networks (4 Credits)
4. `CSE343` — Machine Learning (4 Credits)
5. `CSE656` — Information Integration and Applications (`IIA` - 4 Credits)
6. `CSE999A` — Distance Course in CSE (4 Credits)
7. `ESC205A` — Environmental Sciences (2 Credits)
