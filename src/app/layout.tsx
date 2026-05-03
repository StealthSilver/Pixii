import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

export const metadata: Metadata = {
 title: "Pixii",
 description: "Pixii",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" className="h-full overflow-hidden antialiased" suppressHydrationWarning>
 <head>
 <script dangerouslySetInnerHTML={{ __html: themeScript }} />
 <link
 href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=cabinet-grotesk@400,500,700,800&display=swap"
 rel="stylesheet"
 />
 </head>
 <body className="flex h-screen max-h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
 <ThemeProvider>
 <AppShell>{children}</AppShell>
 </ThemeProvider>
 </body>
 </html>
 );
}
