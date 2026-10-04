import { useEffect, useState } from "react";

type ApiStatus = "checking" | "available" | "unavailable";

export function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let mounted = true;

    fetch("/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Health endpoint returned ${response.status}`);
        }
        if (mounted) {
          setApiStatus("available");
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setApiStatus("unavailable");
          setApiError(
            error instanceof Error ? error.message : "Unknown network error",
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <main id="main" className="page" tabIndex={-1}>
        <h1>Public service directory</h1>
        <p>
          A starting point for finding and using public services online.
        </p>
        <section aria-labelledby="connection-heading">
          <h2 id="connection-heading">Local connection</h2>
          <p aria-live="polite">
            {apiStatus === "checking" && "Checking the service API…"}
            {apiStatus === "available" && "The service API is available."}
            {apiStatus === "unavailable" &&
              `The service API is unavailable. ${apiError}`}
          </p>
        </section>
      </main>
    </>
  );
}
