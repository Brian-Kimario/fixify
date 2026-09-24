import Link from 'next/link';

export function PropertyRecordPreview() {
  return (
    <section className="section" id="property">
      <div className="wrap property-feature">
        <div className="reveal">
          <p className="eyebrow">PROPERTY RECORD</p>
          <h2>Your home should remember the work.</h2>
          <p>
            Keep completed jobs, useful asset details, invoices and maintenance history together. Over time, the record becomes part of the property rather than disappearing into old chats.
          </p>
          <Link href="/property" className="btn btn-ghost" style={{ marginTop: '20px' }}>
            View a property record <span>→</span>
          </Link>
        </div>
        <div className="record-card reveal-scale">
          <div className="record-head">
            <div>
              <small>MERIDIAN COURT</small>
              <h3>Flat 3B</h3>
            </div>
            <span className="record-badge">ACTIVE RECORD</span>
          </div>
          <div className="record-row">
            <span>Kitchen plumbing</span>
            <span>Trap replaced</span>
          </div>
          <div className="record-row">
            <span>Split AC</span>
            <span>Service due</span>
          </div>
          <div className="record-row">
            <span>Fuse board</span>
            <span>RCD tested</span>
          </div>
          <div className="record-row">
            <span>Boiler</span>
            <span>Annual service</span>
          </div>
          <div className="record-foot">
            <span>14 jobs logged</span>
            <span>View full history →</span>
          </div>
        </div>
      </div>
    </section>
  );
}
