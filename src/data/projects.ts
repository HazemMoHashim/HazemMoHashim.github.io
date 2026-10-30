/* ============================================================
   projects.ts — the project data model.
   Three levels of the site:
     1. Homepage  → FEATURED WORK (tier: primary / medium / small)
     2. /projects → the full archive
     3. /projects/:slug → the case study (this file's fields)
   Facts from Hazem's CVs only. Gallery slots marked PENDING are
   awaiting real material from Hazem (renders, photos, diagrams).
   ============================================================ */

import type { Track } from './profile'

export type GalleryKind =
  | 'pcb-render'
  | 'pcb-photo'
  | 'schematic'
  | 'diagram'
  | 'simulation'
  | 'screenshot'
  | 'photo'
  | 'video'

export interface GalleryItem {
  kind: GalleryKind
  caption: string
  src?: string // when absent, the UI renders an intentional placeholder frame
  /** source document behind a still, offered as a link under the caption */
  href?: string
}

export interface Project {
  id: string
  slug: string
  idx: string
  track: Track
  title: string
  /** one-liner, used on cards + page hero */
  line: string
  year: string
  /** homepage tier — projects without a tier live only in the archive */
  tier?: 'primary' | 'medium' | 'small'
  /** short card paragraph (2–3 sentences max) */
  blurb: string
  /* ----- case study ----- */
  problem: string
  contribution: string
  architecture: string
  implementation: string
  results: string[]
  tech: string[]
  gallery: GalleryItem[]
  /** interactive 3D model (glb) — replaces the hero image when present */
  model?: { src: string; caption?: string }
  github?: string
  external?: string
}

export const projects: Project[] = [
  {
    id: 'grad-ml',
    slug: 'smart-university-secure-network',
    idx: '01',
    track: 'ai-ml',
    title: 'Smart University Secure Network',
    line: 'Real-time ML detection of DoS attack classes in live campus network traffic.',
    year: '2026',
    tier: 'primary',
    blurb:
      'Our main graduation project: an 11-member team that designed and built a secure smart-campus network with three-tier architecture, redundancy, firewalling and server services. The networking/IT side was shared team work; my focus was the AI side, building and serving the intrusion-detection model: a Random-Forest classifier that separates benign traffic from multiple DoS attack classes in real time, deployed behind a FastAPI backend with a live threat dashboard ("Network Guard").',
    problem:
      'Universities run dense, mixed-load networks where students, faculty and administration all depend on seamless access, yet typical campus designs suffer from inadequate architecture, poor scalability and real exposure to cyber threats. Without a well-designed, secure infrastructure, the institution risks data breaches, unauthorized access and service disruptions. The team\'s answer was a hierarchical three-tier campus design; the open question was the detection layer: how do you tell attack traffic from legitimate load in real time, when static rules can\'t keep up?',
    contribution:
      'An 11-member team project, supervised by Dr. Hany Ahmed and Dr. Rasha, South Valley University, Faculty of Engineering, 2025–2026. It was a networking project as much as an AI one: the topology, redundancy and security design were shared team work, and each of us owned a part of the whole. My part was the AI detection side, developed along with my teammates\' infrastructure and server work: dataset strategy, class-imbalance handling, feature analysis, model training and evaluation, and the deployment path that turned the offline model into a working IDS.',
    architecture:
      'The team-designed campus: hierarchical three-tier architecture (Core / Distribution / Access) with OSPF dynamic routing, VRRP gateway redundancy, VLAN segmentation, Layer-2 protections, Windows Server services (Active Directory, DNS, DHCP), Zabbix monitoring, and a FortiGate firewall enforcing policy over a Site-to-Site IPSec VPN. On the AI side, where most of my work sits, a serialized Random-Forest pipeline (scaler + label encoder + model) is loaded by a FastAPI service that exposes a /predict endpoint for live network flows, persists every classification to SQLite for post-incident forensics, and feeds a dashboard visualizing live packet flow and threat distribution.',
    implementation:
      'The model was trained on the CIC-IDS2017 Wednesday working-hours flow dataset (benign traffic vs. DoS Hulk, GoldenEye, Slowloris and Slowhttptest). Flow-math infinities were cleaned out, and the severe class imbalance (hundreds of thousands of BENIGN flows against thousands of attacks) was handled by undersampling BENIGN to the DoS-Hulk count so no class dominated training. Pearson-correlation analysis across key flow features (duration, packet counts, flow bytes/s, packet sizes) exposed redundancy before feature selection. The final pipeline: stratified 80/20 split, StandardScaler, Random Forest (100 trees, all cores), serialized with joblib, so the FastAPI service scales incoming flows with the exact fitted scaler, keeping train and serve conditions identical.',
    results: [
      'Graduation project graded Excellent, South Valley University, 2026',
      'Near-perfect multi-class separation on the held-out test set: BENIGN, DoS Hulk, GoldenEye, Slowloris and Slowhttptest classified with zero observed misclassifications (confusion matrix)',
      'Flow Duration, Total Fwd Packets and Packet Length Mean ranked as the top discriminative features',
      'Network Guard: real-time FastAPI inference + SQLite audit trail + live dashboard that visibly flags volumetric DoS spikes over normal-traffic baselines',
      'Full campus infrastructure validated: OSPF convergence, VRRP failover, IPSec VPN, Layer-2 protections, AD/DNS/DHCP, Zabbix monitoring',
    ],
    tech: [
      'Python',
      'scikit-learn',
      'Random Forest',
      'pandas',
      'FastAPI',
      'SQLite',
      'Network security',
      'TCP/IP',
      'Cisco three-tier',
      'FortiGate',
    ],
    gallery: [
      {
        kind: 'diagram',
        caption: 'The model\'s result: confusion matrix with zero observed misclassifications across all five classes (Fig 5.4)',
        src: '/images/susn/susn-confusion.png',
      },
      {
        kind: 'diagram',
        caption: 'Top-10 feature importances: flow duration leads (Fig 5.5)',
        src: '/images/susn/susn-top-features.png',
      },
      {
        kind: 'screenshot',
        caption: 'Network Guard dashboard: live packet flow with DoS spikes over baseline (Fig 5.6)',
        src: '/images/susn/susn-dashboard-live.png',
      },
      {
        kind: 'screenshot',
        caption: 'Threat classification breakdown: benign vs. active DoS variants (Fig 5.7)',
        src: '/images/susn/susn-threat-breakdown.png',
      },
      {
        kind: 'simulation',
        caption: 'Raw dataset: severe class imbalance toward BENIGN traffic (Fig 5.1)',
        src: '/images/susn/susn-class-imbalance.png',
      },
      {
        kind: 'simulation',
        caption: 'After undersampling: balanced training distribution (Fig 5.2)',
        src: '/images/susn/susn-class-balanced.png',
      },
      {
        kind: 'diagram',
        caption: 'Pearson correlation across key flow features (Fig 5.3)',
        src: '/images/susn/susn-correlation.png',
      },
      {
        kind: 'diagram',
        caption: 'The team\'s network: three-tier campus topology, VLAN plan, data center & IPSec-VPN branch link',
        src: '/images/susn/susn-topology.png',
      },
    ],
  },
  {
    id: 'esp32-board',
    slug: 'custom-esp32-board',
    idx: '02',
    track: 'hardware',
    title: 'Custom ESP32 Development Board',
    line: '2-layer ESP32-WROOM board designed & routed in Altium, full fab package.',
    year: '2026',
    tier: 'medium',
    blurb:
      'A complete custom ESP32-WROOM development board: power management, sensor I/O, castellated module footprint and a full fabrication package, schematic to Gerbers, all in Altium Designer. The same board floating at the top of this page.',
    problem:
      'Off-the-shelf dev boards scatter their pins and power design around someone else’s priorities. For the sensor work I wanted a board with deliberate power management and the exact I/O I needed, and I wanted to own every decision from schematic to fab.',
    contribution:
      'Everything: requirements, schematic, component selection, 2-layer layout and routing, silkscreen, design-rule checking and the full fabrication package.',
    architecture:
      'ESP32-WROOM module (castellated, antenna region kept clear per datasheet), USB power path with regulation, sensor I/O headers, strapping-pin discipline, programming interface.',
    implementation:
      'Schematic in Altium Designer, 2-layer routing with hand-tuned trace widths for power vs signal, floorplanned placement (module antenna east, connectors on board edges), DRC-clean output, Gerber + drill generation for fabrication.',
    results: [
      'Full fab package generated (Gerbers, drill, BOM, pick & place)',
      'DRC-clean layout across all rule categories',
      'The 3D model at the top of this page is the real board, exported from Altium',
    ],
    tech: ['Altium Designer', 'ESP32-WROOM', 'PCB design', 'Embedded', 'Sensor interfacing'],
    github: 'https://github.com/HazemMoHashim',
    model: {
      src: '/models/esp32/board.glb',
      caption: 'REAL BOARD · STEP EXPORT FROM ALTIUM · DRAG TO ROTATE',
    },
    gallery: [
      {
        kind: 'pcb-render',
        caption: 'Top side, the real board exported from Altium',
        src: '/images/esp32/esp32-top-3d.png',
      },
      {
        kind: 'pcb-render',
        caption: 'Top copper and silkscreen, straight from the PCB document',
        src: '/images/esp32/esp32-top.png',
      },
      {
        kind: 'pcb-render',
        caption: 'Bottom copper, seen with the board turned over',
        src: '/images/esp32/esp32-bottom.png',
      },
      {
        kind: 'schematic',
        caption: 'Full schematic sheet',
        src: '/images/esp32/esp32-schematic.png',
        href: '/docs/esp32-schematic.pdf',
      },
    ],
  },
  {
    id: 'race-engineer',
    slug: 'local-ai-race-engineer',
    idx: '03',
    track: 'ai-ml',
    title: 'Local AI Race Engineer',
    line: 'Voice race engineer running fully local: Gemma 3 2B + Whisper on live telemetry.',
    year: '2026',
    tier: 'medium',
    blurb:
      'Gemma 3 2B and Whisper, both hosted locally, listening to race telemetry and my voice. It calls pace, strategy and hazards mid-stint. No cloud in the loop.',
    problem:
      'Cloud LLMs are too slow and too dependency-heavy for mid-stint racing calls. A latency spike or dropped connection and the “engineer” goes silent exactly when you need it.',
    contribution:
      'Designed and built the whole loop: telemetry capture, the local model stack, and the voice path in both directions.',
    architecture:
      'Sim telemetry → local inference stack (Gemma 3 2B reasoning, Whisper speech recognition) → spoken strategy and hazard calls back into the sim. Everything on-device.',
    implementation:
      'Pipeline glued around locally hosted models: telemetry parsing, context assembly for the engineer, speech output. Tuned so answers arrive inside a racing-relevant time window, not a chat-app one.',
    results: [
      'Fully local, no cloud dependency during a stint',
      'Pace, strategy and hazard calls from live telemetry',
      'Runs on consumer hardware (single laptop GPU)',
    ],
    tech: ['Gemma 3', 'Whisper', 'Python', 'Local LLMs', 'Real-time systems'],
    gallery: [
      { kind: 'diagram', caption: 'Telemetry → model → voice loop' },
      { kind: 'photo', caption: 'The rig: wheel, pedals, wheelbase' },
      { kind: 'screenshot', caption: 'Console: live stint callouts' },
    ],
  },
  {
    id: 'ffb-sim',
    slug: 'force-feedback-simulator',
    idx: '04',
    track: 'hardware',
    title: 'DIY Force-Feedback Racing Simulator',
    line: 'Wheelbase, wheel and pedals driven by BLDC control, encoders and STM32 firmware.',
    year: '2026',
    tier: 'small',
    blurb:
      'BLDC motors driven by STM32 firmware with encoder feedback. The wheel pushes back with forces that mean something: kerbs, weight transfer, front-axle load.',
    problem:
      'Consumer force-feedback wheels give you canned effects. I wanted forces computed from the actual car state, and I wanted to build the wheelbase myself.',
    contribution:
      'Full hardware + firmware build: motor selection and drive electronics, encoder integration, STM32 firmware for the force loop, pedal set.',
    architecture:
      'BLDC wheel motor with encoder feedback, STM32 running the force-feedback control loop, direct drive to the rim, load-path pedals.',
    implementation:
      'Firmware written against measured motor characteristics; forces derived from live sim telemetry (tire load, kerb strikes, steering rack forces) and rendered through the motor with encoder-verified position.',
    results: [
      'Direct-drive force feedback from real physics, not canned effects',
      'Custom wheelbase + pedals built from components',
      'It survives my driving, which is its own test',
    ],
    tech: ['STM32', 'BLDC motors', 'Encoders', 'Embedded C/C++', 'Control loops'],
    gallery: [
      { kind: 'photo', caption: 'Wheelbase build' },
      { kind: 'diagram', caption: 'Force loop: telemetry → motor torque' },
    ],
  },
  {
    id: 'bandgap',
    slug: 'bandgap-voltage-reference',
    idx: '05',
    track: 'hardware',
    title: 'Bandgap Voltage Reference',
    line: 'CMOS bandgap in Cadence Virtuoso: 0.8 V output across 1.2–3.3 V supply at 20 µW.',
    year: '2025',
    tier: 'small',
    blurb:
      'A CMOS bandgap reference in Cadence Virtuoso: 0.8 V output from a 1.2–3.3 V supply at 20 µW, designed for the IEEE SSCS Egypt competition.',
    problem:
      'Every analog block downstream needs a supply-independent reference. Designing one that stays flat from a 1.2 V to a 3.3 V supply, at micro-watt power, is the classic analog rite of passage.',
    contribution:
      'Full design ownership: topology choice, transistor sizing, trim network, and the full verification pass in Cadence Virtuoso.',
    architecture:
      'CMOS bandgap core with a supply range of 1.2–3.3 V, referenced to a 0.8 V output, designed around low quiescent current.',
    implementation:
      'Designed and simulated in Cadence Virtuoso: DC sweep across the full supply range, temperature characterization, power budget verified at 20 µW.',
    results: [
      '0.8 V reference stable across 1.2–3.3 V supply',
      '20 µW power budget met',
      'Built for the IEEE SSCS Egypt competition',
    ],
    tech: ['Cadence Virtuoso', 'CMOS', 'Analog IC design', 'NgSpice'],
    gallery: [
      { kind: 'schematic', caption: 'Bandgap core schematic' },
      { kind: 'simulation', caption: 'Reference vs supply sweep (1.2–3.3 V)' },
    ],
  },
  {
    id: 'vco',
    slug: 'cross-coupled-lc-vco',
    idx: '06',
    track: 'hardware',
    title: 'Cross-Coupled LC VCO',
    line: 'IC design contributed to a peer team’s microwave-based diabetic sensor.',
    year: '2026',
    blurb:
      'Contributed the IC design to a peer team’s graduation project: a cross-coupled LC VCO generating the microwave power their non-invasive sensing mechanism relies on.',
    problem:
      'A peer team’s microwave-based diabetic sensing concept needed a stable RF source to drive it. They had the sensing theory, they needed the oscillator.',
    contribution:
      'The oscillator itself: cross-coupled LC topology, designed and characterized for their sensing frequency and power needs.',
    architecture:
      'Cross-coupled LC VCO: a negative-resistance pair over an LC tank, sized for the target band and start-up margin.',
    implementation:
      'Designed in Cadence: tank sizing, negative-resistance biasing, start-up and oscillation-frequency verification in simulation.',
    results: [
      'Oscillator delivered to the team’s sensing project',
      'Start-up verified across process corners in simulation',
    ],
    tech: ['Cadence Virtuoso', 'RF IC design', 'CMOS', 'VCO'],
    gallery: [
      { kind: 'schematic', caption: 'Cross-coupled pair + tank' },
      { kind: 'simulation', caption: 'Start-up transient' },
    ],
  },
  {
    id: 'ever-v',
    slug: 'ever-v-electric-vehicle',
    idx: '07',
    track: 'hardware',
    title: 'EVER V Electric Vehicle',
    line: 'Designed & integrated the EV powertrain and low-voltage subsystem for the competition car.',
    year: '2024',
    blurb:
      'As powertrain subsystem head I designed and integrated the EV powertrain and the low-voltage electrical architecture the team raced in the EVER V competition.',
    problem:
      'A student-built EV needs an electrical architecture that survives vibration, weather and student maintenance, while delivering predictable power under race conditions.',
    contribution:
      'Subsystem head: owned the powertrain design and the low-voltage architecture, led the integration and bring-up, carried it across two EVER V competition cycles.',
    architecture:
      'Traction power path and a separate low-voltage rail for control, sensing and comms: isolated, fused, and serviceable by students in a paddock.',
    implementation:
      'Component selection, wiring architecture, protection design, and on-car integration across two competition builds; led the technical side of the subsystem team.',
    results: [
      'Two EVER V competition cycles completed',
      'Powertrain + low-voltage architecture designed, integrated and raced',
      'Led the subsystem team end to end',
    ],
    tech: ['EV powertrain', 'Motor controllers', 'Batteries', 'System integration'],
    gallery: [
      { kind: 'photo', caption: 'The car, EVER V competition' },
      { kind: 'diagram', caption: 'Low-voltage architecture' },
    ],
  },
  {
    id: 'clamp-detect',
    slug: 'industrial-clamp-detection',
    idx: '08',
    track: 'ai-ml',
    title: 'Industrial Clamp Detection',
    line: 'YOLOv11 object detection on machine-clamp footage: annotated in Roboflow, trained in Colab.',
    year: '2026',
    blurb:
      'YOLOv11 watching machine-clamp footage; frames annotated in Roboflow, trained in Colab, tuned for a real production line’s lighting.',
    problem:
      'Production lines need to know clamp state without a person staring at footage. Lighting on a real line is hostile to off-the-shelf detection.',
    contribution:
      'End to end: dataset collection and annotation, training, and tuning for production-floor conditions.',
    architecture:
      'Camera frames → YOLOv11 detector → clamp state classification usable by line monitoring.',
    implementation:
      'Frames annotated in Roboflow, training run in Colab, model tuned against real production-line lighting rather than clean lab footage.',
    results: [
      'Working detector on real line footage',
      'Annotation + training pipeline reproducible in Roboflow/Colab',
    ],
    tech: ['YOLOv11', 'Computer vision', 'Python', 'Roboflow'],
    gallery: [
      { kind: 'screenshot', caption: 'Detections on line footage' },
      { kind: 'photo', caption: 'The clamps, production floor' },
    ],
  },
  {
    id: 'sc-dcdc',
    slug: 'switched-capacitor-dc-dc',
    idx: '09',
    track: 'hardware',
    title: 'Switched-Capacitor DC-DC Converter',
    line: 'Fully integrated SC converter in 0.18 µm CMOS: 74% doubler / 77% buck efficiency.',
    year: '2025',
    blurb:
      'A fully-integrated switched-capacitor converter in 0.18 µm CMOS: 74% efficiency as a doubler, 77% as a buck.',
    problem:
      'On-chip voltage conversion without inductors: a fully-integrated converter has to trade topology, flying capacitors and switching scheme for efficiency inside a tiny silicon area.',
    contribution:
      'Full design of the converter in 0.18 µm CMOS: topology, sizing, switching scheme and efficiency verification.',
    architecture:
      'Switched-capacitor converter in 0.18 µm CMOS, operating as both doubler and buck depending on configuration.',
    implementation:
      'Designed and simulated in Cadence Virtuoso at 0.18 µm; efficiency characterized per configuration with measured simulation results.',
    results: [
      '74% efficiency as a doubler',
      '77% efficiency as a buck',
      'Fully integrated, no external magnetics',
    ],
    tech: ['Cadence Virtuoso', 'CMOS', 'Power electronics', 'Analog IC design'],
    gallery: [
      { kind: 'schematic', caption: 'Converter topology' },
      { kind: 'simulation', caption: 'Efficiency curves per configuration' },
    ],
  },
  {
    id: 'sea-waste',
    slug: 'autonomous-sea-waste-classifier',
    idx: '10',
    track: 'ai-ml',
    title: 'Autonomous Sea Waste Classifier',
    line: 'Real-time marine debris detection on an embedded robotic platform. Hack4Tech.',
    year: '2024',
    blurb:
      'A real-time marine-debris classifier deployed on an embedded robotic platform at the Hack4Tech hackathon.',
    problem:
      'Marine cleanup robots need to tell debris from open water in real time, on hardware small enough to actually float.',
    contribution:
      'The detection/classification pipeline and its deployment on the embedded platform.',
    architecture:
      'Onboard camera → embedded inference → classification output driving the robot’s collection logic.',
    implementation:
      'Model trained for debris classes and compressed enough for real-time inference on the robot’s embedded hardware; built and demonstrated at Hack4Tech.',
    results: [
      'Real-time classification on embedded hardware',
      'Demonstrated live at Hack4Tech',
    ],
    tech: ['Computer vision', 'Embedded', 'Python', 'Real-time systems'],
    gallery: [
      { kind: 'photo', caption: 'The platform at Hack4Tech' },
      { kind: 'screenshot', caption: 'Live classification run' },
    ],
  },
]

export const featuredProjects = projects.filter((p) => p.tier)
export const archiveProjects = projects

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
