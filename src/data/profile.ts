/* ============================================================
   profile.ts — ALL site content lives here.
   Sourced from Hazem's two CVs (Sept 2026 hardware / Aug 2026 ML).
   Edit content here, never in components.
   ============================================================ */

export type Track = "hardware" | "ai-ml"

export const profile = {
  name: "Hazem",
  surname: "Hashim",
  fullName: "Hazem M. Hashim",
  title: "Electronics & Communication Engineer",
  location: "Qena, Egypt",
  coords: "N26.16° E32.72°",
  email: "HazemMoHashim@gmail.com",
  github: "https://github.com/HazemMoHashim",
  githubUser: "HazemMoHashim",
  linkedin: "https://www.linkedin.com/in/hazemmohashim/",
  rev: "2026.1",
  languages: [
    "Arabic — native",
    "English — fluent",
    "French — basic",
    "German — basic",
  ],
  education: {
    degree: "B.Sc. Electronics & Communication Engineering",
    school: "Qena University (formerly South Valley University)",
    period: "2021 — 2026",
    note: "Graduation project graded Excellent",
  },
}

/* ---------- featured (lead = main graduation project) ---------- */

export interface Featured {
  id: string
  num: string
  track: Track
  title: string
  blurb: string
  specs: string[]
  lead?: boolean
  withStage?: boolean
}

export const featuredBuilds: Featured[] = [
  {
    id: "grad-ml",
    num: "01 / GRADUATION PROJECT",
    track: "ai-ml",
    title: "Smart University Secure Network",
    blurb:
      "My main graduation project — and my part in it was the machine-learning core: a model that detects multiple DoS attack classes from live network traffic in real time, feeding a smart-campus architecture for traffic optimization, threat detection and intrusion prevention.",
    specs: ["Real-time ML detection", "Multiple DoS classes", "Live network traffic", "2026"],
    lead: true,
  },
  {
    id: "esp32-board",
    num: "02 / FEATURED · HARDWARE",
    track: "hardware",
    title: "Custom ESP32 Development Board",
    blurb:
      "2-layer ESP32-WROOM board designed & routed in Altium Designer — power management, sensor I/O, full fab package. The same board floating at the top of this page.",
    specs: ["2-layer PCB", "Altium Designer", "ESP32-WROOM", "2026"],
    withStage: true,
  },
]

/* ---------- project list ---------- */

export interface Build {
  id: string
  idx: string
  track: Track
  title: string
  line: string
  detail: string
  year: string
}

export const builds: Build[] = [
  {
    id: "race-engineer",
    idx: "03",
    track: "ai-ml",
    title: "Local AI Race Engineer",
    line: "Voice race engineer running fully local — Gemma 3 2B + Whisper reading live sim-racing telemetry.",
    detail:
      "Gemma 3 2B and Whisper, both hosted locally, listening to race telemetry and my voice. It calls pace, strategy and hazards mid-stint — no cloud in the loop.",
    year: "2026",
  },
  {
    id: "vco",
    idx: "04",
    track: "hardware",
    title: "Cross-Coupled LC VCO",
    line: "IC design contributed to a peer team's microwave-based diabetic sensor — RF power generation for the sensing mechanism.",
    detail:
      "Contributed the IC design to a peer team's graduation project: a cross-coupled LC VCO generating the microwave power their non-invasive sensing mechanism relies on.",
    year: "2026",
  },
  {
    id: "ffb-sim",
    idx: "05",
    track: "hardware",
    title: "DIY Force-Feedback Racing Simulator",
    line: "Wheelbase, wheel and pedals driven by BLDC control, encoders, and STM32/Arduino firmware.",
    detail:
      "BLDC motors driven by STM32 firmware with encoder feedback — the wheel pushes back with forces that mean something: kerbs, weight transfer, front-axle load.",
    year: "2026",
  },
  {
    id: "clamp-detect",
    idx: "06",
    track: "ai-ml",
    title: "Industrial Clamp Detection",
    line: "YOLOv11 object detection on machine-clamp footage — dataset annotated in Roboflow, trained in Colab.",
    detail:
      "YOLOv11 watching machine-clamp footage; frames annotated in Roboflow, trained in Colab, tuned for a real production line's lighting.",
    year: "2026",
  },
  {
    id: "ever-v",
    idx: "07",
    track: "hardware",
    title: "EVER V Electric Vehicle",
    line: "Designed & integrated the EV powertrain and low-voltage subsystem for the EVER V competition.",
    detail:
      "As powertrain subsystem head I designed and integrated the EV powertrain and the low-voltage electrical architecture the team raced in the EVER V competition.",
    year: "2024",
  },
  {
    id: "bandgap",
    idx: "08",
    track: "hardware",
    title: "Bandgap Voltage Reference",
    line: "CMOS bandgap in Cadence Virtuoso — 0.8 V output across 1.2–3.3 V supply at 20 µW. IEEE SSCS Egypt.",
    detail:
      "A CMOS bandgap reference in Cadence Virtuoso: 0.8 V output from a 1.2–3.3 V supply at 20 µW — designed for the IEEE SSCS Egypt competition.",
    year: "2025",
  },
  {
    id: "sc-dcdc",
    idx: "09",
    track: "hardware",
    title: "Switched-Capacitor DC-DC Converter",
    line: "Fully integrated SC converter in 0.18 µm CMOS — 74% doubler / 77% buck efficiency.",
    detail:
      "A fully-integrated switched-capacitor converter in 0.18 µm CMOS: 74% efficiency as a doubler, 77% as a buck.",
    year: "2025",
  },
  {
    id: "sea-waste",
    idx: "10",
    track: "ai-ml",
    title: "Autonomous Sea Waste Classifier",
    line: "Real-time marine debris detection & classification deployed on an embedded robotic platform. Hack4Tech.",
    detail:
      "A real-time marine-debris classifier deployed on an embedded robotic platform at the Hack4Tech hackathon.",
    year: "2024",
  },
]

/* ---------- revision history (education + training + roles) ---------- */

export interface RevRow {
  years: string
  what: string
  who: string
  tag: "edu" | "training" | "team" | "ml"
  note?: string
}

export const revisions: RevRow[] = [
  {
    years: "2021 — 2026",
    what: "B.Sc. Electronics & Communication Engineering",
    who: "Qena University (formerly South Valley University)",
    tag: "edu",
    note: "Graduation project: Excellent",
  },
  {
    years: "2021 — 2026",
    what: "Electrical Technical Head",
    who: "IEEE SVU Student Branch",
    tag: "team",
    note: "Workshops & mentoring — electronics, programming, robotics",
  },
  {
    years: "2022 — 2026",
    what: "Powertrain Subsystem Head",
    who: "SVU Racing Team",
    tag: "team",
    note: "Led the EV electrical architecture across two EVER V competition cycles",
  },
  {
    years: "2023",
    what: "EGTA Winter Training Program",
    who: "Siemens Energy",
    tag: "training",
    note: "Industrial automation, PLCs, SCADA control architectures",
  },
  {
    years: "2023",
    what: "HCIA-AI Certification",
    who: "Huawei ICT Academy",
    tag: "ml",
    note: "ML algorithms, deep-learning architectures, TensorFlow",
  },
  {
    years: "2024",
    what: "PCB Design Training Program",
    who: "CREATIVA Qena",
    tag: "training",
    note: "Schematic design, layout routing, board fabrication",
  },
  {
    years: "2025",
    what: "Analog IC Design Training Program",
    who: "Information Technology Institute (ITI)",
    tag: "training",
    note: "CMOS analog building blocks in Cadence Virtuoso",
  },
  {
    years: "2025",
    what: "Digital IC Design using FPGA",
    who: "National Telecommunication Institute (NTI)",
    tag: "training",
    note: "FPGA-based digital systems & hardware architectures in Verilog",
  },
  {
    years: "2026",
    what: "Generative AI & Deep Learning Track",
    who: "ITI × NVIDIA DLI",
    tag: "ml",
    note: "Neural networks, transformers, PyTorch, TensorRT",
  },
  {
    years: "2026",
    what: "Build with AI: Masr Edition",
    who: "Google",
    tag: "ml",
    note: "Modern AI tools, APIs and real-world implementations",
  },
]

/* ---------- stack ---------- */

export interface StackGroup {
  ref: string
  title: string
  items: string[]
}

export const stack: StackGroup[] = [
  {
    ref: "GRP-A",
    title: "Electronics & IC",
    items: ["Altium Designer", "Cadence Virtuoso", "Xschem", "NgSpice", "Verilog / FPGA"],
  },
  {
    ref: "GRP-B",
    title: "Embedded",
    items: ["ESP32", "STM32", "Arduino", "Embedded C/C++", "Sensor interfacing", "Real-time systems"],
  },
  {
    ref: "GRP-C",
    title: "EV & Automotive",
    items: ["EV powertrain", "Motor controllers", "Batteries", "Sensors & telemetry", "System integration"],
  },
  {
    ref: "GRP-D",
    title: "AI / ML",
    items: ["PyTorch", "TensorFlow", "YOLO / computer vision", "Local LLMs", "Whisper", "TensorRT"],
  },
  {
    ref: "GRP-E",
    title: "Software & Tools",
    items: ["Python", "C / C++", "MATLAB / Simulink", "FastAPI / Flask", "Linux", "Git", "TCP/IP networking"],
  },
]

/* ---------- honors ---------- */

export interface Honor {
  year: string
  what: string
}

export const honors: Honor[] = [
  { year: "2024", what: "Best Design Award — ERIL Robotics Competition" },
  { year: "2025", what: "Participant — IEEE SSCS Egypt Competition" },
  { year: "2024", what: "Participant — Electric Vehicle Rally" },
  { year: "2024", what: "Participant — Hack4Tech Hackathon" },
  { year: "2022", what: "Best Design Award — UEA6 Robotics Competition" },
  { year: "2019", what: "Best Teamwork Award — IEEE SVU SB Robotics Competition" },
]

/* ---------- marquee ---------- */

export const marqueeItems = [
  "PCB Design",
  "Embedded C/C++",
  "Analog IC — Cadence",
  "FPGA / Verilog",
  "EV Powertrain",
  "Computer Vision",
  "Local LLMs",
  "MATLAB / Simulink",
  "Sensor Interfacing",
  "System Integration",
]


/* ---------- avatar (stage B v2) — warm, first person, reviewed by Hazem ---------- */

export const avatarScript: Record<string, string> = {
  greet:
    "Hey, welcome in! I'm Hazem — the pocket-sized version. I build electronics and the AI that runs on them. Scroll down, I'll walk you through everything!",
  poke:
    "Haha, hi again! Poking the avatar, bold move. I like the energy. Keep scrolling — the cool stuff is below!",
  profile:
    "This is me on paper! B.Sc. from Qena University, class of 2026 — and the graduation project came out with an Excellent. I only mention it constantly.",
  revisions:
    "The changelog of me! EV powertrain team, IC design workshops, training courses — every role here got me soldered a little tighter.",
  builds:
    "My favorite part — click any row and it comes ALIVE in 3D! Go on, try the bandgap. 0.8 volts of pure pride.",
  stack:
    "The toolbox! No skill bars here — a '90% in Altium' means nothing. What counts is what I've actually shipped with each of these.",
  spine:
    "The honors shelf! Best Teamwork at the IEEE robotics competition — fitting, honestly, because everything on this page was a team sport.",
  contact:
    "You made it all the way down — I like your style! The email copies on click. Or catch me on GitHub and LinkedIn. Talk soon!",
  jarvisPoke:
    "Whoa — you found the secret knock! Respect. That name means a lot to me; this whole site is built in its spirit.",
}

/* hover chat — short, punchy, per build (fires when the pointer lands on a row) */
export const buildChat: Record<string, string> = {
  "grad-ml":
    "My main grad project! I built the ML core — a model reading live network traffic and catching DoS attacks in real time. The team built the campus; I gave it reflexes.",
  "esp32-board":
    "This board! Every trace routed by hand in Altium — 2 layers, ESP32-WROOM, full fab package. Same board as the big one up top. Same pride.",
  "race-engineer":
    "My race engineer! Gemma 3 + Whisper, running 100% local — it reads telemetry and calls strategy at me mid-stint. No cloud, no lag, no excuses.",
  vco:
    "Honesty corner: the sensor was another team's project — I designed the LC VCO that powered it. Small part, proud part.",
  "ffb-sim":
    "My rig! BLDC motors, STM32 firmware, encoder feedback — I feel every kerb through this wheel. Hardware that talks back.",
  "clamp-detect":
    "YOLOv11 watching factory clamps! Dataset annotated in Roboflow, trained in Colab, tuned for real production-line lighting.",
  "ever-v":
    "EVER V! I was powertrain subsystem head — the whole EV drivetrain and low-voltage architecture, designed and integrated by yours truly.",
  bandgap:
    "THE BANDGAP! 0.8 V steady from a 1.2–3.3 V supply at just 20 µW — Cadence Virtuoso, IEEE SSCS Egypt. First design I didn't have to apologize for!",
  "sc-dcdc":
    "Switched-cap converter in 0.18 µm CMOS — 74% as a doubler, 77% as a buck. Efficiency you can measure, not vibes.",
  "sea-waste":
    "Hack4Tech! A marine-debris classifier running real-time on an embedded robot. The ocean said thanks.",
}

/* ---------- avatar reactions (v4) — reviewed by Hazem ---------- */

export const giggleLines: string[] = [
  "Haha! Hey, that tickles!",
  "Hehe — okay, okay, I'm ticklish in all my vertices!",
  "Hahaha! Do that again and I'm charging by the giggle.",
  "Hehehe, stop it! I'm trying to look professional here!",
]

export const angryLines: string[] = [
  "OKAY. That's it. No more high-fives for you. Hmph.",
  "Hey! Poke me ONE more time and I'm unionizing.",
  "I am a serious engineer! ...Okay fine, one more giggle. ONE.",
]

/* ---------- JARVIS easter egg (type "jarvis" anywhere) ---------- */

export const easterEgg = {
  title: 'J.A.R.V.I.S. // OFFLINE',
  line: 'His little brother runs this bench now. I take it from here.',
}
