/* Empty Leg List, hover intent for the mega menu.
 *
 * Pure CSS :hover closes the panel the instant the pointer leaves the trigger,
 * which makes the diagonal move from "Destinations" down to a city link a race
 * the visitor keeps losing. This keeps the panel open for a moment after the
 * pointer leaves, and cancels the close if it comes back.
 *
 * It adds and removes .open, which the existing stylesheet already styles, so
 * no CSS change is needed. Touch and keyboard behaviour is untouched: the
 * existing click handler still drives those.
 */
(function () {
  "use strict";
  var CLOSE_DELAY = 450;   // long enough to cross the gap, short enough not to linger
  var OPEN_DELAY = 60;     // ignore pointers just passing over on their way elsewhere

  if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

  function wire(item) {
    if (item.dataset.intent) return;
    item.dataset.intent = "1";
    var closeT = null, openT = null;

    function open() {
      clearTimeout(closeT);
      openT = setTimeout(function () {
        Array.prototype.forEach.call(document.querySelectorAll(".nitem.open"), function (n) {
          if (n !== item) n.classList.remove("open");
        });
        item.classList.add("open");
      }, OPEN_DELAY);
    }
    function close() {
      clearTimeout(openT);
      closeT = setTimeout(function () { item.classList.remove("open"); }, CLOSE_DELAY);
    }

    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", close);
    item.addEventListener("focusin", function () { clearTimeout(closeT); item.classList.add("open"); });
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) close();
    });
  }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll(".nitem"), wire);
  }

  start();
  document.addEventListener("DOMContentLoaded", start);
  window.addEventListener("load", start);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      Array.prototype.forEach.call(document.querySelectorAll(".nitem.open"), function (n) { n.classList.remove("open"); });
    }
  });
})();
