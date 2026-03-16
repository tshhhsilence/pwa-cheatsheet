// app.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered:", reg.scope);
    } catch (e) {
      console.error("SW registration failed:", e);
    }
  });
}
