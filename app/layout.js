import "./globals.css";

export const metadata = { title: "Prompt Chain Studio", description: "Build, test, and review AI prompt chains" };

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
