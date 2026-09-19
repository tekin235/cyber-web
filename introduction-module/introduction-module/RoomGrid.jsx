import { Link } from 'react-router-dom';

const OPEN_ROOMS = [
  {
    to: 'build-tool',
    glyph: '▦',
    title: 'The build tool',
    desc: (
      <>
        A binary called <code className="im-code">vault</code> sits in the leaked files. It's
        hiding more than it's showing.
      </>
    ),
  },
  {
    to: 'hidden-page',
    glyph: '◈',
    title: "The page that shouldn't exist",
    desc: "Acme's own site tells crawlers to stay away from something. Naturally, you don't.",
  },
  {
    to: 'guestbook',
    glyph: '✎',
    title: 'The guestbook',
    desc: 'Somewhere, an admin still reads every comment posted here. Make that a problem for them.',
  },
];

const LOCKED_ROOMS = [
  { glyph: '⇄', title: 'The coffee shop wifi', desc: 'Opens with the network dungeon. Watch a login cross the wire in plain text.' },
  { glyph: '✷', title: 'The encoded memo', desc: 'Opens with the crypto session. A message that was "encrypted" — barely.' },
  { glyph: '⌁', title: 'The support form', desc: 'Opens with terminal/privesc. A form field that gets passed straight to a shell.' },
  { glyph: '▤', title: "Somebody else's invoice", desc: "Opens with web fundamentals. Change one number in a URL, see a stranger's data." },
  { glyph: '⛁', title: 'The "../../" folder', desc: "Opens with terminal/privesc. A file picker that never checks where you're pointing it." },
  { glyph: '☏', title: 'The phone call', desc: 'Opens with the social engineering session. No exploit — just a very convincing voice.' },
];

export default function RoomGrid() {
  return (
    <div className="im-module">
      <h1 className="im-h1">What's on the drive</h1>
      <p className="im-lead">
        Three scenes are open right now. Jump between them any time — nothing needs to be
        finished in one sitting. The rest unlock as the real dungeons do over the semester.
      </p>
      <div className="im-rooms">
        {OPEN_ROOMS.map((r) => (
          <Link className="im-room" to={r.to} key={r.to}>
            <div className="im-room-top">
              <div className="im-glyph">{r.glyph}</div>
              <div className="im-tag">Open</div>
            </div>
            <h3 className="im-room-title">{r.title}</h3>
            <p className="im-room-desc">{r.desc}</p>
          </Link>
        ))}
        {LOCKED_ROOMS.map((r, i) => (
          <div className="im-room im-locked" key={i}>
            <div className="im-room-top">
              <div className="im-glyph">{r.glyph}</div>
              <div className="im-tag">Locked</div>
            </div>
            <h3 className="im-room-title">{r.title}</h3>
            <p className="im-room-desc">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
