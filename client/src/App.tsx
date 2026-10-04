import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { fetchServiceTasks } from "./api";
import type { ServiceTask } from "./api";

type View = "overview" | "services" | "tasks" | "reports" | "settings";
type RequestStatus = "In review" | "Needs attention" | "Completed";
type ApiStatus = "checking" | "available" | "unavailable";
type TaskCategory = "all" | "open" | "completed";
type TaskSort = "title" | "assignee" | "status";
type TaskPreferences = { query: string; category: TaskCategory; sort: TaskSort };
type DemoUser = { name: string; email: string; role: string };

const taskPreferencesKey = "civicdesk.task-preferences";
const requestStorageKey = "civicdesk.service-requests";
const sessionStorageKey = "civicdesk.demo-session";
const defaultTaskPreferences: TaskPreferences = { query: "", category: "all", sort: "title" };
const demoUser: DemoUser = { name: "Jordan Davis", email: "jordan.davis@civicdesk.gov", role: "Program manager" };

function isTaskSort(value: string): value is TaskSort {
  return value === "title" || value === "assignee" || value === "status";
}

function readTaskPreferences(): { preferences: TaskPreferences; error: string } {
  try {
    const stored = localStorage.getItem(taskPreferencesKey);
    if (!stored) return { preferences: defaultTaskPreferences, error: "" };
    const value: unknown = JSON.parse(stored);
    if (typeof value !== "object" || value === null) {
      return { preferences: defaultTaskPreferences, error: "Saved task preferences were invalid and have been reset." };
    }
    const data = value as Record<string, unknown>;
    return {
      preferences: {
        query: typeof data.query === "string" ? data.query : "",
        category: data.category === "open" || data.category === "completed" ? data.category : "all",
        sort: data.sort === "assignee" || data.sort === "status" ? data.sort : "title",
      },
      error: "",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
    return { preferences: defaultTaskPreferences, error: `Task preferences could not be loaded: ${message}` };
  }
}

type ServiceRequest = {
  id: string;
  resident: string;
  service: string;
  submitted: string;
  status: RequestStatus;
  notes: string;
};

const initialRequests: ServiceRequest[] = [
  { id: "SR-2048", resident: "Amara Okafor", service: "Housing assistance", submitted: "Oct 24, 2024", status: "In review", notes: "" },
  { id: "SR-2047", resident: "Noah Williams", service: "Business license", submitted: "Oct 24, 2024", status: "Needs attention", notes: "" },
  { id: "SR-2046", resident: "Sofia Chen", service: "Food support", submitted: "Oct 23, 2024", status: "Completed", notes: "" },
  { id: "SR-2045", resident: "Ethan Patel", service: "Housing assistance", submitted: "Oct 23, 2024", status: "In review", notes: "" },
  { id: "SR-2044", resident: "Isabella Garcia", service: "Child care subsidy", submitted: "Oct 22, 2024", status: "Completed", notes: "" },
];

function isRequestStatus(value: unknown): value is RequestStatus {
  return value === "In review" || value === "Needs attention" || value === "Completed";
}

function isServiceRequest(value: unknown): value is ServiceRequest {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value && typeof value.id === "string"
    && "resident" in value && typeof value.resident === "string"
    && "service" in value && typeof value.service === "string"
    && "submitted" in value && typeof value.submitted === "string"
    && "status" in value && isRequestStatus(value.status)
    && "notes" in value && typeof value.notes === "string";
}

function readRequests(): { requests: ServiceRequest[]; error: string } {
  try {
    const stored = localStorage.getItem(requestStorageKey);
    if (!stored) return { requests: initialRequests, error: "" };
    const value: unknown = JSON.parse(stored);
    if (!Array.isArray(value) || !value.every(isServiceRequest)) {
      return { requests: initialRequests, error: "Saved requests were invalid. The sample requests have been restored." };
    }
    return { requests: value, error: "" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
    return { requests: initialRequests, error: `Saved requests could not be loaded: ${message}` };
  }
}

function isDemoUser(value: unknown): value is DemoUser {
  if (typeof value !== "object" || value === null) return false;
  return "name" in value && typeof value.name === "string"
    && "email" in value && typeof value.email === "string"
    && "role" in value && typeof value.role === "string";
}

function readDemoSession(): { user: DemoUser | null; error: string } {
  try {
    const stored = localStorage.getItem(sessionStorageKey);
    if (!stored) return { user: null, error: "" };
    const value: unknown = JSON.parse(stored);
    if (isDemoUser(value)) return { user: value, error: "" };
    return { user: null, error: "The saved demo session was invalid. Please sign in again." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
    return { user: null, error: `The saved demo session could not be loaded: ${message}` };
  }
}

const navigation: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "services", label: "Service requests", icon: "▤" },
  { id: "tasks", label: "Team tasks", icon: "✓" },
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
  const [sessionData] = useState(readDemoSession);
  const [demoSession, setDemoSession] = useState(sessionData.user);
  const [view, setView] = useState<View>("overview");
  const [requestData] = useState(readRequests);
  const [requests, setRequests] = useState(requestData.requests);
  const [requestStorageError, setRequestStorageError] = useState(requestData.error);
  const initialRequestsRef = useRef(requestData.requests);
  const [taskPreferencesRead] = useState(readTaskPreferences);
  const [taskPreferences, setTaskPreferences] = useState(taskPreferencesRead.preferences);
  const [preferenceError, setPreferenceError] = useState(taskPreferencesRead.error);
  const initialTaskPreferences = useRef(taskPreferences);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [taskLoadState, setTaskLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [tasksError, setTasksError] = useState("");
  const [taskReloadKey, setTaskReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [authError, setAuthError] = useState(sessionData.error);
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
    if (taskPreferences === initialTaskPreferences.current) return;
    try {
      localStorage.setItem(taskPreferencesKey, JSON.stringify(taskPreferences));
      setPreferenceError("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
      setPreferenceError(`Task preferences could not be saved: ${message}`);
    }
  }, [taskPreferences]);

  useEffect(() => {
    if (requests === initialRequestsRef.current) return;
    try {
      localStorage.setItem(requestStorageKey, JSON.stringify(requests));
      setRequestStorageError("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
      setRequestStorageError(`Request changes could not be saved: ${message}`);
    }
  }, [requests]);

  useEffect(() => {
    if (!demoSession) return;
    try {
      localStorage.setItem(sessionStorageKey, JSON.stringify(demoSession));
      setAuthError("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
      setAuthError(`Your demo session could not be saved: ${message}`);
    }
  }, [demoSession]);

  useEffect(() => {
    const controller = new AbortController();
    setTaskLoadState("loading");
    setTasksError("");

    async function loadTasks() {
      try {
        const result = await fetchServiceTasks(controller.signal);
        if (controller.signal.aborted) return;
        setTasks(result);
        setTaskLoadState("loaded");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setTasksError(error instanceof Error ? error.message : "An unexpected network error occurred.");
        setTaskLoadState("error");
      }
    }

    void loadTasks();
    return () => controller.abort();
  }, [taskReloadKey]);

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

  const filteredTasks = useMemo(() => tasks
    .filter((task) => {
      const matchesCategory = taskPreferences.category === "all"
        || (taskPreferences.category === "completed" ? task.completed : !task.completed);
      const matchesQuery = `${task.title} ${task.assignee}`.toLowerCase().includes(taskPreferences.query.toLowerCase());
      return matchesCategory && matchesQuery;
    })
    .sort((first, second) => {
      if (taskPreferences.sort === "status") return Number(first.completed) - Number(second.completed);
      const firstValue = taskPreferences.sort === "assignee" ? first.assignee : first.title;
      const secondValue = taskPreferences.sort === "assignee" ? second.assignee : second.title;
      return firstValue.localeCompare(secondValue);
    }), [taskPreferences, tasks]);

  const navigate = (next: View) => {
    setView(next);
    setQuery("");
    setStatusFilter("All statuses");
  };

  const saveRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const resident = String(data.get("resident")).trim();
    const service = String(data.get("service"));
    const statusValue = String(data.get("status"));
    if (!isRequestStatus(statusValue)) {
      setAnnouncement("Choose a valid request status before saving.");
      return;
    }
    const notes = String(data.get("notes")).trim();
    if (editingRequest) {
      const updatedRequest = { ...editingRequest, resident, service, status: statusValue, notes };
      setRequests((current) => current.map((request) => request.id === editingRequest.id ? updatedRequest : request));
      setAnnouncement(`Request ${editingRequest.id} was updated.`);
    } else {
      const nextId = Math.max(2048, ...requests.map((request) => Number(request.id.replace(/^SR-/, "")) || 0)) + 1;
      const request: ServiceRequest = {
        id: `SR-${nextId}`,
        resident,
        service,
        submitted: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
        status: statusValue,
        notes,
      };
      setRequests((current) => [request, ...current]);
      setAnnouncement(`Request ${request.id} for ${resident} was created.`);
    }
    setDialogOpen(false);
    setEditingRequest(null);
  };

  const beginCreate = () => {
    setEditingRequest(null);
    setDialogOpen(true);
  };

  const beginEdit = () => {
    if (!selectedRequest) return;
    setEditingRequest(selectedRequest);
    setSelectedRequest(null);
    setDeleteConfirmation(false);
    setDialogOpen(true);
  };

  const deleteSelectedRequest = () => {
    if (!selectedRequest) return;
    setRequests((current) => current.filter((request) => request.id !== selectedRequest.id));
    setAnnouncement(`Request ${selectedRequest.id} was deleted.`);
    setSelectedRequest(null);
    setDeleteConfirmation(false);
  };

  const signInToDemo = () => {
    setDemoSession(demoUser);
    setAuthError("");
  };

  const signOutOfDemo = () => {
    try {
      localStorage.removeItem(sessionStorageKey);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Browser storage is unavailable.";
      setAuthError(`Your demo session could not be cleared: ${message}`);
    }
    setDemoSession(null);
    setAnnouncement("You signed out of the demo workspace.");
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!demoSession) return;
    const data = new FormData(event.currentTarget);
    const updatedSession = {
      name: String(data.get("name")).trim(),
      email: String(data.get("email")).trim(),
      role: String(data.get("role")).trim(),
    };
    if (!updatedSession.name || !updatedSession.email || !updatedSession.role) return;
    setDemoSession(updatedSession);
    setAnnouncement("Your demo profile was saved.");
  };

  const heading = navigation.find((item) => item.id === view)?.label ?? "Overview";

  if (!demoSession) {
    return (
      <main className="sign-in-page">
        <section className="sign-in-card" aria-labelledby="sign-in-title">
          <a className="brand sign-in-brand" href="#home" aria-label="CivicDesk">
            <span className="brand-mark" aria-hidden="true">C</span>
            <span>Civic<span className="brand-light">Desk</span></span>
          </a>
          <p className="eyebrow">PUBLIC SERVICE WORKSPACE</p>
          <h1 id="sign-in-title">Welcome to CivicDesk</h1>
          <p className="heading-description">Sign in to explore the interactive service operations demo.</p>
          {authError && <div className="task-alert" role="alert">{authError}</div>}
          <button className="button button-primary sign-in-button" type="button" onClick={signInToDemo}>Continue as demo user</button>
          <p className="sign-in-note">Demo authentication only. No password or real account is required.</p>
        </section>
      </main>
    );
  }

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
            <span className="avatar" aria-hidden="true">{demoSession.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
            <span className="profile-copy"><strong>{demoSession.name}</strong><small>{demoSession.role}</small></span>
            <button className="icon-button profile-menu" type="button" onClick={signOutOfDemo} aria-label="Sign out of demo workspace">↪</button>
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
            <button className="top-avatar" type="button" onClick={signOutOfDemo} aria-label={`Sign out ${demoSession.name}`}>{demoSession.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</button>
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
          {requestStorageError && <div className="task-alert" role="alert">{requestStorageError}</div>}
          {view === "overview" && (
            <>
              <section className="page-heading" aria-labelledby="page-title">
                <div>
                  <p className="eyebrow">TUESDAY, OCTOBER 29, 2024</p>
                  <h1 id="page-title">Good morning, Jordan <span aria-hidden="true">✦</span></h1>
                  <p className="heading-description">Here’s what’s happening across your services today.</p>
                </div>
                <button className="button button-primary" type="button" onClick={beginCreate}><span aria-hidden="true">＋</span> New request</button>
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
                <button className="button button-primary" type="button" onClick={beginCreate}><span aria-hidden="true">＋</span> New request</button>
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

          {view === "tasks" && (
            <section aria-labelledby="page-title">
              <div className="page-heading">
                <div><p className="eyebrow">WORKSPACE / OPERATIONS</p><h1 id="page-title">Team tasks</h1><p className="heading-description">Track your team’s work, powered by live task data.</p></div>
                <span className={`task-connection ${taskLoadState}`} role="status">
                  <span aria-hidden="true" />
                  {taskLoadState === "loading" ? "Loading tasks" : taskLoadState === "error" ? "Tasks unavailable" : `${tasks.length} tasks loaded`}
                </span>
              </div>
              {preferenceError && <div className="task-alert" role="alert">{preferenceError}</div>}
              {taskLoadState === "error" && (
                <div className="task-alert" role="alert">
                  <span>We couldn’t load the team tasks. {tasksError}</span>
                  <button className="button button-secondary" type="button" onClick={() => setTaskReloadKey((key) => key + 1)}>Try again</button>
                </div>
              )}
              <section className="panel tasks-panel" aria-labelledby="tasks-heading">
                <div className="panel-heading">
                  <div><h2 id="tasks-heading">Task board</h2><p>{taskLoadState === "loaded" ? `${filteredTasks.length} matching tasks` : "Tasks from the public task service"}</p></div>
                </div>
                <div className="task-toolbar">
                  <label className="search-field task-search">
                    <span className="sr-only">Search tasks by title or assignee</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
                    <input type="search" value={taskPreferences.query} onChange={(event) => setTaskPreferences((current) => ({ ...current, query: event.target.value }))} placeholder="Search tasks or assignees..." />
                  </label>
                  <label className="select-field task-sort"><span className="sr-only">Sort tasks</span>
                    <select value={taskPreferences.sort} onChange={(event) => { const sort = event.target.value; if (isTaskSort(sort)) setTaskPreferences((current) => ({ ...current, sort })); }}>
                      <option value="title">Sort: task name</option><option value="assignee">Sort: assignee</option><option value="status">Sort: status</option>
                    </select>
                  </label>
                </div>
                <div className="task-tabs" role="group" aria-label="Filter tasks by status">
                  {([
                    ["all", "All tasks"],
                    ["open", "Open"],
                    ["completed", "Completed"],
                  ] as const).map(([category, label]) => (
                    <button key={category} className={`task-tab ${taskPreferences.category === category ? "is-active" : ""}`} type="button" aria-pressed={taskPreferences.category === category} onClick={() => setTaskPreferences((current) => ({ ...current, category }))}>{label}</button>
                  ))}
                </div>
                {taskLoadState === "loading" ? (
                  <div className="task-list task-skeletons" role="status" aria-label="Loading tasks">
                    {Array.from({ length: 5 }, (_, index) => <div className="task-skeleton" key={index}><span /><span /><span /></div>)}
                  </div>
                ) : taskLoadState === "loaded" && (
                  filteredTasks.length > 0 ? (
                    <ul className="task-list" id="tasks-list">
                      {filteredTasks.map((task) => (
                        <li className="task-item" key={task.id}>
                          <span className={`task-state ${task.completed ? "is-complete" : ""}`} aria-hidden="true">{task.completed ? "✓" : "○"}</span>
                          <div className="task-copy"><h3>{task.title}</h3><p>Assigned to {task.assignee} <span aria-hidden="true">·</span> Task #{task.id}</p></div>
                          <span className={`task-status ${task.completed ? "is-complete" : ""}`}>{task.completed ? "Completed" : "Open"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="task-empty" role="status">No tasks match these filters. Try another search or status.</p>
                )}
              </section>
              <p className="task-source">Live demo data from <a href="https://jsonplaceholder.typicode.com/" target="_blank" rel="noreferrer">JSONPlaceholder</a>. Search, filters, and sort order are saved in this browser.</p>
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
              <section className="panel settings-panel" aria-labelledby="profile-heading"><div className="panel-heading"><div><h2 id="profile-heading">Profile information</h2><p>Update the details associated with your demo account.</p></div></div><form id="profile-settings-form" className="settings-form" onSubmit={saveProfile}><div className="form-row"><label htmlFor="profile-name">Full name</label><input id="profile-name" name="name" defaultValue={demoSession.name} autoComplete="name" required maxLength={80} /></div><div className="form-row"><label htmlFor="profile-email">Work email</label><input id="profile-email" name="email" type="email" defaultValue={demoSession.email} autoComplete="email" required maxLength={120} /></div><div className="form-row"><label htmlFor="profile-role">Role</label><input id="profile-role" name="role" defaultValue={demoSession.role} required maxLength={80} /></div><button className="button button-primary" type="submit">Save profile</button></form><button className="button button-secondary sign-out-button" type="button" onClick={signOutOfDemo}>Sign out</button></section>
              <section className="panel settings-panel notification-settings" aria-labelledby="notification-heading"><div className="panel-heading"><div><h2 id="notification-heading">Notifications</h2><p>Choose which updates you receive.</p></div></div><fieldset className="preference-list"><legend className="sr-only">Notification preferences</legend><label><span><strong>Request updates</strong><small>Get notified when a request needs your attention.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Weekly summary</strong><small>Receive a weekly overview of service performance.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Product announcements</strong><small>Hear about new features and improvements.</small></span><input type="checkbox" /></label></fieldset></section>
            </section>
          )}
          <footer className="footer"><span>© 2024 CivicDesk. Public service, made simpler.</span><nav aria-label="Legal and help"><a href="#privacy">Privacy</a><a href="#accessibility">Accessibility</a><a href="#help">Help center</a></nav></footer>
        </main>
      </div>

      <dialog ref={dialogRef} key={editingRequest?.id ?? "new-request"} className="request-dialog" aria-labelledby="dialog-title" onClose={() => { setDialogOpen(false); setEditingRequest(null); }} onCancel={() => { setDialogOpen(false); setEditingRequest(null); }}>
        <form onSubmit={saveRequest}>
          <div className="dialog-heading"><div><p className="eyebrow">SERVICE REQUEST</p><h2 id="dialog-title">{editingRequest ? "Edit request" : "Create a request"}</h2><p>{editingRequest ? "Update this request in your workspace." : "Add a new resident request to your workspace."}</p></div><button className="icon-button close-dialog" type="button" aria-label="Close dialog" onClick={() => setDialogOpen(false)}>×</button></div>
          <fieldset className="dialog-fields"><legend className="sr-only">Request details</legend>
            <label htmlFor="resident-name">Resident name <span aria-hidden="true">*</span></label>
            <input id="resident-name" name="resident" autoComplete="name" required minLength={2} maxLength={80} defaultValue={editingRequest?.resident ?? ""} placeholder="Enter resident’s full name" />
            <label htmlFor="service-name">Service <span aria-hidden="true">*</span></label>
            <select id="service-name" name="service" required defaultValue={editingRequest?.service ?? ""}><option value="" disabled>Select a service</option><option>Housing assistance</option><option>Business license</option><option>Food support</option><option>Child care subsidy</option></select>
            <label htmlFor="request-status">Status <span aria-hidden="true">*</span></label>
            <select id="request-status" name="status" required defaultValue={editingRequest?.status ?? "In review"}><option>In review</option><option>Needs attention</option><option>Completed</option></select>
            <label htmlFor="request-notes">Notes <span className="optional-label">(optional)</span></label>
            <textarea id="request-notes" name="notes" rows={3} maxLength={500} defaultValue={editingRequest?.notes ?? ""} placeholder="Add details to help your team..." />
          </fieldset>
          <p className="required-note"><span aria-hidden="true">*</span> Required fields</p>
          <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="button button-primary" type="submit">{editingRequest ? "Save changes" : "Create request"}</button></div>
        </form>
      </dialog>
      <dialog ref={detailsDialogRef} className="request-dialog details-dialog" aria-labelledby="details-title" onClose={() => { setSelectedRequest(null); setDeleteConfirmation(false); }} onCancel={() => { setSelectedRequest(null); setDeleteConfirmation(false); }}>
        {selectedRequest && (
          <div>
            <div className="dialog-heading"><div><p className="eyebrow">REQUEST DETAILS</p><h2 id="details-title">{selectedRequest.id}</h2><p>Submitted {selectedRequest.submitted}</p></div><button className="icon-button close-dialog" type="button" aria-label="Close request details" onClick={() => { setSelectedRequest(null); setDeleteConfirmation(false); }}>×</button></div>
            {deleteConfirmation ? (
              <div className="delete-confirmation" role="alert"><p>Delete request {selectedRequest.id}? This action cannot be undone.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setDeleteConfirmation(false)}>Keep request</button><button className="button button-danger" type="button" onClick={deleteSelectedRequest}>Delete request</button></div></div>
            ) : (
              <>
                <dl className="request-details">
                  <div><dt>Resident</dt><dd>{selectedRequest.resident}</dd></div>
                  <div><dt>Service</dt><dd>{selectedRequest.service}</dd></div>
                  <div><dt>Status</dt><dd><StatusBadge status={selectedRequest.status} /></dd></div>
                  <div><dt>Date submitted</dt><dd>{selectedRequest.submitted}</dd></div>
                  <div><dt>Notes</dt><dd>{selectedRequest.notes || "No notes"}</dd></div>
                </dl>
                <div className="dialog-actions"><button className="button button-danger" type="button" onClick={() => setDeleteConfirmation(true)}>Delete</button><button className="button button-secondary" type="button" onClick={() => setSelectedRequest(null)}>Close</button><button className="button button-primary" type="button" onClick={beginEdit}>Edit request</button></div>
              </>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
