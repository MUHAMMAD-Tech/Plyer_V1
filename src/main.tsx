import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "next-themes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <App />
      </ThemeProvider>
    </AppWrapper>
  </StrictMode>
);
