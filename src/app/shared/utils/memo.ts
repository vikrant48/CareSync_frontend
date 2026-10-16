/**
 * Cheap memoisation for template-called methods on components that don't use signals.
 *
 * `compute` re-runs only when one of the values returned by `deps` changes (compared with
 * `Object.is`), so a getter used several times per change-detection pass does the work once and
 * returns the same array instance until its inputs really change.
 *
 *   filtered = memoByDeps(
 *     () => this.items.filter(...),
 *     () => [this.items, this.term],
 *   );
 *
 * Inputs must be replaced, not mutated in place, to invalidate the cache.
 */
export function memoByDeps<T>(compute: () => T, deps: () => readonly unknown[]): () => T {
  let lastDeps: readonly unknown[] | null = null;
  let lastValue!: T;
  return () => {
    const next = deps();
    const same =
      lastDeps !== null &&
      lastDeps.length === next.length &&
      next.every((v, i) => Object.is(v, lastDeps![i]));
    if (!same) {
      lastValue = compute();
      lastDeps = next;
    }
    return lastValue;
  };
}
