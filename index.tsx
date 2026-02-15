import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import App from "./App";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkKey}>
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </ClerkProvider>
  </React.StrictMode>
);
