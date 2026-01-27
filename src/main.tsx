import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CategoryProvider } from "./contexts/CategoryContext.tsx";

createRoot(document.getElementById("root")!).render(
  <CategoryProvider>
    <App />
  </CategoryProvider>
);