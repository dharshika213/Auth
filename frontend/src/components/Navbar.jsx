import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"

function Navbar() {
  const navigate = useNavigate()

  return (
    <motion.nav
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
      className="fixed left-1/2 top-4 z-50 w-[94%] max-w-6xl -translate-x-1/2"
    >
      <div className="reference-card flex items-center justify-between rounded-2xl px-4 py-2.5 sm:px-5">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FA]">
            <ShieldCheck className="h-5 w-5 text-[#1A3D63]" />
          </div>

          <div className="text-left">
            <div className="text-[15px] font-bold tracking-tight text-[#0A1931]">
              AuthentiCheck
            </div>

            <div className="text-[7px] font-semibold uppercase tracking-[0.18em] text-[#4A7FA7]">
              Academic Intelligence
            </div>
          </div>
        </button>

        <div className="hidden items-center gap-7 md:flex">
          <a
            href="/#home"
            className="text-xs font-medium text-[#0A1931] transition hover:text-[#4A7FA7]"
          >
            Home
          </a>

          <a
            href="/#features"
            className="text-xs font-medium text-[#0A1931] transition hover:text-[#4A7FA7]"
          >
            Features
          </a>

          <a
            href="/#how-it-works"
            className="text-xs font-medium text-[#0A1931] transition hover:text-[#4A7FA7]"
          >
            How It Works
          </a>

          <a
            href="/#about"
            className="text-xs font-medium text-[#0A1931] transition hover:text-[#4A7FA7]"
          >
            About
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/welcome")}
            className="hidden text-xs font-medium text-[#0A1931] transition hover:text-[#4A7FA7] sm:block"
          >
            Sign In
          </button>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/welcome")}
            className="group flex items-center gap-2 rounded-full bg-[#1A3D63] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#1A3D63]/15"
          >
            Get Started

            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar