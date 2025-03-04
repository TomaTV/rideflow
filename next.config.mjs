/** @type {import('next').NextConfig} */
const nextConfig = {
  // Activer les variables d'environnement et publiciser celles avec le préfixe NEXT_PUBLIC_
  env: {
    NEXT_PUBLIC_OPENROUTE_SERVICE_KEY:
      process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_KEY,
    NEXT_PUBLIC_HERE_API_KEY: process.env.NEXT_PUBLIC_HERE_API_KEY,
    NEXT_PUBLIC_OPENWEATHER_MAP_KEY:
      process.env.NEXT_PUBLIC_OPENWEATHER_MAP_KEY,
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
  },
  // Configuration de sécurité pour les requêtes
  async headers() {
    return [
      {
        source: "/routes/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
