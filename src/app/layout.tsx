import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavigationBar from "@/components/Navbar";
import { NavigationHeightProvider } from "@/contexts/NavigationHeightContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSYD — Rendu de Travaux",
  description:
    "Site de rendu des travaux pratiques de la matière ANSYD, présentant les labs, le code Go associé et leur exécution via Google Cloud Run.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ANSYD — Rendu de Travaux",
    description:
      "Site de rendu des travaux pratiques ANSYD, avec exécution du code Go et visualisation des résultats.",
    url: "https://neo-imt.cloud",
    siteName: "ANSYD Labs",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NavigationHeightProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <NavigationBar />
          {children}
        </body>
      </html>
    </NavigationHeightProvider>
  );
}
