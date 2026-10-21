import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** A run of text with its emphasis */
interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/** One block of AI text: a heading, a bullet (with its nesting depth) or a paragraph */
interface Block {
  kind: 'heading' | 'bullet' | 'paragraph';
  level: number;
  segments: Segment[];
}

/**
 * Shows AI-written Markdown-style text (## headings, - / * bullets, nested bullets, **bold**, *italic*) as readable
 * headings, lists and paragraphs. The text is parsed into plain text runs and rendered as text, never as HTML,
 * so nothing in it can inject markup.
 */
@Component({
  selector: 'app-ai-text',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1.5 text-xs leading-relaxed text-[var(--text)]">
      <ng-container *ngFor="let block of blocks">
        <h4 *ngIf="block.kind === 'heading'"
            class="font-bold text-[var(--text)] first:mt-0"
            [ngClass]="block.level <= 2 ? 'text-sm mt-3 pb-1 border-b border-[var(--border)]' : 'text-xs mt-3 text-cyan-700 dark:text-cyan-300 uppercase tracking-wide'">
          <ng-container *ngTemplateOutlet="segmentsTpl; context: { $implicit: block.segments }"></ng-container>
        </h4>
        <div *ngIf="block.kind === 'bullet'" class="flex gap-2" [style.padding-left.rem]="block.level * 1.1">
          <span class="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full"
                [ngClass]="block.level === 0 ? 'bg-cyan-500' : 'bg-[var(--muted)]'" aria-hidden="true"></span>
          <span class="min-w-0"><ng-container *ngTemplateOutlet="segmentsTpl; context: { $implicit: block.segments }"></ng-container></span>
        </div>
        <p *ngIf="block.kind === 'paragraph'">
          <ng-container *ngTemplateOutlet="segmentsTpl; context: { $implicit: block.segments }"></ng-container>
        </p>
      </ng-container>
    </div>

    <ng-template #segmentsTpl let-segments>
      <ng-container *ngFor="let s of segments"><strong *ngIf="s.bold" class="font-semibold">{{ s.text }}</strong><em *ngIf="!s.bold && s.italic" class="text-[var(--muted)]">{{ s.text }}</em><ng-container *ngIf="!s.bold && !s.italic">{{ s.text }}</ng-container></ng-container>
    </ng-template>
  `
})
export class AiTextComponent {
  blocks: Block[] = [];

  @Input() set text(value: string | null | undefined) {
    this.blocks = parseAiText(value);
  }
}

export function parseAiText(value: string | null | undefined): Block[] {
  const blocks: Block[] = [];
  for (const raw of String(value ?? '').replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const heading = /^\s*(#{1,6})\s+(.*)$/.exec(raw);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length, segments: inline(heading[2]) });
      continue;
    }
    const bullet = /^(\s*)(?:[-*•]|\d+[.)])\s+(.*)$/.exec(raw);
    if (bullet) {
      const depth = Math.min(3, Math.floor(bullet[1].replace(/\t/g, '  ').length / 2));
      blocks.push({ kind: 'bullet', level: depth, segments: inline(bullet[2]) });
      continue;
    }
    // A whole line in bold reads as a small heading
    const boldLine = /^\s*\*\*(.+)\*\*\s*$/.exec(raw);
    if (boldLine && !boldLine[1].includes('**')) {
      blocks.push({ kind: 'heading', level: 3, segments: inline(boldLine[1]) });
      continue;
    }
    blocks.push({ kind: 'paragraph', level: 0, segments: inline(raw.trim()) });
  }
  return blocks;
}

/** **bold** and *italic* runs; unmatched markers are dropped */
function inline(text: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) segments.push({ text: match[1].replace(/\*/g, ''), bold: true });
    else segments.push({ text: match[2], italic: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments.map(s => ({ ...s, text: s.text.replace(/\*\*/g, '') })).filter(s => s.text.length > 0);
}
