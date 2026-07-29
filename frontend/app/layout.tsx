import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Interview Prep | Ace Your Next Interview',
  description: 'AI-powered mock interview system with personalized questions, real-time feedback, and performance analytics. Practice smarter, not harder.',
  keywords: 'AI interview, mock interview, interview preparation, technical interview, behavioral interview',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Floating background orbs */}
        <div className="orb orb-purple" />
        <div className="orb orb-cyan" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
