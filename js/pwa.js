(function () {
  if (!("serviceWorker" in navigator)) return;
  const http = location.protocol === "http:" || location.protocol === "https:";
  if (!http) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () { });
  });
})();
