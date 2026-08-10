// ==========================================================================
// SEMESTER 5 — ACADEMIC OS — CORE JAVASCRIPT
// ==========================================================================

// 1. DEFAULT COURSES DATA
const DEFAULT_COURSES = [
  {
    code: "BIP398",
    name: "Independent Project",
    shortName: "BIP398",
    credits: 4,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  },
  {
    code: "COM301A",
    name: "Technical Communication",
    shortName: "COM301A",
    credits: 2,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  },
  {
    code: "CSE232",
    name: "Computer Networks",
    shortName: "CSE232",
    credits: 4,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  },
  {
    code: "CSE343",
    name: "Machine Learning",
    shortName: "CSE343",
    credits: 4,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  },
  {
    code: "CSE656",
    name: "Information Integration and Applications",
    shortName: "IIA",
    credits: 4,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  },
  {
    code: "CSE999A",
    name: "Distance Course in CSE",
    shortName: "CSE999A",
    credits: 4,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  },
  {
    code: "ESC205A",
    name: "Environmental Sciences",
    shortName: "ESC205A",
    credits: 2,
    instructor: "",
    targetGrade: "—",
    currentGrade: "—",
    status: "Not Started",
    risk: "Green",
    targetMarks: null,
    syllabusProgress: 0,
    weakAreas: "",
    strongAreas: "",
    notes: ""
  }
];

// Grade Options for selection
const GRADE_OPTIONS = ["—", "A+", "A", "A-", "B", "B-", "C", "C-", "D", "F", "S", "X"];

// 2. STATE CONFIGURATION
let state = {
  courses: [],
  assessments: [],
  marks: [], // Linked to assessments via assessmentId
  settings: {
    targetSemesterGPA: null,
    targetSemesterMarks: null,
    theme: "light",
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear()
  }
};

// 3. STORAGE & STATE MANAGEMENT
function loadState() {
  const stored = localStorage.getItem("academic_os_state");
  if (stored) {
    try {
      state = JSON.parse(stored);
      // Backwards compatibility / Check if all courses exist
      if (!state.courses || state.courses.length === 0) {
        state.courses = JSON.parse(JSON.stringify(DEFAULT_COURSES));
      } else {
        // Ensure name overrides like Short Name are set
        state.courses.forEach(c => {
          if (c.code === "CSE656") c.shortName = "IIA";
        });
      }
      if (!state.assessments) state.assessments = [];
      if (!state.marks) state.marks = [];
      if (!state.settings) {
        state.settings = {
          targetSemesterGPA: null,
          targetSemesterMarks: null,
          theme: "light",
          calendarMonth: new Date().getMonth(),
          calendarYear: new Date().getFullYear()
        };
      }
    } catch (e) {
      console.error("Error parsing stored state, resetting.", e);
      resetStateToDefault();
    }
  } else {
    resetStateToDefault();
  }
  
  // Apply current theme
  document.documentElement.setAttribute("data-theme", state.settings.theme || "light");
}

function saveState() {
  localStorage.setItem("academic_os_state", JSON.stringify(state));
}

function resetStateToDefault() {
  state.courses = JSON.parse(JSON.stringify(DEFAULT_COURSES));
  state.assessments = [];
  state.marks = [];
  state.settings = {
    targetSemesterGPA: null,
    targetSemesterMarks: null,
    theme: "light",
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear()
  };
  saveState();
}

// 4. DERIVED CALCULATIONS (FORMULAS)
function getCourseCalculatedData(courseCode) {
  const courseAssessments = state.assessments.filter(a => a.courseCode === courseCode);
  
  // Graded assessment weightages and scores
  let totalGradedWeightage = 0;
  let totalWeightedScore = 0;
  let completedCount = 0;

  courseAssessments.forEach(a => {
    if (a.status === "Completed") {
      completedCount++;
    }
    
    // Find linked marks entry
    const mark = state.marks.find(m => m.assessmentId === a.id);
    if (mark && mark.marksObtained !== null && a.maxMarks > 0 && a.weightage > 0) {
      const percentage = (mark.marksObtained / a.maxMarks) * 100;
      const weightedScore = (percentage * a.weightage) / 100;
      totalWeightedScore += weightedScore;
      totalGradedWeightage += a.weightage;
    }
  });

  // Marks Percentage on completed graded items
  const gradedPercentage = totalGradedWeightage > 0 ? (totalWeightedScore / totalGradedWeightage) * 100 : null;

  return {
    assessmentProgress: totalGradedWeightage, // % of total course weightage graded
    currentMarks: totalWeightedScore, // total weighted marks obtained so far (out of 100)
    gradedPercentage: gradedPercentage, // performance % on graded items
    completedAssessmentsCount: completedCount,
    totalAssessmentsCount: courseAssessments.length
  };
}

function getSemesterCalculatedData() {
  let totalCredits = 0;
  let weightedMarksSum = 0;
  let totalSyllabusProgress = 0;
  let activeCourseCount = 0;

  state.courses.forEach(c => {
    const calc = getCourseCalculatedData(c.code);
    totalCredits += c.credits;
    // Weighted by credits
    weightedMarksSum += (calc.currentMarks * c.credits);
    totalSyllabusProgress += c.syllabusProgress;
    activeCourseCount++;
  });

  const overallPerformance = totalCredits > 0 ? (weightedMarksSum / totalCredits) : 0;
  const averageSyllabusProgress = activeCourseCount > 0 ? (totalSyllabusProgress / activeCourseCount) : 0;

  return {
    totalCredits,
    overallPerformance, // Weighted average of current marks across credits
    averageSyllabusProgress
  };
}

// 5. VIEW ROUTING & BREADCRUMBS
function handleRouting() {
  const hash = window.location.hash || "#dashboard";
  const viewport = document.getElementById("content-viewport");
  const breadcrumbs = document.getElementById("breadcrumbs");
  const currentBreadcrumb = document.getElementById("current-breadcrumb");

  // Close sidebar drawer on mobile after navigation
  document.getElementById("sidebar").classList.remove("open");

  // Highlight Sidebar navigation
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  // Reset breadcrumbs
  breadcrumbs.innerHTML = `
    <span class="breadcrumb-item"><a href="#dashboard">Semester 5 — Academic OS</a></span>
    <span class="breadcrumb-separator">/</span>
  `;

  if (hash === "#dashboard") {
    document.querySelector('[data-page="dashboard"]').classList.add("active");
    breadcrumbs.innerHTML += `<span class="breadcrumb-item active">Dashboard</span>`;
    renderDashboard(viewport);
  } else if (hash === "#assessments") {
    document.querySelector('[data-page="assessments"]').classList.add("active");
    breadcrumbs.innerHTML += `<span class="breadcrumb-item active">Assessments</span>`;
    renderAssessments(viewport);
  } else if (hash === "#marks") {
    document.querySelector('[data-page="marks"]').classList.add("active");
    breadcrumbs.innerHTML += `<span class="breadcrumb-item active">Marks Database</span>`;
    renderMarks(viewport);
  } else if (hash === "#grades") {
    document.querySelector('[data-page="grades"]').classList.add("active");
    breadcrumbs.innerHTML += `<span class="breadcrumb-item active">Grade Tracker</span>`;
    renderGrades(viewport);
  } else if (hash === "#progress") {
    document.querySelector('[data-page="progress"]').classList.add("active");
    breadcrumbs.innerHTML += `<span class="breadcrumb-item active">Progress Tracker</span>`;
    renderProgress(viewport);
  } else if (hash.startsWith("#course-")) {
    const courseCode = hash.replace("#course-", "");
    const course = state.courses.find(c => c.code === courseCode);
    if (course) {
      const activeLink = document.querySelector(`[href="#course-${courseCode}"]`);
      if (activeLink) activeLink.classList.add("active");
      
      breadcrumbs.innerHTML += `
        <span class="breadcrumb-item"><a href="#dashboard">Courses</a></span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">${course.code}</span>
      `;
      renderCoursePage(viewport, course);
    } else {
      window.location.hash = "#dashboard";
    }
  } else {
    window.location.hash = "#dashboard";
  }
}

// 6. VIEW RENDERING FUNCTIONS

// --- DASHBOARD VIEW ---
function renderDashboard(container) {
  const semData = getSemesterCalculatedData();
  
  // Count states for Snapshot
  const totalCourses = state.courses.length;
  const completedCourses = state.courses.filter(c => c.status === "Completed").length;
  const greenCourses = state.courses.filter(c => c.risk === "Green").length;
  const yellowCourses = state.courses.filter(c => c.risk === "Yellow").length;
  const redCourses = state.courses.filter(c => c.risk === "Red").length;

  // Render HTML Structure
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <h2 class="page-title">SEMESTER 5 — ACADEMIC OS</h2>
        <p class="page-subtitle">Your central academic command center. Track assessments, performance, and progress.</p>
      </header>

      <div class="dashboard-grid">
        <!-- SEMESTER OVERVIEW -->
        <div class="card overview-banner">
          <h3 class="section-title">📊 Semester Overview</h3>
          <div class="overview-stats">
            <div class="stat-item">
              <span class="stat-label">Semester</span>
              <span class="stat-value">Monsoon 2026</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Courses</span>
              <span class="stat-value">${totalCourses}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Credits</span>
              <span class="stat-value">${semData.totalCredits}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Overall Performance</span>
              <span class="stat-value">${semData.overallPerformance.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Target GPA</span>
              <span class="stat-value editable-stat" id="target-gpa-display">${state.settings.targetSemesterGPA || "—"}</span>
            </div>
          </div>
        </div>

        <!-- SEMESTER SNAPSHOT -->
        <div class="snapshot-grid">
          <div class="snapshot-card">
            <div class="snapshot-label">Courses</div>
            <div class="snapshot-value">${totalCourses}</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-label" style="color: var(--clr-green-txt);">Completed</div>
            <div class="snapshot-value" style="color: var(--clr-green-txt);">${completedCourses}</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-label" style="color: var(--clr-green-txt);">On Track</div>
            <div class="snapshot-value" style="color: var(--clr-green-txt);">${greenCourses}</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-label" style="color: var(--clr-yellow-txt);">Needs Attention</div>
            <div class="snapshot-value" style="color: var(--clr-yellow-txt);">${yellowCourses}</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-label" style="color: var(--clr-red-txt);">High Risk</div>
            <div class="snapshot-value" style="color: var(--clr-red-txt);">${redCourses}</div>
          </div>
        </div>

        <!-- TWO COLUMN LAYOUT -->
        <div class="dashboard-columns">
          <!-- LEFT COLUMN: COURSE PROGRESS -->
          <div class="dashboard-col-left">
            <div class="db-view-container">
              <div class="db-header">
                <span class="db-title">📚 Course Progress</span>
              </div>
              <div class="table-wrapper">
                <table class="db-table" id="dashboard-courses-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Progress %</th>
                      <th>Current Marks</th>
                      <th>Target Grade</th>
                      <th>Current Grade</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: DAILY VIEW & UPCOMING -->
          <div class="dashboard-col-right">
            <!-- TODAY / DAILY VIEW -->
            <div class="card notes-container" style="padding: 1rem;">
              <h4 class="section-title" style="font-size: 0.95rem; margin-bottom: 0.5rem;">📅 Today's Focus</h4>
              <div class="feed-list" id="daily-focus-list">
                <!-- Populated dynamically -->
              </div>
            </div>

            <!-- UPCOMING ASSESSMENTS -->
            <div class="card" style="padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 class="section-title" style="font-size: 0.95rem; margin-bottom: 0;">⏳ Nearest Assessments</h4>
                <button class="btn btn-primary btn-sm" id="quick-add-assessment-btn">+ Add</button>
              </div>
              <div class="feed-list" id="upcoming-assessments-list">
                <!-- Populated dynamically -->
              </div>
            </div>

            <!-- RECENT MARKS -->
            <div class="card" style="padding: 1rem;">
              <h4 class="section-title" style="font-size: 0.95rem; margin-bottom: 0.5rem;">💯 Recent Marks</h4>
              <div class="feed-list" id="recent-marks-list">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind Target GPA click edit
  document.getElementById("target-gpa-display").addEventListener("click", () => {
    const currentVal = state.settings.targetSemesterGPA || "";
    const newVal = prompt("Enter Target GPA (e.g. 9.0 or 9.5):", currentVal);
    if (newVal !== null) {
      state.settings.targetSemesterGPA = newVal.trim() ? newVal.trim() : null;
      saveState();
      renderDashboard(container);
    }
  });

  // Populate Dashboard Course Table
  const coursesBody = container.querySelector("#dashboard-courses-table tbody");
  state.courses.forEach(course => {
    const calc = getCourseCalculatedData(course.code);
    const progressPercent = Math.min(Math.round(calc.assessmentProgress), 100);
    
    // Status color class
    let riskBadge = `<span class="badge badge-gray">${course.risk}</span>`;
    if (course.risk === "Green") riskBadge = `<span class="badge badge-green">🟢 Green</span>`;
    if (course.risk === "Yellow") riskBadge = `<span class="badge badge-yellow">🟡 Yellow</span>`;
    if (course.risk === "Red") riskBadge = `<span class="badge badge-red">🔴 Red</span>`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><a href="#course-${course.code}" class="cell-link">${course.code}</a></td>
      <td><strong>${course.name}</strong></td>
      <td>${course.credits}</td>
      <td>
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <div class="progress-info">
            <span>Weight Graded</span>
            <span class="progress-pct">${progressPercent}%</span>
          </div>
        </div>
      </td>
      <td><strong>${calc.currentMarks.toFixed(1)}</strong> <span style="font-size:0.7rem; color:var(--text-secondary);">/ 100</span></td>
      <td>${course.targetGrade}</td>
      <td>${course.currentGrade}</td>
      <td>${riskBadge}</td>
    `;
    coursesBody.appendChild(row);
  });

  // Populate Today's Focus List
  const dailyFocusList = container.querySelector("#daily-focus-list");
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Today's deadlines
  const todayDeadlines = state.assessments.filter(a => a.date === todayStr);
  // High risk courses needing attention
  const attentionCourses = state.courses.filter(c => c.risk === "Yellow" || c.risk === "Red");
  
  let dailyItemsHTML = "";
  if (todayDeadlines.length === 0 && attentionCourses.length === 0) {
    dailyItemsHTML = `<div class="empty-db-state" style="padding: 1rem 0;">No pressing academic alerts today! Keep it up.</div>`;
  } else {
    todayDeadlines.forEach(d => {
      dailyItemsHTML += `
        <div class="feed-item">
          <div class="feed-meta">
            <span class="badge badge-red">⚠️ DEADLINE TODAY</span>
            <span>${d.courseCode}</span>
          </div>
          <div class="feed-title">${d.name} (${d.type})</div>
        </div>
      `;
    });
    attentionCourses.forEach(c => {
      const badge = c.risk === "Red" ? `<span class="badge badge-red">🔴 RED RISK</span>` : `<span class="badge badge-yellow">🟡 YELLOW RISK</span>`;
      dailyItemsHTML += `
        <div class="feed-item">
          <div class="feed-meta">
            ${badge}
            <span>${c.code}</span>
          </div>
          <div class="feed-title">${c.name} needs attention.</div>
        </div>
      `;
    });
  }
  dailyFocusList.innerHTML = dailyItemsHTML;

  // Populate Nearest Assessments List (Up to 5)
  const upcomingList = container.querySelector("#upcoming-assessments-list");
  const upcomingAssessments = state.assessments
    .filter(a => a.status === "Upcoming" || a.status === "Pending")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  let upcomingHTML = "";
  if (upcomingAssessments.length === 0) {
    upcomingHTML = `<div class="empty-db-state" style="padding: 1rem 0;">No upcoming assessments found.</div>`;
  } else {
    upcomingAssessments.forEach(a => {
      const diffTime = new Date(a.date) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let timeStr = "";
      if (diffDays === 0) timeStr = "Today";
      else if (diffDays === 1) timeStr = "Tomorrow";
      else if (diffDays > 1) timeStr = `in ${diffDays} days`;
      else timeStr = `${Math.abs(diffDays)} days overdue`;

      const priorityBadge = a.priority === "High" ? `<span class="badge badge-red">🔴 High</span>` :
                            a.priority === "Medium" ? `<span class="badge badge-yellow">🟡 Med</span>` :
                            `<span class="badge badge-blue">🔵 Low</span>`;

      upcomingHTML += `
        <div class="feed-item" style="cursor:pointer;" onclick="window.location.hash='#assessments'">
          <div class="feed-meta">
            <span>${a.courseCode}</span>
            <span>•</span>
            <span>${a.date} (${timeStr})</span>
            <span>•</span>
            ${priorityBadge}
          </div>
          <div class="feed-title">${a.name} <span style="font-weight:normal; color:var(--text-secondary);">(${a.type})</span></div>
        </div>
      `;
    });
  }
  upcomingList.innerHTML = upcomingHTML;

  // Bind Quick Add Assessment Button
  container.querySelector("#quick-add-assessment-btn").addEventListener("click", () => {
    openAssessmentModal();
  });

  // Populate Recent Marks List
  const recentMarksList = container.querySelector("#recent-marks-list");
  
  // Sort marks by assessment date or input timestamp
  const recentMarks = [...state.marks]
    .map(m => {
      const assessment = state.assessments.find(a => a.id === m.assessmentId);
      return { mark: m, assessment: assessment };
    })
    .filter(item => item.assessment !== undefined)
    .sort((a, b) => new Date(b.assessment.date) - new Date(a.assessment.date))
    .slice(0, 5);

  let recentMarksHTML = "";
  if (recentMarks.length === 0) {
    recentMarksHTML = `<div class="empty-db-state" style="padding: 1rem 0;">No marks entered yet.</div>`;
  } else {
    recentMarks.forEach(item => {
      const percentage = item.assessment.maxMarks > 0 ? (item.mark.marksObtained / item.assessment.maxMarks) * 100 : 0;
      recentMarksHTML += `
        <div class="feed-item" style="cursor:pointer;" onclick="window.location.hash='#marks'">
          <div class="feed-meta">
            <span>${item.assessment.courseCode}</span>
            <span>•</span>
            <span>${item.assessment.type}</span>
          </div>
          <div class="feed-title">
            ${item.assessment.name}: <strong>${item.mark.marksObtained}</strong> / ${item.assessment.maxMarks} (${percentage.toFixed(0)}%)
          </div>
        </div>
      `;
    });
  }
  recentMarksList.innerHTML = recentMarksHTML;
}

// --- CENTRAL ASSESSMENTS VIEW ---
let activeAssessmentsTab = "upcoming";

function renderAssessments(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div class="page-title-row">
          <h2 class="page-title">📅 Assessments Database</h2>
          <button class="btn btn-primary" id="add-assessment-btn">+ Add Assessment</button>
        </div>
        <p class="page-subtitle">Track, schedule, and organize deadlines across all courses.</p>
      </header>

      <div class="db-view-container">
        <!-- DB Tabs -->
        <div class="db-tabs">
          <div class="db-tab ${activeAssessmentsTab === 'today' ? 'active' : ''}" data-tab="today">⏳ Today</div>
          <div class="db-tab ${activeAssessmentsTab === 'this-week' ? 'active' : ''}" data-tab="this-week">📅 This Week</div>
          <div class="db-tab ${activeAssessmentsTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming">🔮 Upcoming</div>
          <div class="db-tab ${activeAssessmentsTab === 'overdue' ? 'active' : ''}" data-tab="overdue">🚨 Overdue</div>
          <div class="db-tab ${activeAssessmentsTab === 'calendar' ? 'active' : ''}" data-tab="calendar">🗓️ Calendar</div>
          <div class="db-tab ${activeAssessmentsTab === 'by-course' ? 'active' : ''}" data-tab="by-course">📚 By Course</div>
          <div class="db-tab ${activeAssessmentsTab === 'completed' ? 'active' : ''}" data-tab="completed">✅ Completed</div>
          <div class="db-tab ${activeAssessmentsTab === 'pending' ? 'active' : ''}" data-tab="pending">⏳ Pending</div>
        </div>

        <!-- View Body -->
        <div id="assessment-db-view-body">
          <!-- Injected dynamically based on tab -->
        </div>
      </div>
    </div>
  `;

  // Bind tab switches
  container.querySelectorAll(".db-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      activeAssessmentsTab = e.target.getAttribute("data-tab");
      renderAssessments(container);
    });
  });

  // Bind Add Assessment Button
  container.querySelector("#add-assessment-btn").addEventListener("click", () => {
    openAssessmentModal();
  });

  const viewBody = container.querySelector("#assessment-db-view-body");
  
  // Date thresholds
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
  const todayMs = new Date(todayStr).getTime();
  const next7DaysMs = todayMs + 7 * 24 * 60 * 60 * 1000;
  
  if (activeAssessmentsTab === "today") {
    const list = state.assessments.filter(a => a.date === todayStr);
    renderAssessmentsTable(viewBody, list.sort((a,b) => new Date(a.date) - new Date(b.date)));
  } else if (activeAssessmentsTab === "this-week") {
    const list = state.assessments.filter(a => {
      const aMs = new Date(a.date).getTime();
      return a.date >= todayStr && aMs < next7DaysMs;
    });
    renderAssessmentsTable(viewBody, list.sort((a,b) => new Date(a.date) - new Date(b.date)));
  } else if (activeAssessmentsTab === "upcoming") {
    const list = state.assessments.filter(a => a.status === "Upcoming");
    renderAssessmentsTable(viewBody, list.sort((a,b) => new Date(a.date) - new Date(b.date)));
  } else if (activeAssessmentsTab === "overdue") {
    const list = state.assessments.filter(a => (a.status === "Upcoming" || a.status === "Pending") && a.date < todayStr);
    renderAssessmentsTable(viewBody, list.sort((a,b) => new Date(a.date) - new Date(b.date)));
  } else if (activeAssessmentsTab === "completed") {
    renderAssessmentsTable(viewBody, state.assessments.filter(a => a.status === "Completed").sort((a,b) => new Date(b.date) - new Date(a.date)));
  } else if (activeAssessmentsTab === "pending") {
    renderAssessmentsTable(viewBody, state.assessments.filter(a => a.status === "Pending").sort((a,b) => new Date(a.date) - new Date(b.date)));
  } else if (activeAssessmentsTab === "by-course") {
    renderAssessmentsByCourse(viewBody);
  } else if (activeAssessmentsTab === "calendar") {
    renderCalendarView(viewBody);
  }
}

function renderAssessmentsTable(container, filteredList) {
  if (filteredList.length === 0) {
    container.innerHTML = `<div class="empty-db-state">No assessments in this view. Click "+ Add Assessment" to get started.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="db-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Course</th>
            <th>Type</th>
            <th>Date</th>
            <th>Max Marks</th>
            <th>Weightage</th>
            <th>Status</th>
            <th>Priority</th>
            <th style="width: 100px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Rows -->
        </tbody>
      </table>
    </div>
  `;

  const tbody = container.querySelector("tbody");
  filteredList.forEach(a => {
    const tr = document.createElement("tr");
    
    let priorityBadge = a.priority === "High" ? `<span class="badge badge-red">🔴 High</span>` :
                        a.priority === "Medium" ? `<span class="badge badge-yellow">🟡 Med</span>` :
                        `<span class="badge badge-blue">🔵 Low</span>`;

    let statusBadge = a.status === "Upcoming" ? `<span class="badge badge-gray">Upcoming</span>` :
                      a.status === "Completed" ? `<span class="badge badge-green">Completed</span>` :
                      a.status === "Pending" ? `<span class="badge badge-orange">Pending</span>` :
                      `<span class="badge badge-gray">N/A</span>`;

    tr.innerHTML = `
      <td><strong>${a.name}</strong></td>
      <td><a href="#course-${a.courseCode}" class="cell-link">${a.courseCode}</a></td>
      <td>${a.type}</td>
      <td>${a.date}</td>
      <td>${a.maxMarks || "—"}</td>
      <td>${a.weightage ? a.weightage + "%" : "—"}</td>
      <td>${statusBadge}</td>
      <td>${priorityBadge}</td>
      <td>
        <div style="display:flex; gap:0.25rem;">
          <button class="btn btn-secondary btn-sm edit-a-btn" data-id="${a.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-a-btn" data-id="${a.id}">Delete</button>
        </div>
      </td>
    `;

    // Bind action buttons
    tr.querySelector(".edit-a-btn").addEventListener("click", () => openAssessmentModal(a.id));
    tr.querySelector(".delete-a-btn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete assessment: "${a.name}"?`)) {
        deleteAssessment(a.id);
      }
    });

    tbody.appendChild(tr);
  });
}

function renderAssessmentsByCourse(container) {
  container.innerHTML = `<div class="course-grouped-view" style="padding: 1.5rem; display:flex; flex-direction:column; gap:2rem;"></div>`;
  const groupedDiv = container.querySelector(".course-grouped-view");

  state.courses.forEach(course => {
    const courseAssessments = state.assessments.filter(a => a.courseCode === course.code);
    
    const courseSection = document.createElement("div");
    courseSection.innerHTML = `
      <h4 class="section-title" style="font-size: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem;">
        📚 ${course.code} — ${course.name}
      </h4>
      <div class="course-table-container" style="margin-top: 0.5rem;"></div>
    `;

    const tableDiv = courseSection.querySelector(".course-table-container");
    renderAssessmentsTable(tableDiv, courseAssessments.sort((a,b) => new Date(a.date) - new Date(b.date)));
    groupedDiv.appendChild(courseSection);
  });
}

function renderCalendarView(container) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const curMonth = state.settings.calendarMonth;
  const curYear = state.settings.calendarYear;

  container.innerHTML = `
    <div style="padding: 1.25rem;">
      <div class="calendar-controls">
        <button class="btn btn-secondary btn-sm" id="cal-prev-btn">◀ Previous</button>
        <span class="calendar-month-year">${months[curMonth]} ${curYear}</span>
        <button class="btn btn-secondary btn-sm" id="cal-next-btn">Next ▶</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-header">Mon</div>
        <div class="calendar-day-header">Tue</div>
        <div class="calendar-day-header">Wed</div>
        <div class="calendar-day-header">Thu</div>
        <div class="calendar-day-header">Fri</div>
        <div class="calendar-day-header">Sat</div>
        <div class="calendar-day-header">Sun</div>
        <!-- Days will be inserted dynamically -->
      </div>
    </div>
  `;

  // Bind controls
  container.querySelector("#cal-prev-btn").addEventListener("click", () => {
    state.settings.calendarMonth--;
    if (state.settings.calendarMonth < 0) {
      state.settings.calendarMonth = 11;
      state.settings.calendarYear--;
    }
    saveState();
    renderCalendarView(container);
  });

  container.querySelector("#cal-next-btn").addEventListener("click", () => {
    state.settings.calendarMonth++;
    if (state.settings.calendarMonth > 11) {
      state.settings.calendarMonth = 0;
      state.settings.calendarYear++;
    }
    saveState();
    renderCalendarView(container);
  });

  const grid = container.querySelector(".calendar-grid");

  // Get calendar date variables
  const firstDayIndex = new Date(curYear, curMonth, 1).getDay(); // 0 is Sunday
  // Convert Sunday index from 0 to 6 (so Mon is 0, Sun is 6)
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const lastDay = new Date(curYear, curMonth + 1, 0).getDate();
  const prevLastDay = new Date(curYear, curMonth, 0).getDate();

  // Draw previous month padding days
  for (let i = adjustedFirstDay; i > 0; i--) {
    const day = prevLastDay - i + 1;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day other-month";
    dayDiv.innerHTML = `<span class="calendar-day-num">${day}</span>`;
    grid.appendChild(dayDiv);
  }

  // Draw active month days
  const today = new Date();
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    if (today.getFullYear() === curYear && today.getMonth() === curMonth && today.getDate() === d) {
      dayDiv.className += " today";
    }

    dayDiv.innerHTML = `
      <span class="calendar-day-num">${d}</span>
      <div class="calendar-events" id="events-${dateStr}"></div>
    `;

    grid.appendChild(dayDiv);

    // Find and populate events for this date
    const dayEvents = state.assessments.filter(a => a.date === dateStr);
    const eventsContainer = dayDiv.querySelector(`.calendar-events`);
    
    dayEvents.forEach(e => {
      const evtBadge = document.createElement("div");
      evtBadge.className = `calendar-event`;
      
      // Determine priority background
      if (e.priority === "High") evtBadge.style.backgroundColor = "var(--clr-red-bg)", evtBadge.style.color = "var(--clr-red-txt)";
      else if (e.priority === "Medium") evtBadge.style.backgroundColor = "var(--clr-yellow-bg)", evtBadge.style.color = "var(--clr-yellow-txt)";
      else evtBadge.style.backgroundColor = "var(--clr-blue-bg)", evtBadge.style.color = "var(--clr-blue-txt)";

      evtBadge.innerText = `[${e.courseCode}] ${e.name}`;
      evtBadge.title = `${e.name} (${e.type})\nCourse: ${e.courseCode}\nPriority: ${e.priority}`;
      evtBadge.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openAssessmentModal(e.id);
      });

      eventsContainer.appendChild(evtBadge);
    });
  }

  // Draw next month padding days
  const totalGridCells = adjustedFirstDay + lastDay;
  const nextMonthPadding = 35 - totalGridCells >= 0 ? 35 - totalGridCells : 42 - totalGridCells;

  for (let n = 1; n <= nextMonthPadding; n++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day other-month";
    dayDiv.innerHTML = `<span class="calendar-day-num">${n}</span>`;
    grid.appendChild(dayDiv);
  }
}

// --- CENTRAL MARKS VIEW ---
function renderMarks(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <div class="page-title-row">
          <h2 class="page-title">💯 Central Marks Database</h2>
          <button class="btn btn-primary" id="add-mark-btn">+ Add Marks Entry</button>
        </div>
        <p class="page-subtitle">Formulas automatically calculate percentages and weighted course performance.</p>
      </header>

      <div class="db-view-container">
        <div class="db-header">
          <span class="db-title">Record Sheet</span>
        </div>
        <div id="marks-db-view-body">
          <!-- Dynamically populated table -->
        </div>
      </div>
    </div>
  `;

  container.querySelector("#add-mark-btn").addEventListener("click", () => {
    openMarkModal();
  });

  const viewBody = container.querySelector("#marks-db-view-body");
  
  if (state.marks.length === 0) {
    viewBody.innerHTML = `<div class="empty-db-state">No mark records found. Select an assessment and click "+ Add Marks Entry" to fill marks.</div>`;
    return;
  }

  viewBody.innerHTML = `
    <div class="table-wrapper">
      <table class="db-table">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Course</th>
            <th>Type</th>
            <th>Max Marks</th>
            <th>Obtained</th>
            <th>Percentage</th>
            <th>Weightage</th>
            <th>Weighted Score</th>
            <th>Notes</th>
            <th style="width: 100px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Dynamic -->
        </tbody>
      </table>
    </div>
  `;

  const tbody = viewBody.querySelector("tbody");
  state.marks.forEach(m => {
    const assessment = state.assessments.find(a => a.id === m.assessmentId);
    if (!assessment) return; // Skip broken relations

    const percentage = assessment.maxMarks > 0 ? (m.marksObtained / assessment.maxMarks) * 100 : 0;
    const weightedScore = (percentage * assessment.weightage) / 100;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${assessment.name}</strong></td>
      <td><a href="#course-${assessment.courseCode}" class="cell-link">${assessment.courseCode}</a></td>
      <td>${assessment.type}</td>
      <td>${assessment.maxMarks}</td>
      <td><strong style="color: var(--accent-primary);">${m.marksObtained}</strong></td>
      <td><strong>${percentage.toFixed(1)}%</strong></td>
      <td>${assessment.weightage}%</td>
      <td><strong style="color: var(--clr-green-txt);">${weightedScore.toFixed(2)}</strong></td>
      <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${m.notes}">${m.notes || "—"}</td>
      <td>
        <div style="display:flex; gap:0.25rem;">
          <button class="btn btn-secondary btn-sm edit-m-btn" data-id="${m.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-m-btn" data-id="${m.id}">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector(".edit-m-btn").addEventListener("click", () => openMarkModal(m.id));
    tr.querySelector(".delete-m-btn").addEventListener("click", () => {
      if (confirm(`Delete mark entry for "${assessment.name}"?`)) {
        deleteMark(m.id);
      }
    });

    tbody.appendChild(tr);
  });
}

// --- GRADE TRACKER VIEW ---
function renderGrades(container) {
  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <h2 class="page-title">📊 Grade Tracker</h2>
        <p class="page-subtitle">Track target and actual grades. Calculations will update automatically when values are released.</p>
      </header>

      <div class="db-view-container">
        <div class="db-header">
          <span class="db-title">Course Grades</span>
        </div>
        <div class="table-wrapper">
          <table class="db-table" id="grades-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Credits</th>
                <th>Current Marks (Weighted)</th>
                <th>Graded Performance %</th>
                <th>Target Grade</th>
                <th>Current Grade</th>
                <th>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              <!-- Dynamic -->
            </tbody>
          </table>
        </div>
      </div>

      <div class="callout" style="margin-top: 1.5rem;">
        <span class="callout-icon">💡</span>
        <div class="callout-content">
          <strong>Grade Updates:</strong> To update target or final course grades, simply select them from the inline dropdown menus in the table above. These boundaries are manually set since IIIT-Delhi grades are relative and final cuts are released at semester-end.
        </div>
      </div>
    </div>
  `;

  const tbody = container.querySelector("#grades-table tbody");
  state.courses.forEach(course => {
    const calc = getCourseCalculatedData(course.code);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="#course-${course.code}" class="cell-link"><strong>${course.code} — ${course.name}</strong></a></td>
      <td>${course.credits}</td>
      <td><strong>${calc.currentMarks.toFixed(1)}</strong> <span style="font-size:0.7rem; color:var(--text-secondary);">/ 100</span></td>
      <td><strong>${calc.gradedPercentage !== null ? calc.gradedPercentage.toFixed(1) + "%" : "—"}</strong></td>
      <td>
        <select class="inline-select target-grade-select" data-code="${course.code}">
          ${GRADE_OPTIONS.map(g => `<option value="${g}" ${course.targetGrade === g ? 'selected' : ''}>${g}</option>`).join("")}
        </select>
      </td>
      <td>
        <select class="inline-select current-grade-select" data-code="${course.code}">
          ${GRADE_OPTIONS.map(g => `<option value="${g}" ${course.currentGrade === g ? 'selected' : ''}>${g}</option>`).join("")}
        </select>
      </td>
      <td>
        <select class="inline-select risk-select risk-${course.risk.toLowerCase()}" data-code="${course.code}">
          <option value="Green" ${course.risk === 'Green' ? 'selected' : ''}>🟢 Green</option>
          <option value="Yellow" ${course.risk === 'Yellow' ? 'selected' : ''}>🟡 Yellow</option>
          <option value="Red" ${course.risk === 'Red' ? 'selected' : ''}>🔴 Red</option>
        </select>
      </td>
    `;

    // Bind inline dropdown changes
    tr.querySelector(".target-grade-select").addEventListener("change", (e) => {
      course.targetGrade = e.target.value;
      saveState();
    });

    tr.querySelector(".current-grade-select").addEventListener("change", (e) => {
      course.currentGrade = e.target.value;
      saveState();
    });

    tr.querySelector(".risk-select").addEventListener("change", (e) => {
      course.risk = e.target.value;
      e.target.className = `inline-select risk-select risk-${e.target.value.toLowerCase()}`;
      saveState();
    });

    tbody.appendChild(tr);
  });
}

// --- PROGRESS TRACKER VIEW ---
function renderProgress(container) {
  const semData = getSemesterCalculatedData();

  container.innerHTML = `
    <div class="page-container">
      <header class="page-header">
        <h2 class="page-title">📈 Progress Tracker</h2>
        <p class="page-subtitle">Track syllabus coverage independently of assessment marks. Manage strengths and action items.</p>
      </header>

      <!-- SEMESTER LEVEL PROGRESS -->
      <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, var(--clr-blue-bg) 0%, rgba(27, 100, 218, 0.01) 100%);">
        <h3 class="section-title">🎓 Semester Level Tracker</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem; margin-top:1rem;">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 0.25rem;">
              <span class="form-label" style="color:var(--text-primary);">Average Syllabus Progress</span>
              <span style="font-weight:700;">${semData.averageSyllabusProgress.toFixed(0)}%</span>
            </div>
            <div class="progress-bar-wrapper" style="height: 12px;">
              <div class="progress-bar-fill" style="width: ${semData.averageSyllabusProgress}%; background-color: var(--accent-primary);"></div>
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 0.25rem;">
              <span class="form-label" style="color:var(--text-primary);">Total Academic Credits Earned</span>
              <span style="font-weight:700;">${state.courses.filter(c => c.status === "Completed").reduce((acc, c) => acc + c.credits, 0)} / ${semData.totalCredits}</span>
            </div>
            <div class="progress-bar-wrapper" style="height: 12px;">
              <div class="progress-bar-fill" style="width: ${(state.courses.filter(c => c.status === "Completed").reduce((acc, c) => acc + c.credits, 0) / semData.totalCredits * 100).toFixed(0)}%; background-color: var(--clr-green-txt);"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- COURSE PROGRESS CARD LIST -->
      <h3 class="section-title">📚 Course Trackers</h3>
      <div class="progress-cards-list" style="display:flex; flex-direction:column; gap:1.5rem;" id="progress-course-cards">
        <!-- Dynamic Cards -->
      </div>
    </div>
  `;

  const cardsContainer = container.querySelector("#progress-course-cards");
  state.courses.forEach(course => {
    const calc = getCourseCalculatedData(course.code);
    const progressPercent = Math.min(Math.round(calc.assessmentProgress), 100);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem;">
        <h4 style="font-family:var(--font-display); font-size:1.1rem; font-weight:700;">
          <a href="#course-${course.code}" class="cell-link">${course.code} — ${course.name}</a>
        </h4>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="form-label">Status</span>
          <select class="inline-select status-select-prog" data-code="${course.code}">
            <option value="Not Started" ${course.status === 'Not Started' ? 'selected' : ''}>⏳ Not Started</option>
            <option value="In Progress" ${course.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
            <option value="Completed" ${course.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem; margin-bottom: 1rem;">
        <!-- Syllabus Progress -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <label class="form-label" style="margin-bottom:0;">Syllabus Progress (Lectures/Readings)</label>
            <span class="progress-pct" id="syl-pct-${course.code}">${course.syllabusProgress}%</span>
          </div>
          <div class="progress-input-group">
            <input type="range" min="0" max="100" class="slider-input syl-slider" data-code="${course.code}" value="${course.syllabusProgress}">
          </div>
        </div>

        <!-- Assessment Progress -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <label class="form-label" style="margin-bottom:0;">Assessment Grading Progress</label>
            <span class="progress-pct">${progressPercent}%</span>
          </div>
          <div class="progress-bar-wrapper" style="margin-top:10px;">
            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
      </div>

      <!-- Strengths and Weaknesses -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:1rem; border-top:1px solid var(--border-color); padding-top:1rem;">
        <div>
          <label class="form-label">🔥 Strengths / Strong Areas</label>
          <input type="text" class="form-input strong-input" data-code="${course.code}" value="${course.strongAreas || ''}" placeholder="e.g. Socket programming, Routing protocols...">
        </div>
        <div>
          <label class="form-label">⚠️ Weak Areas / Needs Revision</label>
          <input type="text" class="form-input weak-input" data-code="${course.code}" value="${course.weakAreas || ''}" placeholder="e.g. Subnetting, TCP congestion control...">
        </div>
      </div>
    `;

    // Bind Syllabus slider
    card.querySelector(".syl-slider").addEventListener("input", (e) => {
      const code = e.target.getAttribute("data-code");
      const val = parseInt(e.target.value);
      document.getElementById(`syl-pct-${code}`).innerText = `${val}%`;
      course.syllabusProgress = val;
      saveState();
    });

    // Bind Status dropdown
    card.querySelector(".status-select-prog").addEventListener("change", (e) => {
      course.status = e.target.value;
      saveState();
    });

    // Bind Strengths / Weaknesses text boxes (autosave on blur)
    card.querySelector(".strong-input").addEventListener("blur", (e) => {
      course.strongAreas = e.target.value.trim();
      saveState();
    });

    card.querySelector(".weak-input").addEventListener("blur", (e) => {
      course.weakAreas = e.target.value.trim();
      saveState();
    });

    cardsContainer.appendChild(card);
  });
}

// --- COURSE DETAIL PAGE VIEW ---
function renderCoursePage(container, course) {
  const calc = getCourseCalculatedData(course.code);
  const progressPercent = Math.min(Math.round(calc.assessmentProgress), 100);
  const marksPercentage = calc.gradedPercentage !== null ? calc.gradedPercentage.toFixed(1) + "%" : "—";

  container.innerHTML = `
    <div class="page-container">
      <header class="page-header" style="border-bottom:1px solid var(--border-color); padding-bottom:1.5rem; margin-bottom:1.5rem;">
        <div class="course-header-row">
          <div>
            <h2 class="page-title">${course.code} — ${course.name}</h2>
            <p class="page-subtitle" style="font-size:1rem; margin-top:0.25rem;">Instructor: <span class="cell-editable" id="instructor-val">${course.instructor || "Click to add instructor"}</span></p>
          </div>
          <div>
            <select class="inline-select risk-select risk-${course.risk.toLowerCase()}" id="course-page-risk-select" style="font-size:0.9rem; padding:0.4rem 0.75rem;">
              <option value="Green" ${course.risk === 'Green' ? 'selected' : ''}>🟢 Green (On Track)</option>
              <option value="Yellow" ${course.risk === 'Yellow' ? 'selected' : ''}>🟡 Yellow (Needs Attention)</option>
              <option value="Red" ${course.risk === 'Red' ? 'selected' : ''}>🔴 Red (High Risk)</option>
            </select>
          </div>
        </div>

        <div class="course-meta-grid">
          <div class="course-meta-card">
            <div class="course-meta-label">Course Code</div>
            <div class="course-meta-value">${course.code}</div>
          </div>
          <div class="course-meta-card">
            <div class="course-meta-label">Credits</div>
            <div class="course-meta-value">${course.credits}</div>
          </div>
          <div class="course-meta-card">
            <div class="course-meta-label">Target Grade</div>
            <div class="course-meta-value">
              <select class="inline-select" id="course-page-target-select" style="width:100%; border:none; padding:0; background:transparent; font-weight:600;">
                ${GRADE_OPTIONS.map(g => `<option value="${g}" ${course.targetGrade === g ? 'selected' : ''}>${g}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="course-meta-card">
            <div class="course-meta-label">Status</div>
            <div class="course-meta-value">
              <select class="inline-select" id="course-page-status-select" style="width:100%; border:none; padding:0; background:transparent; font-weight:600;">
                <option value="Not Started" ${course.status === 'Not Started' ? 'selected' : ''}>⏳ Not Started</option>
                <option value="In Progress" ${course.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
                <option value="Completed" ${course.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <!-- PERFORMANCE GRID -->
      <div style="margin-bottom: 2rem;">
        <h3 class="section-title">📊 Performance Overview</h3>
        <div class="performance-overview">
          <div class="perf-card">
            <div class="perf-label">Current Marks</div>
            <div class="perf-value" style="color: var(--accent-primary);">${calc.currentMarks.toFixed(1)} <span style="font-size:0.9rem; color:var(--text-secondary); font-weight:normal;">/ 100</span></div>
          </div>
          <div class="perf-card">
            <div class="perf-label">Target Marks</div>
            <div class="perf-value cell-editable" id="target-marks-val" style="color:var(--text-secondary);">${course.targetMarks !== null ? course.targetMarks : "—"}</div>
          </div>
          <div class="perf-card">
            <div class="perf-label">Marks Percentage (Graded)</div>
            <div class="perf-value" style="color: var(--clr-green-txt);">${marksPercentage}</div>
          </div>
          <div class="perf-card">
            <div class="perf-label">Current Grade</div>
            <div class="perf-value">
              <select class="inline-select" id="course-page-current-grade-select" style="font-size:1.5rem; font-weight:700; border:none; background:transparent; display:inline-block; width:auto; text-align:center;">
                ${GRADE_OPTIONS.map(g => `<option value="${g}" ${course.currentGrade === g ? 'selected' : ''}>${g}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- SYLLABUS PROGRESS -->
      <div class="card" style="margin-bottom: 2.5rem; padding: 1.25rem;">
        <h3 class="section-title" style="font-size: 1rem; margin-bottom: 0.5rem;">📈 Course Progress</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem;">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
              <span class="form-label" style="color:var(--text-primary);">Syllabus Coverage</span>
              <span class="progress-pct" id="cp-syl-pct">${course.syllabusProgress}%</span>
            </div>
            <div class="progress-input-group">
              <input type="range" min="0" max="100" class="slider-input" id="cp-syl-slider" value="${course.syllabusProgress}">
            </div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
              <span class="form-label" style="color:var(--text-primary);">Assessment Weight Completed</span>
              <span class="progress-pct">${progressPercent}%</span>
            </div>
            <div class="progress-bar-wrapper" style="margin-top:10px;">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ASSESSMENTS FILTERED VIEW -->
      <div class="db-view-container">
        <div class="db-header">
          <span class="db-title">📅 Assessments for ${course.code}</span>
          <button class="btn btn-primary btn-sm" id="course-add-assessment-btn">+ Add Assessment</button>
        </div>
        <div id="course-assessments-tbody-container">
          <!-- Populated by helper -->
        </div>
      </div>

      <!-- MARKS FILTERED VIEW -->
      <div class="db-view-container">
        <div class="db-header">
          <span class="db-title">💯 Marks Record for ${course.code}</span>
          <button class="btn btn-primary btn-sm" id="course-add-mark-btn">+ Enter Mark</button>
        </div>
        <div id="course-marks-tbody-container">
          <!-- Populated by helper -->
        </div>
      </div>

      <!-- QUICK NOTES -->
      <div class="notes-container card">
        <h3 class="section-title" style="font-size: 1.1rem; margin-bottom: 0.5rem;">📝 Quick Notes & Syllabus Items</h3>
        <textarea class="notes-editor" id="course-notes-editor" placeholder="Write syllabus topics, reference folders, instructor office hours, or general ideas here...">${course.notes || ""}</textarea>
        <span class="input-help-text" style="text-align: right;">Saves automatically on edit.</span>
      </div>
    </div>
  `;

  // Bind edit handlers
  container.querySelector("#course-page-risk-select").addEventListener("change", (e) => {
    course.risk = e.target.value;
    e.target.className = `inline-select risk-select risk-${e.target.value.toLowerCase()}`;
    saveState();
  });

  container.querySelector("#course-page-target-select").addEventListener("change", (e) => {
    course.targetGrade = e.target.value;
    saveState();
  });

  container.querySelector("#course-page-status-select").addEventListener("change", (e) => {
    course.status = e.target.value;
    saveState();
  });

  container.querySelector("#course-page-current-grade-select").addEventListener("change", (e) => {
    course.currentGrade = e.target.value;
    saveState();
  });

  container.querySelector("#cp-syl-slider").addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    container.querySelector("#cp-syl-pct").innerText = `${val}%`;
    course.syllabusProgress = val;
    saveState();
  });

  // Edit instructor
  container.querySelector("#instructor-val").addEventListener("click", () => {
    const newInst = prompt("Enter instructor name:", course.instructor || "");
    if (newInst !== null) {
      course.instructor = newInst.trim();
      container.querySelector("#instructor-val").innerText = course.instructor || "Click to add instructor";
      saveState();
    }
  });

  // Edit target marks
  container.querySelector("#target-marks-val").addEventListener("click", () => {
    const val = course.targetMarks !== null ? course.targetMarks : "";
    const newVal = prompt("Enter target course marks out of 100:", val);
    if (newVal !== null) {
      if (newVal.trim() === "") {
        course.targetMarks = null;
      } else {
        const num = parseFloat(newVal);
        course.targetMarks = isNaN(num) ? null : num;
      }
      container.querySelector("#target-marks-val").innerText = course.targetMarks !== null ? course.targetMarks : "—";
      saveState();
    }
  });

  // Save notes on blur/change
  container.querySelector("#course-notes-editor").addEventListener("blur", (e) => {
    course.notes = e.target.value;
    saveState();
  });

  // Course Assessment Sub-table
  const caContainer = container.querySelector("#course-assessments-tbody-container");
  const courseAssessments = state.assessments.filter(a => a.courseCode === course.code);
  renderAssessmentsTable(caContainer, courseAssessments.sort((a,b) => new Date(a.date) - new Date(b.date)));

  // Course Marks Sub-table
  const cmContainer = container.querySelector("#course-marks-tbody-container");
  const courseMarks = state.marks.filter(m => {
    const assessment = state.assessments.find(a => a.id === m.assessmentId);
    return assessment && assessment.courseCode === course.code;
  });

  if (courseMarks.length === 0) {
    cmContainer.innerHTML = `<div class="empty-db-state" style="padding: 1.5rem;">No mark entries logged yet for this course.</div>`;
  } else {
    cmContainer.innerHTML = `
      <div class="table-wrapper">
        <table class="db-table">
          <thead>
            <tr>
              <th>Assessment</th>
              <th>Type</th>
              <th>Max Marks</th>
              <th>Obtained</th>
              <th>Percentage</th>
              <th>Weightage</th>
              <th>Weighted Score</th>
              <th>Notes</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Rows -->
          </tbody>
        </table>
      </div>
    `;
    const cmTbody = cmContainer.querySelector("tbody");
    courseMarks.forEach(m => {
      const assessment = state.assessments.find(a => a.id === m.assessmentId);
      const percentage = assessment.maxMarks > 0 ? (m.marksObtained / assessment.maxMarks) * 100 : 0;
      const weightedScore = (percentage * assessment.weightage) / 100;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${assessment.name}</strong></td>
        <td>${assessment.type}</td>
        <td>${assessment.maxMarks}</td>
        <td><strong>${m.marksObtained}</strong></td>
        <td><strong>${percentage.toFixed(1)}%</strong></td>
        <td>${assessment.weightage}%</td>
        <td><strong style="color: var(--clr-green-txt);">${weightedScore.toFixed(2)}</strong></td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.notes || "—"}</td>
        <td>
          <div style="display:flex; gap:0.25rem;">
            <button class="btn btn-secondary btn-sm cp-edit-m" data-id="${m.id}">Edit</button>
            <button class="btn btn-danger btn-sm cp-delete-m" data-id="${m.id}">Delete</button>
          </div>
        </td>
      `;

      tr.querySelector(".cp-edit-m").addEventListener("click", () => openMarkModal(m.id));
      tr.querySelector(".cp-delete-m").addEventListener("click", () => {
        if (confirm(`Delete mark entry for "${assessment.name}"?`)) {
          deleteMark(m.id);
          renderCoursePage(container, course);
        }
      });

      cmTbody.appendChild(tr);
    });
  }

  // Quick Add buttons inside page
  container.querySelector("#course-add-assessment-btn").addEventListener("click", () => {
    openAssessmentModal(null, course.code);
  });

  container.querySelector("#course-add-mark-btn").addEventListener("click", () => {
    openMarkModal(null, course.code);
  });
}

// 7. MODALS LOGIC & FORMS

// --- ASSESSMENT MODAL ---
function openAssessmentModal(assessmentId = null, preSelectedCourse = null) {
  const modal = document.getElementById("assessment-modal");
  const form = document.getElementById("assessment-form");
  const title = document.getElementById("assessment-modal-title");
  
  // Clear/Reset form
  form.reset();
  document.getElementById("assessment-id").value = "";
  document.getElementById("marks-obtained-group").style.display = "none";

  // Populate courses list
  const selectCourse = document.getElementById("assessment-course");
  selectCourse.innerHTML = state.courses.map(c => `<option value="${c.code}">${c.code} — ${c.name}</option>`).join("");

  if (assessmentId) {
    // Edit Mode
    title.innerText = "Edit Assessment";
    const a = state.assessments.find(item => item.id === assessmentId);
    if (a) {
      document.getElementById("assessment-id").value = a.id;
      document.getElementById("assessment-name").value = a.name;
      selectCourse.value = a.courseCode;
      document.getElementById("assessment-type").value = a.type;
      document.getElementById("assessment-date").value = a.date;
      document.getElementById("assessment-priority").value = a.priority;
      document.getElementById("assessment-max-marks").value = a.maxMarks || "";
      document.getElementById("assessment-weightage").value = a.weightage || "";
      document.getElementById("assessment-status").value = a.status;
      document.getElementById("assessment-notes").value = a.notes || "";
      
      // If completed, let them edit marks directly in this form
      document.getElementById("marks-obtained-group").style.display = "block";
      const mark = state.marks.find(m => m.assessmentId === a.id);
      if (mark) {
        document.getElementById("assessment-marks-obtained").value = mark.marksObtained !== null ? mark.marksObtained : "";
      }
    }
  } else {
    // Add Mode
    title.innerText = "Add Assessment";
    document.getElementById("assessment-date").value = new Date().toISOString().split("T")[0];
    if (preSelectedCourse) {
      selectCourse.value = preSelectedCourse;
    }
  }

  // Toggle marks input display based on status select
  document.getElementById("assessment-status").addEventListener("change", (e) => {
    if (e.target.value === "Completed") {
      document.getElementById("marks-obtained-group").style.display = "block";
    } else {
      document.getElementById("marks-obtained-group").style.display = "none";
    }
  });

  modal.classList.add("open");
}

function handleAssessmentSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById("assessment-id").value;
  const name = document.getElementById("assessment-name").value.trim();
  const courseCode = document.getElementById("assessment-course").value;
  const type = document.getElementById("assessment-type").value;
  const date = document.getElementById("assessment-date").value;
  const priority = document.getElementById("assessment-priority").value;
  const maxMarks = parseFloat(document.getElementById("assessment-max-marks").value) || null;
  const weightage = parseFloat(document.getElementById("assessment-weightage").value) || 0;
  const status = document.getElementById("assessment-status").value;
  const notes = document.getElementById("assessment-notes").value.trim();

  let assessment;

  if (id) {
    // Update existing
    assessment = state.assessments.find(item => item.id === id);
    if (assessment) {
      assessment.name = name;
      assessment.courseCode = courseCode;
      assessment.type = type;
      assessment.date = date;
      assessment.priority = priority;
      assessment.maxMarks = maxMarks;
      assessment.weightage = weightage;
      assessment.status = status;
      assessment.notes = notes;
    }
  } else {
    // Create new
    assessment = {
      id: Date.now().toString(),
      name,
      courseCode,
      type,
      date,
      priority,
      maxMarks,
      weightage,
      status,
      notes
    };
    state.assessments.push(assessment);
  }

  // Handle Marks obtained sync if status is Completed
  const marksInput = document.getElementById("assessment-marks-obtained").value;
  if (status === "Completed" && marksInput !== "") {
    const marksObtained = parseFloat(marksInput);
    if (!isNaN(marksObtained)) {
      let mark = state.marks.find(m => m.assessmentId === assessment.id);
      if (mark) {
        mark.marksObtained = marksObtained;
      } else {
        state.marks.push({
          id: Date.now().toString() + "_m",
          assessmentId: assessment.id,
          marksObtained: marksObtained,
          notes: ""
        });
      }
    }
  } else if (status !== "Completed") {
    // If not completed, delete any associated mark record to keep DB in sync
    state.marks = state.marks.filter(m => m.assessmentId !== assessment.id);
  }

  saveState();
  closeModals();
  handleRouting();
  renderSidebarCourses();
}

function deleteAssessment(id) {
  state.assessments = state.assessments.filter(a => a.id !== id);
  // Cascading delete related marks
  state.marks = state.marks.filter(m => m.assessmentId !== id);
  
  saveState();
  handleRouting();
}

// --- MARKS MODAL ---
function openMarkModal(markId = null, preSelectedCourse = null) {
  const modal = document.getElementById("mark-modal");
  const form = document.getElementById("mark-form");
  const title = document.getElementById("mark-modal-title");
  
  form.reset();
  document.getElementById("mark-id").value = "";

  // Filter assessments list that are eligible for grading (e.g. have maxMarks and weightage)
  const selectAssessment = document.getElementById("mark-assessment-id");
  let filteredAssessments = state.assessments;
  if (preSelectedCourse) {
    filteredAssessments = state.assessments.filter(a => a.courseCode === preSelectedCourse);
  }

  if (filteredAssessments.length === 0) {
    alert("Please create an assessment for this course first before logging marks.");
    return;
  }

  selectAssessment.innerHTML = `<option value="" disabled selected>-- Select Assessment --</option>` + 
    filteredAssessments.map(a => `<option value="${a.id}">[${a.courseCode}] ${a.name} (${a.type})</option>`).join("");

  // Bind change listener to autofill course, max marks, weightage
  selectAssessment.addEventListener("change", (e) => {
    const selectedA = state.assessments.find(a => a.id === e.target.value);
    if (selectedA) {
      document.getElementById("mark-course-display").value = selectedA.courseCode;
      document.getElementById("mark-type-display").value = selectedA.type;
      document.getElementById("mark-max-display").value = selectedA.maxMarks || "Not specified";
      document.getElementById("mark-weightage-display").value = selectedA.weightage ? selectedA.weightage + "%" : "Not specified";
    }
  });

  if (markId) {
    title.innerText = "Edit Marks Record";
    const m = state.marks.find(item => item.id === markId);
    if (m) {
      document.getElementById("mark-id").value = m.id;
      selectAssessment.value = m.assessmentId;
      
      // Fire change trigger to autofill displays
      selectAssessment.dispatchEvent(new Event("change"));
      
      document.getElementById("mark-obtained").value = m.marksObtained;
      document.getElementById("mark-notes").value = m.notes || "";
    }
  } else {
    title.innerText = "Enter Marks";
  }

  modal.classList.add("open");
}

function handleMarkSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById("mark-id").value;
  const assessmentId = document.getElementById("mark-assessment-id").value;
  const marksObtained = parseFloat(document.getElementById("mark-obtained").value);
  const notes = document.getElementById("mark-notes").value.trim();

  if (isNaN(marksObtained)) return;

  if (id) {
    // Edit existing
    const mark = state.marks.find(item => item.id === id);
    if (mark) {
      mark.assessmentId = assessmentId;
      mark.marksObtained = marksObtained;
      mark.notes = notes;
    }
  } else {
    // Create new
    state.marks.push({
      id: Date.now().toString(),
      assessmentId,
      marksObtained,
      notes
    });
  }

  // Auto-complete and sync the linked assessment status
  const assessment = state.assessments.find(a => a.id === assessmentId);
  if (assessment) {
    assessment.status = "Completed";
  }

  saveState();
  closeModals();
  handleRouting();
}

function deleteMark(id) {
  state.marks = state.marks.filter(m => m.id !== id);
  saveState();
  handleRouting();
}

// Close all modal dialogs
function closeModals() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.classList.remove("open");
  });
}

// 8. SIDEBAR RENDERER
function renderSidebarCourses() {
  const container = document.getElementById("sidebar-course-list");
  container.innerHTML = "";

  state.courses.forEach(course => {
    const calc = getCourseCalculatedData(course.code);
    
    // Status visual dot color
    let dotColor = "#e3e2e0"; // grey
    if (course.risk === "Green") dotColor = "var(--clr-green-txt)";
    else if (course.risk === "Yellow") dotColor = "var(--clr-yellow-txt)";
    else if (course.risk === "Red") dotColor = "var(--clr-red-txt)";

    const a = document.createElement("a");
    a.href = `#course-${course.code}`;
    a.className = "nav-item";
    a.setAttribute("data-page", `course-${course.code}`);
    a.innerHTML = `
      <span class="nav-icon" style="color: ${dotColor}; font-size: 1.3rem;">•</span>
      <span class="nav-label" title="${course.code} — ${course.name}">${course.shortName} — ${course.name}</span>
    `;

    container.appendChild(a);
  });

  // Re-highlight active items
  const hash = window.location.hash || "#dashboard";
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("href") === hash) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// 9. INITIALIZATION & GLOBAL EVENTS
function initApp() {
  loadState();
  renderSidebarCourses();
  handleRouting();

  // Route hash change listener
  window.addEventListener("hashchange", handleRouting);

  // Sidebar toggle for mobile
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Close modals
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", closeModals);
  });
  
  // Also close modal by clicking overlay background
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModals();
    });
  });

  // Bind Form Submissions
  document.getElementById("assessment-form").addEventListener("submit", handleAssessmentSubmit);
  document.getElementById("mark-form").addEventListener("submit", handleMarkSubmit);

  // Theme Toggles
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleMobile = document.getElementById("theme-toggle-mobile");
  
  function toggleTheme() {
    const currentTheme = state.settings.theme || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    state.settings.theme = newTheme;
    saveState();
    
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Toggle icon displays
    document.querySelectorAll(".sun-icon").forEach(icon => {
      icon.style.display = newTheme === "light" ? "block" : "none";
    });
    document.querySelectorAll(".moon-icon").forEach(icon => {
      icon.style.display = newTheme === "light" ? "none" : "block";
    });
  }

  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener("click", toggleTheme);

  // Init theme icons display state
  const curTheme = state.settings.theme || "light";
  document.querySelectorAll(".sun-icon").forEach(icon => {
    icon.style.display = curTheme === "light" ? "block" : "none";
  });
  document.querySelectorAll(".moon-icon").forEach(icon => {
    icon.style.display = curTheme === "light" ? "none" : "block";
  });

  // Reset Data Button
  const resetBtn = document.getElementById("reset-data-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all assessments, grades, and marks? This will reset the workspace back to empty placeholders.")) {
        resetStateToDefault();
        loadState();
        renderSidebarCourses();
        handleRouting();
      }
    });
  }
}

// Execute app startup
document.addEventListener("DOMContentLoaded", initApp);
