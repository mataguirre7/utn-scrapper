import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CVG Dashboard",
  description: "Dashboard para gestionar cursos y actividades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              📚 CVG Dashboard
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <Link href="/courses" className="hover:text-blue-600">Cursos</Link>
              <Link href="/calendar" className="hover:text-blue-600">Calendario</Link>
              <Link href="/changes" className="hover:text-blue-600">Cambios</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
