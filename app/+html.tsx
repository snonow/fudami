// Learn more https://docs.expo.dev/router/reference/static-rendering/#root-html

import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="en" className="light" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <ScrollViewStyleReset />
        {headNodes}

        <link rel="icon" href="favicon.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="favicon-light.png" media="(prefers-color-scheme: light)" />

        {/* Liquid Zen UI — Tailwind CDN (web landing + sign-in only) */}
        {/* preflight disabled so RN-web styles on the app pages are unaffected */}
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
        <script
          id="tailwind-config"
          dangerouslySetInnerHTML={{
            __html: `
tailwind.config = {
  darkMode: "class",
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        "on-primary-fixed": "#410000",
        "sumi-ink": "#2C2A29",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#e4e2dd",
        "on-error": "#ffffff",
        "background": "#fbf9f3",
        "secondary-container": "#a5b5fe",
        "secondary-fixed": "#dde1ff",
        "primary-fixed": "#ffdad4",
        "surface-dim": "#dcdad4",
        "hanko-red": "#E83929",
        "inverse-surface": "#30312d",
        "secondary-fixed-dim": "#b7c4ff",
        "on-primary": "#ffffff",
        "outline": "#906f6a",
        "on-background": "#1b1c19",
        "on-tertiary-fixed-variant": "#005230",
        "surface-container-high": "#eae8e2",
        "error": "#ba1a1a",
        "surface-container": "#f0eee8",
        "tertiary-fixed": "#77fbb2",
        "primary-container": "#dd3122",
        "sumi-ink-muted": "#6B6661",
        "inverse-primary": "#ffb4a8",
        "on-primary-fixed-variant": "#930001",
        "on-surface-variant": "#5c403b",
        "surface-tint": "#bc150d",
        "aizome-indigo-light": "#DCE2F1",
        "error-container": "#ffdad6",
        "tertiary-container": "#008651",
        "hanko-red-light": "#FCEAE9",
        "surface": "#fbf9f3",
        "on-surface": "#1b1c19",
        "outline-variant": "#e5bdb7",
        "tertiary-fixed-dim": "#58de97",
        "primary-fixed-dim": "#ffb4a8",
        "washi-paper": "#F9F7F1",
        "tertiary": "#006a3f",
        "on-secondary-fixed": "#001452",
        "matcha-green": "#00A968",
        "surface-container-low": "#f5f3ed",
        "aizome-indigo": "#1D2F6F",
        "surface-bright": "#fbf9f3",
        "on-tertiary-fixed": "#002110",
        "matcha-green-light": "#D9F2E6",
        "on-secondary-fixed-variant": "#314283",
        "primary": "#b8110a",
        "on-tertiary": "#ffffff",
        "on-primary-container": "#fffbff",
        "on-error-container": "#93000a",
        "on-secondary": "#ffffff",
        "surface-container-highest": "#e4e2dd",
        "hanko-red-dark": "#B3291D",
        "inverse-on-surface": "#f3f1eb",
        "washi-border": "#E6E1D6",
        "on-secondary-container": "#344585",
        "on-tertiary-container": "#f6fff5",
        "secondary": "#4a5a9c"
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      },
      spacing: {
        "base": "8px",
        "margin-desktop": "auto",
        "margin-mobile": "20px",
        "gutter-mobile": "16px",
        "gutter-desktop": "32px",
        "container-max-width": "1200px"
      },
      fontFamily: {
        "headline-lg": ["Plus Jakarta Sans"],
        "stats-number": ["Plus Jakarta Sans"],
        "kanji-display": ["Plus Jakarta Sans"],
        "label-caps": ["Plus Jakarta Sans"],
        "headline-md": ["Plus Jakarta Sans"],
        "body-lg": ["Plus Jakarta Sans"],
        "body-md": ["Plus Jakarta Sans"],
        "headline-lg-mobile": ["Plus Jakarta Sans"]
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "stats-number": ["20px", { lineHeight: "24px", fontWeight: "700" }],
        "kanji-display": ["80px", { lineHeight: "100px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }]
      }
    }
  }
}
`,
          }}
        />

        {/* Fonts for the landing page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Liquid Zen keyframe animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
@keyframes float {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }

@keyframes blink {
  0%, 94%, 98% { opacity: 1; }
  95%, 97%, 99%, 100% { opacity: 0; }
}
.mascot-blink { animation: blink 6s linear infinite; }

.glass-panel {
  background: rgba(255,255,255,0.4);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 8px 32px rgba(0,0,0,0.05);
}
.dark .glass-panel {
  background: rgba(44,42,41,0.4);
  border: 1px solid rgba(255,255,255,0.1);
}
.mascot-container { transition: transform 0.1s ease-out; }
.timeline-scroll::-webkit-scrollbar { height: 6px; }
.timeline-scroll::-webkit-scrollbar-track { background: rgba(228,226,221,0.3); border-radius: 3px; }
.timeline-scroll::-webkit-scrollbar-thumb { background: #DCE2F1; border-radius: 3px; }
.timeline-scroll::-webkit-scrollbar-thumb:hover { background: #1D2F6F; }
`
        }} />
      </head>
      <body {...bodyAttributes}>
        {children}
        <div id="clerk-captcha"></div>
        {bodyNodes}
      </body>
    </html>
  );
}
