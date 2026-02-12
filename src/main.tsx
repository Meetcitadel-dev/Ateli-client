import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary.tsx";

const container = document.getElementById("root");
if (container) {
    createRoot(container).render(
        <GlobalErrorBoundary>
            <App />
        </GlobalErrorBoundary>
    );
} else {
    console.error("Root element not found");
}
