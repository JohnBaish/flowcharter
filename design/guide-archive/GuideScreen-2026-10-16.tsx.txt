import { SHAPES, SHAPE_ORDER, type ShapeType } from '../data/shapes.ts';
import { shapePath, shapeInnerLines } from '../lib/shapes.ts';

// The words on this screen are a second draft (2026-10-16, after Stage 5) for John to edit (SPEC §9).

const INK = '#201e1d';

/** A sample of each shape, drawn at a size that fits a guide tile. */
const SAMPLES: Record<ShapeType, { w: number; h: number; text: string[] }> = {
  terminator: { w: 112, h: 38, text: ['Start'] },
  process: { w: 124, h: 44, text: ['Book the backup'] },
  decision: { w: 132, h: 68, text: ['Backup', 'available?'] },
  io: { w: 130, h: 44, text: ['Receive call'] },
  predefined: { w: 130, h: 44, text: ['Arrange cover'] },
  document: { w: 118, h: 50, text: ['Rota'] },
  delay: { w: 124, h: 44, text: ['Wait an hour'] },
};

function ShapeSample({ type }: { type: ShapeType }) {
  const { w, h, text } = SAMPLES[type];
  const inner = shapeInnerLines(type, w, h);
  const top = h / 2 - ((text.length - 1) * 15) / 2 - (type === 'document' ? 4 : 0);
  return (
    <svg viewBox="0 0 160 76" width="160" height="76" aria-hidden="true" style={{ display: 'block', maxWidth: '100%', margin: '0 auto' }}>
      <g transform={`translate(${(160 - w) / 2} ${(76 - h) / 2})`}>
        <path d={shapePath(type, w, h)} fill={SHAPES[type].fill} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        {inner && <path d={inner} fill="none" stroke={INK} strokeWidth={1.5} />}
        <text textAnchor="middle" dominantBaseline="central" fontFamily="Figtree, sans-serif" fontSize={13} fill={INK}>
          {text.map((line, i) => <tspan key={i} x={w / 2} y={top + i * 15}>{line}</tspan>)}
        </text>
      </g>
    </svg>
  );
}

const section = { margin: '0 0 var(--space-4)', padding: 'var(--space-6)' } as const;
const heading = { margin: '2px 0 var(--space-3)' } as const;
const body = { margin: '0 0 var(--space-3)', fontSize: 14.5, lineHeight: 1.6, opacity: 1 } as const;

export function GuideScreen() {
  return (
    <div style={{ padding: '0 var(--space-4) var(--space-6)' }}>
      <div style={{ padding: 'var(--space-3) 0' }}>
        <div className="card-kicker" style={{ margin: 0 }}>Guide</div>
        <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>How Flowcharter works</h2>
      </div>

      <div className="card" style={section}>
        <p style={{ ...body, margin: 0 }}>
          Flowcharter turns a list into a flowchart. Answer a few questions one step at a time, or type your steps as a
          list, and the chart is drawn for you. There's no dragging boxes about. (You can return to this intro page at
          any time via “Guide”.)
        </p>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">Getting started</div>
        <h3 className="card-title" style={heading}>Two ways to build a chart</h3>
        <p style={body}>
          Press <strong>New chart</strong> and choose <strong>Step by step</strong> or <strong>Start with a blank
          list</strong>. Both build the same chart, and you can swap between them whenever you like.
        </p>
        <p style={body}>
          <strong>Step by step</strong> asks what happens next, in plain English: something gets done, you ask a
          question, information comes in or goes out, or it's the end. Write the step, and it's added to your chart.
          When you ask a question, the cards follow each answer in turn until every path has an ending. On a computer
          the chart grows beside the cards; on a phone, tap <strong>Peek at the chart</strong>. Press{' '}
          <strong>Back</strong> to change what you've just written.
        </p>
        <p style={{ ...body, margin: 0 }}>
          <strong>Switch to building in List mode</strong> takes you to the List at any point, and the List's{' '}
          <strong>Step by step</strong> button brings you back to the cards while anything is still unfinished.
        </p>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">The List</div>
        <h3 className="card-title" style={heading}>Writing the steps yourself</h3>
        <ul style={{ ...body, paddingLeft: 22, display: 'grid', gap: 'var(--space-2)', margin: 0 }}>
          <li>
            Add one row for each step: press <strong>+ Add item</strong>, or press Enter in a box.
          </li>
          <li>
            The <strong>Type</strong> decides the step's shape. Flowcharter guesses (the first row is the start, and a
            row ending in a question mark is a question), and you can change it.
          </li>
          <li>
            A question's answers appear underneath it. Use <strong>goes to</strong> to say where each one leads: pick
            a step, or <strong>+ New step</strong> to add one. Pointing back at an earlier step makes a loop.
          </li>
          <li>
            Every other row leads on to the next one. To skip ahead, go back or stop, change its{' '}
            <strong>then</strong> box.
          </li>
        </ul>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">The Chart</div>
        <h3 className="card-title" style={heading}>Seeing and sharing it</h3>
        <p style={{ ...body, margin: 0 }}>
          Use the <strong>List | Chart</strong> switch at the top to see your chart. <strong>Automatic</strong> draws it
          top to bottom or left to right, whichever fits your screen better; the other button lets you choose the
          other way. <strong>Print</strong> it, or use <strong>Copy image</strong> to paste it into something else.
        </p>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">The key</div>
        <h3 className="card-title" style={heading}>The shapes</h3>
        <p style={body}>
          Each type of step has its own shape and its own colour.
        </p>
        <div className="guide-shapes">
          {SHAPE_ORDER.map((t) => (
            <div key={t} className="guide-shape">
              <ShapeSample type={t} />
              <div style={{ font: '700 14px var(--font-body)', marginTop: 4 }}>{SHAPES[t].name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', lineHeight: 1.45 }}>{SHAPES[t].meaning}</div>
            </div>
          ))}
        </div>
        <p style={{ ...body, margin: 'var(--space-3) 0 0', fontSize: 13.5, color: 'var(--color-neutral-700)' }}>
          The shapes follow the usual flowchart conventions (ISO 5807). The colours are Flowcharter's own, and a chart
          still makes sense printed in black and white.
        </p>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">Making it clear</div>
        <h3 className="card-title" style={heading}>Tips</h3>
        <ul style={{ ...body, paddingLeft: 22, display: 'grid', gap: 'var(--space-2)', margin: 0 }}>
          <li>Start each action with a verb: "Send reminder", not "Reminder".</li>
          <li>Write questions that have short answers, such as Yes or No.</li>
          <li>Keep the wording short. Long text makes big boxes and a chart that's harder to read.</li>
          <li>Use the rarer shapes only when they add something; most charts need just the first four.</li>
        </ul>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">Your flowcharts</div>
        <h3 className="card-title" style={heading}>Where they're kept</h3>
        <p style={body}>
          Your flowcharts are saved automatically, but only in this browser, on this device. Use <strong>Export</strong> on
          the Library to keep a backup or to move them to another device, and <strong>Import</strong> to bring them back.
        </p>
        <p style={{ ...body, margin: 0 }}>
          The flowcharts you make here are not collected; they're only saved in your browser. We collect anonymous visit
          statistics (no cookies, no personal data) to see how the site is used. Flowcharter is a free-to-use personal
          project by John Baish. Contact: flowcharter@baish.net
        </p>
      </div>
    </div>
  );
}
