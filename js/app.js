let currentUser = null;
let vehicle = null;
let records = [];

const elements = {
  vehicleModal: document.getElementById("vehicleModal"),
  vehicleForm: document.getElementById("vehicleForm"),
  fuelForm: document.getElementById("fuelForm"),
  loadingOverlay: document.getElementById("loadingOverlay")
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function setLoading(isLoading) {
  elements.loadingOverlay.classList.toggle("hidden", !isLoading);
}

function handleDatabaseError(error, fallbackMessage) {
  console.error(error);

  if (error?.code === "23505") {
    UI.showToast("Bu plaka veya kilometre kaydı zaten mevcut.");
    return;
  }

  UI.showToast(error?.message || fallbackMessage);
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

function validateOdometer(odometer, editId) {
  if (!vehicle) return "Önce araç bilgilerini kaydetmelisin.";

  if (odometer < Number(vehicle.startOdometer)) {
    return "Kilometre başlangıç kilometresinden düşük olamaz.";
  }

  const duplicate = records.some(
    (record) =>
      record.id !== editId &&
      Number(record.odometer) === Number(odometer)
  );

  return duplicate
    ? "Bu kilometrede zaten bir yakıt kaydı var."
    : null;
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

async function deleteRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  if (!confirm(`${record.date} tarihli, ${record.odometer} km yakıt kaydı silinsin mi?`)) {
    return;
  }

  setLoading(true);

  try {
    await DatabaseService.deleteFuelRecord(id);
    records = records.filter((item) => item.id !== id);
    renderApp();
    UI.showToast("Yakıt kaydı silindi.");
  } catch (error) {
    handleDatabaseError(error, "Yakıt kaydı silinemedi.");
  } finally {
    setLoading(false);
  }
}

elements.vehicleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formVehicle = {
    nickname: document.getElementById("vehicleNickname").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: document.getElementById("year").value,
    fuelType: document.getElementById("vehicleFuelType").value,
    startOdometer: Number(document.getElementById("startOdometer").value),
    plate: document.getElementById("plate").value.trim().toUpperCase()
  };

  setLoading(true);

  try {
    vehicle = vehicle?.id
      ? await DatabaseService.updateVehicle(vehicle.id, formVehicle)
      : await DatabaseService.createVehicle(formVehicle);

    UI.closeModal("vehicleModal");
    renderApp();
    UI.showToast("Araç bilgileri veritabanına kaydedildi.");
  } catch (error) {
    handleDatabaseError(error, "Araç kaydedilemedi.");
  } finally {
    setLoading(false);
  }
});

elements.fuelForm.addEventListener("submit", async (event) => {
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

  setLoading(true);

  try {
    if (editId) {
      const updatedRecord = await DatabaseService.updateFuelRecord(editId, record);
      records = records.map((item) => item.id === editId ? updatedRecord : item);
      UI.showToast("Yakıt kaydı güncellendi.");
    } else {
      const createdRecord = await DatabaseService.createFuelRecord(vehicle.id, record);
      records.push(createdRecord);
      UI.showToast("Yakıt kaydı veritabanına eklendi.");
    }

    resetFuelForm();
    renderApp();
  } catch (error) {
    handleDatabaseError(error, "Yakıt kaydı kaydedilemedi.");
  } finally {
    setLoading(false);
  }
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
  if (event.target === elements.vehicleModal) UI.closeModal("vehicleModal");
});

document.getElementById("cancelEditButton").addEventListener("click", () => {
  resetFuelForm();
  UI.showToast("Düzenleme iptal edildi.");
});

const savedTheme = localStorage.getItem("kacYakti_theme") || "light";
document.documentElement.dataset.theme = savedTheme;
document.getElementById("themeButton").textContent = savedTheme === "dark" ? "☀️" : "🌙";

document.getElementById("themeButton").addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("kacYakti_theme", nextTheme);
  document.getElementById("themeButton").textContent =
    nextTheme === "dark" ? "☀️" : "🌙";
});

async function initializeApp() {
  setLoading(true);

  try {
    currentUser = await window.authReady;
    if (!currentUser) return;

    vehicle = await DatabaseService.getFirstVehicle();
    records = vehicle
      ? await DatabaseService.getFuelRecords(vehicle.id)
      : [];

    document.getElementById("fuelDate").value = getToday();
    renderApp();

    if (!vehicle) {
      fillVehicleForm();
      UI.openModal("vehicleModal");
      UI.showToast("İlk olarak araç bilgilerini ekle.");
    }
  } catch (error) {
    handleDatabaseError(error, "Veriler yüklenirken bir hata oluştu.");
  } finally {
    setLoading(false);
  }
}

initializeApp();
