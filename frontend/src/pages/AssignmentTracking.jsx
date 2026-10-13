import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

function AssignmentTracking() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()

  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("authentichek_token")
    const storedUser = localStorage.getItem("authentichek_user")

    if (!token || !storedUser) {
      navigate("/auth")
      return
    }

    try {
      const user = JSON.parse(storedUser)

      if (user.role !== "teacher") {
        navigate("/student")
        return
      }
    } catch {
      navigate("/auth")
      return
    }

    const fetchTracking = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `http://127.0.0.1:8000/api/assignments/${assignmentId}/roster`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load assignment tracking."
          )
        }

        setTracking(data)
      } catch (err) {
        setError(err.message || "Unable to load assignment tracking.")
      } finally {
        setLoading(false)
      }
    }

    fetchTracking()
  }, [assignmentId, navigate])

  const formatDate = (dateString) => {
    if (!dateString) return "—"

    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-4 h-4 w-96 animate-pulse rounded bg-slate-100" />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            </div>

            <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/teacher")}
            className="mb-6 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to dashboard
          </button>

          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-red-700">
              Unable to load assignment tracking
            </h1>

            <p className="mt-3 text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tracking) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate("/teacher")}
          className="mb-6 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Back to dashboard
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#102f53]">
              Assignment tracking
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {tracking.assignment_title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Monitor which students have submitted their academic work.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Assigned students
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {tracking.total_students}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">
                Submitted
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {tracking.submitted_count}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">
                Not submitted
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-700">
                {tracking.not_submitted_count}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Student submission status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Every student is shown below with their submission status for
                this assignment.
              </p>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <div className="grid grid-cols-[1.2fr_2fr_140px] border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div>Student</div>
                <div>Submissions</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-slate-200">
                {tracking.students.map((student) => (
                  <div
                    key={student.student_id}
                    className="grid grid-cols-[1.2fr_2fr_140px] gap-4 px-5 py-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {student.student_name}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {student.student_email}
                      </p>
                    </div>

                    <div className="min-w-0">
                      {student.submissions.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No submission
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {student.submissions.map((submission) => (
                            <div
                              key={submission.submission_id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <p className="break-words text-sm font-semibold text-slate-800">
                                {submission.original_filename}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Submitted {formatDate(submission.submitted_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start">
                      {student.status === "submitted" ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                          Not submitted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {tracking.students.map((student) => (
                <div
                  key={student.student_id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {student.student_name}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {student.student_email}
                      </p>
                    </div>

                    {student.status === "submitted" ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Submitted
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                        Not submitted
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Submissions
                    </p>

                    {student.submissions.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-400">
                        No submission
                      </p>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {student.submissions.map((submission) => (
                          <div
                            key={submission.submission_id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="break-words text-sm font-semibold text-slate-800">
                              {submission.original_filename}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Submitted {formatDate(submission.submitted_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {tracking.students.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  No students found.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  There are currently no student accounts available for this
                  assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentTracking