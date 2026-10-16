import { ChangeDetectorRef } from '@angular/core';
import { MonoTypeOperatorFunction, tap } from 'rxjs';

/**
 * For OnPush components: request a view check whenever the stream emits or errors, so state
 * assigned in the subscriber's callbacks renders. (markForCheck only flags the view; the actual
 * check runs after the callback, so it is fine that tap fires first.)
 *
 *   this.api.load().pipe(markForCheckOn(this.cdr)).subscribe(res => this.items = res);
 */
export function markForCheckOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
  return tap<T>({
    next: () => cdr.markForCheck(),
    error: () => cdr.markForCheck(),
  });
}
