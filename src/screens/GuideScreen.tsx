import { SHAPES, SHAPE_ORDER, type ShapeType } from '../data/shapes.ts';
import { shapePath, shapeInnerLines } from '../lib/shapes.ts';

// The words on this screen are a first draft for John to edit (SPEC §9).

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
  connector: { w: 40, h: 40, text: ['A'] },
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
          Flowcharter turns a list into a flowchart. You write your steps one row at a time, say what kind of step each
          one is, and the chart is drawn for you. There's no dragging boxes about.
        </p>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">Step by step</div>
        <h3 className="card-title" style={heading}>Making a flowchart</h3>
        <ol style={{ ...body, paddingLeft: 22, display: 'grid', gap: 'var(--space-2)' }}>
          <li>Press <strong>New chart</strong> and give it a name.</li>
          <li>
            On the <strong>List</strong>, add one row for each step. Press <strong>Add item</strong>, or press Enter in a
            box. Keep each step short, and start it with a verb: "Book the backup".
          </li>
          <li>
            Check the <strong>Type</strong> of each row, because the type decides its shape. Flowcharter guesses (the
            first row is the start, and a row ending in a question mark is a decision), and you can change any of them.
          </li>
          <li>
            A <strong>decision</strong> is a question. Its answers appear underneath it. Write what each answer is called
            ("Yes", "No"), and use <strong>goes to</strong> to say which step it leads to. Pointing back at an earlier
            step makes a loop. The number box changes how many answers there are, from 2 to 6.
          </li>
          <li>
            Every other row leads on to the next row. To skip ahead, go back, or stop, change its <strong>then</strong>{' '}
            box.
          </li>
          <li>
            Open the <strong>Chart</strong>. <strong>Automatic</strong> picks top-to-bottom or left-to-right, whichever
            fits better, and <strong>Down</strong> and <strong>Across</strong> let you choose. Then <strong>Print</strong>{' '}
            it, or use <strong>Copy image</strong> to paste it into something else.
          </li>
        </ol>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">The key</div>
        <h3 className="card-title" style={heading}>The shapes</h3>
        <p style={body}>
          Each type of step has its own shape and its own colour. Most flowcharts only need the first four.
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
          The arrows join the steps in order, and a decision's answers are written on its arrows. The shapes follow the
          usual flowchart conventions (the international standard is ISO 5807). The colours are Flowcharter's own: the
          shapes and the wording carry the meaning too, so a chart still makes sense printed in black and white.
        </p>
      </div>

      <div className="card" style={section}>
        <div className="card-kicker">Making it clear</div>
        <h3 className="card-title" style={heading}>Tips</h3>
        <ul style={{ ...body, paddingLeft: 22, display: 'grid', gap: 'var(--space-2)', margin: 0 }}>
          <li>Stick to Start / End, Process, Decision and Input / Output unless another shape really adds meaning.</li>
          <li>Start each step with a verb: "Send reminder", not "Reminder".</li>
          <li>Write each decision as a question with a short answer, such as Yes or No, and label every answer.</li>
          <li>Keep the flow going one way, top to bottom or left to right. Flowcharter does this for you.</li>
          <li>Keep the wording short. Long text makes big boxes and a chart that's harder to read.</li>
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
