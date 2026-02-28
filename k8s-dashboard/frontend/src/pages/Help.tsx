import { useState } from 'react'
import { HelpCircle, BookOpen, Keyboard, Server, Shield, ChevronDown, ChevronUp, Terminal, Activity, AlertTriangle, Box, Cpu, Globe } from 'lucide-react'

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
  { icon: Server, title: 'Cluster Overview', desc: 'View cluster health, node count, and resource usage at a glance' },
  { icon: Box, title: 'Workloads', desc: 'Monitor Deployments, StatefulSets, DaemonSets, and Jobs' },
  { icon: Cpu, title: 'Nodes', desc: 'Inspect node status, capacity, allocatable resources, and conditions' },
  { icon: Terminal, title: 'Pod Logs', desc: 'Stream real-time logs from running containers' },
  { icon: Activity, title: 'Metrics', desc: 'CPU, memory, and network metrics with historical charts' },
  { icon: AlertTriangle, title: 'Alerts', desc: 'Automated alerting for anomalies and threshold breaches' },
  { icon: Globe, title: 'Multi-Cluster', desc: 'Manage and switch between multiple Kubernetes clusters' },
  { icon: Shield, title: 'RBAC', desc: 'Role-based access control for admin and user roles' },
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Help Center</h1>
        <p className="text-gray-400 mt-1">Learn how to use the K8s Dashboard</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-lg w-fit">
        {sections.map((sec) => {
          const Icon = sec.icon
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === sec.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {sec.label}
            </button>
          )
        })}
      </div>

      {/* Features */}
      {activeSection === 'features' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Dashboard Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-start gap-4">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      {activeSection === 'shortcuts' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <p className="text-sm text-gray-500 mb-2">Standard browser shortcuts are supported.</p>
          <div className="space-y-3">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.description} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <span className="text-gray-300 text-sm">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono text-gray-300"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {activeSection === 'faq' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/50 transition"
              >
                <span className="text-sm font-medium text-white pr-4">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-700 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* About */}
      {activeSection === 'about' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">About K8s Dashboard</h2>
          <div className="space-y-4 text-sm text-gray-400">
            <p>
              K8s Dashboard is a modern, full-stack Kubernetes monitoring and management application
              built with React, TypeScript, and FastAPI.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Frontend</h3>
                <ul className="space-y-1">
                  <li>React 18 + TypeScript</li>
                  <li>Vite 5 (Build Tool)</li>
                  <li>TailwindCSS (Styling)</li>
                  <li>Zustand (State Management)</li>
                  <li>React Query (Data Fetching)</li>
                  <li>Recharts (Charts/Graphs)</li>
                </ul>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Backend</h3>
                <ul className="space-y-1">
                  <li>Python 3.13 + FastAPI</li>
                  <li>SQLAlchemy (ORM)</li>
                  <li>SQLite (Database)</li>
                  <li>JWT Authentication</li>
                  <li>Kubernetes Python Client</li>
                  <li>Pydantic v2 (Validation)</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-500">Version 1.0.0 &middot; Developed as academic project</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
