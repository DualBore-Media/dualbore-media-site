import React, {lazy,Suspense} from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
const ManagedOperations=lazy(()=>import('./operations/ManagedOperations.jsx'));
const Unsubscribe=lazy(()=>import('./operations/Unsubscribe.jsx'));
const ProductionStore=lazy(()=>import('./commerce/ManagedStore.jsx'));
const store=window.location.pathname==='/shop'||(import.meta.env.MODE!=='commerce'&&/^\/order\/(success|pending|cancel)$/.test(window.location.pathname));
const operations=/^\/(account|admin)(\/|$)/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {operations?<Suspense fallback={<main className="store-page" role="status">Loading your garage...</main>}><ManagedOperations admin={window.location.pathname.startsWith('/admin')}/></Suspense>:window.location.pathname==='/unsubscribe'?<Suspense fallback={<main role="status">Loading email preferences...</main>}><Unsubscribe/></Suspense>:store?<Suspense fallback={<main className="store-page" role="status">Loading the garage store...</main>}><ProductionStore/></Suspense>:<App />}
  </React.StrictMode>,
);
