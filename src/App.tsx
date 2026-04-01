import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { searchRemoteJobs, analyzeAndTailor, JobMatch } from './services/gemini';

interface Job {
  title: string;
  company: string;
  description: string;
  link: string;
}

interface AppliedJob extends Job {
  appliedAt: string;
  status: 'Applied' | 'Interviewing' | 'Rejected';
  matchScore: number;
}

export default function App() {
  const [resume, setResume] = useState(`YOGESH DWIVEDI
+917723815356 ydwivedi091@gmail.com

PROFILE
Detail-oriented Computer Science student skilled in data analysis, leadership, and event coordination. Experienced in managing large-scale projects and delivering results under pressure.

PROFESSIONAL EXPERIENCE
Data Entry & Editor | Dainik Bhaskar, Indore (2024–2025)
Completed 80+ editorial assignments and optimized content using audience metrics. Improved digital performance through data-driven insights.

Founder & Tech Lead | URJA A2 Milk
Built full business website and digital presence; led branding and customer engagement. Designed visual assets and marketing campaigns to educate customers on health.

Graphic Designer (Freelance)
Designed brand identities and marketing materials, increasing engagement by 35%.

Data Analyst (Project-Based)
Analyzed 250,000+ e-commerce sales records to identify performance trends. Built interactive Power BI & Excel dashboards and automated reporting systems.

CORE SKILLS
Technical: Python, Frontend Dev (HTML/CSS/JS), Data Analytics & Visualization.
Tools: Power BI, Advanced Excel, UI/UX Design
Creative: Graphic Design, Branding, Presentation Design.
Business: Project Management, Strategy, Digital Marketing, Data-Driven Decision Making.

PROJECTS
Business Web Dev: Created a responsive UI/UX focused site for a dairy business.
Sales Dashboard: Built automated Power BI reports for real-time decision-making.
Visual Content: Developed animated content and presentations for marketing.

EXTRA-CURRICULAR ACTIVITIES
Tech Contributor: Active in developer meetups and online troubleshooting forums.
Academic Mentor: Volunteered at Prestige Institute to assist juniors in web and DB fundamentals.
Strategic Growth: Participates in startup summits and business pitch competitions.`);
  const [jobQuery, setJobQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobMatch | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const [autoPilotStatus, setAutoPilotStatus] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!jobQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchRemoteJobs(jobQuery);
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (job: Job) => {
    setSelectedJob(job);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeAndTailor(resume, job.description);
      setAnalysisResult(result);
      return result;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateApply = async (job: Job, score: number) => {
    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newAppliedJob: AppliedJob = {
      ...job,
      appliedAt: new Date().toLocaleString(),
      status: 'Applied',
      matchScore: score
    };
    
    setAppliedJobs(prev => [newAppliedJob, ...prev]);
    setIsApplying(false);
  };

  const handleAutoPilot = async () => {
    if (!jobQuery || !resume) return;
    setIsAutoPilotActive(true);
    setAutoPilotStatus('Scanning for remote opportunities...');
    
    const results = await handleSearch();
    
    if (results.length === 0) {
      setAutoPilotStatus('No jobs found. Retrying in a moment...');
      setIsAutoPilotActive(false);
      return;
    }

    for (const job of results) {
      if (!isAutoPilotActive) break;
      
      setAutoPilotStatus(`Analyzing match for ${job.title} at ${job.company}...`);
      const analysis = await handleAnalyze(job);
      
      if (analysis && analysis.score >= 75) {
        setAutoPilotStatus(`Match found (${analysis.score}%)! Tailoring and applying...`);
        await simulateApply(job, analysis.score);
      } else {
        setAutoPilotStatus(`Skipping ${job.title} (Score: ${analysis?.score || 0}% - below threshold)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setAutoPilotStatus('Auto-Pilot cycle complete.');
    setIsAutoPilotActive(false);
  };

  const handleApply = async () => {
    if (!selectedJob || !analysisResult) return;
    await simulateApply(selectedJob, analysisResult.score);
    setAnalysisResult(null);
    setSelectedJob(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1C1917] font-sans selection:bg-[#FDE047]">
      {/* Header */}
      <header className="border-b border-[#E7E5E4] bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1C1917] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">RemoteJob Agent</h1>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-[#57534E]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAutoPilotActive ? 'bg-orange-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
              <span>{isAutoPilotActive ? 'Auto-Pilot Active' : 'Agent Online'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Auto-Pilot Status Bar */}
        <AnimatePresence>
          {isAutoPilotActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <span className="text-sm font-medium text-orange-800">{autoPilotStatus}</span>
                </div>
                <button 
                  onClick={() => setIsAutoPilotActive(false)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                >
                  Stop Agent
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs & Search */}
          <div className="lg:col-span-5 space-y-8">
            {/* Resume Section */}
            <section className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#A8A29E]" />
                <h2 className="font-semibold">Your Resume</h2>
              </div>
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-48 p-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
              />
            </section>

            {/* Job Search Section */}
            <section className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#A8A29E]" />
                  <h2 className="font-semibold">Autonomous Remote Hunt</h2>
                </div>
                {!isAutoPilotActive && (
                  <button
                    onClick={handleAutoPilot}
                    disabled={!jobQuery}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-orange-200 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Start Auto-Pilot
                  </button>
                )}
              </div>
              <div className="mb-4 flex items-center gap-2">
                <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  100% Remote Only
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Remote Data Analyst', 'Remote Frontend Developer', 'Remote Graphic Designer'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setJobQuery(role)}
                    className="px-3 py-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-full text-xs font-medium hover:bg-[#E7E5E4] transition-colors"
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={jobQuery}
                  onChange={(e) => setJobQuery(e.target.value)}
                  placeholder="Search for remote roles..."
                  className="flex-1 px-4 py-2 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#1C1917] outline-none text-sm"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !jobQuery}
                  className="px-4 py-2 bg-[#1C1917] text-white rounded-xl font-medium text-sm hover:bg-[#44403C] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {/* Search Results List */}
              <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isSearching && (
                  <div className="flex flex-col items-center justify-center py-12 text-[#A8A29E]">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-sm">Agent is scanning the web...</p>
                  </div>
                )}
                {searchResults.map((job, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      selectedJob?.link === job.link 
                        ? 'border-[#1C1917] bg-[#FAFAF9] ring-1 ring-[#1C1917]' 
                        : 'border-[#E7E5E4] hover:border-[#A8A29E] bg-white'
                    }`}
                    onClick={() => handleAnalyze(job)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm group-hover:text-[#1C1917]">{job.title}</h3>
                      <ExternalLink className="w-3 h-3 text-[#A8A29E]" />
                    </div>
                    <p className="text-xs text-[#78716C] mb-2">{job.company}</p>
                    <p className="text-[10px] text-[#A8A29E] line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Application History */}
            <section className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />
                <h2 className="font-semibold">Application History</h2>
              </div>
              <div className="space-y-3">
                {appliedJobs.length === 0 && (
                  <p className="text-xs text-[#A8A29E] text-center py-4 italic">No applications sent yet.</p>
                )}
                {appliedJobs.map((job, idx) => (
                  <div key={idx} className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold">{job.title}</h4>
                      <p className="text-[10px] text-[#78716C]">{job.company} • {job.appliedAt}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        {job.status}
                      </span>
                      <span className="text-[10px] font-bold text-[#1C1917]">{job.matchScore}% Match</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Agent Intelligence */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 p-12"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-[#E7E5E4] border-t-[#1C1917] rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-[#1C1917] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Analyzing Match</h3>
                    <p className="text-[#78716C]">Tailoring your cover letter and summary for {selectedJob?.company}...</p>
                  </div>
                </motion.div>
              ) : analysisResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Match Header */}
                  <div className="bg-[#1C1917] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium uppercase tracking-widest text-[#A8A29E]">Agent Recommendation</span>
                          <h2 className="text-2xl font-bold mt-1">{selectedJob?.title} @ {selectedJob?.company}</h2>
                        </div>
                        <div className="text-right">
                          <div className="text-5xl font-black tracking-tighter">{analysisResult.score}%</div>
                          <div className="text-[10px] uppercase tracking-widest text-[#A8A29E]">Match Score</div>
                        </div>
                      </div>
                      <p className="text-[#D6D3D1] leading-relaxed text-sm">
                        {analysisResult.reasoning}
                      </p>
                      
                      <div className="mt-8 flex gap-4">
                        <button
                          onClick={handleApply}
                          disabled={isApplying}
                          className="flex-1 py-4 bg-white text-[#1C1917] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#F5F5F4] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting Application...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              Auto-Apply Now
                            </>
                          )}
                        </button>
                        <a
                          href={selectedJob?.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                  </div>

                  {/* Tailored Content */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                          <h3 className="font-bold">Tailored Summary</h3>
                        </div>
                        <button onClick={() => copyToClipboard(analysisResult.tailoredSummary, 'summary')} className="p-2 hover:bg-[#F5F5F4] rounded-lg">
                          {copied === 'summary' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#78716C]" />}
                        </button>
                      </div>
                      <p className="text-sm italic text-[#44403C] leading-relaxed">{analysisResult.tailoredSummary}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#3B82F6]" />
                          <h3 className="font-bold">Tailored Cover Letter</h3>
                        </div>
                        <button onClick={() => copyToClipboard(analysisResult.tailoredCoverLetter, 'letter')} className="p-2 hover:bg-[#F5F5F4] rounded-lg">
                          {copied === 'letter' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#78716C]" />}
                        </button>
                      </div>
                      <div className="p-4 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] whitespace-pre-wrap text-xs leading-relaxed text-[#44403C] max-h-[400px] overflow-y-auto">
                        {analysisResult.tailoredCoverLetter}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#E7E5E4] rounded-3xl"
                >
                  <div className="w-16 h-16 bg-[#E7E5E4] rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-[#A8A29E]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Agent Intelligence</h3>
                  <p className="text-[#78716C] max-w-xs">
                    Select a job from the search results to start the auto-apply process.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-[#E7E5E4] mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-[#78716C]">
          <p>© 2026 RemoteJob Agent. Powered by Google Gemini.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#1C1917] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#1C1917] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
