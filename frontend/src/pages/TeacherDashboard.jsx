import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpen,
  ClipboardList,
  FileCheck2,
  Clock3,
  Plus,
  LogOut,
  CalendarDays,
  Users,
  ArrowRight,
  GraduationCap,
  Sparkles,
  X,
  FileText,
  Mail,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Trash2,
} from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000"

function TeacherDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [analysisBySubmission, setAnalysisBySubmission] = useState({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [deletingAssignment, setDeletingAssignment] = useState(null)
  const [deleteError, setDeleteError] = useState("")

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingAssignment, setCreatingAssignment] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState("")

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    due_date: "",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("authentichek_user")
    const token = localStorage.getItem("authentichek_token")

    if (!storedUser || !token) {
      navigate("/auth?role=teacher")
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)

      if (parsedUser.role !== "teacher") {
        navigate("/auth?role=teacher")
        return
      }

      setUser(parsedUser)
      loadDashboard(token)
    } catch {
      localStorage.removeItem("authentichek_user")
      localStorage.removeItem("authentichek_token")
      navigate("/auth?role=teacher")
    }
  }, [navigate])

  async function loadDashboard(token) {
    setLoading(true)
    setError("")

    try {
      const [assignmentsResponse, submissionsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/assignments/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/submissions/teacher`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

      if (!assignmentsResponse.ok) {
        throw new Error("Could not load assignments.")
      }

      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData)

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData)

        await loadSubmissionAnalyses(
          submissionsData,
          token,
        )
      } else {
        setSubmissions([])
        setAnalysisBySubmission({})
      }
    } catch (err) {
      setError(err.message || "Could not load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  async function loadSubmissionAnalyses(
    submissionList,
    token,
  ) {
    if (!submissionList.length) {
      setAnalysisBySubmission({})
      return
    }

    const analysisEntries = await Promise.all(
      submissionList.map(async (submission) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/analysis/submission/${submission.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          if (response.status === 404) {
            return [submission.id, null]
          }

          if (!response.ok) {
            return [submission.id, null]
          }

          const data = await response.json()

          return [submission.id, data]
        } catch {
          return [submission.id, null]
        }
      }),
    )

    const analysisMap = Object.fromEntries(
      analysisEntries,
    )

    setAnalysisBySubmission(analysisMap)
  }

  function handleLogout() {
    localStorage.removeItem("authentichek_token")
    localStorage.removeItem("authentichek_user")
    navigate("/auth?role=teacher")
  }

  function openDeleteAssignment(assignment) {
    setDeleteError("")
    setDeletingAssignment(assignment)
  }

  function closeDeleteAssignment() {
    if (deletingAssignment?.isDeleting) return

    setDeletingAssignment(null)
    setDeleteError("")
  }

  async function handleDeleteAssignment() {
    if (!deletingAssignment?.id) return

    const token = localStorage.getItem(
      "authentichek_token",
    )

    if (!token) {
      navigate("/auth?role=teacher")
      return
    }

    const assignmentId = deletingAssignment.id

    setDeletingAssignment((current) =>
      current
        ? {
            ...current,
            isDeleting: true,
          }
        : current,
    )

    setDeleteError("")

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assignments/${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null)

        throw new Error(
          data?.detail ||
            "Could not permanently delete the assignment.",
        )
      }

      setAssignments((current) =>
        current.filter(
          (assignment) =>
            assignment.id !== assignmentId,
        ),
      )

      setSubmissions((current) =>
        current.filter(
          (submission) =>
            submission.assignment_id !== assignmentId,
        ),
      )

      setAnalysisBySubmission((current) => {
        const next = { ...current }

        submissions.forEach((submission) => {
          if (
            submission.assignment_id ===
            assignmentId
          ) {
            delete next[submission.id]
          }
        })

        return next
      })

      if (
        selectedAssignment?.id ===
        assignmentId
      ) {
        setSelectedAssignment(null)
      }

      setDeletingAssignment(null)
    } catch (err) {
      setDeletingAssignment((current) =>
        current
          ? {
              ...current,
              isDeleting: false,
            }
          : current,
      )

      setDeleteError(
        err.message ||
          "Something went wrong while permanently deleting the assignment.",
      )
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "No deadline"
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return "No deadline"
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
  }

  function formatDateTime(dateString) {
    if (!dateString) {
      return "Unknown"
    }

    const rawValue = String(dateString).trim()

    if (!rawValue) {
      return "Unknown"
    }

    const hasTimezone =
      /(Z|[+-]\d{2}:\d{2})$/i.test(rawValue)

    const normalizedDate =
      hasTimezone
        ? rawValue
        : `${rawValue}Z`

    const date = new Date(normalizedDate)

    if (Number.isNaN(date.getTime())) {
      return "Unknown"
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(date)
  }

  function openCreateModal() {
    setAssignmentForm({
      title: "",
      description: "",
      due_date: "",
    })

    setCreateError("")
    setCreateSuccess("")
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    if (creatingAssignment) return

    setShowCreateModal(false)
    setCreateError("")
    setCreateSuccess("")
  }

  function handleAssignmentChange(event) {
    const { name, value } = event.target

    setAssignmentForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleCreateAssignment(event) {
    event.preventDefault()

    const title = assignmentForm.title.trim()
    const description =
      assignmentForm.description.trim()

    if (title.length < 2) {
      setCreateError(
        "Assignment title must contain at least 2 characters.",
      )
      return
    }

    const token = localStorage.getItem(
      "authentichek_token",
    )

    if (!token) {
      navigate("/auth?role=teacher")
      return
    }

    setCreatingAssignment(true)
    setCreateError("")
    setCreateSuccess("")

    try {
      const payload = {
        title,
        description: description || null,
        due_date: assignmentForm.due_date
          ? `${assignmentForm.due_date}T23:59:00`
          : null,
      }

      const response = await fetch(
        `${API_BASE_URL}/api/assignments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      )

      const data = await response
        .json()
        .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Could not create the assignment.",
        )
      }

      setAssignments((current) => [
        data,
        ...current,
      ])

      setCreateSuccess(
        "Assignment created successfully.",
      )

      setAssignmentForm({
        title: "",
        description: "",
        due_date: "",
      })

      setTimeout(() => {
        setShowCreateModal(false)
        setCreateSuccess("")
      }, 900)
    } catch (err) {
      setCreateError(
        err.message ||
          "Something went wrong while creating the assignment.",
      )
    } finally {
      setCreatingAssignment(false)
    }
  }

  const pendingReviews = useMemo(() => {
    return submissions.filter((submission) => {
      const analysis =
        analysisBySubmission[submission.id]

      return (
        !analysis ||
        analysis.status !== "completed"
      )
    }).length
  }, [
    submissions,
    analysisBySubmission,
  ])

  const analyzedSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const analysis =
        analysisBySubmission[submission.id]

      return analysis?.status === "completed"
    }).length
  }, [
    submissions,
    analysisBySubmission,
  ])

  const assignmentSubmissionCount =
    useMemo(() => {
      const counts = {}

      submissions.forEach((submission) => {
        counts[submission.assignment_id] =
          (counts[submission.assignment_id] || 0) +
          1
      })

      return counts
    }, [submissions])

  function getAnalysisStatus(submission) {
    const analysis =
      analysisBySubmission[submission.id]

    if (!analysis) {
      return {
        label: "Needs verification",
        tone: "pending",
        icon: Clock3,
      }
    }

    if (analysis.status === "completed") {
      return {
        label: "Verified",
        tone: "verified",
        icon: CheckCircle2,
      }
    }

    if (analysis.status === "failed") {
      return {
        label: "Verification failed",
        tone: "failed",
        icon: AlertCircle,
      }
    }

    return {
      label: "Analysis pending",
      tone: "pending",
      icon: Clock3,
    }
  }

  function getMLLabel(trainedClass) {
    if (!trainedClass) return null

    const labels = {
      exact_copy: "Exact copy",
      paraphrased: "Paraphrased",
      partial_copy: "Partial copy",
      original: "Original",
      unrelated: "Unrelated",
    }

    return (
      labels[trainedClass] ||
      trainedClass.replaceAll("_", " ")
    )
  }

  function getMLTone(trainedClass) {
    if (
      trainedClass === "exact_copy" ||
      trainedClass === "partial_copy" ||
      trainedClass === "paraphrased"
    ) {
      return "warning"
    }

    if (
      trainedClass === "original" ||
      trainedClass === "unrelated"
    ) {
      return "positive"
    }

    return "neutral"
  }

  function getOriginalityLabel(score) {
    if (
      score === null ||
      score === undefined
    ) {
      return null
    }

    if (score >= 80) {
      return "High originality"
    }

    if (score >= 60) {
      return "Moderate originality"
    }

    if (score >= 40) {
      return "Low originality"
    }

    return "Very low originality"
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f9fd] text-[#102542]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="background-bubble bubble-float-1 absolute -left-24 top-24 h-72 w-72 opacity-50" />

        <div className="background-bubble-light bubble-float-2 absolute right-[-100px] top-28 h-96 w-96 opacity-50" />

        <div className="background-bubble-soft bubble-float-3 absolute bottom-[-120px] left-[35%] h-80 w-80 opacity-50" />

        <div className="floating-dot left-[12%] top-[20%]" />
        <div className="floating-dot left-[78%] top-[25%]" />
        <div className="floating-dot left-[65%] top-[72%]" />
        <div className="floating-dot left-[25%] top-[78%]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#dce7f2] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102f53] text-white shadow-lg">
              <BookOpen
                size={23}
                strokeWidth={2}
              />
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight text-[#102542]">
                AuthentiCheck
              </div>

              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d8098]">
                Teacher Portal
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-[#dce7f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#49627c] shadow-sm transition hover:border-[#b8cbe0] hover:bg-[#f8fbff]"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* Welcome */}
        <section className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4a7fa7]">
              <Sparkles size={15} />
              Academic verification workspace
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-[#102542] md:text-5xl">
              Welcome back,{" "}
              <span className="blue-gradient-text">
                {user?.name || "Teacher"}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[#71839a]">
              Create assignments, monitor student
              submissions, and review academic work
              verification results from one place.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="group flex items-center justify-center gap-2 rounded-2xl bg-[#102f53] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(16,47,83,0.22)] transition hover:-translate-y-0.5 hover:bg-[#173d68]"
          >
            <Plus size={19} />
            Create assignment
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <section className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<ClipboardList size={21} />}
            label="Total assignments"
            value={
              loading
                ? "—"
                : assignments.length
            }
          />

          <StatCard
            icon={<FileCheck2 size={21} />}
            label="Student submissions"
            value={
              loading
                ? "—"
                : submissions.length
            }
          />

          <StatCard
            icon={<Clock3 size={21} />}
            label="Pending verification"
            value={
              loading
                ? "—"
                : pendingReviews
            }
          />

          <StatCard
            icon={<ShieldCheck size={21} />}
            label="Verified submissions"
            value={
              loading
                ? "—"
                : analyzedSubmissions
            }
          />
        </section>

        {/* Assignments */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a7fa7]">
                Academic work
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#102542]">
                Your assignments
              </h2>
            </div>

            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#61758d] shadow-sm ring-1 ring-[#e2ebf4] sm:block">
              {assignments.length}{" "}
              {assignments.length === 1
                ? "assignment"
                : "assignments"}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#cbd9e7] bg-white/80 px-8 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4fa] text-[#28547e]">
                <GraduationCap size={30} />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-[#102542]">
                No assignments yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71839a]">
                Create your first assignment to start
                receiving and verifying student
                academic work.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-6 rounded-xl bg-[#102f53] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173d68]"
              >
                Create your first assignment
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {assignments.map((assignment) => {
                const submissionCount =
                  assignmentSubmissionCount[
                    assignment.id
                  ] || 0

                const assignmentSubmissions =
                  submissions.filter(
                    (submission) =>
                      submission.assignment_id ===
                      assignment.id,
                  )

                const verifiedCount =
                  assignmentSubmissions.filter(
                    (submission) =>
                      analysisBySubmission[
                        submission.id
                      ]?.status === "completed",
                  ).length

                return (
                  <article
                    key={assignment.id}
                    className="group rounded-3xl border border-[#dfe8f1] bg-white/90 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(25,55,85,0.11)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4fa] text-[#28547e]">
                        <ClipboardList size={23} />
                      </div>

                      <span className="rounded-full bg-[#eef6f2] px-3 py-1.5 text-xs font-bold text-[#2d6a52]">
                        Active
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-[#102542]">
                      {assignment.title}
                    </h3>

                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#71839a]">
                      {assignment.description ||
                        "No assignment description provided."}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e7eef5] pt-5">
                      <div className="flex items-center gap-2 rounded-xl bg-[#f6f9fc] px-3 py-2 text-xs font-semibold text-[#61758d]">
                        <CalendarDays size={15} />
                        Due{" "}
                        {formatDate(
                          assignment.due_date,
                        )}
                      </div>

                      <div className="flex items-center gap-2 rounded-xl bg-[#f6f9fc] px-3 py-2 text-xs font-semibold text-[#61758d]">
                        <Users size={15} />
                        {submissionCount}{" "}
                        {submissionCount === 1
                          ? "submission"
                          : "submissions"}
                      </div>

                      {submissionCount > 0 && (
                        <div className="flex items-center gap-2 rounded-xl bg-[#edf7f2] px-3 py-2 text-xs font-semibold text-[#2d6a52]">
                          <ShieldCheck size={15} />
                          {verifiedCount} verified
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() =>
                          setSelectedAssignment(
                            assignment,
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#102f53] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#173d68]"
                      >
                        View submissions
                        <ArrowRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/teacher/assignment/${assignment.id}/tracking`,
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#102f53] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#173d68]"
                      >
                        <BarChart3 size={16} />
                        Assignment tracking
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openDeleteAssignment(
                          assignment,
                        )
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                      Delete assignment
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Create assignment modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0d2238]/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,40,65,0.28)]">
            <div className="flex items-start justify-between border-b border-[#e4edf5] px-6 py-5 md:px-8">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#4a7fa7]">
                  New assignment
                </div>

                <h2 className="mt-1 text-2xl font-semibold text-[#102542]">
                  Create assignment
                </h2>

                <p className="mt-1 text-sm text-[#71839a]">
                  Add the details students will see in
                  their dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creatingAssignment}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f7fb] text-[#60758c] transition hover:bg-[#e9f0f6] hover:text-[#102542] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateAssignment}
              className="space-y-6 px-6 py-6 md:px-8 md:py-8"
            >
              {createError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm font-semibold text-green-700">
                  <CheckCircle2 size={18} />
                  {createSuccess}
                </div>
              )}

              <div>
                <label
                  htmlFor="assignment-title"
                  className="mb-2 block text-sm font-semibold text-[#29445f]"
                >
                  Assignment title
                </label>

                <input
                  id="assignment-title"
                  name="title"
                  type="text"
                  value={assignmentForm.title}
                  onChange={handleAssignmentChange}
                  placeholder="e.g. Machine Learning Research Report"
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-[#d7e3ee] bg-white px-4 py-3.5 text-sm text-[#102542] outline-none transition placeholder:text-[#9aabba] focus:border-[#6e9bc0] focus:ring-4 focus:ring-[#e8f1f8]"
                />
              </div>

              <div>
                <label
                  htmlFor="assignment-description"
                  className="mb-2 block text-sm font-semibold text-[#29445f]"
                >
                  Description
                </label>

                <textarea
                  id="assignment-description"
                  name="description"
                  value={
                    assignmentForm.description
                  }
                  onChange={
                    handleAssignmentChange
                  }
                  placeholder="Explain what students need to submit..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#d7e3ee] bg-white px-4 py-3.5 text-sm leading-6 text-[#102542] outline-none transition placeholder:text-[#9aabba] focus:border-[#6e9bc0] focus:ring-4 focus:ring-[#e8f1f8]"
                />
              </div>

              <div>
                <label
                  htmlFor="assignment-due-date"
                  className="mb-2 block text-sm font-semibold text-[#29445f]"
                >
                  Due date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6f88a1]"
                  />

                  <input
                    id="assignment-due-date"
                    name="due_date"
                    type="date"
                    value={
                      assignmentForm.due_date
                    }
                    onChange={
                      handleAssignmentChange
                    }
                    className="w-full rounded-xl border border-[#d7e3ee] bg-white py-3.5 pl-11 pr-4 text-sm text-[#102542] outline-none transition focus:border-[#6e9bc0] focus:ring-4 focus:ring-[#e8f1f8]"
                  />
                </div>

                <p className="mt-2 text-xs text-[#8496aa]">
                  The deadline will be stored as 11:59 PM
                  on the selected date.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#e7eef5] pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creatingAssignment}
                  className="rounded-xl border border-[#d7e3ee] bg-white px-5 py-3 text-sm font-semibold text-[#526b84] transition hover:bg-[#f7fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#102f53] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(16,47,83,0.18)] transition hover:bg-[#173d68] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {creatingAssignment ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent delete confirmation modal */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0d2238]/55 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,40,65,0.3)]">
            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <Trash2 size={25} />
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-[#102542]">
                Delete assignment permanently?
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#637890]">
                You are about to permanently delete
                <span className="font-bold text-[#102542]">
                  {` ${deletingAssignment.title}`}
                </span>
                . This cannot be undone.
              </p>

              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                <p className="text-sm font-semibold leading-6 text-red-800">
                  This will permanently remove the
                  assignment, all student submissions,
                  verification results, sentence matches,
                  and uploaded files associated with it.
                </p>
              </div>

              {deleteError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteAssignment}
                  disabled={Boolean(
                    deletingAssignment.isDeleting,
                  )}
                  className="rounded-xl border border-[#d7e3ee] bg-white px-5 py-3 text-sm font-semibold text-[#526b84] transition hover:bg-[#f7fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAssignment}
                  disabled={Boolean(
                    deletingAssignment.isDeleting,
                  )}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(185,28,28,0.18)] transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingAssignment.isDeleting ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Deleting permanently...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2238]/40 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,40,65,0.25)]">
            <div className="flex items-start justify-between border-b border-[#e4edf5] px-6 py-5 md:px-8">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#4a7fa7]">
                  Student submissions
                </div>

                <h2 className="mt-1 text-2xl font-semibold text-[#102542]">
                  {selectedAssignment.title}
                </h2>

                <p className="mt-1 text-sm text-[#71839a]">
                  {
                    submissions.filter(
                      (submission) =>
                        submission.assignment_id ===
                        selectedAssignment.id,
                    ).length
                  }{" "}
                  submission(s)
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedAssignment(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f7fb] text-[#60758c] transition hover:bg-[#e9f0f6] hover:text-[#102542]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6 md:p-8">
              {submissions.filter(
                (submission) =>
                  submission.assignment_id ===
                  selectedAssignment.id,
              ).length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4fa] text-[#28547e]">
                    <FileCheck2 size={29} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-[#102542]">
                    No submissions yet
                  </h3>

                  <p className="mt-2 text-sm text-[#71839a]">
                    Students have not submitted work for
                    this assignment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter(
                      (submission) =>
                        submission.assignment_id ===
                        selectedAssignment.id,
                    )
                    .map((submission) => {
                      const analysis =
                        analysisBySubmission[
                          submission.id
                        ]

                      const analysisStatus =
                        getAnalysisStatus(
                          submission,
                        )

                      const StatusIcon =
                        analysisStatus.icon

                      const mlLabel =
                        getMLLabel(
                          analysis?.trained_class,
                        )

                      const mlTone =
                        getMLTone(
                          analysis?.trained_class,
                        )

                      const originality =
                        analysis?.originality_score

                      return (
                        <div
                          key={submission.id}
                          className="rounded-2xl border border-[#dfe8f1] bg-[#fbfdff] p-5 transition hover:border-[#bfd1e2] hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
                                <FileText size={22} />
                              </div>

                              <div>
                                <h3 className="font-semibold text-[#102542]">
                                  {
                                    submission.student_name
                                  }
                                </h3>

                                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#71839a]">
                                  <Mail size={13} />
                                  {
                                    submission.student_email
                                  }
                                </div>

                                <div className="mt-2 text-sm font-semibold text-[#28547e]">
                                  {
                                    submission.original_filename
                                  }
                                </div>

                                <div className="mt-1 text-xs text-[#7a8ca1]">
                                  Submitted{" "}
                                  {formatDateTime(
                                    submission.submitted_at,
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={[
                                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                                  analysisStatus.tone ===
                                  "verified"
                                    ? "bg-[#eef6f2] text-[#2d6a52]"
                                    : analysisStatus.tone ===
                                        "failed"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-[#fff7e8] text-[#9a6a1f]",
                                ].join(" ")}
                              >
                                <StatusIcon size={13} />
                                {
                                  analysisStatus.label
                                }
                              </span>
                            </div>
                          </div>

                          {analysis?.status ===
                            "completed" && (
                            <div className="mt-5 grid gap-3 border-t border-[#e6eef5] pt-4 sm:grid-cols-2">
                              <div className="rounded-xl border border-[#e1eaf2] bg-white px-4 py-3">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a8ca1]">
                                  <BarChart3
                                    size={14}
                                  />
                                  Originality
                                </div>

                                <div className="mt-1 flex items-end justify-between gap-3">
                                  <span className="text-lg font-bold text-[#102542]">
                                    {originality !==
                                      null &&
                                    originality !==
                                      undefined
                                      ? `${Number(
                                          originality,
                                        ).toFixed(1)}%`
                                      : "—"}
                                  </span>

                                  <span className="text-xs font-semibold text-[#6d8098]">
                                    {getOriginalityLabel(
                                      originality,
                                    ) ||
                                      "Not available"}
                                  </span>
                                </div>
                              </div>

                              <div className="rounded-xl border border-[#e1eaf2] bg-white px-4 py-3">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a8ca1]">
                                  <ShieldCheck
                                    size={14}
                                  />
                                  Supervised ML
                                </div>

                                <div className="mt-1 flex items-end justify-between gap-3">
                                  {mlLabel ? (
                                    <>
                                      <span
                                        className={[
                                          "text-sm font-bold capitalize",
                                          mlTone ===
                                          "warning"
                                            ? "text-[#9a6a1f]"
                                            : mlTone ===
                                                "positive"
                                              ? "text-[#2d6a52]"
                                              : "text-[#28547e]",
                                        ].join(
                                          " ",
                                        )}
                                      >
                                        {mlLabel}
                                      </span>

                                      <span className="text-xs font-semibold text-[#6d8098]">
                                        {analysis.trained_confidence !==
                                          null &&
                                        analysis.trained_confidence !==
                                          undefined
                                          ? `${(
                                              Number(
                                                analysis.trained_confidence,
                                              ) *
                                              100
                                            ).toFixed(
                                              1,
                                            )}%`
                                          : "—"}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm font-semibold text-[#7a8ca1]">
                                      Not available
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-5 border-t border-[#e6eef5] pt-4">
                            <button
                              onClick={() =>
                                navigate(
                                  `/teacher/report/${submission.id}`,
                                )
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#102f53] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#173d68]"
                            >
                              {analysis?.status ===
                              "completed"
                                ? "Open verification report"
                                : "Open verification workspace"}
                              <ArrowRight
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#dfe8f1] bg-white/90 p-5 shadow-[0_10px_30px_rgba(25,55,85,0.06)] backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
          {icon}
        </div>

        <div>
          <div className="text-xs font-semibold text-[#7a8ca1]">
            {label}
          </div>

          <div className="mt-1 text-2xl font-bold text-[#102542]">
            {value}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-[#dfe8f1] bg-white p-6">
      <div className="h-12 w-12 rounded-2xl bg-[#e9f0f6]" />
      <div className="mt-6 h-6 w-2/3 rounded bg-[#e9f0f6]" />
      <div className="mt-3 h-4 w-full rounded bg-[#eef3f7]" />
      <div className="mt-2 h-4 w-4/5 rounded bg-[#eef3f7]" />
      <div className="mt-7 h-10 w-full rounded-xl bg-[#eef3f7]" />
    </div>
  )
}

export default TeacherDashboard