

  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import { BrowserRouter } from 'react-router-dom';
  import "./index.css";
  import { Workbox } from "workbox-window";

  if ("serviceWorker" in navigator) {
    const wb = new Workbox("/sw.js");
    wb.register();
  }


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);


  