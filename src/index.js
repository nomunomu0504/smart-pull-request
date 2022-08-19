$(window).on("load", main);

var actionButtonElementList = [];
var diffContentElementList = [];
var setIntervalTimer;

const supportsTransitions = "ontransitionend" in window;
function performTransition(container, cb) {
  if (!supportsTransitions) {
    cb();
    return;
  }
  const els = Array.from(container.querySelectorAll(".js-transitionable"));
  if (container.classList.contains("js-transitionable")) els.push(container);
  for (const el of els) {
    const transitionHeight = isTransitioningHeight(el);
    if (!(el instanceof HTMLElement)) continue;
    el.addEventListener(
      "transitionend",
      () => {
        el.style.display = "";
        el.style.visibility = "";
        if (transitionHeight) {
          withoutTransition(el, function () {
            el.style.height = "";
          });
        }
      },
      { once: true }
    );
    el.style.boxSizing = "content-box";
    el.style.display = "block";
    el.style.visibility = "visible";
    if (transitionHeight) {
      withoutTransition(el, function () {
        el.style.height = getComputedStyle(el).height;
      });
    }
    // force reflow
    el.offsetHeight;
  }
  cb();
  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue;
    if (isTransitioningHeight(el)) {
      const currentHeight = getComputedStyle(el).height;
      el.style.boxSizing = "";
      if (currentHeight === "0px") {
        el.style.height = `${el.scrollHeight}px`;
      } else {
        el.style.height = "0px";
      }
    }
  }
}
// Detect if element is transitioning its height property.
function isTransitioningHeight(el) {
  return getComputedStyle(el).transitionProperty === "height";
}
// Apply style change callback w/o triggering a transition.
function withoutTransition(el, cb) {
  el.style.transition = "none";
  cb();
  el.offsetHeight;
  el.style.transition = "";
}

function expandAllItem() {
  actionButtonElementList.forEach((actionButton) => {
    actionButton.nextElementSibling?.removeAttribute("data-hidden");
    actionButton.setAttribute("aria-expanded", "true");
  });

  diffContentElementList.forEach((diffContent) => {
    const containerSelector =
      diffContent.getAttribute("data-details-container") ||
      ".js-details-container";
    const container = diffContent.closest(containerSelector);
    performTransition(container, () => {
      updateOpenState(container, true);
    });
  });
}

function collapseAllItem() {
  actionButtonElementList.forEach((actionButton) => {
    actionButton.nextElementSibling?.setAttribute("data-hidden", "");
    actionButton.setAttribute("aria-expanded", "false");
  });

  diffContentElementList.forEach((diffContent) => {
    const containerSelector =
      diffContent.getAttribute("data-details-container") ||
      ".js-details-container";
    const container = diffContent.closest(containerSelector);
    performTransition(container, () => {
      updateOpenState(container, false);
    });
  });
}

function updateOpenState(container, open) {
  container.classList.toggle("open", open);
  container.classList.toggle("Details--on", open);
  for (const target of containerTargets(container)) {
    target.setAttribute("aria-expanded", open.toString());
  }
}

function containerTargets(container) {
  return [...container.querySelectorAll(".js-details-target")].filter(
    (target) => target.closest(".js-details-container") === container
  );
}

function getActionButtonElementList() {
  return Array.prototype.slice
    .call(document.getElementsByClassName("ActionList-content"))
    .filter((actionButton) => actionButton.tagName === "BUTTON");
}

function getDiffContentElementList() {
  return Array.prototype.slice
    .call(document.getElementsByClassName("btn-octicon js-details-target"))
    .filter(
      (diffContent) =>
        diffContent.attributes["aria-label"].value === "Toggle diff contents"
    );
}

function jsLoaded() {
  if (document.querySelector(".subnav-search") != null) {
    actionButtonElementList = getActionButtonElementList();
    diffContentElementList = getDiffContentElementList();
    $.get(chrome.runtime.getURL("src/templates/buttons.html"), function (data) {
      console.log(data);
      const parentNode = $(".subnav-search");
      console.log(parentNode);
      $(parentNode).after(data);
    });
    clearInterval(setIntervalTimer);
  }
}

function main(e) {
  const url = window.location.href;
  const isPrFilesUrl = /\/pull\/\d*\/files/g.test(url);

  if (isPrFilesUrl) {
    actionButtonElementList = [];
    setIntervalTimer = setInterval(jsLoaded, 1000);

    $(document).on("click", "#js-close-button", collapseAllItem);
    $(document).on("click", "#js-open-button", expandAllItem);
  }
}
