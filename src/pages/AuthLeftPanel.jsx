import { Cpu, Share2, FileCode } from 'lucide-react'

const features = [
  {
    icon: Cpu,
    title: 'AI Architecture Generation',
    description: 'Describe your system, AI maps it to nodes and edges on a live canvas.',
  },
  {
    icon: Share2,
    title: 'Real-time Collaboration',
    description: 'Live cursors, presence indicators, and shared node editing across your team.',
  },
  {
    icon: FileCode,
    title: 'Instant Spec Generation',
    description: 'Export a complete Markdown technical spec directly from the canvas graph.',
  },
]

export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-[46%] p-12 border-r border-surface-border overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
          <span className="text-sm font-black text-black leading-none select-none">A</span>
        </div>
        <span className="text-[0.9375rem] font-semibold text-copy-primary">Arka AI</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-5xl font-bold text-copy-primary leading-tight mb-5">
          Design systems at the<br />speed of thought.
        </h1>
        <p className="text-copy-secondary text-sm mb-10 max-w-sm leading-relaxed">
          Describe your architecture in plain English. Arka AI maps it to a shared
          canvas your whole team can refine in real time.
        </p>

        <ul className="space-y-6">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated border border-surface-border">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium text-copy-primary">{title}</p>
                <p className="text-xs text-copy-muted mt-0.5 leading-relaxed">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <p className="text-xs text-copy-faint">© 2026 Arka AI. All rights reserved.</p>
    </div>
  )
}
