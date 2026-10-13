import { motion } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

function RoleSelectionPage() {
  const navigate = useNavigate()

  const roles = [
    {
      title: "Teacher",
      subtitle: "Educator workspace",
      description:
        "Create assignments, review submissions, and investigate similarity evidence.",
      icon: GraduationCap,
      role: "teacher",
    },
    {
      title: "Student",
      subtitle: "Student workspace",
      description:
        "Submit academic work and understand your originality analysis.",
      icon: UserRound,
      role: "student",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6FAFD]">

      {/* =====================================================
          BACKGROUND ANIMATION
          ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* BLUR BUBBLES */}

        <div className="background-bubble bubble-float-1 left-[-120px] top-[8%] h-80 w-80" />

        <div className="background-bubble-light bubble-float-2 right-[-100px] top-[5%] h-96 w-96" />

        <div className="background-bubble-soft bubble-float-3 bottom-[3%] left-[5%] h-72 w-72" />

        <div className="background-bubble-light bubble-float-4 bottom-[-100px] right-[5%] h-80 w-80" />

        {/* BOOKS */}

        <BookOpen className="floating-book book-float-1 left-[6%] top-[25%] h-16 w-16" />

        <BookOpen className="floating-book book-float-2 left-[18%] bottom-[12%] h-12 w-12" />

        <BookOpen className="floating-book book-float-3 right-[7%] top-[32%] h-14 w-14" />

        <BookOpen className="floating-book book-float-4 right-[19%] bottom-[14%] h-10 w-10" />

        {/* DOTS */}

        <span className="floating-dot left-[17%] top-[17%]" />
        <span className="floating-dot left-[30%] top-[25%]" />
        <span className="floating-dot right-[26%] top-[20%]" />
        <span className="floating-dot right-[12%] top-[47%]" />
        <span className="floating-dot left-[10%] bottom-[27%]" />

      </div>

      {/* HEADER */}

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FA]">
            <ShieldCheck className="h-5 w-5 text-[#1A3D63]" />
          </div>

          <div className="text-left">

            <div className="text-sm font-bold text-[#0A1931]">
              AuthentiCheck
            </div>

            <div className="text-[6px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
              Academic Intelligence
            </div>

          </div>

        </button>

        <div className="text-[9px] font-semibold text-[#4A7FA7]">
          Step 1 of 2
        </div>

      </header>

      {/* CONTENT */}

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-20">

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >

          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#B3C8E0]/60 bg-[#EAF3FA] px-3.5 py-1.5 text-[9px] font-semibold text-[#1A3D63]">
            <Sparkles className="h-3 w-3 text-[#4A7FA7]" />
            Choose Your Workspace
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-[#0A1931] sm:text-5xl">
            How will you use
            <br />

            <span className="blue-gradient-text">
              AuthentiCheck?
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-xs leading-6 text-[#1A3D63]/70">
            Select your role to access the workspace designed for your
            academic workflow.
          </p>

        </motion.div>

        {/* ROLE CARDS */}

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">

          {roles.map((role, index) => {
            const Icon = role.icon

            return (
              <motion.button
                key={role.title}
                type="button"
                onClick={() =>
                  navigate(
                    `/auth?role=${role.role}`
                  )
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2 + index * 0.12,
                }}
                whileHover={{ y: -7 }}
                whileTap={{ scale: 0.985 }}
                className="group relative overflow-hidden rounded-2xl border border-[#B3C8E0]/55 bg-white p-6 text-left shadow-sm transition hover:shadow-xl hover:shadow-[#1A3D63]/10 sm:p-7"
              >

                {/* BUBBLE INSIDE CARD */}

                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#EAF3FA] blur-2xl transition duration-700 group-hover:scale-125" />

                <div className="absolute -bottom-14 -left-14 h-32 w-32 rounded-full bg-[#B3C8E0]/20 blur-2xl transition duration-700 group-hover:scale-125" />

                <div className="relative">

                  {/* ICON */}

                  <motion.div
                    whileHover={{
                      rotate: 3,
                      scale: 1.05,
                    }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA]"
                  >
                    <Icon className="h-7 w-7 text-[#1A3D63]" />
                  </motion.div>

                  {/* TEXT */}

                  <div className="mt-7">

                    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
                      {role.subtitle}
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-[#0A1931]">
                      {role.title}
                    </h2>

                    <p className="mt-3 max-w-sm text-xs leading-6 text-[#1A3D63]/70">
                      {role.description}
                    </p>

                  </div>

                  {/* FOOTER */}

                  <div className="mt-7 flex items-center justify-between">

                    <span className="text-xs font-semibold text-[#1A3D63]">
                      Enter workspace
                    </span>

                    <motion.span
                      whileHover={{ x: 4 }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A1931] text-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>

                  </div>

                </div>
              </motion.button>
            )
          })}

        </div>

        {/* BOTTOM NOTE */}

        <div className="mt-9 flex items-center justify-center gap-2 text-[9px] text-[#4A7FA7]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your workspace and academic data remain role-specific.
        </div>

      </main>
    </div>
  )
}

export default RoleSelectionPage