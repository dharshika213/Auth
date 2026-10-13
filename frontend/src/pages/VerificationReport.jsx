import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  FileText,
  Brain,
  SearchCheck,
  Users,
  RefreshCw,
  AlertCircle,
  Clock3,
  UserRound,
  ShieldCheck,
  Activity,
  BarChart3,
  Info,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react"

const API_BASE_URL = "http://127.0.0.1:8000"

function VerificationReport() {
  const navigate = useNavigate()
  const { submissionId } = useParams()

  const [user, setUser] = useState(null)
  const [report, setReport] = useState(null)
  const [submissionContext, setSubmissionContext] = useState(null)

  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [runMessage, setRunMessage] = useState("")
  const [view, setView] = useState("summary")

  useEffect(() => {
    const storedUser = localStorage.getItem(
      "authentichek_user"
    )

    const token = localStorage.getItem(
      "authentichek_token"
    )

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

      loadReport(token)
    } catch {
      localStorage.removeItem(
        "authentichek_user"
      )

      localStorage.removeItem(
        "authentichek_token"
      )

      navigate("/auth?role=teacher")
    }
  }, [navigate, submissionId])

  async function loadReport(token) {
    setLoading(true)
    setError("")

    try {
      const reportUrl =
        API_BASE_URL +
        "/api/analysis/submission/" +
        submissionId

      const reportResponse = await fetch(
        reportUrl,
        {
          headers: {
            Authorization:
              "Bearer " + token,
          },
        }
      )

      if (reportResponse.status === 404) {
        setReport(null)
        await loadSubmissionContext(token)
        return
      }

      if (!reportResponse.ok) {
        const data =
          await reportResponse
            .json()
            .catch(() => null)

        throw new Error(
          data?.detail ||
            "Could not load the verification report."
        )
      }

      const data =
        await reportResponse.json()

      setReport({
        ...data,
        matches: normalizeMatches(data),
      })

      await loadSubmissionContext(token)
    } catch (err) {
      setError(
        err.message ||
          "Could not load the verification report."
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadSubmissionContext(token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/submissions/teacher`,
        {
          headers: {
            Authorization:
              "Bearer " + token,
          },
        }
      )

      if (!response.ok) {
        return
      }

      const submissions =
        await response.json()

      const currentSubmission =
        Array.isArray(submissions)
          ? submissions.find(
              (submission) =>
                String(submission.id) ===
                String(submissionId)
            )
          : null

      setSubmissionContext(
        currentSubmission || null
      )
    } catch {
      setSubmissionContext(null)
    }
  }

  async function runVerification() {
    const token = localStorage.getItem(
      "authentichek_token"
    )

    if (!token) {
      navigate("/auth?role=teacher")
      return
    }

    setRunning(true)
    setError("")
    setRunMessage("")

    try {
      const url =
        API_BASE_URL +
        "/api/analysis/" +
        submissionId

      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer " + token,
          },
        }
      )

      const data =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Verification could not be completed."
        )
      }

      setRunMessage(
        "Verification completed successfully."
      )

      setReport({
        ...data,
        matches: normalizeMatches(data),
      })

      await loadSubmissionContext(token)

      setView("summary")
    } catch (err) {
      setError(
        err.message ||
          "Verification could not be completed."
      )
    } finally {
      setRunning(false)
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) {
      return "Not available"
    }

    const rawValue =
      String(dateString).trim()

    if (!rawValue) {
      return "Not available"
    }

    const hasTimezone =
      /(Z|[+-]\d{2}:\d{2})$/i.test(
        rawValue
      )

    const normalizedDate =
      hasTimezone
        ? rawValue
        : `${rawValue}Z`

    const date =
      new Date(normalizedDate)

    if (Number.isNaN(date.getTime())) {
      return "Not available"
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }
    ).format(date)
  }

  function formatPercent(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—"
    }

    return (
      Number(value).toFixed(1) +
      "%"
    )
  }

  function similarityTone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "bg-[#f4f7fa] text-[#71839a]"
    }

    if (value >= 80) {
      return "bg-[#fff0f0] text-[#a84444]"
    }

    if (value >= 60) {
      return "bg-[#fff7e8] text-[#9a6a1f]"
    }

    return "bg-[#eef6f2] text-[#2d6a52]"
  }

  function handleBack() {
    navigate("/teacher")
  }

  const matches = useMemo(
    () => normalizeMatches(report),
    [report]
  )

  const contextStudentName =
    submissionContext?.student_name ||
    submissionContext?.student?.name ||
    submissionContext?.name ||
    null

  const contextAssignmentTitle =
    submissionContext?.assignment_title ||
    submissionContext?.assignment?.title ||
    null

  const contextFilename =
    submissionContext?.original_filename ||
    submissionContext?.filename ||
    null

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f9fd] text-[#102542]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="background-bubble bubble-float-1 absolute -left-24 top-24 h-72 w-72 opacity-45" />

        <div className="background-bubble-light bubble-float-2 absolute right-[-100px] top-28 h-96 w-96 opacity-45" />

        <div className="background-bubble-soft bubble-float-3 absolute bottom-[-120px] left-[35%] h-80 w-80 opacity-45" />

        <div className="floating-dot left-[12%] top-[20%]" />
        <div className="floating-dot left-[78%] top-[25%]" />
        <div className="floating-dot left-[65%] top-[72%]" />
        <div className="floating-dot left-[25%] top-[78%]" />
      </div>

      <header className="relative z-10 border-b border-[#dce7f2] bg-white/85 backdrop-blur-xl">
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
                Verification Report
              </div>
            </div>
          </div>

          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl border border-[#d8e4ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#49627c] shadow-sm transition hover:border-[#b8cbe0] hover:bg-[#f8fbff]"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <section className="mb-9">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4a7fa7]">
            <SearchCheck size={15} />
            Academic verification
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#102542] md:text-5xl">
                Verification report
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-[#71839a]">
                A clear verification summary first,
                followed by detailed similarity evidence
                and machine-learning analysis.
              </p>
            </div>

            {report && (
              <div className="flex rounded-xl border border-[#dce7f1] bg-white p-1 shadow-sm">
                <button
                  onClick={() =>
                    setView("summary")
                  }
                  className={
                    "rounded-lg px-4 py-2 text-sm font-semibold transition " +
                    (view === "summary"
                      ? "bg-[#102f53] text-white shadow-sm"
                      : "text-[#49627c] hover:bg-[#f4f8fc]")
                  }
                >
                  Summary
                </button>

                <button
                  onClick={() =>
                    setView("details")
                  }
                  className={
                    "rounded-lg px-4 py-2 text-sm font-semibold transition " +
                    (view === "details"
                      ? "bg-[#102f53] text-white shadow-sm"
                      : "text-[#49627c] hover:bg-[#f4f8fc]")
                  }
                >
                  Detailed verification
                </button>
              </div>
            )}
          </div>

          {user && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#71839a]">
              <UserRound size={15} />

              Teacher:

              <span className="font-semibold text-[#38546f]">
                {user.name}
              </span>
            </div>
          )}
        </section>

        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={18}
            />

            <div>{error}</div>
          </div>
        )}

        {runMessage && (
          <div className="mb-7 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            <CheckCircle2 size={18} />
            {runMessage}
          </div>
        )}

        {loading ? (
          <LoadingReport />
        ) : !report ? (
          <NotRunCard
            running={running}
            onRun={runVerification}
          />
        ) : view === "summary" ? (
          <SummaryView
            report={report}
            matches={matches}
            studentName={
              contextStudentName
            }
            assignmentTitle={
              contextAssignmentTitle
            }
            filename={
              contextFilename
            }
            onViewDetails={() =>
              setView("details")
            }
            onRunAgain={
              runVerification
            }
            running={running}
            formatDateTime={
              formatDateTime
            }
          />
        ) : (
          <DetailedView
            report={report}
            matches={matches}
            running={running}
            runVerification={
              runVerification
            }
            formatDateTime={
              formatDateTime
            }
            formatPercent={
              formatPercent
            }
            similarityTone={
              similarityTone
            }
            onBackToSummary={() =>
              setView("summary")
            }
          />
        )}
      </main>
    </div>
  )
}

function SummaryView({
  report,
  matches,
  studentName,
  assignmentTitle,
  filename,
  onViewDetails,
  onRunAgain,
  running,
  formatDateTime,
}) {
  const classification =
    getFinalClassification(
      report,
      matches
    )

  const exactPercentage =
    toPercentage(
      report.exact_match_score
    )

  const semanticPercentage =
    toPercentage(
      report.semantic_similarity_score
    )

  const originality =
    safePercentage(
      report.originality_score
    )

  const aiScore =
    safePercentage(
      report.ai_writing_score
    )

  const referenceStudent =
    report.strongest_reference_student_name ||
    report.trained_reference_student_name ||
    null

  const referenceSubmissionId =
    report.strongest_reference_submission_id ||
    report.trained_reference_submission_id ||
    null

  const referenceFilename =
    report.strongest_reference_filename ||
    report.trained_reference_filename ||
    null

  const strongMatchCount =
    matches.filter((match) => {
      const exact =
        Number(
          match.exact_similarity || 0
        ) * 100

      const semantic =
        Number(
          match.semantic_similarity || 0
        ) * 100

      return (
        exact >= 85 ||
        semantic >= 85
      )
    }).length

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d8e5ef] bg-white shadow-[0_22px_65px_rgba(25,55,85,0.10)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#e9f3fb] blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#eef7f3] blur-3xl" />
        </div>

        <div className="relative grid gap-8 p-7 md:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:p-11">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#edf4fa] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.13em] text-[#28547e]">
                <ShieldCheck size={15} />
                Final verification result
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f8fb] px-3.5 py-2 text-xs font-semibold text-[#71839a]">
                <CheckCircle2 size={14} />
                {report.status}
              </span>
            </div>

            <div className="mt-7">
              <div className="text-sm font-semibold text-[#71839a]">
                Academic work reviewed
              </div>

              <h2 className="mt-2 break-words text-3xl font-bold tracking-tight text-[#102542] md:text-4xl">
                {filename ||
                  submissionFilename(
                    report
                  ) ||
                  "Academic submission"}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#71839a]">
                <span className="flex items-center gap-2">
                  <UserRound size={15} />
                  {studentName ||
                    "Student information unavailable"}
                </span>

                <span className="flex items-center gap-2">
                  <BookOpen size={15} />
                  {assignmentTitle ||
                    "Assignment information unavailable"}
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div
                className={
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl " +
                  classification.iconBackground +
                  " " +
                  classification.iconText
                }
              >
                {classification.icon}
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#8092a6]">
                  Classification
                </div>

                <div className="mt-1 text-3xl font-bold tracking-tight text-[#102542]">
                  {classification.label}
                </div>

                <div
                  className={
                    "mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-bold " +
                    classification.badgeClass
                  }
                >
                  {classification.shortLabel}
                </div>
              </div>
            </div>

            <p className="mt-7 max-w-2xl text-sm leading-7 text-[#5e738b]">
              {classification.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onViewDetails}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#102f53] px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(16,47,83,0.20)] transition hover:-translate-y-0.5 hover:bg-[#173d68]"
              >
                View detailed verification

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <button
                onClick={onRunAgain}
                disabled={running}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4e1ec] bg-white px-6 py-3.5 text-sm font-bold text-[#49627c] transition hover:border-[#b7cadc] hover:bg-[#f8fbfe] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    running
                      ? "animate-spin"
                      : ""
                  }
                />

                {running
                  ? "Running..."
                  : "Run again"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-[2rem] bg-[#e9f3fb] blur-2xl" />

              <div className="relative rounded-[2rem] border border-[#d9e6f0] bg-white/90 p-6 shadow-[0_18px_50px_rgba(25,55,85,0.09)] backdrop-blur md:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#49627c]">
                    <Award
                      size={18}
                      className="text-[#4a7fa7]"
                    />
                    Verification certificate
                  </div>

                  <Sparkles
                    size={18}
                    className="text-[#4a7fa7]"
                  />
                </div>

                <div className="mt-7 flex justify-center">
                  <div
                    className="flex h-36 w-36 items-center justify-center rounded-full"
                    style={{
                      background:
                        originality === null
                          ? "conic-gradient(#dce7f2 0deg 360deg)"
                          : `conic-gradient(#4a7fa7 0deg ${
                              originality * 3.6
                            }deg, #e8eef4 ${
                              originality * 3.6
                            }deg 360deg)`,
                    }}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                      <div className="text-3xl font-bold text-[#102542]">
                        {originality === null
                          ? "—"
                          : originality.toFixed(
                              1
                            ) + "%"}
                      </div>

                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8092a6]">
                        Originality
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  <SummaryMetric
                    label="Exact similarity"
                    value={
                      exactPercentage === null
                        ? "—"
                        : exactPercentage.toFixed(
                            1
                          ) + "%"
                    }
                    tone={
                      exactPercentage
                    }
                  />

                  <SummaryMetric
                    label="Semantic similarity"
                    value={
                      semanticPercentage ===
                      null
                        ? "—"
                        : semanticPercentage.toFixed(
                            1
                          ) + "%"
                    }
                    tone={
                      semanticPercentage
                    }
                  />

                  <SummaryMetric
                    label="AI-writing indicator"
                    value={
                      aiScore === null
                        ? "Not available"
                        : aiScore.toFixed(
                            1
                          ) + "%"
                    }
                    tone={null}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
              <Info size={21} />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
                Verification summary
              </div>

              <h2 className="mt-2 text-xl font-semibold text-[#102542]">
                {classification.label}
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#71839a]">
                {classification.explanation}
              </p>

              {referenceStudent && (
                <div className="mt-6 rounded-2xl border border-[#dfe8f1] bg-[#fbfdff] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
                    Reference student
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
                      <UserRound size={18} />
                    </div>

                    <div>
                      <div className="text-base font-bold text-[#102542]">
                        {referenceStudent}
                      </div>

                      {referenceSubmissionId && (
                        <div className="mt-1 text-xs font-semibold text-[#71839a]">
                          Submission #{referenceSubmissionId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] md:p-7">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
              Similarity detected
            </div>

            <div className="mt-1 text-sm text-[#71839a]">
              Based on the verification evidence
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background:
                  exactPercentage === null
                    ? "conic-gradient(#dce7f2 0deg 360deg)"
                    : `conic-gradient(#a84444 0deg ${
                        exactPercentage * 3.6
                      }deg, #f0dddd ${
                        exactPercentage * 3.6
                      }deg 360deg)`,
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <div className="text-3xl font-bold text-[#102542]">
                  {exactPercentage === null
                    ? "—"
                    : exactPercentage.toFixed(1) + "%"}
                </div>

                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8092a6]">
                  Similarity
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#e1eaf2] bg-[#fbfdff] px-4 py-3">
              <div className="text-xs font-semibold text-[#71839a]">
                Originality
              </div>

              <div className="mt-1 text-xl font-bold text-[#102542]">
                {originality === null
                  ? "—"
                  : originality.toFixed(1) + "%"}
              </div>
            </div>

            <div className="rounded-xl border border-[#f0d5d5] bg-[#fffafa] px-4 py-3">
              <div className="text-xs font-semibold text-[#71839a]">
                Similarity
              </div>

              <div className="mt-1 text-xl font-bold text-[#a84444]">
                {exactPercentage === null
                  ? "—"
                  : exactPercentage.toFixed(1) + "%"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#dfe8f1] bg-[#102f53] p-6 text-white shadow-[0_18px_55px_rgba(16,47,83,0.18)] md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a9c5dc]">
              <SearchCheck size={15} />
              Detailed evidence available
            </div>

            <h2 className="mt-2 text-2xl font-semibold">
              Review the complete verification trail
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c4d5e4]">
              Inspect exact and semantic signals, supervised
              ML output, strongest references, and the
              individual submitted/reference sentence pairs.
            </p>
          </div>


        </div>
      </section>

      {report.analyzed_at && (
        <div className="flex items-center justify-center gap-2 text-xs text-[#8495a8]">
          <Clock3 size={13} />
          Analyzed{" "}
          {formatDateTime(
            report.analyzed_at
          )}
        </div>
      )}
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  tone,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e1eaf2] bg-[#fbfdff] px-4 py-3">
      <span className="text-xs font-semibold text-[#71839a]">
        {label}
      </span>

      <span
        className={
          "text-sm font-bold " +
          (tone === null ||
          tone === undefined
            ? "text-[#49627c]"
            : tone >= 80
              ? "text-[#a84444]"
              : tone >= 60
                ? "text-[#9a6a1f]"
                : "text-[#2d6a52]")
        }
      >
        {value}
      </span>
    </div>
  )
}

function SummaryStatCard({
  icon,
  label,
  value,
  description,
  tone,
}) {
  const toneStyles = {
    blue: {
      icon: "bg-[#edf4fa] text-[#28547e]",
      value: "text-[#102542]",
    },
    red: {
      icon: "bg-[#fff0f0] text-[#a84444]",
      value: "text-[#a84444]",
    },
    amber: {
      icon: "bg-[#fff7e8] text-[#9a6a1f]",
      value: "text-[#9a6a1f]",
    },
    green: {
      icon: "bg-[#eef6f2] text-[#2d6a52]",
      value: "text-[#2d6a52]",
    },
  }

  const styles =
    toneStyles[tone] ||
    toneStyles.blue

  return (
    <div className="rounded-3xl border border-[#dfe8f1] bg-white/95 p-5 shadow-[0_12px_35px_rgba(25,55,85,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(25,55,85,0.09)]">
      <div
        className={
          "flex h-10 w-10 items-center justify-center rounded-xl " +
          styles.icon
        }
      >
        {icon}
      </div>

      <div className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
        {label}
      </div>

      <div
        className={
          "mt-2 text-3xl font-bold tracking-tight " +
          styles.value
        }
      >
        {value}
      </div>

      <div className="mt-2 text-xs leading-5 text-[#8192a6]">
        {description}
      </div>
    </div>
  )
}

function getFinalClassification(
  report,
  matches
) {
  const evidenceClass =
    report.evidence_classification

  const normalizedEvidence =
    normalizeClassification(
      evidenceClass
    )

  if (
    normalizedEvidence &&
    normalizedEvidence !== "unknown"
  ) {
    return buildClassificationConfig(
      normalizedEvidence
    )
  }

  const trainedClass =
    normalizeClassification(
      report.trained_class
    )

  if (
    trainedClass &&
    trainedClass !== "unknown"
  ) {
    return buildClassificationConfig(
      trainedClass
    )
  }

  const exact =
    toPercentage(
      report.exact_match_score
    )

  const semantic =
    toPercentage(
      report.semantic_similarity_score
    )

  const strongest =
    matches.length
      ? Math.max(
          ...matches.map(
            (match) =>
              Math.max(
                Number(
                  match.exact_similarity ||
                    0
                ) * 100,
                Number(
                  match.semantic_similarity ||
                    0
                ) * 100
              )
          )
        )
      : 0

  const strongestSignal =
    Math.max(
      exact || 0,
      semantic || 0,
      strongest
    )

  if (strongestSignal >= 85) {
    if (
      exact !== null &&
      exact >= 85
    ) {
      return buildClassificationConfig(
        "exact_copy"
      )
    }

    return buildClassificationConfig(
      "paraphrased"
    )
  }

  if (strongestSignal >= 40) {
    return buildClassificationConfig(
      "partial_copy"
    )
  }

  return buildClassificationConfig(
    "original"
  )
}

function buildClassificationConfig(
  classification
) {
  const configs = {
    exact_copy: {
      label: "Exact Copy",
      shortLabel:
        "Strong direct overlap detected",
      description:
        "The available evidence shows very high direct textual similarity with reference work. The detailed report contains the sentence-level evidence that produced this classification.",
      explanation:
        "This result is based on strong direct textual overlap identified by the verification engine. Review the matching sentences and surrounding academic context before making any academic decision.",
      icon: (
        <FileText size={27} />
      ),
      iconBackground:
        "bg-[#fff0f0]",
      iconText:
        "text-[#a84444]",
      badgeClass:
        "bg-[#fff0f0] text-[#a84444]",
      ringBackground:
        "bg-[conic-gradient(#a84444_0deg,#a84444_320deg,#f4dddd_320deg,#f4dddd_360deg)]",
    },

    paraphrased: {
      label: "Paraphrased",
      shortLabel:
        "Strong meaning-level overlap",
      description:
        "The available evidence shows strong semantic similarity while direct word overlap is lower. The detailed report identifies the submitted and reference sentences for review.",
      explanation:
        "This result indicates that the submitted work has strong meaning-level similarity with reference material despite wording differences. Sentence-level evidence should be reviewed in context.",
      icon: (
        <Brain size={27} />
      ),
      iconBackground:
        "bg-[#fff7e8]",
      iconText:
        "text-[#9a6a1f]",
      badgeClass:
        "bg-[#fff7e8] text-[#9a6a1f]",
      ringBackground:
        "bg-[conic-gradient(#c8913d_0deg,#c8913d_275deg,#f5e8cf_275deg,#f5e8cf_360deg)]",
    },

    partial_copy: {
      label: "Partial Copy",
      shortLabel:
        "Partial overlap detected",
      description:
        "The verification engine found meaningful overlap, but the available evidence does not indicate that the entire submission follows the reference work.",
      explanation:
        "Some portions of the submission show similarity to available reference work. The detailed evidence view provides the individual sentence pairs that should be reviewed.",
      icon: (
        <FileCheck2 size={27} />
      ),
      iconBackground:
        "bg-[#fff7e8]",
      iconText:
        "text-[#9a6a1f]",
      badgeClass:
        "bg-[#fff7e8] text-[#9a6a1f]",
      ringBackground:
        "bg-[conic-gradient(#c8913d_0deg,#c8913d_200deg,#f5e8cf_200deg,#f5e8cf_360deg)]",
    },

    original: {
      label: "Original",
      shortLabel:
        "No strong overlap detected",
      description:
        "The available comparison evidence does not show a strong matching relationship with the eligible reference submissions.",
      explanation:
        "The available evidence indicates relatively low similarity. This does not replace academic review, but the verification engine did not identify strong matching evidence.",
      icon: (
        <CheckCircle2 size={27} />
      ),
      iconBackground:
        "bg-[#eef6f2]",
      iconText:
        "text-[#2d6a52]",
      badgeClass:
        "bg-[#eef6f2] text-[#2d6a52]",
      ringBackground:
        "bg-[conic-gradient(#4a9674_0deg,#4a9674_330deg,#dceee5_330deg,#dceee5_360deg)]",
    },

    unrelated: {
      label: "Unrelated",
      shortLabel:
        "No matching relationship detected",
      description:
        "The supervised model found the available comparison more consistent with an unrelated relationship.",
      explanation:
        "The supervised model did not find a meaningful relationship with the available reference material.",
      icon: (
        <SearchCheck size={27} />
      ),
      iconBackground:
        "bg-[#edf4fa]",
      iconText:
        "text-[#28547e]",
      badgeClass:
        "bg-[#edf4fa] text-[#28547e]",
      ringBackground:
        "bg-[conic-gradient(#4a7fa7_0deg,#4a7fa7_330deg,#dce9f4_330deg,#dce9f4_360deg)]",
    },
  }

  return (
    configs[classification] ||
    configs.original
  )
}

function normalizeClassification(
  value
) {
  if (!value) {
    return null
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")

  const aliases = {
    "exact_copy":
      "exact_copy",

    "exact_overlap":
      "exact_copy",

    "exact":
      "exact_copy",

    "paraphrased":
      "paraphrased",

    "paraphrase":
      "paraphrased",

    "partial_copy":
      "partial_copy",

    "partial":
      "partial_copy",

    "original":
      "original",

    "unrelated":
      "unrelated",
  }

  return aliases[normalized] ||
    "unknown"
}

function toPercentage(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const numeric =
    Number(value)

  if (
    Number.isNaN(numeric)
  ) {
    return null
  }

  return Math.max(
    0,
    Math.min(
      100,
      numeric * 100
    )
  )
}

function safePercentage(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const numeric =
    Number(value)

  if (
    Number.isNaN(numeric)
  ) {
    return null
  }

  return Math.max(
    0,
    Math.min(
      100,
      numeric
    )
  )
}

function submissionFilename(
  report
) {
  if (
    report?.submission_filename
  ) {
    return report.submission_filename
  }

  if (
    report?.original_filename
  ) {
    return report.original_filename
  }

  return null
}

function DetailedView({
  report,
  matches,
  running,
  runVerification,
  formatDateTime,
  formatPercent,
  similarityTone,
  onBackToSummary,
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[#dfe8f1] bg-white/95 p-5 shadow-[0_12px_35px_rgba(25,55,85,0.06)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
            <SearchCheck size={21} />
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
              Detailed verification
            </div>

            <div className="mt-1 text-lg font-semibold text-[#102542]">
              Evidence and model analysis
            </div>
          </div>
        </div>

        <button
          onClick={onBackToSummary}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d5e2ed] bg-white px-4 py-2.5 text-sm font-bold text-[#49627c] transition hover:border-[#b9ccde] hover:bg-[#f8fbfe]"
        >
          <ArrowLeft size={16} />
          Back to summary
        </button>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        <OriginalityCard
          value={report.originality_score}
        />

        <VisualScoreCard
          icon={<FileText size={22} />}
          label="Exact similarity"
          value={
            report.exact_match_score
          }
          description="Text-level similarity"
        />

        <VisualScoreCard
          icon={<Brain size={22} />}
          label="Semantic similarity"
          value={
            report.semantic_similarity_score
          }
          description="Meaning-level similarity"
        />
      </section>

      <HowToReadReport />

      <section className="mt-6 rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
              <Brain size={22} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[#102542]">
                  AI-assisted writing indicator
                </h2>

                <span className="rounded-full bg-[#edf4fa] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#28547e]">
                  Review signal
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71839a]">
                This score reflects writing characteristics
                detected by the analysis engine. It should be
                used as a review signal and should not be
                treated as proof that AI was used.
              </p>
            </div>
          </div>

          <AIWritingScore
            value={
              report.ai_writing_score
            }
          />
        </div>
      </section>

      <SupervisedMLSection
        trainedClass={
          report.trained_class
        }
        trainedConfidence={
          report.trained_confidence
        }
        trainedReferenceSubmissionId={
          report.trained_reference_submission_id
        }
        trainedReferenceStudentName={
          report.trained_reference_student_name
        }
        trainedReferenceFilename={
          report.trained_reference_filename
        }
      />

      <section className="mt-6 rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef8f2] text-[#2d805e]">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#102542]">
                Verification completed
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#71839a]">
                {report.summary ||
                  "The submission has been compared against eligible submissions."}
              </p>

              {report.analyzed_at && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8495a8]">
                  <Clock3 size={13} />

                  Analyzed{" "}
                  {formatDateTime(
                    report.analyzed_at
                  )}
                </div>
              )}
            </div>
          </div>

          <span className="self-start rounded-full bg-[#eef6f2] px-3.5 py-2 text-xs font-bold capitalize text-[#2d6a52] md:self-center">
            {report.status}
          </span>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <ComparisonCard
          icon={<FileText size={20} />}
          title="Exact text comparison"
          value={
            report.exact_match_score
          }
        />

        <ComparisonCard
          icon={<Brain size={20} />}
          title="Semantic comparison"
          value={
            report.semantic_similarity_score
          }
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-3xl border border-[#dfe8f1] bg-white/95 shadow-[0_15px_45px_rgba(25,55,85,0.07)]">
        <div className="border-b border-[#e4edf5] px-6 py-6 md:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
              <Users size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[#102542]">
                  Sentence-level evidence
                </h2>

                <span className="rounded-full bg-[#edf4fa] px-3 py-1.5 text-xs font-bold text-[#28547e]">
                  {matches.length}{" "}
                  {matches.length === 1
                    ? "match"
                    : "matches"}
                </span>
              </div>

              <p className="mt-1 text-sm leading-6 text-[#71839a]">
                Potentially matching sentences identified by
                the verification engine.
              </p>
            </div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="px-6 py-14 text-center md:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2d805e]">
              <CheckCircle2 size={27} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#102542]">
              No sentence-level matches found
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#71839a]">
              The verification engine did not identify
              sentence matches above the configured
              thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-6 md:p-8">
            {matches.map(
              (match, index) => (
                <MatchCard
                  key={
                    match.id ||
                    index
                  }
                  match={match}
                  index={index}
                  formatPercent={
                    formatPercent
                  }
                  similarityTone={
                    similarityTone
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      <div className="mt-7 flex justify-end">
        <button
          onClick={runVerification}
          disabled={running}
          className="flex items-center gap-2 rounded-xl bg-[#102f53] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(16,47,83,0.18)] transition hover:-translate-y-0.5 hover:bg-[#173d68] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              running
                ? "animate-spin"
                : ""
            }
          />

          {running
            ? "Running verification..."
            : "Run verification again"}
        </button>
      </div>
    </>
  )
}

function HowToReadReport() {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#dce7f1] bg-white/95 shadow-[0_15px_45px_rgba(25,55,85,0.06)] backdrop-blur">
      <div className="border-b border-[#e4edf5] bg-[#f8fbfe] px-6 py-5 md:px-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
            <Info size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#102542]">
              How to read this report
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#71839a]">
              The verification engine provides multiple signals.
              No single score should be interpreted as standalone
              proof of academic misconduct or AI use.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3 md:p-7">
        <EvidenceGuide
          tone="red"
          title="Exact overlap"
          description="Very high direct textual similarity. Review the submitted and reference sentences side by side."
        />

        <EvidenceGuide
          tone="amber"
          title="Possible paraphrased overlap"
          description="Strong meaning-level similarity with lower direct word overlap. The wording may have been substantially rephrased."
        />

        <EvidenceGuide
          tone="green"
          title="No significant overlap"
          description="Lower similarity signals mean the available comparison evidence does not show a strong matching relationship."
        />
      </div>

      <div className="border-t border-[#e4edf5] bg-[#fbfdff] px-6 py-4 md:px-7">
        <p className="text-xs leading-5 text-[#71839a]">
          <span className="font-bold text-[#49627c]">
            Review principle:
          </span>{" "}
          AuthentiCheck identifies similarity patterns for
          academic review. The teacher should consider the full
          submitted work, assignment context, reference evidence,
          and the model signals together.
        </p>
      </div>
    </section>
  )
}

function EvidenceGuide({
  tone,
  title,
  description,
}) {
  const styles = {
    red: {
      wrapper:
        "border-[#f0d5d5] bg-[#fffafa]",
      icon:
        "bg-[#fff0f0] text-[#a84444]",
      title:
        "text-[#8f3d3d]",
    },

    amber: {
      wrapper:
        "border-[#f0dfbf] bg-[#fffdf8]",
      icon:
        "bg-[#fff7e8] text-[#9a6a1f]",
      title:
        "text-[#89601c]",
    },

    green: {
      wrapper:
        "border-[#d4e8dc] bg-[#fbfefc]",
      icon:
        "bg-[#eef6f2] text-[#2d6a52]",
      title:
        "text-[#2d6a52]",
    },
  }

  const style =
    styles[tone] ||
    styles.green

  return (
    <div
      className={
        "rounded-2xl border p-5 " +
        style.wrapper
      }
    >
      <div
        className={
          "flex h-10 w-10 items-center justify-center rounded-xl " +
          style.icon
        }
      >
        {tone === "red" ? (
          <FileText size={19} />
        ) : tone === "amber" ? (
          <Brain size={19} />
        ) : (
          <CheckCircle2 size={19} />
        )}
      </div>

      <h3
        className={
          "mt-4 text-sm font-bold " +
          style.title
        }
      >
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#71839a]">
        {description}
      </p>
    </div>
  )
}

function OriginalityCard({
  value,
}) {
  const numericValue =
    value === null ||
    value === undefined
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Number(value)
          )
        )

  const rotation =
    numericValue === null
      ? 0
      : numericValue * 3.6

  const originalityLabel =
    getOriginalityLabel(
      numericValue
    )

  const originalityTone =
    getOriginalityTone(
      numericValue
    )

  return (
    <div className="rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] backdrop-blur md:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
          <FileCheck2 size={22} />
        </div>

        <div className="text-sm font-semibold text-[#71839a]">
          Originality
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <div
          className="relative flex h-40 w-40 items-center justify-center rounded-full"
          style={{
            background:
              numericValue === null
                ? "conic-gradient(#dce7f2 0deg 360deg)"
                : "conic-gradient(#4a7fa7 " +
                  rotation +
                  "deg, #e8eef4 " +
                  rotation +
                  "deg 360deg)",
          }}
        >
          <div className="flex h-[122px] w-[122px] flex-col items-center justify-center rounded-full bg-white">
            <div className="text-3xl font-bold tracking-tight text-[#102542]">
              {numericValue === null
                ? "—"
                : numericValue.toFixed(
                    1
                  ) + "%"}
            </div>

            <div
              className={
                "mt-1 text-[10px] font-bold uppercase tracking-[0.16em] " +
                originalityTone
              }
            >
              {originalityLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 text-center text-sm text-[#8192a6]">
        {numericValue === null
          ? "Originality could not be determined"
          : "Originality score based on similarity evidence"}
      </div>
    </div>
  )
}

function getOriginalityLabel(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not available"
  }

  if (value >= 80) {
    return "High originality"
  }

  if (value >= 60) {
    return "Moderate originality"
  }

  if (value >= 40) {
    return "Low originality"
  }

  return "Very low originality"
}

function getOriginalityTone(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "text-[#8192a6]"
  }

  if (value >= 80) {
    return "text-[#2d6a52]"
  }

  if (value >= 60) {
    return "text-[#49627c]"
  }

  if (value >= 40) {
    return "text-[#9a6a1f]"
  }

  return "text-[#a84444]"
}

function VisualScoreCard({
  icon,
  label,
  value,
  description,
}) {
  const similarityPercentage =
    value === null ||
    value === undefined
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Number(value) * 100
          )
        )

  return (
    <div className="rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_15px_45px_rgba(25,55,85,0.07)] backdrop-blur md:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
          {icon}
        </div>

        <div className="text-sm font-semibold text-[#71839a]">
          {label}
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between gap-4">
        <div className="text-4xl font-bold tracking-tight text-[#102542]">
          {similarityPercentage === null
            ? "—"
            : similarityPercentage.toFixed(
                1
              ) + "%"}
        </div>

        {similarityPercentage !== null && (
          <div
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold " +
              comparisonTone(
                similarityPercentage
              )
            }
          >
            {comparisonLabel(
              similarityPercentage
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#8192a6]">
          <span>0%</span>
          <span>100%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#e8eef4]">
          <div
            className="h-full rounded-full bg-[#4a7fa7] transition-all duration-700"
            style={{
              width:
                (similarityPercentage ??
                  0) + "%",
            }}
          />
        </div>
      </div>

      <div className="mt-3 text-sm text-[#8192a6]">
        {description}
      </div>
    </div>
  )
}

function AIWritingScore({
  value,
}) {
  const numericValue =
    value === null ||
    value === undefined
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Number(value)
          )
        )

  if (numericValue === null) {
    return (
      <div className="min-w-[220px] rounded-2xl border border-[#e0e9f2] bg-[#f8fbfe] px-5 py-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
          Score
        </div>

        <div className="mt-2 text-2xl font-bold text-[#71839a]">
          Not available
        </div>
      </div>
    )
  }

  const label =
    numericValue >= 80
      ? "Higher indicator"
      : numericValue >= 60
        ? "Moderate indicator"
        : "Lower indicator"

  return (
    <div className="min-w-[240px] rounded-2xl border border-[#dce7f1] bg-[#f8fbfe] px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8092a6]">
          AI-writing score
        </div>

        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#49627c] shadow-sm">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div className="text-4xl font-bold tracking-tight text-[#102542]">
          {numericValue.toFixed(
            1
          )}
          %
        </div>

        <Brain
          size={25}
          className="mb-1 text-[#4a7fa7]"
        />
      </div>

      <div className="mt-4">
        <div className="h-2.5 overflow-hidden rounded-full bg-[#e4edf5]">
          <div
            className="h-full rounded-full bg-[#4a7fa7] transition-all duration-700"
            style={{
              width:
                numericValue + "%",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function SupervisedMLSection({
  trainedClass,
  trainedConfidence,
  trainedReferenceSubmissionId,
  trainedReferenceStudentName,
  trainedReferenceFilename,
}) {
  const confidence =
    trainedConfidence === null ||
    trainedConfidence === undefined
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Number(
              trainedConfidence
            ) * 100
          )
        )

  const classConfig =
    getMLClassConfig(
      trainedClass
    )

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#d9e5ef] bg-white/95 shadow-[0_15px_45px_rgba(25,55,85,0.07)] backdrop-blur">
      <div className="border-b border-[#e4edf5] bg-gradient-to-r from-[#f8fbfe] to-[#f3f8fc] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3fa] text-[#28547e] shadow-sm">
              <ShieldCheck size={24} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[#102542]">
                  Supervised ML verification
                </h2>

                <span className="rounded-full bg-[#eaf3fa] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#28547e]">
                  Trained model
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71839a]">
                A supervised classification model analyzes
                similarity features between this submission and
                eligible reference submissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#dce7f1] bg-white px-3 py-2 text-xs font-semibold text-[#49627c] shadow-sm">
            <Activity size={15} />
            ML verification active
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {trainedClass ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[#dfe8f1] bg-[#fbfdff] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-xl " +
                    classConfig.iconBackground +
                    " " +
                    classConfig.iconText
                  }
                >
                  {classConfig.icon}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8092a6]">
                    Classification
                  </div>

                  <div className="mt-1 text-2xl font-bold text-[#102542]">
                    {classConfig.label}
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#71839a]">
                {classConfig.description}
              </p>

              <div className="mt-5 rounded-xl border border-[#e0e9f2] bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8092a6]">
                  <BarChart3 size={15} />
                  Model interpretation
                </div>

                <p className="mt-2 text-sm leading-6 text-[#49627c]">
                  The classifier combines semantic and lexical
                  similarity features to estimate the relationship
                  between the submitted work and reference work.
                </p>
              </div>

              {trainedReferenceSubmissionId && (
                <div className="mt-5 rounded-xl border border-[#d9e5ef] bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8092a6]">
                    <FileText size={15} />
                    Strongest ML reference
                  </div>

                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
                      <UserRound size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-base font-bold text-[#102542]">
                        {trainedReferenceStudentName ||
                          "Reference student unavailable"}
                      </div>

                      <div className="mt-1 text-sm text-[#49627c]">
                        Submission #
                        {
                          trainedReferenceSubmissionId
                        }
                      </div>

                      {trainedReferenceFilename && (
                        <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#71839a]">
                          <FileText
                            size={14}
                            className="mt-0.5 shrink-0"
                          />

                          <span className="break-all">
                            {trainedReferenceFilename}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-[#71839a]">
                    This is the reference submission that produced
                    the strongest trained-model signal for this
                    report.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#dfe8f1] bg-[#fbfdff] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8092a6]">
                    Confidence
                  </div>

                  <div className="mt-2 text-4xl font-bold tracking-tight text-[#102542]">
                    {confidence === null
                      ? "—"
                      : confidence.toFixed(
                          1
                        ) + "%"}
                  </div>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef6f2] text-[#2d805e]">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#8192a6]">
                  <span>0%</span>
                  <span>100%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#e5edf4]">
                  <div
                    className="h-full rounded-full bg-[#4a7fa7] transition-all duration-700"
                    style={{
                      width:
                        (confidence ??
                          0) + "%",
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#f2f7fb] p-4">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#8092a6]">
                  Model output
                </div>

                <div className="mt-2 font-mono text-sm font-semibold text-[#38546f]">
                  {trainedClass}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd9e5] bg-[#f8fbfe] px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf4fa] text-[#28547e]">
              <ShieldCheck size={23} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#102542]">
              Supervised ML result unavailable
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#71839a]">
              Run verification again to generate a supervised
              machine learning classification for this submission.
            </p>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-[#e1eaf2] bg-[#f8fbfe] px-4 py-3">
          <p className="text-xs leading-5 text-[#71839a]">
            <span className="font-bold text-[#49627c]">
              Important:
            </span>{" "}
            This is an automated model signal intended to support
            academic review. It should be considered alongside
            the similarity scores and sentence-level evidence
            rather than treated as standalone proof of copying.
          </p>
        </div>
      </div>
    </section>
  )
}

function getMLClassConfig(
  predictedClass
) {
  const configs = {
    exact_copy: {
      label: "Exact copy",
      description:
        "The trained classifier detected a pattern consistent with direct textual overlap between the submitted work and a reference submission.",
      icon: (
        <FileText size={21} />
      ),
      iconBackground:
        "bg-[#fff0f0]",
      iconText:
        "text-[#a84444]",
    },

    paraphrased: {
      label: "Paraphrased",
      description:
        "The trained classifier detected strong semantic similarity with reduced direct word-for-word overlap, which is consistent with paraphrased content.",
      icon: (
        <Brain size={21} />
      ),
      iconBackground:
        "bg-[#fff7e8]",
      iconText:
        "text-[#9a6a1f]",
    },

    partial_copy: {
      label: "Partial copy",
      description:
        "The trained classifier detected evidence consistent with partial overlap between the submitted work and a reference submission.",
      icon: (
        <FileCheck2 size={21} />
      ),
      iconBackground:
        "bg-[#fff7e8]",
      iconText:
        "text-[#9a6a1f]",
    },

    original: {
      label: "Original",
      description:
        "The trained classifier found the submission more consistent with the original class than the available reference categories.",
      icon: (
        <CheckCircle2 size={21} />
      ),
      iconBackground:
        "bg-[#eef6f2]",
      iconText:
        "text-[#2d805e]",
    },

    unrelated: {
      label: "Unrelated",
      description:
        "The trained classifier found the submission and reference text to be more consistent with an unrelated relationship.",
      icon: (
        <SearchCheck size={21} />
      ),
      iconBackground:
        "bg-[#edf4fa]",
      iconText:
        "text-[#28547e]",
    },
  }

  return (
    configs[predictedClass] || {
      label:
        predictedClass ||
        "Unknown",
      description:
        "The supervised model returned a classification for this comparison.",
      icon: (
        <ShieldCheck size={21} />
      ),
      iconBackground:
        "bg-[#edf4fa]",
      iconText:
        "text-[#28547e]",
    }
  )
}

function ComparisonCard({
  icon,
  title,
  value,
}) {
  const similarityPercentage =
    value === null ||
    value === undefined
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Number(value) * 100
          )
        )

  return (
    <div className="rounded-3xl border border-[#dfe8f1] bg-white/95 p-6 shadow-[0_12px_35px_rgba(25,55,85,0.06)]">
      <div className="flex items-center gap-3 text-[#28547e]">
        {icon}

        <h3 className="font-semibold text-[#49627c]">
          {title}
        </h3>
      </div>

      <div className="mt-5 text-3xl font-bold text-[#102542]">
        {similarityPercentage === null
          ? "—"
          : similarityPercentage.toFixed(
              1
            ) + "%"}
      </div>

      <div
        className={
          "mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-bold " +
          comparisonTone(
            similarityPercentage
          )
        }
      >
        {comparisonLabel(
          similarityPercentage
        )}
      </div>
    </div>
  )
}

function getEvidenceClassification(
  exactPercentage,
  semanticPercentage
) {
  if (exactPercentage >= 85) {
    return {
      label: "Exact overlap",
      sourceLabel:
        "Reference submission",
      description:
        "This sentence shows very high direct textual overlap with the reference sentence. Review the surrounding context before drawing conclusions.",
      badgeClass:
        "bg-[#fff0f0] text-[#a84444]",
    }
  }

  if (
    semanticPercentage >= 75 &&
    exactPercentage < 85
  ) {
    return {
      label:
        "Possible paraphrased overlap",
      sourceLabel:
        "Reference submission",
      description:
        "The sentences show strong meaning-level similarity with lower direct word overlap. This may indicate substantially reworded or paraphrased content.",
      badgeClass:
        "bg-[#fff7e8] text-[#9a6a1f]",
    }
  }

  if (semanticPercentage >= 60) {
    return {
      label:
        "Potentially related",
      sourceLabel:
        "Reference submission",
      description:
        "The verification engine found meaningful semantic similarity between the submitted and reference sentences.",
      badgeClass:
        "bg-[#edf4fa] text-[#28547e]",
    }
  }

  return {
    label: "Weak similarity",
    sourceLabel:
      "Reference submission",
    description:
      "The sentences share some similarity, but the evidence is weaker than the configured higher-similarity categories.",
    badgeClass:
      "bg-[#f4f7fa] text-[#71839a]",
  }
}

function MatchCard({
  match,
  index,
  formatPercent,
  similarityTone,
}) {
  const exactPercentage =
    Number(
      match.exact_similarity || 0
    ) * 100

  const semanticPercentage =
    Number(
      match.semantic_similarity || 0
    ) * 100

  const strongestScore =
    Math.max(
      exactPercentage,
      semanticPercentage
    )

  const evidence =
    getEvidenceClassification(
      exactPercentage,
      semanticPercentage
    )

  return (
    <article className="rounded-2xl border border-[#dfe8f1] bg-[#fbfdff] p-5 transition hover:border-[#bfd1e2] hover:shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#4a7fa7]">
          Match {index + 1}
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold " +
              similarityTone(
                exactPercentage
              )
            }
          >
            Exact{" "}
            {formatPercent(
              exactPercentage
            )}
          </span>

          <span
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold " +
              similarityTone(
                semanticPercentage
              )
            }
          >
            Semantic{" "}
            {formatPercent(
              semanticPercentage
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#dce8f2] bg-[#f8fbff] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3fa] text-[#28547e]">
            <UserRound size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] " +
                  evidence.badgeClass
                }
              >
                {evidence.label}
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8092a6]">
                {evidence.sourceLabel}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-base font-bold text-[#102542]">
                {match.reference_student_name ||
                  "Reference student unavailable"}
              </div>

              {match.reference_submission_id && (
                <div className="mt-1 text-sm font-semibold text-[#49627c]">
                  Submission #
                  {
                    match.reference_submission_id
                  }
                </div>
              )}

              {match.reference_filename && (
                <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#71839a]">
                  <FileText
                    size={14}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="break-all">
                    {
                      match.reference_filename
                    }
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs leading-5 text-[#71839a]">
              {evidence.description}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SentencePanel
          label="Submitted sentence"
          text={
            match.submitted_sentence
          }
        />

        <SentencePanel
          label="Reference sentence"
          text={
            match.reference_sentence
          }
        />
      </div>

      <div className="mt-4 text-xs text-[#8495a8]">
        Combined strongest similarity:{" "}
        <span className="font-bold text-[#49627c]">
          {formatPercent(
            strongestScore
          )}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#8495a8]">
        <span>
          Submitted sentence #
          {match.submitted_sentence_index +
            1}
        </span>

        <span>
          Reference sentence #
          {match.reference_sentence_index +
            1}
        </span>
      </div>
    </article>
  )
}

function SentencePanel({
  label,
  text,
}) {
  return (
    <div className="rounded-xl border border-[#dce7f1] bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8092a6]">
        {label}
      </div>

      <p className="mt-3 text-sm leading-7 text-[#38546f]">
        {text}
      </p>
    </div>
  )
}

function NotRunCard({
  running,
  onRun,
}) {
  return (
    <section className="rounded-3xl border border-[#dfe8f1] bg-white/95 px-6 py-14 text-center shadow-[0_18px_55px_rgba(25,55,85,0.08)] md:px-10 md:py-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4fa] text-[#28547e]">
        <SearchCheck size={30} />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-[#102542]">
        Verification has not been run
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#71839a]">
        Start the verification engine to compare this
        submission against eligible submissions from other
        students.
      </p>

      <button
        onClick={onRun}
        disabled={running}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#102f53] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(16,47,83,0.2)] transition hover:-translate-y-0.5 hover:bg-[#173d68] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SearchCheck size={18} />

        {running
          ? "Running verification..."
          : "Run verification"}
      </button>
    </section>
  )
}

function LoadingReport() {
  return (
    <div className="animate-pulse">
      <div className="rounded-[2rem] bg-white p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="h-8 w-48 rounded bg-[#e9f0f6]" />

            <div className="mt-7 h-10 w-80 rounded bg-[#e9f0f6]" />

            <div className="mt-4 h-5 w-64 rounded bg-[#eef3f7]" />

            <div className="mt-8 h-16 w-72 rounded bg-[#eef3f7]" />

            <div className="mt-7 h-16 w-96 rounded bg-[#eef3f7]" />
          </div>

          <div className="flex justify-center">
            <div className="h-80 w-full max-w-sm rounded-[2rem] bg-[#eef3f7]" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonScore />
        <SkeletonScore />
        <SkeletonScore />
        <SkeletonScore />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-3xl bg-white" />
        <div className="h-64 rounded-3xl bg-white" />
      </div>
    </div>
  )
}

function SkeletonScore() {
  return (
    <div className="rounded-3xl border border-[#dfe8f1] bg-white p-7">
      <div className="h-10 w-10 rounded-xl bg-[#e9f0f6]" />

      <div className="mt-5 h-3 w-28 rounded bg-[#eef3f7]" />

      <div className="mt-3 h-9 w-24 rounded bg-[#e9f0f6]" />

      <div className="mt-3 h-4 w-36 rounded bg-[#eef3f7]" />
    </div>
  )
}

function comparisonLabel(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not available"
  }

  if (value >= 80) {
    return "High similarity"
  }

  if (value >= 60) {
    return "Moderate similarity"
  }

  if (value >= 40) {
    return "Low similarity"
  }

  return "Minimal similarity"
}

function comparisonTone(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "bg-[#f4f7fa] text-[#71839a]"
  }

  if (value >= 80) {
    return "bg-[#fff0f0] text-[#a84444]"
  }

  if (value >= 60) {
    return "bg-[#fff7e8] text-[#9a6a1f]"
  }

  return "bg-[#eef6f2] text-[#2d6a52]"
}

function normalizeMatches(data) {
  if (!data) {
    return []
  }

  if (Array.isArray(data)) {
    return data.filter(Boolean)
  }

  if (Array.isArray(data.matches)) {
    return data.matches.filter(Boolean)
  }

  if (
    Array.isArray(
      data.match_details
    )
  ) {
    return data.match_details.filter(
      Boolean
    )
  }

  if (
    Array.isArray(
      data.analysis_matches
    )
  ) {
    return data.analysis_matches.filter(
      Boolean
    )
  }

  return []
}

export default VerificationReport