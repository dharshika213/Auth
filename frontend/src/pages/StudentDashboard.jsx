import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LogOut,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const API_BASE_URL = "http://127.0.0.1:8000"

function StudentDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const [uploadingAssignmentId, setUploadingAssignmentId] =
    useState(null)

  const [uploadMessage, setUploadMessage] = useState("")

  const [submissionToDelete, setSubmissionToDelete] =
    useState(null)

  const [deletingSubmissionId, setDeletingSubmissionId] =
    useState(null)

  const [deleteMessage, setDeleteMessage] = useState("")

  useEffect(() => {
    const storedUser = localStorage.getItem("authentichek_user")
    const token = localStorage.getItem("authentichek_token")

    if (!storedUser || !token) {
      navigate("/auth?role=student")
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)

      if (parsedUser.role !== "student") {
        navigate("/auth?role=student")
        return
      }

      setUser(parsedUser)
      loadDashboardData(token)
    } catch {
      localStorage.removeItem("authentichek_user")
      localStorage.removeItem("authentichek_token")
      navigate("/auth?role=student")
    }
  }, [navigate])

  async function loadDashboardData(token) {
    try {
      setLoading(true)
      setError("")

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [assignmentsResponse, submissionsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/assignments/`, {
            headers,
          }),

          fetch(`${API_BASE_URL}/api/submissions/mine`, {
            headers,
          }),
        ])

      if (
        assignmentsResponse.status === 401 ||
        submissionsResponse.status === 401
      ) {
        handleLogout()
        return
      }

      if (
        !assignmentsResponse.ok ||
        !submissionsResponse.ok
      ) {
        throw new Error("Could not load dashboard data.")
      }

      const assignmentsData = await assignmentsResponse.json()
      const submissionsData = await submissionsResponse.json()

      setAssignments(
        Array.isArray(assignmentsData)
          ? assignmentsData
          : []
      )

      setSubmissions(
        Array.isArray(submissionsData)
          ? submissionsData
          : []
      )
    } catch (err) {
      setError(
        err.message || "Could not load dashboard data."
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem("authentichek_token")
    localStorage.removeItem("authentichek_user")
    navigate("/")
  }

  function parseDateValue(dateValue, treatAsUtc = false) {
    if (!dateValue) {
      return null
    }

    const rawValue = String(dateValue).trim()

    if (!rawValue) {
      return null
    }

    const hasTimezone =
      /(Z|[+-]\d{2}:\d{2})$/i.test(rawValue)

    const normalizedValue =
      treatAsUtc && !hasTimezone
        ? `${rawValue}Z`
        : rawValue

    const date = new Date(normalizedValue)

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date
  }

  function formatDate(dateValue) {
    const date = parseDateValue(dateValue)

    if (!date) {
      return "No deadline"
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
  }

  function formatDateTime(dateValue) {
    const date = parseDateValue(dateValue, true)

    if (!date) {
      return "—"
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(date)
  }

  function isPastDue(dueDate) {
    if (!dueDate) {
      return false
    }

    const date = parseDateValue(dueDate)

    if (!date) {
      return false
    }

    // Treat the exact deadline as closed.
    return Date.now() >= date.getTime()
  }

  function closeUploadModal() {
    if (uploadingAssignmentId !== null) {
      return
    }

    setSelectedAssignment(null)
    setSelectedFile(null)
    setUploadMessage("")
  }

  function openUploadModal(assignment) {
    if (isPastDue(assignment.due_date)) {
      setUploadMessage(
        "The assignment deadline has passed. Submissions are closed."
      )
      return
    }

    setSelectedAssignment(assignment)
    setSelectedFile(null)
    setUploadMessage("")
  }

  const submissionByAssignment = useMemo(() => {
    const map = {}

    for (const submission of submissions) {
      if (!map[submission.assignment_id]) {
        map[submission.assignment_id] = []
      }

      map[submission.assignment_id].push(submission)
    }

    return map
  }, [submissions])

  const submittedAssignmentCount = useMemo(() => {
    return new Set(
      submissions.map(
        (submission) => submission.assignment_id
      )
    ).size
  }, [submissions])

  const pendingAssignmentCount = Math.max(
    assignments.length - submittedAssignmentCount,
    0
  )

  async function handleUpload() {
    if (!selectedAssignment || !selectedFile) {
      setUploadMessage("Please select a file first.")
      return
    }

    // Client-side convenience check. The backend remains
    // authoritative for the actual submission deadline.
    if (isPastDue(selectedAssignment.due_date)) {
      setUploadMessage(
        "The assignment deadline has passed. Submissions are closed."
      )
      setSelectedFile(null)
      return
    }

    const token = localStorage.getItem("authentichek_token")

    if (!token) {
      handleLogout()
      return
    }

    try {
      setUploadingAssignmentId(selectedAssignment.id)
      setUploadMessage("")

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(
        `${API_BASE_URL}/api/submissions/${selectedAssignment.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        handleLogout()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Submission upload failed."
        )
      }

      setUploadMessage("Submission uploaded successfully.")
      setSelectedFile(null)

      await loadDashboardData(token)

      setTimeout(() => {
        setSelectedAssignment(null)
        setUploadMessage("")
      }, 1200)
    } catch (err) {
      setUploadMessage(
        err.message || "Submission upload failed."
      )
    } finally {
      setUploadingAssignmentId(null)
    }
  }

  function openDeleteSubmissionModal(submission) {
    setDeleteMessage("")
    setSubmissionToDelete(submission)
  }

  function closeDeleteSubmissionModal() {
    if (deletingSubmissionId !== null) {
      return
    }

    setSubmissionToDelete(null)
    setDeleteMessage("")
  }

  async function handleDeleteSubmission() {
    if (!submissionToDelete) {
      return
    }

    const token = localStorage.getItem("authentichek_token")

    if (!token) {
      handleLogout()
      return
    }

    const submissionId = submissionToDelete.id

    try {
      setDeletingSubmissionId(submissionId)
      setDeleteMessage("")

      const response = await fetch(
        `${API_BASE_URL}/api/submissions/${submissionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        handleLogout()
        return
      }

      if (!response.ok) {
        let data = {}

        try {
          data = await response.json()
        } catch {
          data = {}
        }

        throw new Error(
          data.detail ||
            "The submission could not be deleted."
        )
      }

      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter(
          (submission) =>
            submission.id !== submissionId
        )
      )

      setDeleteMessage("Submission permanently deleted.")

      setTimeout(() => {
        setSubmissionToDelete(null)
        setDeleteMessage("")
      }, 900)
    } catch (err) {
      setDeleteMessage(
        err.message ||
          "The submission could not be deleted."
      )
    } finally {
      setDeletingSubmissionId(null)
    }
  }

  if (loading) {
    return (
      <div className="student-dashboard-page loading-screen">
        <div className="dashboard-background">
          <div className="dashboard-bubble bubble-one" />
          <div className="dashboard-bubble bubble-two" />
          <div className="dashboard-bubble bubble-three" />

          <div className="floating-book book-one">📘</div>
          <div className="floating-book book-two">📚</div>
          <div className="floating-book book-three">📖</div>
        </div>

        <div className="dashboard-loader">
          <div className="loader-orb" />
          <h2>Loading your workspace</h2>
          <p>
            Fetching your assignments and submission history...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="student-dashboard-page">
      <div className="dashboard-background">
        <div className="dashboard-bubble bubble-one" />
        <div className="dashboard-bubble bubble-two" />
        <div className="dashboard-bubble bubble-three" />

        <div className="floating-book book-one">📘</div>
        <div className="floating-book book-two">📚</div>
        <div className="floating-book book-three">📖</div>
      </div>

      <nav className="student-navbar">
        <div className="student-brand">
          <div className="student-brand-icon">
            <BookOpen size={22} />
          </div>

          <div>
            <strong>AuthentiCheck</strong>
            <span>Student Workspace</span>
          </div>
        </div>

        <div className="student-nav-right">
          <div className="student-profile">
            <div className="student-avatar">
              <UserRound size={18} />
            </div>

            <div>
              <strong>{user?.name || "Student"}</strong>
              <span>{user?.email || ""}</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </nav>

      <main className="student-dashboard-content">
        <motion.section
          className="student-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="hero-eyebrow">STUDENT WORKSPACE</p>

            <h1>
              Welcome back,{" "}
              <span>{user?.name || "Student"}</span>
            </h1>

            <p className="hero-description">
              View your academic assignments, deadlines,
              submissions, and submission history in one place.
            </p>
          </div>

          <div className="hero-icon">
            <BookOpen size={44} />
          </div>
        </motion.section>

        {error && (
          <motion.div
            className="dashboard-error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {uploadMessage &&
          !selectedAssignment &&
          uploadMessage.includes("deadline has passed") && (
            <div className="dashboard-error" role="alert">
              {uploadMessage}
            </div>
          )}

        <section className="student-stats-grid">
          <motion.div
            className="student-stat-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="stat-icon">
              <BookOpen size={21} />
            </div>
            <div>
              <span>Available assignments</span>
              <strong>{assignments.length}</strong>
            </div>
          </motion.div>

          <motion.div
            className="student-stat-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Submitted</span>
              <strong>{submittedAssignmentCount}</strong>
            </div>
          </motion.div>

          <motion.div
            className="student-stat-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="stat-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Pending</span>
              <strong>{pendingAssignmentCount}</strong>
            </div>
          </motion.div>

          <motion.div
            className="student-stat-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon">
              <FileText size={21} />
            </div>
            <div>
              <span>Total submissions</span>
              <strong>{submissions.length}</strong>
            </div>
          </motion.div>
        </section>

        <section className="student-section">
          <div className="section-heading">
            <div>
              <p>ACADEMIC WORK</p>
              <h2>Your assignments</h2>
            </div>

            <span className="section-count">
              {assignments.length} assignment
              {assignments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="student-empty-state">
              <div className="empty-icon">
                <BookOpen size={28} />
              </div>
              <h3>No assignments available</h3>
              <p>
                Your assignments will appear here when they are
                created.
              </p>
            </div>
          ) : (
            <div className="assignment-grid">
              {assignments.map((assignment, index) => {
                const assignmentSubmissions =
                  submissionByAssignment[assignment.id] || []

                const latestSubmission =
                  assignmentSubmissions[0]

                const submitted =
                  assignmentSubmissions.length > 0

                const pastDue = isPastDue(assignment.due_date)

                return (
                  <motion.article
                    className="assignment-card"
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <div className="assignment-card-top">
                      <div className="assignment-icon">
                        <FileText size={22} />
                      </div>

                      <span
                        className={
                          pastDue
                            ? "assignment-status overdue"
                            : submitted
                            ? "assignment-status submitted"
                            : "assignment-status pending"
                        }
                      >
                        {pastDue
                          ? "Deadline passed"
                          : submitted
                          ? "Submitted"
                          : "Pending"}
                      </span>
                    </div>

                    <h3>{assignment.title}</h3>

                    <p className="assignment-description">
                      {assignment.description ||
                        "No description provided."}
                    </p>

                    <div className="assignment-meta">
                      <div>
                        <CalendarDays size={16} />
                        <span>Deadline</span>
                        <strong>
                          {formatDate(assignment.due_date)}
                        </strong>
                      </div>

                      {submitted && latestSubmission && (
                        <div>
                          <CheckCircle2 size={16} />
                          <span>Latest submission</span>
                          <strong>
                            {formatDateTime(
                              latestSubmission.submitted_at
                            )}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="assignment-card-footer">
                      <span>
                        {pastDue
                          ? "Deadline passed — submissions closed"
                          : assignmentSubmissions.length > 0
                          ? `${assignmentSubmissions.length} submission${
                              assignmentSubmissions.length !== 1
                                ? "s"
                                : ""
                            }`
                          : "Not submitted yet"}
                      </span>

                      {!pastDue ? (
                        <button
                          className="upload-button"
                          onClick={() =>
                            openUploadModal(assignment)
                          }
                        >
                          <Upload size={17} />
                          {submitted ? "Submit again" : "Upload work"}
                        </button>
                      ) : (
                        <span
                          className="deadline-closed-label"
                          role="status"
                        >
                          <Clock3 size={16} />
                          Closed
                        </span>
                      )}
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>

        <section className="student-section">
          <div className="section-heading">
            <div>
              <p>HISTORY</p>
              <h2>Submission history</h2>
            </div>

            <span className="section-count">
              {submissions.length} file
              {submissions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="student-empty-state">
              <div className="empty-icon">
                <FileText size={28} />
              </div>
              <h3>No submissions yet</h3>
              <p>
                Files you submit will appear here with their
                submission date and status.
              </p>
            </div>
          ) : (
            <div className="submission-history">
              {submissions.map((submission) => (
                <div
                  className="submission-row"
                  key={submission.id}
                >
                  <div className="submission-file-icon">
                    <FileText size={20} />
                  </div>

                  <div className="submission-main">
                    <strong>{submission.original_filename}</strong>
                    <span>{submission.assignment_title}</span>
                  </div>

                  <div className="submission-date">
                    <span>Submitted</span>
                    <strong>
                      {formatDateTime(submission.submitted_at)}
                    </strong>
                  </div>

                  <div className="submission-status">
                    <CheckCircle2 size={16} />
                    <span>
                      {submission.status === "text_extracted"
                        ? "Received"
                        : submission.status}
                    </span>
                  </div>

                  <button
                    className="submission-delete-button"
                    type="button"
                    onClick={() =>
                      openDeleteSubmissionModal(submission)
                    }
                    disabled={
                      deletingSubmissionId === submission.id
                    }
                    title="Delete submission permanently"
                  >
                    <Trash2 size={17} />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedAssignment && (
        <div className="upload-modal-backdrop">
          <motion.div
            className="upload-modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className="modal-header">
              <div>
                <p>SUBMISSION</p>
                <h2>{selectedAssignment.title}</h2>
              </div>

              <button
                className="modal-close"
                onClick={closeUploadModal}
                disabled={uploadingAssignmentId !== null}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-deadline">
              <CalendarDays size={18} />
              <div>
                <span>Submission deadline</span>
                <strong>
                  {formatDate(selectedAssignment.due_date)}
                </strong>
              </div>
            </div>

            {isPastDue(selectedAssignment.due_date) ? (
              <div className="upload-message" role="alert">
                The assignment deadline has passed. Submissions
                are closed.
              </div>
            ) : (
              <>
                <label className="file-dropzone">
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      setSelectedFile(file || null)
                      setUploadMessage("")
                    }}
                  />

                  <Upload size={30} />

                  <strong>
                    {selectedFile
                      ? selectedFile.name
                      : "Choose your academic work"}
                  </strong>

                  <span>PDF, DOCX or PPTX</span>
                </label>

                {uploadMessage && (
                  <div
                    className={
                      uploadMessage.includes("successfully")
                        ? "upload-message success"
                        : "upload-message"
                    }
                    role="status"
                  >
                    {uploadMessage}
                  </div>
                )}

                <button
                  className="modal-upload-button"
                  disabled={
                    !selectedFile ||
                    uploadingAssignmentId ===
                      selectedAssignment.id
                  }
                  onClick={handleUpload}
                >
                  <Upload size={18} />

                  {uploadingAssignmentId === selectedAssignment.id
                    ? "Uploading..."
                    : "Submit assignment"}
                </button>
              </>
            )}

            <p className="privacy-note">
              Your submission will be securely stored for academic
              verification. Verification results are available to
              authorized teaching staff.
            </p>
          </motion.div>
        </div>
      )}

      {submissionToDelete && (
        <div className="upload-modal-backdrop">
          <motion.div
            className="upload-modal delete-confirm-modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="delete-warning-icon">
              <AlertTriangle size={28} />
            </div>

            <div className="delete-confirm-content">
              <p className="delete-eyebrow">
                PERMANENT DELETION
              </p>

              <h2>Delete this submission?</h2>
              <p>You are about to permanently delete:</p>

              <div className="delete-file-card">
                <FileText size={20} />
                <div>
                  <strong>
                    {submissionToDelete.original_filename}
                  </strong>
                  <span>
                    {submissionToDelete.assignment_title}
                  </span>
                </div>
              </div>

              <p className="delete-danger-text">
                This will permanently remove the uploaded document
                and its verification analysis. This action cannot
                be undone.
              </p>
            </div>

            {deleteMessage && (
              <div
                className={
                  deleteMessage.includes("permanently deleted")
                    ? "upload-message success"
                    : "upload-message"
                }
              >
                {deleteMessage}
              </div>
            )}

            <div
              className="delete-confirm-actions"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "12px",
                width: "100%",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                className="delete-cancel-button"
                onClick={closeDeleteSubmissionModal}
                disabled={deletingSubmissionId !== null}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minHeight: "44px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: 1,
                  cursor:
                    deletingSubmissionId !== null
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    deletingSubmissionId !== null ? 0.55 : 1,
                  whiteSpace: "nowrap",
                  boxSizing: "border-box",
                  transition: "all 160ms ease",
                }}
              >
                <X size={17} />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={handleDeleteSubmission}
                disabled={
                  deletingSubmissionId === submissionToDelete.id
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minHeight: "44px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "1px solid #dc2626",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: 1,
                  cursor:
                    deletingSubmissionId === submissionToDelete.id
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    deletingSubmissionId === submissionToDelete.id
                      ? 0.65
                      : 1,
                  whiteSpace: "nowrap",
                  boxSizing: "border-box",
                  boxShadow:
                    "0 6px 18px rgba(220, 38, 38, 0.18)",
                  transition: "all 160ms ease",
                }}
              >
                <Trash2 size={17} />
                <span>
                  {deletingSubmissionId === submissionToDelete.id
                    ? "Deleting..."
                    : "Delete permanently"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard