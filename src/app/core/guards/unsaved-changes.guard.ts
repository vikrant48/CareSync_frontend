import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

/** Implemented by pages that hold edits which would be lost on navigation. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Asks before leaving a page with unsaved edits (in-app navigation).
 * Pages should also guard browser close/refresh with a `window:beforeunload` listener.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges?.()) return true;
  return inject(ConfirmService).ask({
    title: 'Discard changes?',
    message: 'You have unsaved changes on this page. Leave and discard them?',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Stay on page',
    danger: true,
  });
};
