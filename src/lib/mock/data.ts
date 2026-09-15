export interface Detection {
  id: string;
  filename: string;
  type: "image" | "video" | "audio" | "text" | "call" | "link";
  confidence: number; // 0-100 % likely AI/manipulated
  verdict: "authentic" | "suspicious" | "manipulated";
  riskScore: number; // 0-100
  riskLevel: "low" | "moderate" | "high" | "critical";
  createdAt: string;
  size: string;
  scannedBy: string;
  signals: { label: string; score: number }[];
}

export const MOCK_DETECTIONS: Detection[] = [
  {
    id: "det_01H8Z",
    filename: "press-briefing-clip.mp4",
    type: "video",
    confidence: 92,
    verdict: "manipulated",
    riskScore: 88,
    riskLevel: "critical",
    createdAt: "2026-07-06T14:22:00Z",
    size: "48.2 MB",
    scannedBy: "ai-cvh-video-v1",
    signals: [
      { label: "Face swap", score: 94 },
      { label: "Temporal jitter", score: 81 },
      { label: "Audio-lip drift", score: 88 },
      { label: "Compression trail", score: 62 },
      { label: "Frequency anomalies", score: 77 },
    ],
  },
  {
    id: "det_02J1K",
    filename: "profile-headshot.jpg",
    type: "image",
    confidence: 14,
    verdict: "authentic",
    riskScore: 12,
    riskLevel: "low",
    createdAt: "2026-07-06T12:04:00Z",
    size: "3.1 MB",
    scannedBy: "ai-cvh-image-v1",
    signals: [
      { label: "GAN fingerprint", score: 8 },
      { label: "Diffusion artefacts", score: 12 },
      { label: "Sensor noise", score: 91 },
      { label: "EXIF integrity", score: 96 },
    ],
  },
  {
    id: "det_03A9M",
    filename: "leaked-call.wav",
    type: "audio",
    confidence: 68,
    verdict: "suspicious",
    riskScore: 55,
    riskLevel: "high",
    createdAt: "2026-07-05T22:47:00Z",
    size: "12.4 MB",
    scannedBy: "ai-cvh-voice-v1",
    signals: [
      { label: "Vocoder trace", score: 71 },
      { label: "Prosody drift", score: 64 },
      { label: "Room impulse", score: 55 },
    ],
  },
  {
    id: "det_04Q2R",
    filename: "policy-brief.txt",
    type: "text",
    confidence: 87,
    verdict: "manipulated",
    riskScore: 72,
    riskLevel: "high",
    createdAt: "2026-07-05T09:15:00Z",
    size: "48 KB",
    scannedBy: "ai-cvh-text-v1",
    signals: [
      { label: "Perplexity", score: 89 },
      { label: "Burstiness", score: 84 },
      { label: "Stylometric drift", score: 79 },
    ],
  },
  {
    id: "det_05W7T",
    filename: "campaign-poster.png",
    type: "image",
    confidence: 96,
    verdict: "manipulated",
    riskScore: 91,
    riskLevel: "critical",
    createdAt: "2026-07-04T18:30:00Z",
    size: "8.9 MB",
    scannedBy: "ai-cvh-image-v1",
    signals: [
      { label: "GAN fingerprint", score: 97 },
      { label: "Diffusion artefacts", score: 94 },
      { label: "Sensor noise", score: 12 },
    ],
  },
  {
    id: "det_06B4C",
    filename: "interview-raw.mp3",
    type: "audio",
    confidence: 22,
    verdict: "authentic",
    riskScore: 18,
    riskLevel: "low",
    createdAt: "2026-07-04T10:11:00Z",
    size: "22.7 MB",
    scannedBy: "ai-cvh-voice-v1",
    signals: [
      { label: "Vocoder trace", score: 9 },
      { label: "Prosody drift", score: 18 },
      { label: "Room impulse", score: 88 },
    ],
  },
];

export const TRUST_LOGOS = [
  "REUTERS", "AXIS BROADCASTING", "GUARDIAN LABS", "INTERPOL PROTOTYPE",
  "AP FACT CHECK", "MIT MEDIA LAB", "OSINT COLLECTIVE", "META TRUST",
];

export const FEATURES = [
  {
    tag: "01 / VISION",
    title: "Deepfake video forensics",
    body: "Temporal, spatial, and audio-visual cross-checks catch face-swaps, reenactments, and puppeteered frames the moment they play.",
  },
  {
    tag: "02 / SOUND",
    title: "Voice-clone triangulation",
    body: "Spectrograms, prosody, and vocoder fingerprints expose cloned speakers even when routed through the phone network.",
  },
  {
    tag: "03 / IMAGE",
    title: "Diffusion & GAN fingerprints",
    body: "Detect generative signatures from Midjourney, SDXL, Flux, DALL·E, and closed-loop enterprise models — including retouched hybrids.",
  },
  {
    tag: "04 / TEXT",
    title: "Machine-authored text",
    body: "Stylometric + probabilistic models identify AI-drafted articles, statements, and reports across 40+ languages.",
  },
  {
    tag: "05 / SIGNAL",
    title: "Explainable evidence",
    body: "Every verdict ships with a heatmap, signal breakdown, and downloadable forensic report — court-ready, versioned, and auditable.",
  },
  {
    tag: "06 / SCALE",
    title: "Newsroom-grade throughput",
    body: "Batch pipelines, webhooks, and a first-class API. Verify 10 000 assets before the next news cycle files.",
  },
];

export const TESTIMONIALS = [
  { quote: "This platform flagged three fabricated clips in our election coverage before anyone else even saw them.", who: "M. OKAFOR", role: "Head of Verification, Axis" },
  { quote: "The forensic heatmaps changed how our lawyers argue provenance in court.", who: "S. LINDQVIST", role: "Counsel, Nordisk Media" },
  { quote: "We route every user upload through the API. Latency is under a second.", who: "R. PATEL", role: "CTO, Trustlens" },
  { quote: "This is the first detection stack I trust with a byline attached.", who: "J. HERRERA", role: "Investigations, The Ledger" },
];

export const STATS = [
  { label: "assets verified", value: 48_200_000, suffix: "+" },
  { label: "average detection latency", value: 780, suffix: "ms" },
  { label: "precision @ P/R = 0.95", value: 99.2, suffix: "%", decimals: 1 },
  { label: "supported model families", value: 41 },
];

export function detectionById(id: string) {
  return MOCK_DETECTIONS.find((d) => d.id === id) ?? MOCK_DETECTIONS[0];
}