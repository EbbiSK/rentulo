document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".history-tab");
  const historyContent = document.getElementById("historyContent");

  function showHistory(type) {
    tabs.forEach(function (tab) {
      tab.classList.remove("active");
    });

    const activeTab = Array.from(tabs).find(function (tab) {
      return tab.dataset.historyType === type;
    });

    if (activeTab) {
      activeTab.classList.add("active");
    }

    historyContent.innerHTML =
      type === "offers"
        ? "<p>Zde bude historie vašich nabídek.</p>"
        : "<p>Zde bude historie vašich půjčení.</p>";
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showHistory(tab.dataset.historyType);
    });
  });

  showHistory("rentals");
});