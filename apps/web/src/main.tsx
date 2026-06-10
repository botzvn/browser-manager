import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@botzvn/frontend/app/App";
import "@botzvn/frontend/lib/i18n";
import "@botzvn/frontend/index.css";


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
