import { useState } from 'react'
import { HelpCircle, BookOpen, Keyboard, Server, Shield, ChevronDown, Terminal, Activity, AlertTriangle, Box, Cpu, Globe, Sparkles, Zap, Search, Mail, Github, ExternalLink } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'How do I connect a Kubernetes cluster?',
    answer: 'Go to Cluster Management from the sidebar, click "Add Cluster" and provide your kubeconfig file or cluster connection details. The dashboard supports multiple cluster connections simultaneously.',
  },
  {
    question: 'What are the different user roles?',
    answer: 'There are two roles: Administrator and User. Admins can manage users, clusters, and all settings. Regular users can view dashboards, pods, logs, and metrics but cannot manage other users or system settings.',
  },
  {
    question: 'How does real-time monitoring work?',
    answer: 'The dashboard polls the Kubernetes API at a configurable interval (default: 30s). You can change this in Settings → Preferences → Auto-Refresh Interval. Metrics are collected from the Kubernetes Metrics Server.',
  },
  {
    question: 'What is Root Cause Analysis?',
    answer: 'Root Cause Analysis (RCA) uses AI-powered analysis to inspect failing pods, events, and logs to determine the most likely cause of issues. Navigate to Root Cause Analysis from the sidebar to run diagnostics.',
  },
  {
    question: 'How are alerts configured?',
    answer: 'Alerts are generated automatically based on predefined thresholds for CPU/memory usage, pod health, and node status. View and manage alerts from the Alerts page. Critical alerts are highlighted in red.',
  },
  {
    question: 'Can I switch between namespaces?',
    answer: 'Yes. Use the Namespace Selector in the sidebar to filter your view by namespace. Selecting "All Namespaces" shows resources across the entire cluster.',
  },
]

const shortcuts = [
  { keys: ['Esc'], description: 'Close modals / cancel action' },
  { keys: ['F5'], description: 'Refresh current page' },
]

const features = [
  { icon: Server, title: 'Cluster Overview', desc: 'View cluster health, node count, and resource usage at a glance', gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/20' },
  { icon: Box, title: 'Workloads', desc: 'Monitor Deployments, StatefulSets, DaemonSets, and Jobs', gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/20' },
  { icon: Cpu, title: 'Nodes', desc: 'Inspect node status, capacity, allocatable resources, and conditions', gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/20' },
  { icon: Terminal, title: 'Pod Logs', desc: 'Stream real-time logs from running containers', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20' },
  { icon: Activity, title: 'Metrics', desc: 'CPU, memory, and network metrics with historical charts', gradient: 'from-red-500 to-pink-500', bg: 'bg-red-500/20' },
  { icon: AlertTriangle, title: 'Alerts', desc: 'Automated alerting for anomalies and threshold breaches', gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-500/20' },
  { icon: Globe, title: 'Multi-Cluster', desc: 'Manage and switch between multiple Kubernetes clusters', gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/20' },
  { icon: Shield, title: 'RBAC', desc: 'Role-based access control for admin and user roles', gradient: 'from-slate-500 to-gray-500', bg: 'bg-slate-500/20' },
]

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<'features' | 'shortcuts' | 'faq' | 'about'>('features')

  const sections = [
    { id: 'features' as const, label: 'Features', icon: BookOpen },
    { id: 'shortcuts' as const, label: 'Shortcuts', icon: Keyboard },
    { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
    { id: 'about' as const, label: 'About', icon: Server },
  ]

  const activeSectionIndex = sections.findIndex(s => s.id === activeSection)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Help Center</h1>
          <p className="text-slate-400 mt-1">Learn how to use the K8s Dashboard</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="relative">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm w-fit">
          <div 
            className="absolute top-1 h-[calc(100%-8px)] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg transition-all duration-300 ease-out"
            style={{
              left: `${activeSectionIndex * (100 / sections.length)}%`,
              width: `${100 / sections.length}%`,
            }}
          />
          {sections.map((sec) => {
            const Icon = sec.icon
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === sec.id
                    ? 'text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {sec.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Features */}
      {activeSection === 'features' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Dashboard Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div 
                  key={feature.title} 
                  className="group relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 border border-white/10 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                      <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-white/5 blur-xl group-hover:bg-white/10 transition-colors"></div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      {activeSection === 'shortcuts' && (
        <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/20">
                <Keyboard className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-400 mb-6">Standard browser shortcuts are supported for quick navigation.</p>
            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div 
                  key={shortcut.description} 
                  className="flex items-center justify-between py-4 px-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                >
                  <span className="text-slate-300 text-sm font-medium">{shortcut.description}</span>
                  <div className="flex gap-1.5">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs font-mono text-slate-200 shadow-md shadow-slate-900/50 min-w-[2.5rem] text-center"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 text-sm font-medium mb-1">Pro Tip</p>
                  <p className="text-amber-400/80 text-xs">More keyboard shortcuts will be added in future releases. Stay tuned!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      {activeSection === 'faq' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/20">
              <Search className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-colors"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/20 transition-colors"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.question}</span>
                  <div className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 ${openFAQ === index ? 'bg-cyan-500/20 text-cyan-400 rotate-180' : 'text-slate-500'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {openFAQ === index && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-700/50 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      {activeSection === 'about' && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
            <div className="relative p-6 pt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
                  <Server className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">About K8s Dashboard</h2>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                K8s Dashboard is a modern, full-stack Kubernetes monitoring and management application
                built with React, TypeScript, and FastAPI.
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
              <div className="p-5 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/20">
                    <Globe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Frontend</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-2.5">
                  {[
                    'React 18 + TypeScript',
                    'Vite 5 (Build Tool)',
                    'TailwindCSS (Styling)',
                    'Zustand (State Management)',
                    'React Query (Data Fetching)',
                    'Recharts (Charts/Graphs)',
                  ].map((tech) => (
                    <div key={tech} className="flex items-center gap-3 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 py-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0"></div>
                      <span className="text-slate-300 text-sm">{tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
              <div className="p-5 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/20">
                    <Terminal className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Backend</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-2.5">
                  {[
                    'Python 3.13 + FastAPI',
                    'SQLAlchemy (ORM)',
                    'SQLite (Database)',
                    'JWT Authentication',
                    'Kubernetes Python Client',
                    'Pydantic v2 (Validation)',
                  ].map((tech) => (
                    <div key={tech} className="flex items-center gap-3 rounded-lg bg-slate-900/50 border border-slate-700/50 px-4 py-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                      <span className="text-slate-300 text-sm">{tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Version & Links */}
          <div className="relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Version 1.0.0</p>
                  <p className="text-slate-400 text-sm mt-1">Developed as academic project</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href="#" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600/50 transition-colors text-sm">
                    <Github className="w-4 h-4" />
                    GitHub
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                  <a href="#" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600/50 transition-colors text-sm">
                    <Mail className="w-4 h-4" />
                    Contact
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
