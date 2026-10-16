import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from './toast.service';

/**
 * Opens a stored document in a new tab. Medical files are served through short-lived signed links (15 min),
 * so a link from a list loaded earlier may have expired: the file is fetched fresh through the authenticated
 * /api/files/view endpoint (which also re-checks access) and shown from memory. If that fails, the link the
 * list returned is used as before.
 */
@Injectable({ providedIn: 'root' })
export class DocumentOpenerService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private baseUrl = environment.apiBaseUrl;

  open(documentId: number | null | undefined, fallbackUrl?: string | null) {
    if (!documentId) {
      if (fallbackUrl) window.open(fallbackUrl, '_blank', 'noopener');
      return;
    }
    // Open the tab now, while the click still counts as a user action (popup blockers)
    const tab = window.open('', '_blank');
    this.http.get(`${this.baseUrl}/api/files/view/${documentId}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        if (tab) {
          tab.location.href = objectUrl;
        } else {
          window.open(objectUrl, '_blank');
        }
        // The tab has its own copy once loaded
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      },
      error: () => {
        if (fallbackUrl) {
          if (tab) tab.location.href = fallbackUrl;
          else window.open(fallbackUrl, '_blank', 'noopener');
        } else {
          tab?.close();
          this.toast.showError('Could not open the document. Please try again.');
        }
      },
    });
  }
}
