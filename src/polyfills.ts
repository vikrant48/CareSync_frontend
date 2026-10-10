/**
 * Polyfill Node.js `global` object for non-Node runtimes like Deno (Netlify Edge Functions)
 * and legacy browser libraries.
 */
if (typeof (globalThis as any).global === 'undefined') {
    (globalThis as any).global = globalThis;
}
