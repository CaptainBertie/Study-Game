import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { DragEvent, ChangeEvent } from "react";

// Standalone, dependency‑free React mini‑game that runs in ChatGPT's canvas preview.
// No external UI libraries, no PDF import — questions are hard‑coded from Part A of the
// “MMAN1130 Sample Final Exam Paper with MCQ Solution.pdf”.
// End-of-quiz feedback only (no instant correctness reveal).

// Types
 type Choice = { label: string; text: string };
 type Question = {
  id: number;
  prompt: string;
  choices: Choice[];
  correctIndex: number; // 0 = A, 1 = B, 2 = C, 3 = D, 4 = E
  explanation?: string;
};

// Default question bank (Part A only, Q1–Q20) — with expanded explanations
const DEFAULT_QUESTION_BANK: Question[] = [
  {
    id: 1,
    prompt: "What is the primary purpose of engineering standards?",
    choices: [
      { label: "A", text: "To limit innovation in design" },
      { label: "B", text: "To reduce manufacturing costs only" },
      { label: "C", text: "To ensure safety, reliability, and consistency" },
      { label: "D", text: "To increase paperwork in engineering projects" }
    ],
    correctIndex: 2,
    explanation:
      "Standards codify best practice so parts and documentation are compatible across suppliers and time. They target safety, interchangeability and consistent quality — not just cost reduction — and still leave room for innovation within defined limits."
  },
  {
    id: 2,
    prompt: "In Australia, which body is responsible for national standards development?",
    choices: [
      { label: "A", text: "Engineers Australia" },
      { label: "B", text: "ASME" },
      { label: "C", text: "Standards Australia" },
      { label: "D", text: "ISO" }
    ],
    correctIndex: 2,
    explanation:
      "Standards Australia oversees the development and adoption of Australian Standards (AS). Engineers Australia is a professional body; ASME is US‑based; ISO publishes international standards that Australia may adopt or adapt."
  },
  {
    id: 3,
    prompt: "According to AS 1100, what type of line is used to represent visible edges?",
    choices: [
      { label: "A", text: "Chain thin" },
      { label: "B", text: "Dashed thick" },
      { label: "C", text: "Continuous thick" },
      { label: "D", text: "Continuous thin" }
    ],
    correctIndex: 2,
    explanation:
      "AS 1100 specifies a continuous thick line for outlines/visible edges. Hidden edges use dashed thin; centerlines are chain thin — each conveys a different semantic on the drawing."
  },
  {
    id: 4,
    prompt: "What is the correct scale designation for a drawing that is half the real-world size, according to AS 1100?",
    choices: [
      { label: "A", text: "2:1" },
      { label: "B", text: "1:2" },
      { label: "C", text: "1:10" },
      { label: "D", text: "1:1" }
    ],
    correctIndex: 1,
    explanation:
      "In AS 1100, Scale 1:2 means the plotted size is 0.5× the true size. 2:1 would be an enlargement; 1:1 is full size."
  },
  {
    id: 5,
    prompt: "What is the main purpose of using cutting fluid in machining?",
    choices: [
      { label: "A", text: "To colour the workpiece" },
      { label: "B", text: "To dissolve the material being cut" },
      { label: "C", text: "To cool, lubricate, and flush away chips" },
      { label: "D", text: "To bond the cutting tool to the workpiece" }
    ],
    correctIndex: 2,
    explanation:
      "Cutting fluids reduce friction at the tool–chip interface (lubrication), carry heat away (cooling), and help evacuate chips. The net effect is lower tool wear, better dimensional accuracy and improved surface finish."
  },
  {
    id: 6,
    prompt: "What can happen if chips are not removed during machining?",
    choices: [
      { label: "A", text: "Tool wear and poor surface finish" },
      { label: "B", text: "Improved surface finish" },
      { label: "C", text: "Decrease in material hardness" },
      { label: "D", text: "Nothing; chips fall away automatically" }
    ],
    correctIndex: 0,
    explanation:
      "Re‑cutting loose chips increases rubbing and heat, which accelerates flank/ crater wear and leaves torn or smeared surfaces. Effective chip control is a core element of process planning."
  },
  {
    id: 7,
    prompt: "What is the purpose of reaming?",
    choices: [
      { label: "A", text: "To create a thread inside a hole" },
      { label: "B", text: "To enlarge an existing hole to a precise size and finish" },
      { label: "C", text: "To remove chips from a drilled hole" },
      { label: "D", text: "To create a tapered hole" }
    ],
    correctIndex: 1,
    explanation:
      "A reamer removes a small allowance (typically a few tenths of a millimetre) from a pre‑drilled hole to achieve tight size tolerance and improved surface finish. Threads are cut by tapping; tapers require a tapered tool."
  },
  {
    id: 8,
    prompt: "What is the primary function of a milling machine?",
    choices: [
      { label: "A", text: "To heat metal for forging" },
      { label: "B", text: "To join two metal parts" },
      { label: "C", text: "To remove material using a rotating cutter" },
      { label: "D", text: "To measure component dimensions" }
    ],
    correctIndex: 2,
    explanation:
      "Milling uses a rotating multi‑point cutter to shear material, creating flats, slots, pockets and complex 3D surfaces depending on the toolpath and cutter geometry."
  },
  {
    id: 9,
    prompt: "Which tool is used to cut internal threads into a pre‑drilled hole?",
    choices: [
      { label: "A", text: "Reamer" },
      { label: "B", text: "Twist drill" },
      { label: "C", text: "Tap" },
      { label: "D", text: "Die" }
    ],
    correctIndex: 2,
    explanation:
      "A tap forms internal threads by cutting the thread profile into the wall of a drilled hole. A die produces external threads on a rod or shaft; a reamer is for sizing/finishing a hole."
  },
  {
    id: 10,
    prompt: "In milling, what is the difference between peripheral and face milling?",
    choices: [
      { label: "A", text: "Peripheral uses the face of the cutter; face milling uses the edge" },
      { label: "B", text: "Peripheral removes more material; face milling is for finishing only" },
      { label: "C", text: "Peripheral uses the cutter’s sides; face milling uses the cutter’s end" },
      { label: "D", text: "There is no difference" }
    ],
    correctIndex: 2,
    explanation:
      "Peripheral (slab) milling engages the cutter periphery to generate surfaces parallel to the cutter axis; face milling uses the tool end/inserted face to generate a surface perpendicular to the axis."
  },
  {
    id: 11,
    prompt: "What is the main advantage of CNC milling over manual milling?",
    choices: [
      { label: "A", text: "Requires more operators" },
      { label: "B", text: "Lower initial cost" },
      { label: "C", text: "Greater precision and repeatability" },
      { label: "D", text: "Easier to transport" }
    ],
    correctIndex: 2,
    explanation:
      "CNC machines execute programmed toolpaths with closed‑loop control, giving consistent accuracy and the ability to machine complex geometries repeatedly with minimal variation compared with manual setups."
  },
  {
    id: 12,
    prompt: "Which turning operation reduces the diameter of a workpiece along its length?",
    choices: [
      { label: "A", text: "Facing" },
      { label: "B", text: "Boring" },
      { label: "C", text: "Taper turning" },
      { label: "D", text: "Straight turning" }
    ],
    correctIndex: 3,
    explanation:
      "Straight turning feeds a single‑point tool parallel to the spindle axis to bring an outer diameter down to size. Facing acts axially to shorten length; boring enlarges internal diameters; taper turning varies diameter linearly."
  },
  {
    id: 13,
    prompt: "Which part of the lathe supports the other end of the workpiece when it is long or slender?",
    choices: [
      { label: "A", text: "Headstock" },
      { label: "B", text: "Tailstock" },
      { label: "C", text: "Tool holder" },
      { label: "D", text: "Bed" }
    ],
    correctIndex: 1,
    explanation:
      "The tailstock holds a centre (dead/live) or a drill chuck to support the free end of the work, reducing deflection and chatter. For mid‑span support a steady/follower rest may also be used."
  },
  {
    id: 14,
    prompt: "In a clearance fit:",
    choices: [
      { label: "A", text: "The shaft is always larger than the hole" },
      { label: "B", text: "The hole is always larger than the shaft" },
      { label: "C", text: "There is no tolerance applied" },
      { label: "D", text: "Parts are welded together" }
    ],
    correctIndex: 1,
    explanation:
      "A clearance fit guarantees positive clearance (hole − shaft > 0) over the tolerance ranges, enabling easy assembly and free movement. The opposite is an interference fit, where parts press‑fit together."
  },
  {
    id: 15,
    prompt: "What is the meaning of the designation H7/g6?",
    choices: [
      { label: "A", text: "Surface roughness" },
      { label: "B", text: "Thread class" },
      { label: "C", text: "Tolerances" },
      { label: "D", text: "Welding grade" }
    ],
    correctIndex: 2,
    explanation:
      "H7/g6 is a hole‑basis fit: H7 defines the hole tolerance zone starting at the basic size; g6 defines a shaft zone below basic size. Together they describe a typical sliding/locational clearance fit for precise assemblies."
  },
  {
    id: 16,
    prompt: "What is the primary goal of high‑volume manufacturing (HVM)?",
    choices: [
      { label: "A", text: "To produce highly customised, unique parts" },
      { label: "B", text: "To produce small quantities of handmade parts" },
      { label: "C", text: "To test new materials before full production" },
      { label: "D", text: "To efficiently produce large quantities of identical parts" }
    ],
    correctIndex: 3,
    explanation:
      "HVM seeks low unit cost with high throughput by standardising parts and processes, reducing cycle time, and leveraging automation/line balancing for repeatable quality."
  },
  {
    id: 17,
    prompt: "Die casting typically involves which type of material?",
    choices: [
      { label: "A", text: "Thermoplastics" },
      { label: "B", text: "Thermosets" },
      { label: "C", text: "Molten metal" },
      { label: "D", text: "Composite materials" }
    ],
    correctIndex: 2,
    explanation:
      "High‑pressure die casting injects molten metal (commonly aluminium, zinc or magnesium alloys) into a hardened steel die, giving thin walls and good surface finish at high production rates."
  },
  {
    id: 18,
    prompt: "Which process is most suitable for producing large metal parts in small quantities (e.g. engine blocks, pump housings)?",
    choices: [
      { label: "A", text: "Sand casting" },
      { label: "B", text: "Injection moulding" },
      { label: "C", text: "Die casting" },
      { label: "D", text: "3D printing" }
    ],
    correctIndex: 0,
    explanation:
      "Sand casting has low tooling cost and accommodates large, heavy geometries with modest volumes. Die casting is capital‑intensive and suited to smaller parts; injection moulding is for polymers; 3D printing struggles with very large dense metal parts economically."
  },
  {
    id: 19,
    prompt: "In high‑volume manufacturing, what happens to the cost per unit as production volume increases?",
    choices: [
      { label: "A", text: "It increases" },
      { label: "B", text: "It stays the same" },
      { label: "C", text: "It decreases" },
      { label: "D", text: "It becomes unpredictable" }
    ],
    correctIndex: 2,
    explanation:
      "Average cost falls with volume because fixed costs (tooling, overhead, setup) are spread over more units and processes improve via learning curves and utilisation."
  },
  {
    id: 20,
    prompt: "Which of the following is considered a fixed cost in manufacturing?",
    choices: [
      { label: "A", text: "Cost of raw materials" },
      { label: "B", text: "Labour per unit" },
      { label: "C", text: "Electricity used by each machine" },
      { label: "D", text: "Cost of tooling and equipment" }
    ],
    correctIndex: 3,
    explanation:
      "Tooling and capital equipment are fixed (up‑front) outlays that do not change with the number of units produced in the short run; materials, unit labour and energy scale with output."
  }
];

// ——— UI ———
const styles = {
  container: {
    width: "100%",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center"
  },
  card: {
    background: "var(--card-bg, #fff)",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    width: "min(980px, 96vw)",
    margin: "0 auto",
    boxSizing: "border-box" as const
  },
  h1: { fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--text, #0f172a)" },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--text, #0f172a)" },
  p: { color: "var(--muted, #475569)" },
  prompt: { fontSize: 18, lineHeight: 1.5, marginTop: 8, minHeight: 81, display: "flex", alignItems: "center" },
  btnRow: { display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center", marginTop: 16 },
  btn: { padding: "10px 14px", borderRadius: 12, border: "2px solid var(--btn-border, #e5e7eb)", background: "var(--btn-bg, #f8fafc)", color: "var(--text, #0f172a)", cursor: "pointer", boxSizing: "border-box" as const, userSelect: "none" as const },
  btnPrimary: { padding: "10px 14px", borderRadius: 12, border: "1px solid #3b82f6", background: "#3b82f6", color: "white", cursor: "pointer" },
  choice: {
    textAlign: "left" as const,
    padding: "10px 12px",
    borderRadius: 12,
    border: "2px solid var(--chip-border, #e5e7eb)",
    borderColor: "var(--chip-border, #e5e7eb)",
    background: "var(--chip-bg, #f8fafc)",
    cursor: "pointer",
    userSelect: "none" as const,
    outline: "none",
    boxSizing: "border-box" as const,
    boxShadow: "none"
  },
  choiceSelected: {
    borderColor: "#93c5fd",
    background:
      "linear-gradient(90deg, rgba(186,230,253,0.55) 0%, rgba(221,214,254,0.55) 100%)",
    boxShadow: "0 0 0 2px rgba(147,197,253,0.25) inset"
  },
  pill: { fontSize: 12, padding: "2px 8px", borderRadius: 999, display: "inline-block" },
  topActions: { display: "flex", gap: 8 },
  choiceFocused: { borderColor: "#cbd5e1", boxShadow: "0 0 0 2px rgba(148,163,184,0.25) inset" },
  // Quiz navigation chips (sidebar layout)
  navRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 12 },
  qChip: {
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid var(--chip-border, #e5e7eb)",
    background: "var(--chip-bg, #ffffff)",
    color: "var(--text, #0f172a)",
    cursor: "pointer",
    fontSize: 12,
    userSelect: "none" as const,
    outline: "none",
    width: 60,
    minWidth: 60,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box" as const
  },
  sidebar: {
    width: 136,
    borderLeft: "1px solid var(--panel-divider, #eef2f7)",
    paddingLeft: 12,
    position: "absolute" as const,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column" as const,
    background: "transparent"
  },
  navWrap: {
    display: "flex",
    gap: 6,
    height: "100%",
    overflowY: "auto" as const,
    paddingRight: 4,
    alignItems: "flex-start" as const,
    justifyContent: "flex-start" as const,
    overscrollBehavior: "contain" as const,
    WebkitOverflowScrolling: "touch" as const,
    scrollbarWidth: "none" as const
  },
  navColFixed: { flex: 0, display: "grid", gap: 6, gridAutoRows: "min-content", justifyItems: "start" as const, marginTop: 0, width: "auto" },
  navColFixedRight: { flex: 0, display: "grid", gap: 6, gridAutoRows: "min-content", justifyItems: "start" as const, marginTop: 0, width: "auto" }
};

export default function App() {
  const STORAGE_KEY = "mman1130StudyGameV1";

  type SavedState = {
    mode: "intro" | "quiz" | "results" | "review";
    questionBank: Question[];
    cursor: number;
    answers: { selectedIndex: number | null }[];
  };

  const readSaved = (): SavedState | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SavedState>;
      if (!parsed || !Array.isArray(parsed.questionBank) || !Array.isArray(parsed.answers)) return null;
      const qb = parsed.questionBank as Question[];
      const ans = parsed.answers as { selectedIndex: number | null }[];
      if (qb.length === 0 || qb.length !== ans.length) return null;
      const mode = (parsed.mode as SavedState["mode"]) ?? "intro";
      const cursor = typeof parsed.cursor === "number" ? Math.min(Math.max(0, parsed.cursor), qb.length - 1) : 0;
      return { mode, questionBank: qb, cursor, answers: ans };
    } catch {
      return null;
    }
  };

  const saved = readSaved();

  const [mode, setMode] = useState<"intro" | "quiz" | "results" | "review">(() => saved?.mode ?? "intro");
  const [questionBank, setQuestionBank] = useState<Question[]>(() => saved?.questionBank ?? DEFAULT_QUESTION_BANK);
  const [cursor, setCursor] = useState(() => saved?.cursor ?? 0);
  const [answers, setAnswers] = useState<{ selectedIndex: number | null }[]>(() =>
    saved?.answers ?? (saved?.questionBank ?? DEFAULT_QUESTION_BANK).map(() => ({ selectedIndex: null }))
  );
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const [unansweredIndex, setUnansweredIndex] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const quizKeyRef = useRef<HTMLDivElement>(null);

  const current = questionBank[cursor];
  const answeredCount = answers.filter(a => a.selectedIndex !== null).length;
  const isCorrect = (q: Question, sel: number | null) => sel !== null && sel === q.correctIndex;
  const correctCount = useMemo(() => answers.reduce((acc, a, i) => acc + (isCorrect(questionBank[i], a.selectedIndex) ? 1 : 0), 0), [answers, questionBank]);

  // Persist state whenever it changes
  useEffect(() => {
    try {
      const data: SavedState = { mode, questionBank, cursor, answers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [mode, questionBank, cursor, answers]);

  // Setup keyboard focus when entering quiz or changing question
  useEffect(() => {
    if (mode === "quiz") {
      const existing = answers[cursor]?.selectedIndex;
      setFocusIdx(existing === null || existing === undefined ? 0 : existing);
      requestAnimationFrame(() => {
        quizKeyRef.current?.focus();
      });
    }
  }, [mode, cursor]);

  const handleQuizKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mode !== "quiz") return;
    const len = questionBank[cursor]?.choices?.length ?? 0;
    if (len === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(i => (i + 1) % len);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(i => (i - 1 + len) % len);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (cursor < questionBank.length - 1) {
        goNext();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (cursor > 0) {
        goPrev();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = Math.max(0, Math.min(len - 1, focusIdx));
      selectChoice(idx);
      if (cursor < questionBank.length - 1) {
        goNext();
      } else {
        submitQuiz();
      }
    }
  };

  const startQuiz = () => {
    setAnswers(questionBank.map(() => ({ selectedIndex: null })));
    setCursor(0);
    setMode("quiz");
  };

  const selectChoice = (idx: number) => {
    const next = answers.slice();
    const currentSel = next[cursor]?.selectedIndex ?? null;
    // Toggle selection: clicking again deselects
    next[cursor] = { selectedIndex: currentSel === idx ? null : idx };
    setAnswers(next);
  };

  const goNext = () => setCursor(c => Math.min(questionBank.length - 1, c + 1));
  const goPrev = () => setCursor(c => Math.max(0, c - 1));

  const submitQuiz = () => {
    const unanswered = answers.findIndex(a => a.selectedIndex === null);
    if (unanswered !== -1) {
      setUnansweredIndex(unanswered);
      return;
    }
    setMode("review");
  };

  // ------- Import questions (drag & drop or browse) -------
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function coerceQuestion(raw: any, idx: number): Question {
    const prompt: string = String(raw.prompt ?? "");
    const rawChoices: any[] = Array.isArray(raw.choices) ? raw.choices : [];
    const choices: Choice[] = rawChoices.map((c, i) =>
      typeof c === "string"
        ? { label: LETTERS[i] ?? String.fromCharCode(65 + i), text: c }
        : {
            label: String(c.label ?? (LETTERS[i] ?? String.fromCharCode(65 + i))),
            text: String(c.text ?? "")
          }
    );
    const correctIndex: number =
      typeof raw.correctIndex === "number"
        ? raw.correctIndex
        : typeof raw.answerIndex === "number"
        ? raw.answerIndex
        : -1;
    const explanation = typeof raw.explanation === "string" ? raw.explanation : undefined;

    if (!prompt || choices.length < 2 || correctIndex < 0 || correctIndex >= choices.length) {
      throw new Error(`Invalid question at index ${idx}`);
    }

    return {
      id: typeof raw.id === "number" ? raw.id : idx + 1,
      prompt,
      choices,
      correctIndex,
      explanation
    };
  }

  function loadQuestionsFromJSONText(text: string) {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Root JSON must be an array of questions");
      const parsed: Question[] = data.map(coerceQuestion);
      setQuestionBank(parsed);
      setAnswers(parsed.map(() => ({ selectedIndex: null })));
      setCursor(0);
      setLoadStatus(`Loaded ${parsed.length} questions`);
    } catch (err: any) {
      setLoadStatus(`Failed to load: ${err?.message ?? String(err)}`);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const text = await file.text();
    loadQuestionsFromJSONText(text);
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    await handleFiles(e.dataTransfer?.files ?? null);
  };

  const handleBrowse = async (e: ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files);
    e.currentTarget.value = ""; // reset so same file can be chosen again
  };

  useEffect(() => {
    const onDragEnter = (e: DragEvent | DragEventInit | any) => {
      e.preventDefault?.();
      dragDepthRef.current += 1;
      setIsDragActive(true);
    };
    const onDragOver = (e: DragEvent | DragEventInit | any) => {
      e.preventDefault?.();
      if (!isDragActive) setIsDragActive(true);
    };
    const onDragLeave = (e: DragEvent | DragEventInit | any) => {
      e.preventDefault?.();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragActive(false);
    };
    const onDrop = (e: DragEvent | any) => {
      e.preventDefault?.();
      dragDepthRef.current = 0;
      setIsDragActive(false);
      const files = (e as any).dataTransfer?.files ?? null;
      if (files && files.length) {
        void handleFiles(files);
      }
    };

    window.addEventListener("dragenter", onDragEnter as any);
    window.addEventListener("dragover", onDragOver as any);
    window.addEventListener("dragleave", onDragLeave as any);
    window.addEventListener("drop", onDrop as any);
    return () => {
      window.removeEventListener("dragenter", onDragEnter as any);
      window.removeEventListener("dragover", onDragOver as any);
      window.removeEventListener("dragleave", onDragLeave as any);
      window.removeEventListener("drop", onDrop as any);
    };
  }, [isDragActive]);

  return (
    <div
      style={{
        background: "var(--page-bg)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
      }}
    >
      <div style={{ ...styles.container, width: "100%", maxWidth: 960 }}>
        <div style={{ ...styles.card, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={styles.h1}>MMAN1130 Study Game</h1>
            <div style={styles.topActions}>
              {mode === "quiz" && (
                <button style={styles.btn} onClick={() => setMode("intro")} onMouseDown={e => e.preventDefault()}>Main Menu</button>
              )}
              {(mode === "results" || mode === "review") && (
                <>
                  <button style={styles.btn} onClick={() => setMode("intro")} onMouseDown={e => e.preventDefault()}>Main Menu</button>
                  <button style={styles.btn} onClick={startQuiz} onMouseDown={e => e.preventDefault()}>Retry</button>
                </>
              )}
            </div>
          </div>

          {mode === "intro" && (
            <div>
              <p style={styles.p}>Answer all questions. You can change your selection at any time. After you press <b>Submit</b>, you’ll see your total score and a full review with the correct answers and explanations.</p>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                  border: "2px dashed #93c5fd",
                  background: "linear-gradient(180deg, #f8fbff 0%, #f0f9ff 100%)",
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 12
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Import questions (JSON)</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>Drag & drop a .json file here, or
                  <label style={{ color: "#2563eb", cursor: "pointer", marginLeft: 4 }}>
                    browse
                    <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={handleBrowse} />
                  </label>
                </div>
                {loadStatus && (
                  <div style={{ color: loadStatus.startsWith("Failed") ? "#b91c1c" : "#166534", fontSize: 12, marginTop: 6 }}>{loadStatus}</div>
                )}
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>Current set: {questionBank.length} questions.</div>
              </div>
              <div style={styles.btnRow}>
                <button style={styles.btnPrimary} onClick={startQuiz}>Start Quiz</button>
              </div>
            </div>
          )}

          {mode === "quiz" && (
            <div ref={quizKeyRef} tabIndex={0} onKeyDown={handleQuizKeyDown} style={{ outline: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={styles.h2}>Question {current.id} of {questionBank.length}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "#64748b", fontSize: 14 }}>Answered: {answeredCount}/{questionBank.length}</div>
                </div>
              </div>
              <div style={{ position: "relative", display: "block", paddingRight: 148 }}>
      <div>
                  <div style={styles.prompt}>{current.prompt}</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 12, paddingRight: 6 }}>
                    {current.choices.map((c, idx) => {
                      const sel = answers[cursor].selectedIndex;
                      const style = sel === idx ? { ...styles.choice, ...styles.choiceSelected } : styles.choice;
                      const finalStyle = idx === focusIdx ? { ...style, ...styles.choiceFocused } : style;
                      return (
                        <button key={idx} style={finalStyle} onClick={() => selectChoice(idx)} onMouseDown={e => e.preventDefault()}>
                          <strong style={{ marginRight: 8 }}>{c.label}.</strong> {c.text}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ ...styles.btnRow, alignItems: "center" }}>
                    <button style={styles.btn} onClick={goPrev} disabled={cursor === 0} onMouseDown={e => e.preventDefault()}>Previous</button>
                    {cursor < questionBank.length - 1 && (
                      <button style={styles.btn} onClick={goNext} onMouseDown={e => e.preventDefault()}>Next</button>
                    )}
                    {(answeredCount === questionBank.length || cursor === questionBank.length - 1) && (
                      <button style={styles.btnPrimary} onClick={submitQuiz} onMouseDown={e => e.preventDefault()}>Submit</button>
                    )}
                    <div style={{ marginLeft: "auto", marginRight: 8, color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>No answers revealed until you submit.</div>
                  </div>
                </div>
                <aside style={styles.sidebar} aria-label="Question navigator">
                  <div style={{ ...styles.navWrap, position: "sticky", top: 0 }} data-hide-scrollbar>
                    <div style={{ ...styles.navColFixed, paddingTop: 0 }}>
                      {questionBank.filter((_, i) => i % 2 === 0).map((q, colIndex) => {
                        const i = colIndex * 2;
                        const sel = answers[i].selectedIndex;
                        const isActive = cursor === i;
                        const isAnswered = sel !== null;
                        const base = { textAlign: "center" as const };
                        const chipStyle = isActive
                          ? { ...styles.qChip, ...base, border: "2px solid #0f172a", fontWeight: 700, boxShadow: "0 0 0 2px var(--chip-active-outline, #ffffff)" }
                          : isAnswered
                          ? { ...styles.qChip, ...base, border: "1px solid #93c5fd", background: "linear-gradient(90deg, rgba(186,230,253,0.55) 0%, rgba(221,214,254,0.55) 100%)" }
                          : { ...styles.qChip, ...base };
                        return (
                          <button key={q.id} style={chipStyle} onClick={() => setCursor(i)} onMouseDown={e => e.preventDefault()}>
                            Q{q.id}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ ...styles.navColFixedRight, paddingTop: 17 }}>
                      {questionBank.filter((_, i) => i % 2 === 1).map((q, colIndex) => {
                        const i = colIndex * 2 + 1;
                        const sel = answers[i].selectedIndex;
                        const isActive = cursor === i;
                        const isAnswered = sel !== null;
                        const base = { textAlign: "center" as const };
                        const chipStyle = isActive
                          ? { ...styles.qChip, ...base, border: "2px solid #0f172a", fontWeight: 700, boxShadow: "0 0 0 2px var(--chip-active-outline, #ffffff)" }
                          : isAnswered
                          ? { ...styles.qChip, ...base, border: "1px solid #93c5fd", background: "linear-gradient(90deg, rgba(186,230,253,0.55) 0%, rgba(221,214,254,0.55) 100%)" }
                          : { ...styles.qChip, ...base };
                        return (
                          <button key={q.id} style={chipStyle} onClick={() => setCursor(i)} onMouseDown={e => e.preventDefault()}>
                            Q{q.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </aside>
      </div>
              {unansweredIndex !== null && (
                <div
                  role="dialog"
                  aria-modal
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(2,6,23,0.45)",
                    backdropFilter: "blur(2px)"
                  }}
                >
                  <div style={{ ...styles.card, width: "min(560px, 92vw)", boxShadow: "0 24px 60px rgba(2,6,23,0.35)" }}>
                    <h3 style={{ ...styles.h2, marginBottom: 6 }}>Unanswered questions</h3>
                    <div style={{ color: "#475569" }}>You still have unanswered questions (first at Q{unansweredIndex + 1}).</div>
                  <div style={{ ...styles.btnRow, marginTop: 16, userSelect: "none" as const }}>
                      <button
                        style={styles.btn}
                        onClick={() => { setCursor(unansweredIndex); setUnansweredIndex(null); }}
                      >
                        Go to Q{unansweredIndex + 1}
                      </button>
                      <button
                        style={styles.btnPrimary}
                        onClick={() => { setUnansweredIndex(null); setMode("results"); }}
                      >
                        Submit anyway
        </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === "results" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={styles.h2}>Results & Review</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>You scored <b>{correctCount}</b> / {questionBank.length}</div>
                </div>
              </div>
              <div style={{ color: "#64748b", marginBottom: 8 }}>Your answer vs. the correct one. Explanations are shown.</div>
              <div style={{ display: "grid", gap: 12, width: "100%" }}>
                {questionBank.map((q, i) => {
                  const sel = answers[i].selectedIndex;
                  const correct = isCorrect(q, sel);
                  return (
                    <div key={q.id} style={{ ...styles.card, width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700 }}>Q{q.id}</div>
                        <span style={{ ...styles.pill, background: correct ? "#dcfce7" : "#fee2e2", color: correct ? "#166534" : "#991b1b" }}>
                          {correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <div style={{ marginTop: 6 }}>{q.prompt}</div>
                      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                        {q.choices.map((c, idx) => {
                          const isRight = idx === q.correctIndex;
                          const isMine = idx === sel;
                          const chipStyle = isRight
                            ? { border: "2px solid #86efac", background: "radial-gradient(600px 300px at 10% 20%, rgba(187,247,208,0.65), rgba(187,247,208,0) 60%), linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)" }
                            : isMine && !isRight
                            ? { border: "2px solid #fecaca", background: "radial-gradient(600px 300px at 10% 20%, rgba(254,226,226,0.65), rgba(254,226,226,0) 60%), linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)" }
                            : {};
                          return (
                            <div key={idx} style={{ ...styles.choice, cursor: "default", userSelect: "none", ...chipStyle }}>
                              <strong style={{ marginRight: 8 }}>{c.label}.</strong> {c.text}
                              {isRight && <span style={{ marginLeft: 8, fontSize: 12, color: "#166534" }}>(correct)</span>}
                              {isMine && !isRight && <span style={{ marginLeft: 8, fontSize: 12, color: "#991b1b" }}>(your answer)</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 14 }}>
                        <b>Explanation:</b> {q.explanation || <span style={{ color: "#64748b" }}>(Not provided)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ ...styles.btnRow, justifyContent: "flex-end" }}>
                <button style={styles.btn} onClick={() => setMode("intro")} onMouseDown={e => e.preventDefault()}>Main Menu</button>
                <button style={styles.btn} onClick={startQuiz} onMouseDown={e => e.preventDefault()}>Retry</button>
              </div>
            </div>
          )}

          {mode === "review" && (
            <div>
              <h2 style={styles.h2}>Review</h2>
              <div style={{ color: "#64748b", marginBottom: 8 }}>Your answer vs. the correct one. Explanations are shown.</div>
              <div style={{ display: "grid", gap: 12, width: "100%" }}>
                {questionBank.map((q, i) => {
                  const sel = answers[i].selectedIndex;
                  const correct = isCorrect(q, sel);
                  return (
                    <div key={q.id} style={{ ...styles.card, width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700 }}>Q{q.id}</div>
                        <span style={{ ...styles.pill, background: correct ? "#dcfce7" : "#fee2e2", color: correct ? "#166534" : "#991b1b" }}>
                          {correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <div style={{ marginTop: 6 }}>{q.prompt}</div>
                      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                        {q.choices.map((c, idx) => {
                          const isRight = idx === q.correctIndex;
                          const isMine = idx === sel;
                          const chipStyle = isRight
                            ? {
                                border: "2px solid #86efac",
                                background:
                                  "radial-gradient(600px 300px at 10% 20%, rgba(187,247,208,0.65), rgba(187,247,208,0) 60%), " +
                                  "linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)"
                              }
                            : isMine && !isRight
                            ? {
                                border: "2px solid #fecaca",
                                background:
                                  "radial-gradient(600px 300px at 10% 20%, rgba(254,226,226,0.65), rgba(254,226,226,0) 60%), " +
                                  "linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)"
                              }
                            : {};
                          return (
                            <div key={idx} style={{ ...styles.choice, cursor: "default", userSelect: "none", ...chipStyle }}>
                              <strong style={{ marginRight: 8 }}>{c.label}.</strong> {c.text}
                              {isRight && <span style={{ marginLeft: 8, fontSize: 12, color: "#166534" }}>(correct)</span>}
                              {isMine && !isRight && <span style={{ marginLeft: 8, fontSize: 12, color: "#991b1b" }}>(your answer)</span>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 14 }}>
                        <b>Explanation:</b> {q.explanation || <span style={{ color: "#64748b" }}>(Not provided)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={styles.btnRow}>
                <button style={styles.btn} onClick={() => setMode("intro")}>Main Menu</button>
                <button style={styles.btn} onClick={() => setMode("results")}>Back to Results</button>
                <button style={styles.btn} onClick={startQuiz} onMouseDown={e => e.preventDefault()}>Retry Quiz</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 12 }}>Runs entirely in your browser here. No external libraries.</div>
      </div>
      {isDragActive && (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={async e => {
            e.preventDefault();
            setIsDragActive(false);
            await handleFiles(e.dataTransfer?.files ?? null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(60% 40% at 20% 10%, rgba(186,230,253,0.35), rgba(186,230,253,0) 60%), " +
              "radial-gradient(60% 40% at 80% 20%, rgba(221,214,254,0.35), rgba(221,214,254,0) 60%), " +
              "rgba(15,23,42,0.25)",
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100vw",
              height: "100vh",
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center" as const,
              color: "#0f172a",
              background:
                "linear-gradient(180deg, rgba(248,251,255,0.85) 0%, rgba(238,242,255,0.85) 100%)"
            }}
          >
            {/* Pulsing radial wave that scales inward (3x -> 1x) */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "35vmax",
                height: "35vmax",
                borderRadius: "9999px",
                background: "radial-gradient(circle, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0.25) 40%, rgba(147,197,253,0) 70%)",
                animation: "dropPulseIn 2s linear infinite",
                pointerEvents: "none"
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "35vmax",
                height: "35vmax",
                borderRadius: "9999px",
                background: "radial-gradient(circle, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0.25) 40%, rgba(147,197,253,0) 70%)",
                animation: "dropPulseIn 2s linear infinite",
                animationDelay: "1s",
                pointerEvents: "none"
              }}
            />

            <div>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={{ display: "block", margin: "0 auto 10px" }}>
                {/* Box */}
                <rect x="5" y="13" width="14" height="6" rx="1.5" stroke="#3b82f6" strokeWidth="1.8" fill="none" />
                {/* Arrow into box */}
                <path d="M12 5v8m0 0-3-3m3 3 3-3" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Drop your JSON anywhere</div>
              <div style={{ color: "#475569", fontSize: 14 }}>Release to import and replace the current question set</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
