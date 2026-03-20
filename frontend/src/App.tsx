import React, { useState, useRef } from "react";
import { 
  Upload, FileText, CheckCircle, AlertCircle, BookOpen, 
  ChevronRight, Loader2, Info, Download, Target, 
  Clock, Zap, ExternalLink, Layout, Code, Sparkles,
  BarChart3, Calendar, GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from "jspdf";
import { domToPng } from "modern-screenshot";

interface Skill {
  skill: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

interface Gap {
  skill: string;
  status: "Covered" | "Partial" | "Missing";
  reason: string;
}

interface RoadmapItem {
  week: string;
  title: string;
  description: string;
  duration: string;
  priority: "High" | "Medium" | "Optional";
  link: string;
}

interface AnalysisResult {
  domain: "Engineering" | "Management" | "Pharma" | "Arts" | "General";
  candidate_skills: Skill[];
  required_skills: string[];
  gap: Gap[];
  roadmap: RoadmapItem[];
  readiness_score: number;
  total_learning_time: string;
  mini_project: {
    title: string;
    description: string;
  };
  reasoning_trace: string;
}

const ROLE_TEMPLATES = [
  {
    title: "Frontend Developer",
    domain: "Engineering",
    jd: "Required skills: React, TypeScript, Tailwind CSS, Responsive Design, State Management (Redux/Zustand), Unit Testing (Jest/Vitest), Performance Optimization, Web Accessibility (a11y)."
  },
  {
    title: "Data Analyst",
    domain: "Engineering",
    jd: "Required skills: Python, SQL, Pandas, NumPy, Data Visualization (Matplotlib/Seaborn/Tableau), Statistical Analysis, Machine Learning Basics, Excel (Advanced)."
  },
  {
    title: "Marketing Manager",
    domain: "Management",
    jd: "Required skills: Digital Marketing, SEO/SEM, Content Strategy, Brand Management, Market Research, Team Leadership, Budgeting, CRM (HubSpot/Salesforce), Analytics (GA4)."
  },
  {
    title: "Clinical Research Assoc.",
    domain: "Pharma",
    jd: "Required skills: Clinical Trials, GCP (Good Clinical Practice), Pharmacovigilance, Regulatory Affairs, Medical Writing, Data Management, Drug Safety, Protocol Development."
  },
  {
    title: "Graphic Designer",
    domain: "Arts",
    jd: "Required skills: Adobe Creative Suite (Photoshop, Illustrator, InDesign), Typography, Layout Design, Branding, Visual Storytelling, UI/UX Basics, Color Theory, Motion Graphics."
  },
  {
    title: "Project Coordinator",
    domain: "Management",
    jd: "Required skills: Project Planning, Agile/Scrum, Stakeholder Management, Risk Assessment, Resource Allocation, Communication, Documentation, MS Project/Jira."
  }
];

const DOMAINS = ["Engineering", "Management", "Pharma", "Arts", "General"];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("General");
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTemplateSelect = (templateJd: string, domain: string) => {
    setJd(templateJd);
    setSelectedDomain(domain);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a resume.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const extractResponse = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || "Failed to extract text from PDF.");
      }

      const { text: resumeText } = await extractResponse.json();

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
      }

      const genAI = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Analyze the following resume and job description to perform a deep skill gap analysis and generate a professional onboarding roadmap.
        
        TARGET DOMAIN: ${selectedDomain}
        
        RESUME TEXT:
        ${resumeText}
        
        JOB DESCRIPTION:
        ${jd || "General career growth and skill improvement."}
        
        INSTRUCTIONS:
        1. Detect the most relevant domain (Engineering, Management, Pharma, Arts) if "General" is selected.
        2. Extract candidate's current skills with level (Beginner, Intermediate, Advanced).
        3. Identify required skills from JD specific to the domain.
        4. Perform gap analysis for each required skill (Covered, Partial, Missing).
        5. Generate a timeline-based roadmap (Week 1, Week 2, etc.) with domain-specific resources.
        6. Suggest a Capstone Mini Project that is highly relevant to the ${selectedDomain} industry.
        7. Calculate a readiness score (0-100).
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              domain: { type: Type.STRING, enum: ["Engineering", "Management", "Pharma", "Arts", "General"] },
              candidate_skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    level: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                  },
                  required: ["skill", "level"],
                },
              },
              required_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              gap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ["Covered", "Partial", "Missing"] },
                    reason: { type: Type.STRING },
                  },
                  required: ["skill", "status", "reason"],
                },
              },
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    week: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["High", "Medium", "Optional"] },
                    link: { type: Type.STRING },
                  },
                  required: ["week", "title", "description", "duration", "priority", "link"],
                },
              },
              readiness_score: { type: Type.NUMBER },
              total_learning_time: { type: Type.STRING },
              mini_project: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
              reasoning_trace: { type: Type.STRING },
            },
            required: [
              "domain", "candidate_skills", "required_skills", "gap", "roadmap", 
              "readiness_score", "total_learning_time", "mini_project", "reasoning_trace"
            ],
          },
        },
      });

      const analysisResult = JSON.parse(response.text);
      setResult(analysisResult);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setPdfGenerating(true);
    try {
      const imgData = await domToPng(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        style: {
          margin: "0",
          padding: "0",
          width: "1200px", // Fixed width for consistent capture
        }
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if the content is significantly longer than one page
      // Using a 2mm threshold to avoid extra blank pages from tiny overflows
      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save("onboarding-report.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-6 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">OnboardAI <span className="text-emerald-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {result && (
              <button
                onClick={downloadPDF}
                disabled={pdfGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all shadow-sm disabled:opacity-70"
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Report
                  </>
                )}
              </button>
            )}
            <div className="text-sm text-stone-500 font-medium hidden sm:block">Hackathon Build 🚀</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Layout className="w-5 h-5 text-emerald-600" />
                Configuration
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Resume (PDF)</label>
                  <div className="relative border-2 border-dashed border-stone-200 rounded-xl p-6 transition-colors hover:border-emerald-400 group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                      <p className="text-xs text-stone-600 truncate">
                        {file ? file.name : "Click or drag resume"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Target Domain</label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDomain(d)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                          selectedDomain === d 
                            ? "bg-stone-900 text-white border-stone-900" 
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Role Templates</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_TEMPLATES.map((role) => (
                      <button
                        key={role.title}
                        onClick={() => handleTemplateSelect(role.jd, role.domain)}
                        className={`text-left p-2 text-[10px] border rounded-lg transition-all ${
                          jd === role.jd 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" 
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <div className="opacity-50 text-[8px] uppercase mb-0.5">{role.domain}</div>
                        {role.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Job Description</label>
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Paste JD or select a template..."
                    className="w-full h-32 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-xs"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || !file}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div ref={reportRef} className="bg-white p-10 rounded-2xl space-y-8 overflow-hidden">
                    {/* Dashboard Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Detected Domain:</span>
                      <span className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-full uppercase">
                        {result.domain}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center">
                      <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Readiness Score</h3>
                      <div className="relative w-20 h-20 mt-3">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-stone-100 stroke-current"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-500 stroke-current"
                            strokeWidth="3"
                            strokeDasharray={`${result.readiness_score}, 100`}
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold">{result.readiness_score}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center">
                      <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Learning Time</h3>
                      <Clock className="w-8 h-8 text-emerald-600 mt-3 mb-1" />
                      <p className="text-xl font-bold text-stone-900">{result.total_learning_time}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center">
                      <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Skill Level</h3>
                      <GraduationCap className="w-8 h-8 text-emerald-600 mt-3 mb-1" />
                      <p className="text-xl font-bold text-stone-900">
                        {result.candidate_skills.length > 0 ? result.candidate_skills[0].level : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Skill Analysis Dashboard */}
                  <section className="bg-white p-8 rounded-2xl border border-stone-200">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      Visual Skill Dashboard
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.gap.map((item, idx) => (
                        <div key={idx} className="p-4 border border-stone-100 rounded-xl transition-all group bg-stone-50/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-stone-900 text-sm">{item.skill}</span>
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              item.status === "Covered" ? "bg-emerald-100 text-emerald-700" :
                              item.status === "Partial" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 leading-relaxed italic">
                            {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Timeline Roadmap */}
                  <section className="bg-white p-8 rounded-2xl border border-stone-200">
                    <h3 className="text-lg font-semibold mb-8 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Timeline-Based Roadmap
                    </h3>
                    <div className="relative space-y-12">
                      <div className="absolute left-4 top-2 bottom-2 w-px bg-stone-100" />
                      {result.roadmap.map((item, idx) => (
                        <div key={idx} className="relative pl-12 group">
                          <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10 group-hover:bg-emerald-500 transition-all">
                            <span className="text-[10px] font-bold group-hover:text-white">{idx + 1}</span>
                          </div>
                          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 group-hover:border-emerald-200 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{item.week}</span>
                                <h4 className="font-bold text-stone-900">{item.title}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  item.priority === "High" ? "bg-red-100 text-red-600" :
                                  item.priority === "Medium" ? "bg-amber-100 text-amber-600" :
                                  "bg-stone-200 text-stone-600"
                                }`}>
                                  {item.priority}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-medium text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-100">
                                  <Clock className="w-3 h-3" />
                                  {item.duration}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-stone-600 mb-4 leading-relaxed">{item.description}</p>
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              Explore Course <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Mini Project Suggestion */}
                  <section className="bg-emerald-600 text-white p-8 rounded-2xl border border-emerald-500">
                    <div className="flex items-center gap-3 mb-4">
                      <Code className="w-6 h-6" />
                      <h3 className="text-lg font-bold">Capstone Mini Project</h3>
                    </div>
                    <h4 className="text-xl font-semibold mb-2">{result.mini_project.title}</h4>
                    <p className="text-emerald-50 opacity-90 text-sm leading-relaxed">
                      {result.mini_project.description}
                    </p>
                  </section>

                  {/* Reasoning Trace */}
                  <section className="bg-stone-900 text-stone-300 p-8 rounded-2xl border border-stone-800">
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-emerald-400" />
                      AI Reasoning Trace
                    </h3>
                    <div className="font-mono text-[10px] leading-relaxed opacity-80 whitespace-pre-wrap">
                      {result.reasoning_trace}
                    </div>
                  </section>
                </div>
              </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <Loader2 className={`w-8 h-8 text-stone-300 ${loading ? 'animate-spin' : ''}`} />
                  </div>
                  <h3 className="text-lg font-medium text-stone-900">Ready for Analysis</h3>
                  <p className="text-sm text-stone-500 mt-2 max-w-xs">
                    Upload your resume and select a role template to generate your personalized onboarding roadmap.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
