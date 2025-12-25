import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

interface ActionPlanPhase {
  actions: string[];
  deliverable: string;
  why_now: string;
}

interface ActionPlan {
  weeks_1_4: ActionPlanPhase | ActionPlanPhase[]; 
  weeks_5_8: ActionPlanPhase | ActionPlanPhase[];
  weeks_9_12: ActionPlanPhase | ActionPlanPhase[];
}

interface Gap {
  missing: string;
  importance: "High" | "Medium" | "Low";
  reason: string;
}

interface DistanceMap {
  skill_gaps: Gap[];
  experience_gaps: Gap[];
  role_exposure_gaps: Gap[];
  business_impact_gaps: Gap[];
}

interface DecisionOption {
  likelihood: "Low" | "Medium" | "High";
  upside: string;
  risk: string;
  best_for: string;
  avoid_when: string;
}

interface SkillRoi {
  skill: string;
  roi: "Career Accelerator" | "Hygiene Requirement" | "Optional / Low ROI";
  time_to_impact: string;
}

interface FailureMode {
  mistake: string;
  impact: string;
  avoidance: string;
}

interface CareerResponse {
  career_snapshot: string;
  career_distance_map: DistanceMap;
  reality_check: string;
  age_stage_context: string;
  "90_day_action_plan": any; 
  decision_simulator: {
    option_a: DecisionOption;
    option_b: DecisionOption;
    option_c: DecisionOption;
  };
  positioning_strategy: string;
  skill_roi_prioritization: SkillRoi[];
  common_failure_modes: FailureMode[];
  long_term_sustainability: string;
  executive_summary: string[];
}

// --- Icons (SVGs) ---

const IconMap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);
const IconTarget = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const IconBriefcase = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const IconBrain = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);
const IconRocket = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);
const IconDownload = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const IconLinkedin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
)

// --- Constants ---

const SYSTEM_PROMPT = `
🔥 CAREER GPS — ABSOLUTE MASTER SYSTEM PROMPT

You are the world's most advanced Career Strategy AI, designed to analyze careers across the ENTIRE spectrum: from Students/Graduates -> Early Career -> Mid-Senior Management -> Executives -> Pre-Retirement/Retirement Transitions.

CONTEXT:
The user will provide their Current Role, Experience, Industry, Target, and Time Horizon.

YOUR TASK:
Generate a strategic career analysis formatted strictly as JSON.

AUDIENCE SPECIFIC GUIDANCE:
1. STUDENTS / FRESHERS: Focus on breaking in, internships, foundational skills, and signaling value.
2. EARLY CAREER: Focus on rapid growth, mentorship, exposure, and avoiding pigeonholing.
3. MID-CAREER: Focus on specialization, leadership transition, leverage, and income maximization.
4. LATE CAREER / RETIREMENT: Focus on legacy, board roles, consulting, knowledge transfer, financial sustainability, and "retirement now" planning.

📦 OUTPUT FORMAT (STRICT JSON ONLY)
{
  "career_snapshot": "String (2-3 sentences analysis of current standing)",
  "career_distance_map": {
    "skill_gaps": [{ "missing": "String", "importance": "High|Medium|Low", "reason": "String" }],
    "experience_gaps": [{ "missing": "String", "importance": "High|Medium|Low", "reason": "String" }],
    "role_exposure_gaps": [{ "missing": "String", "importance": "High|Medium|Low", "reason": "String" }],
    "business_impact_gaps": [{ "missing": "String", "importance": "High|Medium|Low", "reason": "String" }]
  },
  "reality_check": "String (Brutally honest assessment of feasibility)",
  "age_stage_context": "String (Specific advice for their age/career stage)",
  "90_day_action_plan": {
    "weeks_1_4": { "actions": ["String"], "deliverable": "String", "why_now": "String" },
    "weeks_5_8": { "actions": ["String"], "deliverable": "String", "why_now": "String" },
    "weeks_9_12": { "actions": ["String"], "deliverable": "String", "why_now": "String" }
  },
  "decision_simulator": {
    "option_a": { "likelihood": "Low|Medium|High", "upside": "String", "risk": "String", "best_for": "String", "avoid_when": "String" },
    "option_b": { "likelihood": "Low|Medium|High", "upside": "String", "risk": "String", "best_for": "String", "avoid_when": "String" },
    "option_c": { "likelihood": "Low|Medium|High", "upside": "String", "risk": "String", "best_for": "String", "avoid_when": "String" }
  },
  "positioning_strategy": "String",
  "skill_roi_prioritization": [{ "skill": "String", "roi": "Career Accelerator|Hygiene Requirement|Optional / Low ROI", "time_to_impact": "String" }],
  "common_failure_modes": [{ "mistake": "String", "impact": "String", "avoidance": "String" }],
  "long_term_sustainability": "String",
  "executive_summary": ["String", "String", "String"]
}
Rules:
❌ No markdown in values
❌ No emojis in values (unless specified)
❌ No explanations outside JSON
`;

// --- Helpers ---

const formatPhaseName = (key: string) => {
    // Converts "weeks_1_4" -> "Weeks 1-4"
    if (key.includes("weeks_")) {
        const parts = key.match(/weeks_(\d+)_(\d+)/);
        if (parts) {
            return `Weeks ${parts[1]}-${parts[2]}`;
        }
    }
    return key.replace(/_/g, " ");
};

// --- Components ---

const ProgressBar = ({ value, color = "bg-blue-600" }: { value: number, color?: string }) => (
    <div className="w-full bg-slate-800 rounded-full h-2.5 print:bg-slate-200">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
);

const Badge = ({ children, type, lightMode = false }: { children?: React.ReactNode, type: string, lightMode?: boolean }) => {
    let colors = "bg-slate-700 text-slate-200";
    if (type === "high" || type === "Career Accelerator") colors = "bg-emerald-900/50 text-emerald-400 border border-emerald-800";
    if (type === "medium" || type === "Hygiene Requirement") colors = "bg-amber-900/50 text-amber-400 border border-amber-800";
    if (type === "low" || type === "Optional / Low ROI") colors = "bg-slate-800 text-slate-400 border border-slate-700";
    
    // Light mode overrides for PDF
    if (lightMode) {
        if (type === "high" || type === "Career Accelerator") colors = "bg-emerald-100 text-emerald-800 border border-emerald-200 !text-emerald-800 !bg-emerald-100";
        else if (type === "medium" || type === "Hygiene Requirement") colors = "bg-amber-100 text-amber-800 border border-amber-200 !text-amber-800 !bg-amber-100";
        else colors = "bg-slate-100 text-slate-600 border border-slate-200 !text-slate-600 !bg-slate-100";
    }

    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${colors}`}>
            {children}
        </span>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2 mt-8 print:border-slate-300">
        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 print:text-blue-700 print:bg-blue-100">
            <Icon />
        </div>
        <h2 className="text-xl font-bold text-slate-100 print:text-slate-900">{title}</h2>
    </div>
);

// --- Print Specific Components ---

const PdfPage = ({ children, pageNum }: { children?: React.ReactNode, pageNum: number }) => (
    <div className="pdf-page bg-white w-[210mm] min-h-[297mm] p-[15mm] flex flex-col relative shadow-lg mx-auto mb-8 text-slate-900 page-break-after-always">
        <div className="flex-grow text-slate-900">
            {children}
        </div>
        
        {/* Persistent Footer on every page */}
        <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-700">Career GPS</span>
                 <span className="text-slate-300">|</span>
                 <span>Strategic Report</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">
                    Created by <a href="https://www.linkedin.com/in/yadavritik" className="text-blue-600 font-bold no-underline">Ritik</a>
                </span>
                <span className="text-slate-300">•</span>
                <span>Page {pageNum}</span>
            </div>
        </div>
    </div>
);

const PrintLayout = ({ result, inputs }: { result: CareerResponse, inputs: any }) => {
    return (
        // VISIBLE OVERLAY STRATEGY
        // Instead of hiding off-screen, we position this on TOP of everything (z-index 9999)
        // This ensures html2canvas captures it perfectly.
        // It has a white background to cover the app.
        <div id="print-container" className="absolute top-0 left-0 w-full min-h-screen bg-slate-100 z-[9999] text-slate-900 flex justify-center py-8">
             <style>{`
                #print-container * {
                    color: #0f172a !important; 
                    border-color: #e2e8f0;
                }
                #print-container .text-blue-600, #print-container .text-blue-600 * { color: #2563eb !important; }
                #print-container .text-emerald-600, #print-container .text-emerald-600 * { color: #059669 !important; }
                #print-container .text-amber-600, #print-container .text-amber-600 * { color: #d97706 !important; }
                #print-container .text-red-600, #print-container .text-red-600 * { color: #dc2626 !important; }
                #print-container .bg-slate-50 { background-color: #f8fafc !important; }
                #print-container .bg-white { background-color: #ffffff !important; }
                #print-container .text-slate-500 { color: #64748b !important; }
                #print-container .text-slate-400 { color: #94a3b8 !important; }
                .pdf-page { page-break-after: always; }
            `}</style>
            
            <div className="w-[210mm]">
                {/* Page 1: Executive Summary & Context */}
                <PdfPage pageNum={1}>
                    <div className="border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Career Strategy Report</h1>
                                <p className="text-slate-500 text-sm">Generated by Career GPS</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">{inputs.role}</div>
                                <div className="text-xs text-slate-500">{inputs.experience} Exp • {inputs.industry}</div>
                                <div className="text-xs text-blue-600 font-medium mt-1">Target: {inputs.target}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Executive Summary</h3>
                        <div className="space-y-3">
                            {result.executive_summary.map((point, i) => (
                                <div key={i} className="flex gap-3 text-slate-800">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span className="leading-relaxed font-medium text-slate-900">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-3">Positioning Snapshot</h3>
                        <p className="text-slate-700 leading-relaxed text-sm text-justify">
                            {result.career_snapshot}
                        </p>
                    </div>

                    <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mb-6">
                        <h3 className="text-sm font-bold text-amber-800 uppercase mb-2">Stage Context</h3>
                        <p className="text-sm text-amber-900">{result.age_stage_context}</p>
                    </div>
                </PdfPage>

                {/* Page 2: Distance Map & Reality Check */}
                <PdfPage pageNum={2}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-blue-600"><IconMap /></span> Career Distance Map
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {Object.entries(result.career_distance_map).map(([key, gaps]) => (
                            <div key={key} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-100 pb-2">
                                    {key.replace(/_/g, " ")}
                                </h3>
                                <div className="space-y-3">
                                    {(gaps as Gap[]).map((gap, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-start gap-1 mb-1">
                                                <span className="text-slate-800 font-bold text-xs">{gap.missing}</span>
                                                <Badge type={gap.importance.toLowerCase()} lightMode={true}>{gap.importance}</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">{gap.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`p-5 rounded-lg border ${result.reality_check.toLowerCase().includes("not realistic") ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                        <h3 className="text-sm font-bold uppercase mb-2 text-slate-700">Reality Check</h3>
                        <p className="text-sm text-slate-800 leading-relaxed">{result.reality_check}</p>
                    </div>
                </PdfPage>

                {/* Page 3: Decision Simulator & Strategy */}
                <PdfPage pageNum={3}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-purple-600"><IconBrain /></span> Decision Simulator
                    </h2>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {Object.entries(result.decision_simulator).map(([key, opt]) => {
                            const option = opt as DecisionOption;
                            return (
                                <div key={key} className="border border-slate-200 rounded-lg p-4 flex gap-4">
                                    <div className="w-1/3 border-r border-slate-100 pr-4">
                                        <h3 className="text-lg font-bold capitalize text-slate-900 mb-1">{key.replace("_", " ")}</h3>
                                        <div className="mb-2">
                                            <span className="text-xs text-slate-500">Success Probability</span>
                                            <div className="flex items-center gap-2 font-bold text-sm">
                                                <span className={`${option.likelihood === "High" ? "text-emerald-600" : option.likelihood === "Medium" ? "text-amber-600" : "text-red-600"}`}>{option.likelihood}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                                            <strong>Best for:</strong> {option.best_for}
                                        </div>
                                    </div>
                                    <div className="w-2/3 space-y-2 text-xs">
                                        <div>
                                            <span className="text-emerald-700 font-bold block">UPSIDE</span>
                                            <p className="text-slate-700">{option.upside}</p>
                                        </div>
                                        <div>
                                            <span className="text-red-700 font-bold block">RISK</span>
                                            <p className="text-slate-700">{option.risk}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Positioning Strategy</h3>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.positioning_strategy}</p>
                    </div>
                </PdfPage>

                {/* Page 4: 90 Day Plan */}
                <PdfPage pageNum={4}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-emerald-600"><IconRocket /></span> 90-Day Execution Plan
                    </h2>

                    <div className="space-y-6">
                        {Object.entries(result["90_day_action_plan"]).map(([phase, data]: [string, any], idx) => (
                            <div key={phase} className="flex gap-4">
                                <div className="w-12 flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                        {idx + 1}
                                    </div>
                                    {idx < 2 && <div className="w-0.5 bg-slate-200 flex-grow my-2"></div>}
                                </div>
                                <div className="flex-grow bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 capitalize mb-1">{formatPhaseName(phase)}</h3>
                                    <div className="text-xs font-semibold text-blue-600 mb-3 bg-blue-50 inline-block px-2 py-1 rounded">
                                        Deliverable: {data.deliverable}
                                    </div>
                                    <ul className="space-y-2 mb-3">
                                        {Array.isArray(data.actions) && data.actions.map((action: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <span className="mt-1 text-green-500 shrink-0"><IconCheck /></span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-xs text-slate-400 italic">Why now? {data.why_now}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </PdfPage>

                {/* Page 5: Skills & Sustainability */}
                <PdfPage pageNum={5}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-indigo-600"><IconBriefcase /></span> Skills & Sustainability
                    </h2>

                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">High ROI Skill Prioritization</h3>
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="p-3 border border-slate-200">Action / Skill</th>
                                    <th className="p-3 border border-slate-200">Category</th>
                                    <th className="p-3 border border-slate-200">Time to Impact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.skill_roi_prioritization.map((item, idx) => (
                                    <tr key={idx} className="border border-slate-200">
                                        <td className="p-3 font-medium text-slate-900">{item.skill}</td>
                                        <td className="p-3">
                                            <Badge type={item.roi} lightMode={true}>{item.roi}</Badge>
                                        </td>
                                        <td className="p-3 text-slate-500">{item.time_to_impact}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-red-800 uppercase mb-3 flex items-center gap-2"><IconAlert/> Failure Modes</h3>
                            <div className="space-y-3">
                                {result.common_failure_modes.map((mode, i) => (
                                    <div key={i}>
                                        <p className="text-xs font-bold text-red-700">"{mode.mistake}"</p>
                                        <p className="text-[10px] text-red-600/80 mb-1">{mode.impact}</p>
                                        <p className="text-[10px] text-slate-600 bg-white/50 p-1 rounded inline-block">Fix: {mode.avoidance}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-emerald-800 uppercase mb-3">Long-Term Sustainability</h3>
                            <p className="text-xs text-emerald-900 leading-relaxed text-justify">
                                {result.long_term_sustainability}
                            </p>
                        </div>
                    </div>
                </PdfPage>
            </div>
        </div>
    );
}

// --- Main Application ---

const App = () => {
    const [step, setStep] = useState<"input" | "loading" | "results">("input");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CareerResponse | null>(null);

    // Form State
    const [role, setRole] = useState("");
    const [experience, setExperience] = useState("");
    const [industry, setIndustry] = useState("");
    const [target, setTarget] = useState("");
    const [horizon, setHorizon] = useState("1 year");

    // Refs
    const resultsRef = useRef<HTMLDivElement>(null);
    // State to trigger download only after render
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setStep("loading");

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = "gemini-3-flash-preview";

            const userPrompt = `
User Input:
1. Current role: ${role}
2. Total experience: ${experience}
3. Industry: ${industry}
4. Desired role: ${target}
5. Time horizon: ${horizon}
            `;

            const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

            const response = await ai.models.generateContent({
                model: model,
                contents: fullPrompt,
                config: {
                  responseMimeType: "application/json"
                }
            });

            const text = response.text;
            if (!text) throw new Error("No response generated");
            
            // Basic cleanup if model wraps in markdown
            const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
            const data: CareerResponse = JSON.parse(jsonStr);
            
            setResult(data);
            setStep("results");
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        } catch (err: any) {
            console.error("Error generating career advice:", err);
            setError(err.message || "Failed to generate career strategy. Please try again.");
            setStep("input");
        }
    };

    const downloadReport = async () => {
        if (!result) return;
        setIsDownloading(true);

        // Scroll to top to ensure html2canvas captures from top
        window.scrollTo(0, 0);

        // Wait for PrintLayout to be rendered in the DOM
        setTimeout(() => {
            const element = document.getElementById('print-container');
            const innerElement = element?.firstElementChild; // Capture the inner container (210mm)
            
            if (!element) {
                alert("Error generating PDF. Please try again.");
                setIsDownloading(false);
                return;
            }

            const opt = {
                margin: 0, 
                filename: `Career_GPS_${role.replace(/\s+/g, '_')}_Strategy.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    scrollY: 0,
                    logging: false, // Turn off logging
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            };
            
            if ((window as any).html2pdf) {
                // Pass the inner element if possible to constrain width, or just element if centered
                // Using innerElement (the A4 sized div) ensures better sizing
                const target = element.querySelector('.w-\\[210mm\\]') || element;
                (window as any).html2pdf().set(opt).from(target).save().then(() => {
                    setIsDownloading(false);
                });
            } else {
                alert("PDF Generator is loading, please try again in a few seconds.");
                setIsDownloading(false);
            }
        }, 800); // Increased timeout to 800ms
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
            
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Career GPS
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                window.open(`https://www.linkedin.com/in/yadavritik/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                            }}
                            className="text-xs font-medium text-blue-400 border border-blue-500/30 px-3 py-1 rounded hover:bg-blue-500/10 transition flex items-center gap-1"
                        >
                            <IconLinkedin /> Connect
                        </button>
                        <div className="text-xs font-medium text-slate-500 border border-slate-800 px-2 py-1 rounded hidden md:block">
                            Universal Navigation Engine
                        </div>
                    </div>
                </div>
            </header>

            {/* Print Layout - Only rendered when downloading */}
            {result && isDownloading && <PrintLayout result={result} inputs={{ role, experience, industry, target, horizon }} />}

            <main className="max-w-4xl mx-auto px-4 py-8">
                
                {/* Intro Hero - Only show on input step */}
                {step === "input" && (
                    <div className="mb-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                            Stop Guessing Your <br/>
                            <span className="text-blue-500">Career Trajectory</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            A high-stakes decision intelligence system. From student to retirement. 
                            Brutally honest, data-driven career strategy in seconds.
                        </p>
                    </div>
                )}

                {/* Input Form */}
                {step === "input" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-500">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Current Role / Status</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Student, Senior Product Manager, Retired"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Years of Experience</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. 0 (Student), 5 years, 20+"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Current Industry</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. Fintech, Healthcare, Government"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Desired Role / Direction</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. CTO, Pivot to AI, First Job"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Time Horizon</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {["6 Months", "1 Year", "3 Years", "5+ Years"].map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => setHorizon(h)}
                                            className={`px-4 py-3 rounded-lg text-sm font-medium border transition ${
                                                horizon === h 
                                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25" 
                                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                                            }`}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                className="w-full bg-white text-slate-950 font-bold text-lg py-4 rounded-xl hover:bg-slate-200 transition shadow-xl shadow-white/5 active:scale-[0.98]"
                            >
                                Generate Career GPS Strategy
                            </button>
                            
                            <div className="flex flex-col items-center gap-2 pt-2">
                                <p className="text-center text-xs text-slate-500">
                                    Powered by Google Gemini. Free for educational use.
                                </p>
                                <p className="text-center text-xs text-slate-400">
                                    Created by <a href="https://www.linkedin.com/in/yadavritik" target="_blank" className="text-blue-500 hover:text-blue-400 hover:underline font-bold">Ritik</a>
                                </p>
                            </div>
                        </form>
                    </div>
                )}

                {/* Loading State */}
                {step === "loading" && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-8"></div>
                        <h3 className="text-2xl font-bold text-white mb-2">Analyzing Career Trajectory</h3>
                        <div className="space-y-2 text-center">
                            <p className="text-slate-400 animate-pulse">Calculating role-exposure gaps...</p>
                            <p className="text-slate-400 animate-pulse delay-75">Simulating market scenarios...</p>
                            <p className="text-slate-400 animate-pulse delay-150">Building 90-day leverage plan...</p>
                        </div>
                    </div>
                )}

                {/* Results Dashboard */}
                {step === "results" && result && (
                    <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-950 p-6 rounded-xl text-slate-200">
                        
                        {/* Module 1: Snapshot & Reality */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 break-inside-avoid">
                            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">Positioning Snapshot</h2>
                                <p className="text-lg text-slate-200 leading-relaxed">
                                    {result.career_snapshot}
                                </p>
                            </div>
                            <div className={`bg-slate-900 border rounded-xl p-6 shadow-xl flex flex-col justify-center ${result.reality_check.toLowerCase().includes("not realistic") ? "border-red-900/50 bg-red-900/10" : "border-slate-800"}`}>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Reality Check</h2>
                                <p className="text-sm text-slate-200">{result.reality_check}</p>
                            </div>
                        </div>

                        {/* Module 4: Age/Stage Context */}
                        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 break-inside-avoid">
                             <div className="flex gap-3 items-start">
                                <div className="mt-1 text-amber-500"><IconAlert /></div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-300 uppercase mb-1">Stage Context</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{result.age_stage_context}</p>
                                </div>
                             </div>
                        </div>

                        {/* Module 2: Distance Map */}
                        <div className="break-inside-avoid">
                            <SectionHeader title="Career Distance Map" icon={IconMap} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(result.career_distance_map).map(([key, gaps]) => (
                                    <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5 break-inside-avoid">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-800 pb-2">
                                            {key.replace(/_/g, " ")}
                                        </h3>
                                        <div className="space-y-3">
                                            {(gaps as Gap[]).map((gap, i) => (
                                                <div key={i} className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className="text-slate-200 font-medium text-sm">{gap.missing}</span>
                                                        <Badge type={gap.importance.toLowerCase()}>{gap.importance}</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500">{gap.reason}</p>
                                                </div>
                                            ))}
                                            {(gaps as Gap[]).length === 0 && <p className="text-xs text-slate-600 italic">No significant gaps identified in this category.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Module 6: Simulator */}
                        <div className="break-inside-avoid">
                            <SectionHeader title="Decision Simulator" icon={IconBrain} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(result.decision_simulator).map(([key, opt]) => {
                                    const option = opt as DecisionOption;
                                    return (
                                        <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col hover:border-blue-500/30 transition-colors break-inside-avoid">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-bold capitalize text-white mb-1">
                                                    {key.replace("_", " ")}
                                                </h3>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-slate-400">Success Probability:</span>
                                                    <span className={`text-xs font-bold ${option.likelihood === "High" ? "text-emerald-400" : option.likelihood === "Medium" ? "text-amber-400" : "text-red-400"}`}>
                                                        {option.likelihood}
                                                    </span>
                                                </div>
                                                <ProgressBar 
                                                    value={option.likelihood === "High" ? 85 : option.likelihood === "Medium" ? 50 : 20} 
                                                    color={option.likelihood === "High" ? "bg-emerald-500" : option.likelihood === "Medium" ? "bg-amber-500" : "bg-red-500"}
                                                />
                                            </div>
                                            <div className="space-y-3 text-sm flex-grow">
                                                <div>
                                                    <span className="text-emerald-400 font-bold text-xs block mb-1">UPSIDE</span>
                                                    <p className="text-slate-300">{option.upside}</p>
                                                </div>
                                                <div>
                                                    <span className="text-red-400 font-bold text-xs block mb-1">RISK</span>
                                                    <p className="text-slate-300">{option.risk}</p>
                                                </div>
                                                <div className="pt-2 border-t border-slate-800 mt-2">
                                                    <p className="text-xs text-slate-500"><span className="text-slate-400 font-medium">Best for:</span> {option.best_for}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Module 5: 90 Day Plan */}
                        <div className="break-inside-avoid">
                            <SectionHeader title="90-Day High-Leverage Plan" icon={IconRocket} />
                            <div className="relative border-l-2 border-slate-800 ml-3 space-y-8 py-2">
                                {Object.entries(result["90_day_action_plan"]).map(([phase, data]: [string, any]) => (
                                    <div key={phase} className="pl-8 relative break-inside-avoid">
                                        {/* Timeline Node */}
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                                        
                                        <h3 className="text-lg font-bold text-white capitalize mb-1">{formatPhaseName(phase)}</h3>
                                        <div className="text-sm text-blue-400 font-medium mb-3 flex items-center gap-2">
                                            <IconTarget />
                                            Deliverable: {data.deliverable || "Clear progress"}
                                        </div>
                                        
                                        <ul className="space-y-3 mb-3">
                                            {Array.isArray(data.actions) ? data.actions.map((action: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                                    <div className="mt-0.5 text-blue-500 shrink-0"><IconCheck /></div>
                                                    {action}
                                                </li>
                                            )) : (
                                                <li className="text-slate-400 text-sm">Action data unavailable</li>
                                            )}
                                        </ul>
                                        <p className="text-xs text-slate-500 italic">Why now? {data.why_now}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Module 8: Skill ROI */}
                        <div className="break-inside-avoid">
                            <SectionHeader title="Skill & Effort ROI" icon={IconBriefcase} />
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="text-xs uppercase bg-slate-900 text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Action / Skill</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3 rounded-r-lg">Time to Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {result.skill_roi_prioritization.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-900/50">
                                                <td className="px-4 py-3 font-medium text-white">{item.skill}</td>
                                                <td className="px-4 py-3">
                                                    <Badge type={item.roi}>{item.roi}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">{item.time_to_impact}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Module 7 & 10: Strategy & Sustainability */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
                             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    Positioning Strategy
                                </h3>
                                <p className="text-sm text-slate-300 leading-relaxed">{result.positioning_strategy}</p>
                             </div>
                             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Long-Term Sustainability
                                </h3>
                                <p className="text-sm text-slate-300 leading-relaxed">{result.long_term_sustainability}</p>
                             </div>
                        </div>

                         {/* Module 9: Failure Modes */}
                         <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-6 break-inside-avoid">
                            <h3 className="font-bold text-red-200 mb-4 flex items-center gap-2">
                                <IconAlert /> Common Failure Modes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {result.common_failure_modes.map((mode, i) => (
                                    <div key={i} className="bg-red-950/20 p-4 rounded-lg border border-red-900/20">
                                        <div className="text-red-300 font-bold text-sm mb-2">"{mode.mistake}"</div>
                                        <div className="text-red-200/60 text-xs mb-2">{mode.impact}</div>
                                        <div className="text-emerald-400/80 text-xs font-medium">Fix: {mode.avoidance}</div>
                                    </div>
                                ))}
                            </div>
                         </div>

                        {/* Module 11: Executive Summary */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 relative overflow-hidden break-inside-avoid">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
                                    <button 
                                        onClick={downloadReport}
                                        disabled={isDownloading}
                                        data-html2canvas-ignore="true"
                                        className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {isDownloading ? (
                                            <>Generating PDF...</>
                                        ) : (
                                            <>
                                                <IconDownload /> Download Professional Report
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {result.executive_summary.map((point, i) => (
                                        <div key={i} className="flex gap-3 text-slate-200">
                                            <span className="text-blue-500 font-bold">•</span>
                                            <span className="leading-relaxed">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Custom Footer for Report */}
                        <div className="mt-16 pt-8 border-t border-slate-800 text-center space-y-2">
                            <p className="text-slate-500 text-sm">Career GPS Strategic Report</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                                <span className="font-semibold text-slate-300">
                                    Created by <a href="https://www.linkedin.com/in/yadavritik" target="_blank" className="text-blue-500 hover:text-blue-400 hover:underline">Ritik</a>
                                </span>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div className="flex justify-center pt-8 pb-12" data-html2canvas-ignore="true">
                            <button 
                                onClick={() => {
                                    setStep("input");
                                    setResult(null);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="text-slate-500 hover:text-white transition text-sm underline underline-offset-4"
                            >
                                Start New Analysis
                            </button>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
