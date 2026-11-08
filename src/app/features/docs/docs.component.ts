import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/** Public technical documentation, rendered from public/docs/caresync.md (Markdown + Mermaid diagrams). */
@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, PageLoaderComponent],
  styleUrl: './docs.component.css',
  template: `
    <div class="docs-shell">
      <aside class="docs-toc" aria-label="On this page">
        <div class="docs-toc-title">On this page</div>
        <nav>
          <a *ngFor="let t of toc()" [href]="'#' + t.id" (click)="jump($event, t.id)"
             [class.docs-toc-sub]="t.level === 3" [class.docs-toc-active]="active() === t.id">{{ t.text }}</a>
        </nav>
      </aside>

      <main class="docs-main">
        <details class="docs-toc-mobile" *ngIf="toc().length">
          <summary>On this page</summary>
          <a *ngFor="let t of toc()" [href]="'#' + t.id" (click)="jump($event, t.id)"
             [class.docs-toc-sub]="t.level === 3">{{ t.text }}</a>
        </details>

        <app-page-loader *ngIf="loading()" label="Loading documentation..."></app-page-loader>
        <p *ngIf="error()" class="docs-error">The documentation could not be loaded. Please refresh the page.</p>
        <article #article class="docs-article" [innerHTML]="html()"></article>
      </main>
    </div>
  `,
})
export class DocsComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('article', { static: true }) article!: ElementRef<HTMLElement>;

  html = signal<SafeHtml>('');
  toc = signal<TocEntry[]>([]);
  active = signal('');
  loading = signal(true);
  error = signal(false);

  async ngOnInit() {
    try {
      const markdown = await new Promise<string>((resolve, reject) =>
        this.http.get('/docs/caresync.md', { responseType: 'text' }).subscribe({ next: resolve, error: reject }));
      const { marked } = await import('marked');
      const rendered = await marked.parse(markdown, { gfm: true });
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
      this.loading.set(false);
      setTimeout(() => this.enhance(), 0);
    } catch {
      this.loading.set(false);
      this.error.set(true);
    }
  }

  jump(event: Event, id: string) {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
    this.active.set(id);
  }

  private enhance() {
    const root = this.article.nativeElement;
    const used = new Set<string>();
    const entries: TocEntry[] = [];
    root.querySelectorAll('h2, h3').forEach((h) => {
      let id = (h.textContent || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'section';
      while (used.has(id)) id += '-x';
      used.add(id);
      h.id = id;
      entries.push({ id, text: (h.textContent || '').trim(), level: h.tagName === 'H2' ? 2 : 3 });
    });
    this.toc.set(entries);

    root.querySelectorAll('a[href^="http"]').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    root.querySelectorAll('table').forEach((table) => {
      const wrap = document.createElement('div');
      wrap.className = 'docs-table-wrap';
      table.parentNode?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    this.observeHeadings(root);
    this.renderDiagrams(root);

    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }), 300);
  }

  private observeHeadings(root: HTMLElement) {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((items) => {
      const visible = items.filter((i) => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) this.active.set(visible[0].target.id);
    }, { rootMargin: '-70px 0px -70% 0px' });
    root.querySelectorAll('h2, h3').forEach((h) => observer.observe(h));
  }

  private async renderDiagrams(root: HTMLElement) {
    const blocks = Array.from(root.querySelectorAll('code.language-mermaid'));
    if (!blocks.length) return;
    const { default: mermaid } = await import('mermaid');
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const dark = document.documentElement.classList.contains('dark');
    const panel = token('--panel', dark ? '#111827' : '#ffffff');
    const text = token('--text', dark ? '#f3f4f6' : '#111827');
    const muted = token('--muted', '#6b7280');
    const border = token('--border', dark ? '#374151' : '#e5e7eb');
    const bg = token('--bg', dark ? '#0b1120' : '#f8fafc');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'inherit',
      themeVariables: {
        darkMode: dark,
        background: panel,
        mainBkg: bg,
        primaryColor: bg,
        primaryTextColor: text,
        primaryBorderColor: border,
        secondaryColor: panel,
        tertiaryColor: panel,
        lineColor: muted,
        textColor: text,
        noteBkgColor: panel,
        noteTextColor: text,
        noteBorderColor: border,
        actorBkg: bg,
        actorBorder: border,
        actorTextColor: text,
        signalColor: muted,
        signalTextColor: text,
        labelBoxBkgColor: bg,
        labelBoxBorderColor: border,
        labelTextColor: text,
        clusterBkg: panel,
        clusterBorder: border,
        edgeLabelBackground: panel,
      },
    });
    for (let i = 0; i < blocks.length; i++) {
      const code = blocks[i];
      const pre = code.parentElement;
      const figure = document.createElement('figure');
      figure.className = 'docs-diagram';
      try {
        const { svg } = await mermaid.render(`docs-diagram-${i}`, code.textContent || '');
        figure.innerHTML = svg;
      } catch {
        figure.textContent = 'Diagram could not be drawn.';
      }
      pre?.replaceWith(figure);
    }
  }
}
