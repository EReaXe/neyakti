(() => {
  const searchInput = document.getElementById("recordSearch");
  const fuelFilter = document.getElementById("recordFuelFilter");
  const tankFilter = document.getElementById("recordTankFilter");
  const clearButton = document.getElementById("clearRecordFilters");
  const exportButton = document.getElementById("exportCsvButton");
  const recordList = document.getElementById("recordList");
  const summary = document.getElementById("recordResultSummary");

  if (!searchInput || !fuelFilter || !tankFilter || !recordList) return;

  const filterEmptyState = document.createElement("div");
  filterEmptyState.className = "filter-empty-state hidden";
  filterEmptyState.innerHTML = "<strong>Filtrelere uygun kayıt bulunamadı.</strong><p>Arama veya filtrelerini değiştirerek tekrar dene.</p>";
  recordList.insertAdjacentElement("afterend", filterEmptyState);

  const normalize = (value) =>
    String(value || "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function getCards() {
    return [...recordList.querySelectorAll(".record")];
  }

  function applyFilters() {
    const query = normalize(searchInput.value.trim());
    const selectedFuel = fuelFilter.value;
    const selectedTank = tankFilter.value;
    const cards = getCards();

    let visibleCount = 0;

    cards.forEach((card) => {
      const searchableText = normalize(card.textContent);
      const fuelMatches = selectedFuel === "all" || searchableText.includes(normalize(selectedFuel));
      const isFullTank = card.textContent.includes("Tam depo");
      const tankMatches =
        selectedTank === "all" ||
        (selectedTank === "full" && isFullTank) ||
        (selectedTank === "partial" && !isFullTank);
      const queryMatches = !query || searchableText.includes(query);
      const isVisible = fuelMatches && tankMatches && queryMatches;

      card.classList.toggle("is-filtered-out", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    const hasRecords = cards.length > 0;
    filterEmptyState.classList.toggle("hidden", !hasRecords || visibleCount > 0);
    summary.textContent = hasRecords
      ? `${visibleCount} / ${cards.length} kayıt gösteriliyor`
      : "";
  }

  function clearFilters() {
    searchInput.value = "";
    fuelFilter.value = "all";
    tankFilter.value = "all";
    applyFilters();
    searchInput.focus();
  }

  function escapeCsv(value) {
    const text = String(value ?? "").replaceAll('"', '""');
    return `"${text}"`;
  }

  function exportVisibleRecords() {
    const cards = getCards().filter((card) => !card.classList.contains("is-filtered-out"));

    if (!cards.length) {
      window.UI?.showToast("Dışa aktarılacak kayıt bulunamadı.");
      return;
    }

    const rows = cards.map((card) => {
      const main = card.querySelector(".record-main");
      const metrics = [...card.querySelectorAll(".record-metric strong")].map((item) => item.textContent.trim());
      const detail = main?.querySelector("small")?.textContent
        .split("•")
        .map((item) => item.trim())
        .filter(Boolean) || [];

      return [
        main?.querySelector("strong")?.textContent.trim() || "",
        detail[0] || "",
        detail[1] || "",
        detail[2] || "",
        main?.querySelector(".badge")?.textContent.trim() || "",
        metrics[0] || "",
        metrics[1] || "",
        metrics[2] || "",
        metrics[3] || ""
      ];
    });

    const headers = ["Tarih", "Yakıt Türü", "İstasyon", "Şehir", "Dolum", "Yakıt", "Tutar", "Mesafe", "Tüketim"];
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `kac-yakti-kayitlari-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    window.UI?.showToast(`${cards.length} kayıt CSV olarak indirildi.`);
  }

  searchInput.addEventListener("input", applyFilters);
  fuelFilter.addEventListener("change", applyFilters);
  tankFilter.addEventListener("change", applyFilters);
  clearButton?.addEventListener("click", clearFilters);
  exportButton?.addEventListener("click", exportVisibleRecords);

  const observer = new MutationObserver(() => applyFilters());
  observer.observe(recordList, { childList: true });
  applyFilters();
})();