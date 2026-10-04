import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type View = "overview" | "services" | "reports" | "settings";
type RequestStatus = "In review" | "Needs attention" | "Completed";
type ApiStatus = "checking" | "available" | "unavailable";

type ServiceRequest = {
  id: string;
  resident: string;
  service: string;
  submitted: string;
  status: RequestStatus;
};

const initialRequests: ServiceRequest[] = [
  { id: "SR-2048", resident: "Amara Okafor", service: "Housing assistance", submitted: "Oct 24, 2024", status: "In review" },
  { id: "SR-2047", resident: "Noah Williams", service: "Business license", submitted: "Oct 24, 2024", status: "Needs attention" },
  { id: "SR-2046", resident: "Sofia Chen", service: "Food support", submitted: "Oct 23, 2024", status: "Completed" },
  { id: "SR-2045", resident: "Ethan Patel", service: "Housing assistance", submitted: "Oct 23, 2024", status: "In review" },
  { id: "SR-2044", resident: "Isabella Garcia", service: "Child care subsidy", submitted: "Oct 22, 2024", status: "Completed" },
];

const navigation: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "services", label: "Service requests", icon: "▤" },
  { id: "reports", label: "Reports", icon: "▥" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

function StatusBadge({ status }: { status: RequestStatus }) {
  const style = status === "Completed" ? "complete" : status === "Needs attention" ? "attention" : "review";
  return <span className={`status-badge status-${style}`}><span aria-hidden="true" className="status-dot" />{status}</span>;
}

function RequestTable({ requests, onView }: { requests: ServiceRequest[]; onView: (request: ServiceRequest) => void }) {
  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">Recent service requests and their current status</caption>
        <thead>
          <tr>
            <th scope="col">Request ID</th>
            <th scope="col">Resident</th>
            <th scope="col">Service</th>
            <th scope="col">Date submitted</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? requests.map((request) => (
            <tr key={request.id}>
              <td><button className="request-link request-id-button" type="button" onClick={() => onView(request)}>{request.id}</button></td>
              <td><span className="resident-name">{request.resident}</span></td>
              <td>{request.service}</td>
              <td>{request.submitted}</td>
              <td><StatusBadge status={request.status} /></td>
              <td><button className="row-action" type="button" onClick={() => onView(request)} aria-label={`View request ${request.id}`}>View <span aria-hidden="true">→</span></button></td>
            </tr>
          )) : (
            <tr><td className="empty-state" colSpan={6}>No requests match your search. Try a different name or service.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function App() {
  const [view, setView] = useState<View>("overview");
  const [requests, setRequests] = useState(initialRequests);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [apiError, setApiError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailsDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
        if (mounted) setApiStatus("available");
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setApiStatus("unavailable");
        setApiError(error instanceof Error ? error.message : "Unknown network error");
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  useEffect(() => {
    const dialog = detailsDialogRef.current;
    if (!dialog) return;
    if (selectedRequest && !dialog.open) dialog.showModal();
    if (!selectedRequest && dialog.open) dialog.close();
  }, [selectedRequest]);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesQuery = `${request.id} ${request.resident} ${request.service}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All statuses" || request.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [query, requests, statusFilter]);

  const navigate = (next: View) => {
    setView(next);
    setQuery("");
    setStatusFilter("All statuses");
  };

  const addRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("resident")).trim();
    const service = String(data.get("service"));
    const request: ServiceRequest = {
      id: `SR-${2049 + requests.length - initialRequests.length}`,
      resident: name,
      service,
      submitted: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
      status: "In review",
    };
    setRequests((current) => [request, ...current]);
    setAnnouncement(`Request ${request.id} for ${name} was created.`);
    setDialogOpen(false);
    form.reset();
  };

  const heading = navigation.find((item) => item.id === view)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#overview" onClick={() => navigate("overview")} aria-label="CivicDesk home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Civic<span className="brand-light">Desk</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Primary">
          <ul className="nav-list">
            {navigation.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`nav-link ${view === item.id ? "is-active" : ""}`}
                  aria-current={view === item.id ? "page" : undefined}
                  onClick={() => navigate(item.id)}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                  {item.id === "services" && <span className="nav-count">{requests.length}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon" aria-hidden="true">?</span>
            <strong>Need a hand?</strong>
            <p>Visit the team help center for guidance.</p>
            <a href="#help">Get support <span aria-hidden="true">↗</span></a>
          </div>
          <div className="profile">
            <span className="avatar" aria-hidden="true">JD</span>
            <span className="profile-copy"><strong>Jordan Davis</strong><small>Program manager</small></span>
            <button className="icon-button profile-menu" type="button" aria-label="Open profile menu">···</button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span aria-hidden="true">/</span><strong>{heading}</strong></div>
          <div className="topbar-actions">
            <span className={`environment environment-${apiStatus}`} aria-live="polite" aria-atomic="true" title={apiError || undefined}>
              <span aria-hidden="true" />
              {apiStatus === "checking" && "Checking service connection…"}
              {apiStatus === "available" && "Service API connected"}
              {apiStatus === "unavailable" && "Service API unavailable"}
            </span>
            <button className="icon-button notification-button" type="button" aria-label="Notifications, 3 unread">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
              <span className="notification-dot" />
            </button>
            <button className="top-avatar" type="button" aria-label="Account for Jordan Davis">JD</button>
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
          {view === "overview" && (
            <>
              <section className="page-heading" aria-labelledby="page-title">
                <div>
                  <p className="eyebrow">TUESDAY, OCTOBER 29, 2024</p>
                  <h1 id="page-title">Good morning, Jordan <span aria-hidden="true">✦</span></h1>
                  <p className="heading-description">Here’s what’s happening across your services today.</p>
                </div>
                <button className="button button-primary" type="button" onClick={() => setDialogOpen(true)}><span aria-hidden="true">＋</span> New request</button>
              </section>

              <section aria-labelledby="snapshot-heading">
                <div className="section-heading">
                  <div><h2 id="snapshot-heading">Your service snapshot</h2><p>Performance at a glance</p></div>
                  <button className="button button-secondary date-button" type="button" aria-label="Date range: Last 30 days"><span aria-hidden="true">◷</span> <span>Last 30 days</span><span aria-hidden="true">⌄</span></button>
                </div>
                <div className="metric-grid">
                  <article className="metric-card">
                    <div className="metric-top"><span className="metric-icon purple" aria-hidden="true">▤</span><span className="trend positive">↗ 12.8%</span></div>
                    <p className="metric-label">Total requests</p><p className="metric-value">2,847</p><p className="metric-note">vs. previous 30 days</p>
                    <div className="sparkline purple-line" aria-hidden="true"><span /></div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-top"><span className="metric-icon blue" aria-hidden="true">◷</span><span className="trend positive">↘ 8.2%</span></div>
                    <p className="metric-label">Avg. response time</p><p className="metric-value">2.4 <span className="metric-unit">days</span></p><p className="metric-note">vs. previous 30 days</p>
                    <div className="sparkline blue-line" aria-hidden="true"><span /></div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-top"><span className="metric-icon green" aria-hidden="true">✓</span><span className="trend positive">↗ 4.3%</span></div>
                    <p className="metric-label">Resolution rate</p><p className="metric-value">94.2<span className="metric-unit">%</span></p><p className="metric-note">vs. previous 30 days</p>
                    <div className="sparkline green-line" aria-hidden="true"><span /></div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-top"><span className="metric-icon orange" aria-hidden="true">!</span><span className="trend neutral">Needs review</span></div>
                    <p className="metric-label">Needs attention</p><p className="metric-value">18</p><p className="metric-note">Requests awaiting action</p>
                    <div className="attention-meter" aria-hidden="true"><span /></div>
                  </article>
                </div>
              </section>

              <div className="overview-grid">
                <section className="panel requests-panel" aria-labelledby="requests-heading">
                  <div className="panel-heading">
                    <div><h2 id="requests-heading">Recent requests</h2><p>Keep track of the latest activity</p></div>
                    <a className="text-link" href="#services" onClick={() => navigate("services")}>View all <span aria-hidden="true">→</span></a>
                  </div>
                  <div className="toolbar">
                    <label className="search-field">
                      <span className="sr-only">Search requests by name, service, or ID</span>
                      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
                      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests..." />
                    </label>
                    <label className="select-field"><span className="sr-only">Filter requests by status</span>
                      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option>All statuses</option><option>In review</option><option>Needs attention</option><option>Completed</option>
                      </select>
                    </label>
                  </div>
                  <RequestTable requests={filteredRequests.slice(0, 5)} onView={setSelectedRequest} />
                  <a className="mobile-view-all" href="#services" onClick={() => navigate("services")}>View all requests <span aria-hidden="true">→</span></a>
                </section>

                <aside className="panel activity-panel" aria-labelledby="activity-heading">
                  <div className="panel-heading"><div><h2 id="activity-heading">Activity</h2><p>What’s happening right now</p></div><button className="icon-button small-icon-button" type="button" aria-label="More activity options">···</button></div>
                  <ol className="activity-list">
                    <li><span className="activity-avatar activity-purple" aria-hidden="true">AM</span><div><p><strong>Alex Morgan</strong> approved a <button className="activity-request" type="button" onClick={() => { const request = requests.find((item) => item.id === "SR-2046"); if (request) setSelectedRequest(request); }}>food support request</button></p><time dateTime="2024-10-29T09:42">12 min ago</time></div></li>
                    <li><span className="activity-avatar activity-blue" aria-hidden="true">KL</span><div><p><strong>Kim Lee</strong> added a note to <button className="activity-request" type="button" onClick={() => { const request = requests.find((item) => item.id === "SR-2047"); if (request) setSelectedRequest(request); }}>SR-2047</button></p><time dateTime="2024-10-29T09:18">36 min ago</time></div></li>
                    <li><span className="activity-system" aria-hidden="true">↗</span><div><p><strong>Business license</strong> response time is down 8% this month</p><time dateTime="2024-10-29T08:55">1 hour ago</time></div></li>
                    <li><span className="activity-avatar activity-peach" aria-hidden="true">TR</span><div><p><strong>Taylor Reed</strong> resolved a <button className="activity-request" type="button" onClick={() => { const request = requests.find((item) => item.id === "SR-2044"); if (request) setSelectedRequest(request); }}>child care subsidy request</button></p><time dateTime="2024-10-29T08:21">2 hours ago</time></div></li>
                  </ol>
                  <a className="activity-link" href="#activity">See all activity <span aria-hidden="true">→</span></a>
                </aside>
              </div>

              <section className="service-strip" aria-labelledby="services-heading">
                <div className="panel-heading"><div><h2 id="services-heading">Top services</h2><p>Most requested services this month</p></div><a className="text-link" href="#services" onClick={() => navigate("services")}>All services <span aria-hidden="true">→</span></a></div>
                <div className="service-cards">
                  <article className="service-card"><span className="service-emoji" aria-hidden="true">⌂</span><div><h3>Housing assistance</h3><p>842 requests</p></div><span className="service-change">↗ 18%</span></article>
                  <article className="service-card"><span className="service-emoji food" aria-hidden="true">♡</span><div><h3>Food support</h3><p>624 requests</p></div><span className="service-change">↗ 9%</span></article>
                  <article className="service-card"><span className="service-emoji business" aria-hidden="true">▣</span><div><h3>Business license</h3><p>431 requests</p></div><span className="service-change">↘ 3%</span></article>
                </div>
              </section>
            </>
          )}

          {view === "services" && (
            <section aria-labelledby="page-title">
              <div className="page-heading">
                <div><p className="eyebrow">WORKSPACE / REQUESTS</p><h1 id="page-title">Service requests</h1><p className="heading-description">Review, search, and manage resident requests.</p></div>
                <button className="button button-primary" type="button" onClick={() => setDialogOpen(true)}><span aria-hidden="true">＋</span> New request</button>
              </div>
              <div className="metric-grid compact-metrics">
                <article className="metric-card"><p className="metric-label">All requests</p><p className="metric-value">{requests.length.toLocaleString()}</p><p className="metric-note">Across all services</p></article>
                <article className="metric-card"><p className="metric-label">In review</p><p className="metric-value">{requests.filter((item) => item.status === "In review").length}</p><p className="metric-note">Being processed</p></article>
                <article className="metric-card"><p className="metric-label">Needs attention</p><p className="metric-value">{requests.filter((item) => item.status === "Needs attention").length}</p><p className="metric-note">Action is required</p></article>
                <article className="metric-card"><p className="metric-label">Completed</p><p className="metric-value">{requests.filter((item) => item.status === "Completed").length}</p><p className="metric-note">Successfully resolved</p></article>
              </div>
              <section className="panel full-table-panel" aria-labelledby="all-requests-heading">
                <div className="panel-heading"><div><h2 id="all-requests-heading">All requests</h2><p>{filteredRequests.length} results</p></div></div>
                <div className="toolbar">
                  <label className="search-field"><span className="sr-only">Search requests by name, service, or ID</span><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests..." /></label>
                  <label className="select-field"><span className="sr-only">Filter requests by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>In review</option><option>Needs attention</option><option>Completed</option></select></label>
                </div>
                <RequestTable requests={filteredRequests} onView={setSelectedRequest} />
              </section>
            </section>
          )}

          {view === "reports" && (
            <section aria-labelledby="page-title">
              <div className="page-heading"><div><p className="eyebrow">WORKSPACE / INSIGHTS</p><h1 id="page-title">Reports</h1><p className="heading-description">Understand how residents use your services.</p></div><button className="button button-secondary" type="button" onClick={() => setAnnouncement("Report export is not configured in this demo.")}><span aria-hidden="true">↓</span> <span>Export report</span></button></div>
              <div className="report-grid">
                <article className="panel report-card"><span className="metric-icon purple" aria-hidden="true">▥</span><h2>Request volume</h2><p>Track submissions and completion trends across all services.</p><button className="text-link" type="button" onClick={() => setAnnouncement("Request volume report selected.")}>Open report <span aria-hidden="true">→</span></button></article>
                <article className="panel report-card"><span className="metric-icon blue" aria-hidden="true">◷</span><h2>Response times</h2><p>See how quickly teams respond and where queues are growing.</p><button className="text-link" type="button" onClick={() => setAnnouncement("Response times report selected.")}>Open report <span aria-hidden="true">→</span></button></article>
                <article className="panel report-card"><span className="metric-icon green" aria-hidden="true">♙</span><h2>Resident experience</h2><p>Review satisfaction and feedback across your programs.</p><button className="text-link" type="button" onClick={() => setAnnouncement("Resident experience report selected.")}>Open report <span aria-hidden="true">→</span></button></article>
              </div>
              <section className="panel report-summary" aria-labelledby="monthly-summary"><div className="panel-heading"><div><h2 id="monthly-summary">Monthly summary</h2><p>October 1 – October 29, 2024</p></div></div><div className="summary-row"><span>Total requests received</span><strong>2,847 <span className="trend positive">↗ 12.8%</span></strong></div><div className="summary-row"><span>Requests resolved</span><strong>2,682 <span className="trend positive">↗ 14.1%</span></strong></div><div className="summary-row"><span>Average response time</span><strong>2.4 days <span className="trend positive">↘ 8.2%</span></strong></div></section>
            </section>
          )}

          {view === "settings" && (
            <section aria-labelledby="page-title">
              <div className="page-heading"><div><p className="eyebrow">WORKSPACE / PREFERENCES</p><h1 id="page-title">Settings</h1><p className="heading-description">Manage your workspace preferences and notifications.</p></div><button className="button button-primary" type="submit" form="profile-settings-form">Save changes</button></div>
              <section className="panel settings-panel" aria-labelledby="profile-heading"><div className="panel-heading"><div><h2 id="profile-heading">Profile information</h2><p>Update the details associated with your account.</p></div></div><form id="profile-settings-form" className="settings-form" onSubmit={(event) => { event.preventDefault(); setAnnouncement("Your profile has been saved for this session."); }}><div className="form-row"><label htmlFor="profile-name">Full name</label><input id="profile-name" defaultValue="Jordan Davis" autoComplete="name" /></div><div className="form-row"><label htmlFor="profile-email">Work email</label><input id="profile-email" type="email" defaultValue="jordan.davis@civicdesk.gov" autoComplete="email" /></div><div className="form-row"><label htmlFor="profile-role">Role</label><input id="profile-role" defaultValue="Program manager" /></div><button className="button button-primary" type="submit">Save profile</button></form></section>
              <section className="panel settings-panel notification-settings" aria-labelledby="notification-heading"><div className="panel-heading"><div><h2 id="notification-heading">Notifications</h2><p>Choose which updates you receive.</p></div></div><fieldset className="preference-list"><legend className="sr-only">Notification preferences</legend><label><span><strong>Request updates</strong><small>Get notified when a request needs your attention.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Weekly summary</strong><small>Receive a weekly overview of service performance.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Product announcements</strong><small>Hear about new features and improvements.</small></span><input type="checkbox" /></label></fieldset></section>
            </section>
          )}
          <footer className="footer"><span>© 2024 CivicDesk. Public service, made simpler.</span><nav aria-label="Legal and help"><a href="#privacy">Privacy</a><a href="#accessibility">Accessibility</a><a href="#help">Help center</a></nav></footer>
        </main>
      </div>

      <dialog ref={dialogRef} className="request-dialog" aria-labelledby="dialog-title" onClose={() => setDialogOpen(false)} onCancel={() => setDialogOpen(false)}>
        <form onSubmit={addRequest}>
          <div className="dialog-heading"><div><p className="eyebrow">SERVICE REQUEST</p><h2 id="dialog-title">Create a request</h2><p>Add a new resident request to your workspace.</p></div><button className="icon-button close-dialog" type="button" aria-label="Close dialog" onClick={() => setDialogOpen(false)}>×</button></div>
          <fieldset className="dialog-fields"><legend className="sr-only">Request details</legend>
            <label htmlFor="resident-name">Resident name <span aria-hidden="true">*</span></label>
            <input id="resident-name" name="resident" autoComplete="name" required minLength={2} maxLength={80} placeholder="Enter resident’s full name" />
            <label htmlFor="service-name">Service <span aria-hidden="true">*</span></label>
            <select id="service-name" name="service" required defaultValue=""><option value="" disabled>Select a service</option><option>Housing assistance</option><option>Business license</option><option>Food support</option><option>Child care subsidy</option></select>
            <label htmlFor="request-notes">Notes <span className="optional-label">(optional)</span></label>
            <textarea id="request-notes" name="notes" rows={3} maxLength={500} placeholder="Add details to help your team..." />
          </fieldset>
          <p className="required-note"><span aria-hidden="true">*</span> Required fields</p>
          <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Create request</button></div>
        </form>
      </dialog>
      <dialog ref={detailsDialogRef} className="request-dialog details-dialog" aria-labelledby="details-title" onClose={() => setSelectedRequest(null)} onCancel={() => setSelectedRequest(null)}>
        {selectedRequest && (
          <div>
            <div className="dialog-heading"><div><p className="eyebrow">REQUEST DETAILS</p><h2 id="details-title">{selectedRequest.id}</h2><p>Submitted {selectedRequest.submitted}</p></div><button className="icon-button close-dialog" type="button" aria-label="Close request details" onClick={() => setSelectedRequest(null)}>×</button></div>
            <dl className="request-details">
              <div><dt>Resident</dt><dd>{selectedRequest.resident}</dd></div>
              <div><dt>Service</dt><dd>{selectedRequest.service}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={selectedRequest.status} /></dd></div>
              <div><dt>Date submitted</dt><dd>{selectedRequest.submitted}</dd></div>
            </dl>
            <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setSelectedRequest(null)}>Close</button></div>
          </div>
        )}
      </dialog>
    </div>
  );
}
