const StorageService = (() => {
  const KEYS = {
    vehicle: "kacYakti_vehicle",
    records: "kacYakti_records",
    theme: "kacYakti_theme"
  };

  function read(key, fallback) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (error) {
      console.error("Veri okunamadı:", error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Veri kaydedilemedi:", error);
      return false;
    }
  }

  function getVehicle() {
    return read(KEYS.vehicle, null);
  }

  function saveVehicle(vehicle) {
    return write(KEYS.vehicle, vehicle);
  }

  function getRecords() {
    return read(KEYS.records, []);
  }

  function saveRecords(records) {
    return write(KEYS.records, records);
  }

  function getTheme() {
    return read(KEYS.theme, "light");
  }

  function saveTheme(theme) {
    return write(KEYS.theme, theme);
  }

  function exportData() {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      vehicle: getVehicle(),
      records: getRecords()
    };
  }

  function importData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Geçersiz yedek dosyası.");
    }

    if (!Array.isArray(data.records)) {
      throw new Error("Yedek dosyasında kayıt listesi bulunamadı.");
    }

    saveVehicle(data.vehicle ?? null);
    saveRecords(data.records);
  }

  function clearAll() {
    localStorage.removeItem(KEYS.vehicle);
    localStorage.removeItem(KEYS.records);
  }

  return {
    getVehicle,
    saveVehicle,
    getRecords,
    saveRecords,
    getTheme,
    saveTheme,
    exportData,
    importData,
    clearAll
  };
})();
