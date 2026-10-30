/**
 * Groq API key, read from VITE_GROQ_API_KEY in .env (gitignored) and inlined
 * into the bundle at build time.
 */
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";
