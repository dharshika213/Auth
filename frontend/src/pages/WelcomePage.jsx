import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6FAFD]">

      {/* =====================================================
          ANIMATED BACKGROUND
          ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="background-bubble bubble-float-1 left-[-120px] top-[15%] h-80 w-80" />

        <div className="background-bubble-light bubble-float-2 right-[-90px] top-[8%] h-80 w-80" />

        <div className="background-bubble-soft bubble-float-3 bottom-[5%] left-[8%] h-64 w-64" />

        <BookOpen className="floating-book book-float-1 left-[10%] top-[25%] h-16 w-16" />

        <BookOpen className="floating-book book-float-2 right-[12%] top-[30%] h-12 w-12" />

        <BookOpen className="floating-book book-float-3 right-[20%] bottom-[16%] h-10 w-10" />

        <FileText className="floating-book book-float-4 left-[18%] bottom-[17%] h-12 w-12" />

        <span className="floating-dot left-[25%] top-[20%]" />
        <span className="floating-dot right-[28%] top-[24%]" />
        <span className="floating-dot left-[12%] bottom-[28%]" />
        <span className="floating-dot right-[12%] bottom-[24%]" />

      </div>

      {/* TOP BAR */}

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs font-medium text-[#1A3D63]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FA]">
            <ShieldCheck className="h-4 w-4 text-[#1A3D63]" />
          </div>

          <div className="text-left">

            <div className="text-sm font-bold text-[#0A1931]">
              AuthentiCheck
            </div>

            <div className="text-[6px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
              Academic Intelligence
            </div>

          </div>

        </div>
      </div>

      {/* MAIN */}

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 pb-12">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-2xl text-center"
        >

          {/* SHIELD */}

          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
            className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF3FA] shadow-sm"
          >
            <div className="absolute inset-[-10px] rounded-full border border-[#B3C8E0]/30" />

            <ShieldCheck className="h-10 w-10 text-[#1A3D63]" />
          </motion.div>

          {/* BADGE */}

          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-[#B3C8E0]/60 bg-[#EAF3FA] px-3.5 py-1.5 text-[9px] font-semibold text-[#1A3D63]">
            <Sparkles className="h-3 w-3 text-[#4A7FA7]" />
            Intelligent Academic Verification
          </div>

          {/* TITLE */}

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-[#0A1931] sm:text-5xl">
            Welcome to
            <br />

            <span className="blue-gradient-text">
              AuthentiCheck
            </span>
          </h1>

          {/* DESCRIPTION */}

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#1A3D63]/75">
            Academic work, verified intelligently. Analyze submissions,
            discover meaningful similarities, and review evidence through
            AI-assisted document analysis.
          </p>

          {/* BUTTON */}

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/roles")}
            className="group mx-auto mt-8 flex items-center gap-2 rounded-full bg-[#1A3D63] px-8 py-3.5 text-xs font-semibold text-white shadow-lg shadow-[#1A3D63]/15"
          >
            Continue

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </motion.button>

          {/* NOTE */}

          <p className="mx-auto mt-7 max-w-md text-[9px] leading-5 text-[#4A7FA7]">
            Automated analysis provides review signals and supporting
            evidence. Final academic decisions remain with educators.
          </p>

        </motion.div>

      </main>
    </div>
  )
}

export default WelcomePage