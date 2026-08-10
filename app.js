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

// 2. STATE CONFIGURATION & SUPABASE INTEGRATION
import { supabase, isSupabaseConfigured } from './supabase.js';

let currentUser = null;
let syncStatus = 'synced'; // synced, saving, offline, error
let syncTimeout = null;

let state = {
  courses: [],
  assessments: [],
  marks: [],
  settings: {
    targetSemesterGPA: null,
    targetSemesterMarks: null,
    theme: "light",
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear()
  }
};

// Database Mappings (PostgreSQL snake_case <=> Frontend camelCase)
function mapDBToCourse(db) {
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    shortName: db.short_name,
    credits: db.credits,
    instructor: db.instructor || "",
    targetGrade: db.target_grade || "—",
    currentGrade: db.current_grade || "—",
    targetMarks: db.target_marks,
    syllabusProgress: db.syllabus_progress || 0,
    status: db.status || "Not Started",
    risk: db.risk || "Green",
    weakAreas: db.weak_areas || "",
    strongAreas: db.strong_areas || "",
    notes: db.notes || ""
  };
}

function mapCourseToDB(js, userId) {
  return {
    id: js.id,
    user_id: userId,
    code: js.code,
    name: js.name,
    short_name: js.shortName,
    credits: js.credits,
    instructor: js.instructor || "",
    target_grade: js.targetGrade || "—",
    current_grade: js.currentGrade || "—",
    target_marks: js.targetMarks,
    syllabus_progress: js.syllabusProgress || 0,
    status: js.status || "Not Started",
    risk: js.risk || "Green",
    weak_areas: js.weakAreas || "",
    strong_areas: js.strongAreas || "",
    notes: js.notes || ""
  };
}

function mapDBToAssessment(db, courses) {
  const course = courses.find(c => c.id === db.course_id);
  return {
    id: db.id,
    courseId: db.course_id,
    courseCode: course ? course.code : "",
    name: db.name,
    type: db.type,
    date: db.date,
    maxMarks: db.max_marks,
    weightage: db.weightage || 0,
    status: db.status || "Upcoming",
    priority: db.priority || "Medium",
    notes: db.notes || ""
  };
}

function mapAssessmentToDB(js, userId, courses) {
  const course = courses.find(c => c.code === js.courseCode);
  return {
    id: js.id && js.id.length > 20 ? js.id : undefined,
    user_id: userId,
    course_id: course ? course.id : undefined,
    name: js.name,
    type: js.type,
    date: js.date,
    max_marks: js.maxMarks,
    weightage: js.weightage || 0,
    status: js.status || "Upcoming",
    priority: js.priority || "Medium",
    notes: js.notes || ""
  };
}

function mapDBToMark(db) {
  return {
    id: db.id,
    assessmentId: db.assessment_id,
    marksObtained: db.marks_obtained,
    notes: db.notes || ""
  };
}

function mapMarkToDB(js, userId) {
  return {
    id: js.id && js.id.length > 20 ? js.id : undefined,
    user_id: userId,
    assessment_id: js.assessmentId,
    marks_obtained: js.marksObtained,
    notes: js.notes || ""
  };
}

// UI Status indicators
function setSyncStatus(status) {
  syncStatus = status;
  const dot = document.querySelector(".status-indicator-dot");
  const text = document.querySelector(".sync-status .status-text");
  if (!dot || !text) return;

  dot.className = "status-indicator-dot";
  if (status === 'synced') {
    dot.classList.add("online");
    text.innerText = "Synced to Cloud";
  } else if (status === 'saving') {
    dot.classList.add("saving");
    text.innerText = "Saving changes...";
  } else if (status === 'offline') {
    dot.classList.add("offline");
    text.innerText = "Offline Cache Mode";
  } else if (status === 'error') {
    dot.classList.add("error");
    text.innerText = "Sync Error (Cached)";
  }
}

function showToast(msg) {
  let banner = document.querySelector(".global-status-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "global-status-banner";
    document.body.appendChild(banner);
  }
  banner.innerHTML = `<span class="global-status-text">ℹ️ ${msg}</span>`;
  banner.style.display = "flex";
  
  setTimeout(() => {
    banner.style.display = "none";
  }, 4000);
}

// 3. STORAGE & STATE MANAGEMENT
async function fetchAllData() {
  if (!currentUser) return;
  
  try {
    setSyncStatus('saving');
    
    // Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();
      
    if (settingsError) throw settingsError;
    
    if (settingsData) {
      state.settings = {
        targetSemesterGPA: settingsData.target_semester_gpa,
        targetSemesterMarks: settingsData.target_semester_marks,
        theme: settingsData.theme || 'light',
        calendarMonth: state.settings.calendarMonth,
        calendarYear: state.settings.calendarYear
      };
    } else {
      const { error: insertError } = await supabase
        .from('settings')
        .insert({ user_id: currentUser.id, theme: 'light' });
      if (insertError) throw insertError;
    }
    
    // Set theme and toggle icons
    document.documentElement.setAttribute("data-theme", state.settings.theme || "light");
    updateThemeIcons(state.settings.theme || "light");

    // Fetch courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('code');
      
    if (coursesError) throw coursesError;
    
    if (coursesData && coursesData.length > 0) {
      state.courses = coursesData.map(mapDBToCourse);
    } else {
      const defaultCoursesPayload = DEFAULT_COURSES.map(c => mapCourseToDB(c, currentUser.id));
      const { data: insertedCourses, error: insertCoursesError } = await supabase
        .from('courses')
        .insert(defaultCoursesPayload)
        .select();
        
      if (insertCoursesError) throw insertCoursesError;
      state.courses = insertedCourses.map(mapDBToCourse);
    }

    // Fetch assessments
    const { data: assessmentsData, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date');
      
    if (assessmentsError) throw assessmentsError;
    state.assessments = assessmentsData ? assessmentsData.map(dbA => mapDBToAssessment(dbA, state.courses)) : [];

    // Fetch marks
    const { data: marksData, error: marksError } = await supabase
      .from('marks')
      .select('*')
      .eq('user_id', currentUser.id);
      
    if (marksError) throw marksError;
    state.marks = marksData ? marksData.map(mapDBToMark) : [];

    // Cache local fallback copy
    localStorage.setItem(`academic_os_cache_${currentUser.id}`, JSON.stringify(state));
    
    setSyncStatus('synced');
    renderSidebarCourses();
    handleRouting();
    
  } catch (error) {
    console.error("Error fetching data:", error);
    setSyncStatus('error');
    
    const cache = localStorage.getItem(`academic_os_cache_${currentUser.id}`);
    if (cache) {
      state = JSON.parse(cache);
      renderSidebarCourses();
      handleRouting();
      showToast("Loaded from local offline cache.");
    } else {
      showToast("Could not retrieve your data. Please check your internet connection.");
    }
  }
}

function loadState() {
  // Replaced by fetchAllData() session flows
}

function saveState(skipCloud = false) {
  if (currentUser) {
    localStorage.setItem(`academic_os_cache_${currentUser.id}`, JSON.stringify(state));
  } else {
    localStorage.setItem("academic_os_state", JSON.stringify(state));
  }
  
  if (skipCloud || !currentUser) {
    return;
  }
  
  setSyncStatus('saving');
  
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }
      
      // 1. Sync settings
      const settingsDB = {
        user_id: currentUser.id,
        target_semester_gpa: state.settings.targetSemesterGPA,
        target_semester_marks: state.settings.targetSemesterMarks,
        theme: state.settings.theme || 'light'
      };
      const { error: settingsErr } = await supabase
        .from('settings')
        .upsert(settingsDB);
      if (settingsErr) throw settingsErr;
      
      // 2. Sync courses
      const coursesDB = state.courses.map(c => mapCourseToDB(c, currentUser.id));
      const { error: coursesErr } = await supabase
        .from('courses')
        .upsert(coursesDB);
      if (coursesErr) throw coursesErr;
      
      // 3. Sync assessments (UUID generation sync loop)
      for (let i = 0; i < state.assessments.length; i++) {
        const a = state.assessments[i];
        const dbA = mapAssessmentToDB(a, currentUser.id, state.courses);
        
        if (!a.id || a.id.length < 20) {
          const { data, error } = await supabase
            .from('assessments')
            .insert(dbA)
            .select()
            .single();
          if (error) throw error;
          
          const oldId = a.id;
          a.id = data.id;
          a.courseId = data.course_id;
          
          state.marks.forEach(m => {
            if (m.assessmentId === oldId) {
              m.assessmentId = data.id;
            }
          });
        } else {
          const { error } = await supabase
            .from('assessments')
            .upsert(dbA);
          if (error) throw error;
        }
      }
      
      // 4. Sync marks
      for (let i = 0; i < state.marks.length; i++) {
        const m = state.marks[i];
        const dbM = mapMarkToDB(m, currentUser.id);
        
        if (!m.id || m.id.length < 20) {
          const { data, error } = await supabase
            .from('marks')
            .insert(dbM)
            .select()
            .single();
          if (error) throw error;
          m.id = data.id;
        } else {
          const { error } = await supabase
            .from('marks')
            .upsert(dbM);
          if (error) throw error;
        }
      }
      
      localStorage.setItem(`academic_os_cache_${currentUser.id}`, JSON.stringify(state));
      setSyncStatus('synced');
    } catch (err) {
      console.error("Supabase sync error:", err);
      setSyncStatus('error');
      showToast("Cloud sync failed. Saved to local offline cache.");
    }
  }, 1000);
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
  localStorage.setItem("academic_os_state", JSON.stringify(state));
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

// Search Filtering Helper Functions
function getSearchFilteredCourses(list) {
  const searchInput = document.getElementById("global-search");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (!query) return list;
  return list.filter(c => 
    c.code.toLowerCase().includes(query) ||
    c.name.toLowerCase().includes(query) ||
    (c.instructor && c.instructor.toLowerCase().includes(query)) ||
    (c.notes && c.notes.toLowerCase().includes(query))
  );
}

function getSearchFilteredAssessments(list) {
  const searchInput = document.getElementById("global-search");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (!query) return list;
  return list.filter(a => 
    a.name.toLowerCase().includes(query) ||
    a.courseCode.toLowerCase().includes(query) ||
    a.type.toLowerCase().includes(query) ||
    (a.notes && a.notes.toLowerCase().includes(query))
  );
}

function getSearchFilteredMarks(list) {
  const searchInput = document.getElementById("global-search");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  if (!query) return list;
  return list.filter(m => {
    const a = state.assessments.find(item => item.id === m.assessmentId);
    return (a && a.name.toLowerCase().includes(query)) ||
           (a && a.courseCode.toLowerCase().includes(query)) ||
           (m.notes && m.notes.toLowerCase().includes(query));
  });
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
  getSearchFilteredCourses(state.courses).forEach(course => {
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
  const todayDeadlines = getSearchFilteredAssessments(state.assessments.filter(a => a.date === todayStr));
  // High risk courses needing attention
  const attentionCourses = getSearchFilteredCourses(state.courses.filter(c => c.risk === "Yellow" || c.risk === "Red"));
  
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
  const upcomingAssessments = getSearchFilteredAssessments(
    state.assessments.filter(a => a.status === "Upcoming" || a.status === "Pending")
  )
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
  const recentMarks = getSearchFilteredMarks(state.marks)
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
  const finalFiltered = getSearchFilteredAssessments(filteredList);
  if (finalFiltered.length === 0) {
    container.innerHTML = `<div class="empty-db-state">No matching assessments found.</div>`;
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
  finalFiltered.forEach(a => {
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
  
  const filteredMarks = getSearchFilteredMarks(state.marks);
  if (filteredMarks.length === 0) {
    viewBody.innerHTML = `<div class="empty-db-state">No matching mark records found.</div>`;
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
  filteredMarks.forEach(m => {
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

async function deleteAssessment(id) {
  state.assessments = state.assessments.filter(a => a.id !== id);
  state.marks = state.marks.filter(m => m.assessmentId !== id);
  
  saveState(true);
  handleRouting();
  
  if (currentUser && id.length > 20) {
    try {
      setSyncStatus('saving');
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSyncStatus('synced');
    } catch (err) {
      console.error("Database deletion error for assessment:", err);
      setSyncStatus('error');
      showToast("Sync deletion failed. Saved locally.");
    }
  }
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

async function deleteMark(id) {
  state.marks = state.marks.filter(m => m.id !== id);
  saveState(true);
  handleRouting();
  
  if (currentUser && id.length > 20) {
    try {
      setSyncStatus('saving');
      const { error } = await supabase
        .from('marks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSyncStatus('synced');
    } catch (err) {
      console.error("Database deletion error for mark:", err);
      setSyncStatus('error');
      showToast("Sync deletion failed. Saved locally.");
    }
  }
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

// 9. PRODUCTION UTILITY FUNCTIONS & INITIALIZATION
function updateThemeIcons(theme) {
  document.querySelectorAll(".sun-icon").forEach(icon => {
    icon.style.display = theme === "light" ? "block" : "none";
  });
  document.querySelectorAll(".moon-icon").forEach(icon => {
    icon.style.display = theme === "light" ? "none" : "block";
  });
}

function checkLocalMigration() {
  const localData = localStorage.getItem("academic_os_state");
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if ((parsed.assessments && parsed.assessments.length > 0) || (parsed.marks && parsed.marks.length > 0)) {
        showMigrationBanner();
      }
    } catch (e) {
      console.error("Local storage parse error on migration check:", e);
    }
  }
}

function showMigrationBanner() {
  if (document.querySelector(".migration-banner")) return;

  const banner = document.createElement("div");
  banner.className = "migration-banner";
  banner.innerHTML = `
    <div class="migration-banner-content">
      <span class="migration-banner-icon">💡</span>
      <div class="migration-banner-text">
        <h4>Migrate Local Data</h4>
        <p>We found existing academic data stored locally in this browser. Migrate it now to back it up in your cloud profile.</p>
      </div>
    </div>
    <div class="migration-actions">
      <button class="btn btn-primary btn-sm" id="migrate-yes-btn">Migrate Data</button>
      <button class="btn btn-secondary btn-sm" id="migrate-no-btn">Dismiss</button>
    </div>
  `;

  const viewport = document.getElementById("content-viewport");
  if (viewport) {
    viewport.prepend(banner);
    
    document.getElementById("migrate-yes-btn").addEventListener("click", async () => {
      await runLocalMigration();
    });
    
    document.getElementById("migrate-no-btn").addEventListener("click", () => {
      banner.remove();
      localStorage.removeItem("academic_os_state");
    });
  }
}

async function runLocalMigration() {
  const localData = localStorage.getItem("academic_os_state");
  if (!localData || !currentUser) return;

  const btn = document.getElementById("migrate-yes-btn");
  btn.disabled = true;
  btn.innerText = "Migrating...";

  try {
    setSyncStatus('saving');
    const parsed = JSON.parse(localData);

    const { data: dbCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', currentUser.id);
      
    if (coursesError) throw coursesError;

    if (parsed.settings) {
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          user_id: currentUser.id,
          target_semester_gpa: parsed.settings.targetSemesterGPA,
          target_semester_marks: parsed.settings.targetSemesterMarks,
          theme: parsed.settings.theme || 'light'
        });
      if (settingsError) throw settingsError;
    }

    if (parsed.courses && parsed.courses.length > 0) {
      for (const localC of parsed.courses) {
        const dbC = dbCourses.find(c => c.code === localC.code);
        if (dbC) {
          const { error: updateError } = await supabase
            .from('courses')
            .update({
              instructor: localC.instructor || "",
              target_grade: localC.targetGrade || "—",
              current_grade: localC.currentGrade || "—",
              target_marks: localC.targetMarks,
              syllabus_progress: localC.syllabusProgress || 0,
              status: localC.status || "Not Started",
              risk: localC.risk || "Green",
              weak_areas: localC.weakAreas || "",
              strong_areas: localC.strongAreas || "",
              notes: localC.notes || ""
            })
            .eq('id', dbC.id);
          if (updateError) throw updateError;
        }
      }
    }

    await fetchAllData();

    if (parsed.assessments && parsed.assessments.length > 0) {
      for (const localA of parsed.assessments) {
        const dbC = state.courses.find(c => c.code === localA.courseCode);
        if (dbC) {
          const dbPayload = {
            user_id: currentUser.id,
            course_id: dbC.id,
            name: localA.name,
            type: localA.type,
            date: localA.date,
            max_marks: localA.maxMarks,
            weightage: localA.weightage || 0,
            status: localA.status || "Upcoming",
            priority: localA.priority || "Medium",
            notes: localA.notes || ""
          };
          
          const { data: insertedA, error: insertAError } = await supabase
            .from('assessments')
            .insert(dbPayload)
            .select()
            .single();
            
          if (insertAError) throw insertAError;

          const localM = parsed.marks ? parsed.marks.find(m => m.assessmentId === localA.id) : null;
          if (localM) {
            const markPayload = {
              user_id: currentUser.id,
              assessment_id: insertedA.id,
              marks_obtained: localM.marksObtained,
              notes: localM.notes || ""
            };
            const { error: insertMError } = await supabase
              .from('marks')
              .insert(markPayload);
              
            if (insertMError) throw insertMError;
          }
        }
      }
    }

    await fetchAllData();
    localStorage.removeItem("academic_os_state");
    const banner = document.querySelector(".migration-banner");
    if (banner) banner.remove();
    showToast("Local data migrated successfully! Database fully synced.");
  } catch (err) {
    console.error("Migration error:", err);
    setSyncStatus('error');
    btn.disabled = false;
    btn.innerText = "Migrate Data";
    alert(`Migration failed: ${err.message || err}. Local data remains safe in this browser.`);
  }
}

async function handleResetData() {
  if (!confirm("Are you sure you want to delete all assessments, grades, and marks? This will reset the workspace back to empty placeholders.")) {
    return;
  }
  
  try {
    setSyncStatus('saving');
    
    if (currentUser) {
      const { error: assessmentsErr } = await supabase
        .from('assessments')
        .delete()
        .eq('user_id', currentUser.id);
      if (assessmentsErr) throw assessmentsErr;
      
      const { error: coursesDeleteErr } = await supabase
        .from('courses')
        .delete()
        .eq('user_id', currentUser.id);
      if (coursesDeleteErr) throw coursesDeleteErr;
      
      const defaultCoursesPayload = DEFAULT_COURSES.map(c => mapCourseToDB(c, currentUser.id));
      const { error: coursesInsertErr } = await supabase
        .from('courses')
        .insert(defaultCoursesPayload);
      if (coursesInsertErr) throw coursesInsertErr;
      
      const { error: settingsErr } = await supabase
        .from('settings')
        .update({ target_semester_gpa: null, target_semester_marks: null })
        .eq('user_id', currentUser.id);
      if (settingsErr) throw settingsErr;
    }
    
    resetStateToDefault();
    
    if (currentUser) {
      await fetchAllData();
    } else {
      renderSidebarCourses();
      handleRouting();
    }
    showToast("Data reset to defaults successfully.");
  } catch (err) {
    console.error("Reset data error:", err);
    setSyncStatus('error');
    showToast("Reset failed. Please check your network connection.");
  }
}

function handleExportData() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `academic_os_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Data exported successfully!");
  } catch (err) {
    console.error("Export error:", err);
    alert("Could not export data: " + err.message);
  }
}

async function handleImportData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      
      if (!imported || typeof imported !== 'object') throw new Error("Invalid file format: must be an object.");
      if (!Array.isArray(imported.courses)) throw new Error("Missing courses list.");
      if (!Array.isArray(imported.assessments)) throw new Error("Missing assessments list.");
      if (!Array.isArray(imported.marks)) throw new Error("Missing marks list.");
      
      if (!confirm("⚠️ WARNING: This will replace all your current courses, assessments, and marks with the data from the imported backup file. This action cannot be undone. Are you sure you want to proceed?")) {
        e.target.value = "";
        return;
      }

      setSyncStatus('saving');

      if (currentUser) {
        // Clear database
        const { error: assessmentsErr } = await supabase
          .from('assessments')
          .delete()
          .eq('user_id', currentUser.id);
        if (assessmentsErr) throw assessmentsErr;

        const { error: coursesDeleteErr } = await supabase
          .from('courses')
          .delete()
          .eq('user_id', currentUser.id);
        if (coursesDeleteErr) throw coursesDeleteErr;

        // Insert courses
        const coursesPayload = imported.courses.map(c => mapCourseToDB(c, currentUser.id));
        const { data: insertedCourses, error: coursesInsertErr } = await supabase
          .from('courses')
          .insert(coursesPayload)
          .select();
        if (coursesInsertErr) throw coursesInsertErr;

        state.courses = insertedCourses.map(mapDBToCourse);

        // Insert assessments and resolve references
        if (imported.assessments.length > 0) {
          for (const localA of imported.assessments) {
            const dbC = state.courses.find(c => c.code === localA.courseCode);
            if (dbC) {
              const dbPayload = {
                user_id: currentUser.id,
                course_id: dbC.id,
                name: localA.name,
                type: localA.type,
                date: localA.date,
                max_marks: localA.maxMarks,
                weightage: localA.weightage || 0,
                status: localA.status || "Upcoming",
                priority: localA.priority || "Medium",
                notes: localA.notes || ""
              };
              
              const { data: insertedA, error: insertAError } = await supabase
                .from('assessments')
                .insert(dbPayload)
                .select()
                .single();
                
              if (insertAError) throw insertAError;

              const localM = imported.marks.find(m => m.assessmentId === localA.id);
              if (localM) {
                const markPayload = {
                  user_id: currentUser.id,
                  assessment_id: insertedA.id,
                  marks_obtained: localM.marksObtained,
                  notes: localM.notes || ""
                };
                const { error: insertMError } = await supabase
                  .from('marks')
                  .insert(markPayload);
                  
                if (insertMError) throw insertMError;
              }
            }
          }
        }

        // Overwrite settings
        if (imported.settings) {
          const { error: settingsErr } = await supabase
            .from('settings')
            .upsert({
              user_id: currentUser.id,
              target_semester_gpa: imported.settings.targetSemesterGPA,
              target_semester_marks: imported.settings.targetSemesterMarks,
              theme: imported.settings.theme || 'light'
            });
          if (settingsErr) throw settingsErr;
        }

        await fetchAllData();
      } else {
        state.courses = imported.courses;
        state.assessments = imported.assessments;
        state.marks = imported.marks;
        if (imported.settings) state.settings = imported.settings;
        saveState();
        renderSidebarCourses();
        handleRouting();
      }

      showToast("Data imported and synced successfully!");
    } catch (err) {
      console.error("Import error:", err);
      setSyncStatus('error');
      alert("Import failed: " + (err.message || err));
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
}

// 10. APP ENTRYPOINT & EVENT BINDS
function initApp() {
  // If Supabase keys are missing, render a friendly setup guide card and exit startup
  if (!isSupabaseConfigured) {
    const loadingViewport = document.getElementById("loading-viewport");
    if (loadingViewport) {
      loadingViewport.innerHTML = `
        <div class="loading-spinner-container" style="max-width: 480px; padding: 2.5rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg);">
          <span class="loading-icon" style="animation: none; font-size: 3rem; margin-bottom: 1rem;">⚠️</span>
          <h3 class="loading-text" style="color: var(--clr-red-txt); font-size: 1.4rem; margin-bottom: 0.75rem;">Setup Config Required</h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5;">
            This personal OS is now configured to run in cloud mode, but your local development environment variables are not yet loaded.
          </p>
          <div style="text-align: left; background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--border-radius-md); font-family: monospace; font-size: 0.8rem; line-height: 1.4; margin-bottom: 1.5rem; color: var(--text-primary);">
            # 1. Create a <strong>.env</strong> file in the root directory:<br>
            VITE_SUPABASE_URL=https://your-project.supabase.co<br>
            VITE_SUPABASE_ANON_KEY=your-anon-public-key-here<br><br>
            # 2. Save the file and restart Vite: <br>
            npm run dev
          </div>
          <p style="font-size: 0.85rem; color: var(--text-tertiary);">
            Refer to the README.md for more details on Supabase and Vercel setup.
          </p>
        </div>
      `;
      loadingViewport.style.display = "flex";
    }
    return;
  }

  // Bind Routing Event
  window.addEventListener("hashchange", handleRouting);

  // Sidebar toggle for mobile drawer navigation
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
    updateThemeIcons(newTheme);
  }

  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener("click", toggleTheme);

  // Reset Data Button
  const resetBtn = document.getElementById("reset-data-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", handleResetData);
  }

  // Export Data Button
  const exportBtn = document.getElementById("export-data-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportData);
  }

  // Import Data Buttons
  const importBtn = document.getElementById("import-data-btn");
  const fileInput = document.getElementById("import-file-input");
  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleImportData);
  }

  // Network connection auto-sync listeners
  window.addEventListener('online', () => {
    if (currentUser) {
      fetchAllData();
    } else {
      setSyncStatus('synced');
    }
  });
  window.addEventListener('offline', () => {
    setSyncStatus('offline');
  });

  // Global Search input bind
  const globalSearch = document.getElementById("global-search");
  if (globalSearch) {
    globalSearch.addEventListener("input", () => {
      handleRouting();
    });
  }

  // AUTHENTICATION SYSTEM LOGIC
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const authForm = document.getElementById("auth-form");
  const submitBtn = document.getElementById("auth-submit-btn");
  const submitText = submitBtn.querySelector(".btn-text");
  const errorMsg = document.getElementById("auth-error");
  const logoutBtn = document.getElementById("logout-btn");
  
  let activeAuthTab = 'login';

  tabLogin.addEventListener("click", () => {
    activeAuthTab = 'login';
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    submitText.innerText = "Sign In";
    errorMsg.style.display = "none";
  });

  tabSignup.addEventListener("click", () => {
    activeAuthTab = 'signup';
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    submitText.innerText = "Sign Up";
    errorMsg.style.display = "none";
  });

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const spinner = submitBtn.querySelector(".btn-spinner");

    errorMsg.style.display = "none";
    submitBtn.disabled = true;
    spinner.style.display = "inline-block";

    try {
      if (activeAuthTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast("Signup successful! Please log in.");
        tabLogin.click();
      }
    } catch (err) {
      console.error("Authentication error:", err);
      errorMsg.innerText = err.message || "An authentication error occurred. Please check your credentials.";
      errorMsg.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      spinner.style.display = "none";
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to sign out?")) {
        await supabase.auth.signOut();
      }
    });
  }

  // Manage viewport toggle visibilities with Supabase session status
  const loadingViewport = document.getElementById("loading-viewport");
  const authViewport = document.getElementById("auth-viewport");
  const appContainer = document.querySelector(".app-container");

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      currentUser = session.user;
      
      // Update UI Header user block details
      document.getElementById("user-email").innerText = currentUser.email;
      document.getElementById("user-avatar").innerText = currentUser.email[0].toUpperCase();
      document.getElementById("user-profile-block").style.display = "flex";

      // Fetch cloud data and sync UI
      await fetchAllData();
      
      // Toggle views
      loadingViewport.style.display = "none";
      authViewport.style.display = "none";
      appContainer.style.display = "flex";
    } else {
      currentUser = null;
      resetStateToDefault();
      
      loadingViewport.style.display = "none";
      authViewport.style.display = "flex";
      appContainer.style.display = "none";
    }
  });

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('PWA Service Worker registration failed:', err);
      });
    });
  }
}

// Execute app startup
document.addEventListener("DOMContentLoaded", initApp);
