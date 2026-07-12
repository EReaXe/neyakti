const UI = (() => {
  const currencyFormatter = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2
  });

  const numberFormatter = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2
  });

  let toastTimer;

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(`${dateString}T12:00:00`));
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function renderVehicle(vehicle, records) {
    if (!vehicle) {
      setText("vehicleName", "Henüz araç eklenmedi");
      setText("vehicleDetail", "Başlamak için araç bilgilerini gir.");
      setText("currentOdometer", "—");
      return;
    }

    setText("vehicleName", vehicle.nickname);

    const detail = [
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      vehicle.fuelType,
      vehicle.plate
    ]
      .filter(Boolean)
      .join(" • ");

    setText("vehicleDetail", detail);

    const sorted = CalculationService.sortRecords(records);
    const currentOdometer = sorted.length
      ? sorted.at(-1).odometer
      : vehicle.startOdometer;

    setText("currentOdometer", `${numberFormatter.format(currentOdometer)} km`);
  }

  function renderStats(stats) {
    setText(
      "lastConsumption",
      stats.latestValidPeriod
        ? `${numberFormatter.format(stats.latestValidPeriod.consumption)} L/100 km`
        : "—"
    );

    setText(
      "averageConsumption",
      stats.averageConsumption
        ? `${numberFormatter.format(stats.averageConsumption)} L/100 km`
        : "—"
    );

    setText("totalCost", currencyFormatter.format(stats.totalCost));
    setText("totalDistance", `${numberFormatter.format(stats.totalDistance)} km`);

    setText(
      "averageCostPerKm",
      stats.averageCostPerKm
        ? `${currencyFormatter.format(stats.averageCostPerKm)}/km`
        : "—"
    );

    setText("totalLiters", `${numberFormatter.format(stats.totalLiters)} L`);
    setText("monthlyCost", currencyFormatter.format(stats.monthlyCost));

    setText(
      "lastLiterPrice",
      stats.latestRecord?.literPrice
        ? `${currencyFormatter.format(stats.latestRecord.literPrice)}/L`
        : "—"
    );
  }

  function renderRecords(calculatedRecords, handlers) {
    const container = document.getElementById("recordList");
    const sorted = [...calculatedRecords].sort((a, b) => {
      const odometerDifference = Number(b.odometer) - Number(a.odometer);
      if (odometerDifference !== 0) return odometerDifference;
      return new Date(b.date) - new Date(a.date);
    });

    if (!sorted.length) {
      container.innerHTML = `
        <div class="empty-state">
          <strong>Henüz yakıt kaydı yok.</strong>
          <p>İlk kaydını eklediğinde sonuçlar burada görünecek.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = sorted
      .map(
        (record) => `
          <article class="record">
            <div class="record-main">
              <strong>${formatDate(record.date)}</strong>
              <small>
                ${escapeHTML(record.fuelType)}
                ${record.station ? ` • ${escapeHTML(record.station)}` : ""}
                ${record.city ? ` • ${escapeHTML(record.city)}` : ""}
              </small>

              <span class="badge ${
                record.fullTank ? "badge-success" : "badge-warning"
              }">
                ${record.fullTank ? "✓ Tam depo" : "Kısmi dolum"}
              </span>
            </div>

            <div class="record-metric">
              <span>Yakıt</span>
              <strong>${numberFormatter.format(record.liters)} L</strong>
            </div>

            <div class="record-metric">
              <span>Tutar</span>
              <strong>${currencyFormatter.format(record.amount)}</strong>
            </div>

            <div class="record-metric">
              <span>Mesafe</span>
              <strong>${
                record.calculationValid
                  ? `${numberFormatter.format(record.distance)} km`
                  : "—"
              }</strong>
            </div>

            <div class="record-metric">
              <span>Tüketim</span>
              <strong>${
                record.calculationValid
                  ? `${numberFormatter.format(record.consumption)} L/100 km`
                  : "—"
              }</strong>
            </div>

            <div class="record-actions">
              <button
                class="button button-secondary button-small"
                type="button"
                data-action="edit"
                data-id="${record.id}"
              >
                Düzenle
              </button>

              <button
                class="button button-danger button-small"
                type="button"
                data-action="delete"
                data-id="${record.id}"
              >
                Sil
              </button>
            </div>
          </article>
        `
      )
      .join("");

    container.querySelectorAll("[data-action='edit']").forEach((button) => {
      button.addEventListener("click", () => handlers.onEdit(button.dataset.id));
    });

    container.querySelectorAll("[data-action='delete']").forEach((button) => {
      button.addEventListener("click", () => handlers.onDelete(button.dataset.id));
    });
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  return {
    showToast,
    renderVehicle,
    renderStats,
    renderRecords,
    openModal,
    closeModal
  };
})();
