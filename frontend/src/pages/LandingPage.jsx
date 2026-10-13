
import { motion } from "framer-motion"
import {
  BookOpen,
  CheckCircle2,
  FileSearch,
  Fingerprint,
  Search,
  ShieldCheck,
  Upload,
  Brain,
  Info,
} from "lucide-react"
import Navbar from "../components/Navbar"

function LandingPage() {
  const features = [
    {
      icon: FileSearch,
      title: "Document Verification",
      description:
        "Analyze academic submissions across multiple document formats.",
    },
    {
      icon: Fingerprint,
      title: "Similarity Detection",
      description:
        "Identify exact and modified copying using intelligent text comparison.",
    },
    {
      icon: Brain,
      title: "Semantic Analysis",
      description:
        "Detect paraphrased content beyond simple keyword matching.",
    },
    {
      icon: ShieldCheck,
      title: "Evidence-Based Reports",
      description:
        "Give teachers clear evidence behind potential similarities.",
    },
  ]

  const scrollToSection = (sectionId) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div
      id="home"
      className="relative min-h-screen overflow-hidden bg-[#F6FAFD]"
    >
      <Navbar />

      {/* ANIMATED BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="background-bubble bubble-float-1 left-[-90px] top-[90px] h-72 w-72" />
        <div className="background-bubble-light bubble-float-2 right-[7%] top-[80px] h-80 w-80" />
        <div className="background-bubble-soft bubble-float-3 bottom-[25%] left-[3%] h-64 w-64" />
        <div className="background-bubble-light bubble-float-4 bottom-[-100px] right-[5%] h-96 w-96" />

        <span className="floating-dot left-[13%] top-[28%]" />
        <span className="floating-dot left-[30%] top-[18%]" />
        <span className="floating-dot right-[27%] top-[22%]" />
        <span className="floating-dot right-[12%] top-[42%]" />
        <span className="floating-dot left-[7%] bottom-[28%]" />

        <BookOpen className="floating-book book-float-1 left-[4%] top-[23%] h-16 w-16" />
        <BookOpen className="floating-book book-float-2 left-[16%] bottom-[13%] h-12 w-12" />
        <BookOpen className="floating-book book-float-3 right-[7%] top-[30%] h-14 w-14" />
        <BookOpen className="floating-book book-float-4 right-[19%] bottom-[12%] h-10 w-10" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
        {/* HERO */}
        <section className="grid min-h-[620px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#B3C8E0]/60 bg-[#EAF3FA] px-3.5 py-1.5 text-[10px] font-semibold text-[#1A3D63]"
            >
              <span className="text-[#1A3D63]">✦</span>
              AI-Powered Academic Verification
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-[#0A1931] sm:text-5xl lg:text-[55px]"
            >
              Verify academic
              <br />
              work with
              <br />
              <span className="blue-gradient-text">
                intelligent analysis.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-5 max-w-lg text-sm leading-6 text-[#1A3D63]/75 sm:text-[15px]"
            >
              AuthentiCheck helps educators analyze academic submissions,
              identify exact and paraphrased similarities, and understand the
              evidence behind potential copying.
            </motion.p>

            {/* HERO ACTIONS */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollToSection("features")}
                className="group flex items-center gap-2 rounded-full border border-[#4A7FA7]/50 bg-white px-5 py-3 text-xs font-semibold text-[#1A3D63] transition-colors hover:bg-[#EAF3FA]"
              >
                Explore Features
                <BookOpen className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollToSection("about")}
                className="group flex items-center gap-2 rounded-full bg-[#1A3D63] px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-[#1A3D63]/15 transition-colors hover:bg-[#244D78]"
              >
                <Info className="h-3.5 w-3.5" />
                About AuthentiCheck
              </motion.button>
            </motion.div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
              {[
                "Exact similarity",
                "Semantic matching",
                "Evidence reports",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 text-[10px] text-[#1A3D63]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#4A7FA7]" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT VISUAL */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative min-h-[480px]"
          >
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                x: [0, 15, 0],
                y: [0, -10, 0],
              }}
              transition={{ duration: 9, repeat: Infinity }}
              className="absolute right-[5%] top-[4%] h-80 w-80 rounded-full bg-[#B3C8E0]/25 blur-3xl"
            />

            {/* DOCUMENT 1 */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-2, 0, -2] }}
              transition={{ duration: 7, repeat: Infinity }}
              className="absolute left-[8%] top-[12%] h-48 w-36 rounded-2xl border border-[#B3C8E0]/50 bg-white p-4 shadow-xl shadow-[#1A3D63]/5"
            >
              <div className="h-3 w-20 rounded bg-[#B3C8E0]/45" />
              <div className="mt-5 space-y-2">
                <div className="h-1.5 w-full rounded bg-[#E5EFF7]" />
                <div className="h-1.5 w-[80%] rounded bg-[#E5EFF7]" />
                <div className="h-1.5 w-[90%] rounded bg-[#E5EFF7]" />
                <div className="h-1.5 w-[70%] rounded bg-[#E5EFF7]" />
              </div>
              <div className="mt-8 inline-flex rounded-lg bg-[#EAF3FA] px-2 py-1 text-[8px] font-bold text-[#1A3D63]">
                PDF
              </div>
            </motion.div>

            {/* DOCUMENT 2 */}
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [2, 0, 2] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute bottom-[12%] left-[7%] h-44 w-32 rounded-2xl border border-[#B3C8E0]/50 bg-white p-4 shadow-xl shadow-[#1A3D63]/5"
            >
              <div className="h-3 w-16 rounded bg-[#B3C8E0]/45" />
              <div className="mt-5 space-y-2">
                <div className="h-1.5 w-full rounded bg-[#E5EFF7]" />
                <div className="h-1.5 w-[85%] rounded bg-[#E5EFF7]" />
                <div className="h-1.5 w-[65%] rounded bg-[#E5EFF7]" />
              </div>
              <div className="mt-7 inline-flex rounded-lg bg-[#EAF3FA] px-2 py-1 text-[8px] font-bold text-[#1A3D63]">
                PDF
              </div>
            </motion.div>

            {/* MAIN ANALYSIS CARD */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 7, repeat: Infinity }}
              className="reference-card absolute right-[5%] top-[8%] w-[78%] max-w-[390px] rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between border-b border-[#B3C8E0]/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FA]">
                    <ShieldCheck className="h-4 w-4 text-[#1A3D63]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#0A1931]">
                      Similarity Analysis
                    </div>
                    <div className="text-[8px] text-[#4A7FA7]">
                      AI verification engine
                    </div>
                  </div>
                </div>
                <div className="text-[#B3C8E0]">×</div>
              </div>

              <div className="mt-4 grid grid-cols-[115px_1fr] gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-[#F6FAFD] py-4">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-[#E4EFF7]">
                    <div className="absolute inset-[-8px] rotate-[-35deg] rounded-full border-[8px] border-transparent border-l-[#1A3D63] border-t-[#4A7FA7]" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#0A1931]">
                        87<span className="text-xs">%</span>
                      </div>
                      <div className="text-[7px] text-[#4A7FA7]">
                        Originality
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="flex items-center gap-2 text-[#1A3D63]">
                      <span className="h-2 w-2 rounded-full bg-[#D98B94]" />
                      Exact Match
                    </span>
                    <span className="font-semibold text-[#0A1931]">6%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="flex items-center gap-2 text-[#1A3D63]">
                      <span className="h-2 w-2 rounded-full bg-[#4A7FA7]" />
                      Semantic Match
                    </span>
                    <span className="font-semibold text-[#0A1931]">13%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="flex items-center gap-2 text-[#1A3D63]">
                      <span className="h-2 w-2 rounded-full bg-[#72B69B]" />
                      Evidence Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#F6FAFD] p-3">
                <div className="mb-3 text-[9px] font-bold text-[#0A1931]">
                  Potential Matches
                </div>
                {[
                  ["Research Paper.pdf", "78% match"],
                  ["Academic Article.pdf", "61% match"],
                  ["Online Source.pdf", "48% match"],
                ].map(([name, match]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border-b border-[#B3C8E0]/20 py-2 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                        <FileSearch className="h-3 w-3 text-[#4A7FA7]" />
                      </div>
                      <span className="text-[8px] font-medium text-[#1A3D63]">
                        {name}
                      </span>
                    </div>
                    <span className="text-[8px] font-semibold text-[#4A7FA7]">
                      {match}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* FLOATING NAVY BOOK */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [-4, 4, -4] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute right-[0%] top-[42%] flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A1931] shadow-xl shadow-[#0A1931]/15"
            >
              <BookOpen className="h-7 w-7 text-white" />
            </motion.div>

            {/* FLOATING SHIELD */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute right-[2%] top-[2%] flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xl shadow-[#1A3D63]/10"
            >
              <ShieldCheck className="h-7 w-7 text-[#1A3D63]" />
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="scroll-mt-24 border-t border-[#B3C8E0]/25 pt-20"
        >
          <div className="max-w-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
              Core Capabilities
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0A1931] sm:text-4xl">
              Built for evidence-driven
              <br />
              academic verification.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#1A3D63]/70">
              AuthentiCheck combines document processing, traditional
              similarity techniques, and semantic language analysis to help
              educators investigate academic submissions.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -5 }}
                  className="reference-card rounded-2xl p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FA]">
                    <Icon className="h-5 w-5 text-[#1A3D63]" />
                  </div>
                  <h3 className="mt-5 text-sm font-bold text-[#0A1931]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#1A3D63]/70">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-[#B3C8E0]/25 pt-20"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
            How It Works
          </div>
          <h2 className="mt-3 text-3xl font-bold text-[#0A1931]">
            From submission to evidence.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: Upload,
                title: "Upload",
                text: "A student submission is uploaded for analysis.",
              },
              {
                number: "02",
                icon: Search,
                title: "Analyze",
                text: "Text extraction and similarity engines examine the document.",
              },
              {
                number: "03",
                icon: ShieldCheck,
                title: "Review",
                text: "Teachers receive similarity findings and supporting evidence.",
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  whileHover={{ y: -4 }}
                  className="flex gap-4 rounded-2xl p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF3FA]">
                    <Icon className="h-5 w-5 text-[#1A3D63]" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-[#4A7FA7]">
                      {step.number} · {step.title}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#1A3D63]/70">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="relative mt-20 scroll-mt-24 overflow-hidden rounded-2xl border border-[#B3C8E0]/35 bg-[#EAF3FA] px-7 py-9 sm:px-10"
        >
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/60 blur-2xl" />
          <div className="relative grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
                About AuthentiCheck
              </div>
              <h2 className="mt-3 text-2xl font-bold text-[#0A1931]">
                Academic verification powered by practical AI.
              </h2>
            </div>
            <p className="text-xs leading-6 text-[#1A3D63]/75">
              AuthentiCheck is designed to assist educators in identifying
              potential similarities between academic submissions. The system
              focuses on transparent evidence and meaningful comparisons rather
              than treating automated scores as final proof of academic
              misconduct.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#B3C8E0]/25 bg-white px-6 py-7">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 text-[9px] text-[#4A7FA7] sm:flex-row">
          <span>© 2026 AuthentiCheck</span>
          <span>AI-Based Academic Work Verification System</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage