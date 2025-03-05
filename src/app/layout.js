import { Outfit } from "next/font/google";
import "./globals.css";

const getOutfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "RideFlow - GPS intelligent pour motards",
  description: "RideFlow calcule les meilleurs itinéraires pour motos avec alertes en temps réel sur les dangers, la météo et les radars.",
  keywords: "moto, gps, itinéraire, radars, météo, motard, route, sinueuse",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${getOutfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
