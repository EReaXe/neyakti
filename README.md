let vehicle = StorageService.getVehicle();
let records = StorageService.getRecords();

const elements = {
  vehicleModal: document.getElementById("vehicleModal"),
  vehicleForm: document.getElementById("vehicleForm"),
  fuelForm: document.getElementById("fuelForm"),
  importInput: document.getElementById("importInput")
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function renderApp() {
  const stats = CalculationService.calculateStats(records, vehicle);

  UI.renderVehicle(vehicle, records);
  UI.renderStats(stats);
  UI.renderRecords(stats.calculated, {
    onEdit: editRecord,
    onDelete: deleteRecord
  });

  syncFuelType();
}

function syncFuelType() {
  const editRecordId = document.getElementById("editRecordId").value;

  if (vehicle && !editRecordId) {
    document.getElementById("fuelType").value = vehicle.fuelType || "Benzin";
  }
}

function resetFuelForm() {
  elements.fuelForm.reset();
  document.getElementById("editRecordId").value = "";
  document.getElementById("fuelDate").value = getToday();
  document.getElementById("fullTank").checked = true;
  document.getElementById("fuelFormTitle").textContent = "Yeni yakıt kaydı";
  document.getElementById("cancelEditButton").classList.add("hidden");
  syncFuelType();
}

function fillVehicleForm() {
  document.getElementById("vehicleNickname").value = vehicle?.nickname || "";
  document.getElementById("brand").value = vehicle?.brand || "";
  document.getElementById("model").value = vehicle?.model || "";
  document.getElementById("year").value = vehicle?.year || "";
  document.getElementById("vehicleFuelType").value = vehicle?.fuelType || "Benzin";
  document.getElementById("startOdometer").value = vehicle?.startOdometer || "";
  document.getElementById("plate").value = vehicle?.plate || "";
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  document.getElementById("editRecordId").value = record.id;
  document.getElementById("fuelDate").value = record.date;
  document.getElementById("odometer").value = record.odometer;
  document.getElementById("liters").value = record.liters;
  document.getElementById("amount").value = record.amount;
  document.getElementById("fuelType").value = record.fuelType;
  document.getElementById("station").value = record.station || "";
  document.getElementById("city").value = record.city || "";
  document.getElementById("fullTank").checked = Boolean(record.fullTank);
  document.getElementById("note").value = record.note || "";

  document.getElementById("fuelFormTitle").textContent = "Yakıt kaydını düzenle";
  document.getElementById("cancelEditButton").classList.remove("hidden");
  document.getElementById("fuel-section").scrollIntoView({ behavior: "smooth" });
}

function deleteRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  const approved = confirm(
    `${record.date} tarihli, ${record.odometer} km yakıt kaydı silinsin mi?`
  );

  if (!approved) return;

  records = records.filter((item) => item.id !== id);
  StorageService.saveRecords(records);
  renderApp();
  UI.showToast("Yakıt kaydı silindi.");
}

function validateOdometer(odometer, editId) {
  if (odometer < Number(vehicle.startOdometer)) {
    return "Kilometre başlangıç kilometresinden düşük olamaz.";
  }

  const duplicate = records.some(
    (record) =>
      record.id !== editId && Number(record.odometer) === Number(odometer)
  );

  if (duplicate) {
    return "Bu kilometrede zaten bir yakıt kaydı var.";
  }

  return null;
}

elements.vehicleForm.addEventListener("submit", (event) => {
  event.preventDefault();

  vehicle = {
    nickname: document.getElementById("vehicleNickname").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: document.getElementById("year").value,
    fuelType: document.getElementById("vehicleFuelType").value,
    startOdometer: Number(document.getElementById("startOdometer").value),
    plate: document.getElementById("plate").value.trim().toUpperCase()
  };

  StorageService.saveVehicle(vehicle);
  UI.closeModal("vehicleModal");
  renderApp();
  UI.showToast("Araç bilgileri kaydedildi.");
});

elements.fuelForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!vehicle) {
    fillVehicleForm();
    UI.openModal("vehicleModal");
    UI.showToast("Önce araç bilgilerini kaydetmelisin.");
    return;
  }

  const editId = document.getElementById("editRecordId").value;
  const odometer = Number(document.getElementById("odometer").value);
  const validationError = validateOdometer(odometer, editId);

  if (validationError) {
    UI.showToast(validationError);
    return;
  }

  const record = {
    id: editId || crypto.randomUUID(),
    date: document.getElementById("fuelDate").value,
    odometer,
    liters: Number(document.getElementById("liters").value),
    amount: Number(document.getElementById("amount").value),
    fuelType: document.getElementById("fuelType").value,
    station: document.getElementById("station").value.trim(),
    city: document.getElementById("city").value.trim(),
    fullTank: document.getElementById("fullTank").checked,
    note: document.getElementById("note").value.trim()
  };

  if (editId) {
    records = records.map((item) => (item.id === editId ? record : item));
    UI.showToast("Yakıt kaydı güncellendi.");
  } else {
    records.push(record);
    UI.showToast("Yakıt kaydı eklendi.");
  }

  StorageService.saveRecords(records);
  resetFuelForm();
  renderApp();
});

document.getElementById("openVehicleButton").addEventListener("click", () => {
  fillVehicleForm();
  UI.openModal("vehicleModal");
});

document.getElementById("closeVehicleButton").addEventListener("click", () => {
  UI.closeModal("vehicleModal");
});

document.getElementById("cancelVehicleButton").addEventListener("click", () => {
  UI.closeModal("vehicleModal");
});

elements.vehicleModal.addEventListener("click", (event) => {
  if (event.target === elements.vehicleModal) {
    UI.closeModal("vehicleModal");
  }
});

document.getElementById("cancelEditButton").addEventListener("click", () => {
  resetFuelForm();
  UI.showToast("Düzenleme iptal edildi.");
});

document.getElementById("clearButton").addEventListener("click", () => {
  if (!confirm("Araç ve bütün yakıt kayıtları silinsin mi?")) return;

  StorageService.clearAll();
  vehicle = null;
  records = [];
  resetFuelForm();
  renderApp();
  UI.showToast("Bütün veriler silindi.");
});

document.getElementById("exportButton").addEventListener("click", () => {
  const data = StorageService.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kac-yakti-yedek-${getToday()}.json`;
  link.click();
  URL.revokeObjectURL(url);

  UI.showToast("Yedek dosyası oluşturuldu.");
});

elements.importInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    StorageService.importData(data);

    vehicle = StorageService.getVehicle();
    records = StorageService.getRecords();

    resetFuelForm();
    renderApp();
    UI.showToast("Yedek başarıyla geri yüklendi.");
  } catch (error) {
    UI.showToast(error.message || "Yedek dosyası okunamadı.");
  } finally {
    event.target.value = "";
  }
});

const savedTheme = StorageService.getTheme();
document.documentElement.dataset.theme = savedTheme;

document.getElementById("themeButton").addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.dataset.theme = nextTheme;
  StorageService.saveTheme(nextTheme);
  document.getElementById("themeButton").textContent =
    nextTheme === "dark" ? "☀️" : "🌙";
});

document.getElementById("themeButton").textContent =
  savedTheme === "dark" ? "☀️" : "🌙";

document.getElementById("fuelDate").value = getToday();
renderApp();
