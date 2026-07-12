const DatabaseService = (() => {
  async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Kullanıcı oturumu bulunamadı.");
    return data.user;
  }

  function mapVehicle(row) {
    return {
      id: row.id,
      nickname: row.nickname,
      brand: row.brand,
      model: row.model,
      year: row.model_year,
      fuelType: row.fuel_type,
      plate: row.plate || "",
      startOdometer: Number(row.start_odometer),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function mapFuelRecord(row) {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      date: row.record_date,
      odometer: Number(row.odometer),
      liters: Number(row.liters),
      amount: Number(row.amount),
      fuelType: row.fuel_type,
      station: row.station || "",
      city: row.city || "",
      fullTank: Boolean(row.full_tank),
      note: row.note || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async function getFirstVehicle() {
    const { data, error } = await supabaseClient
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapVehicle(data) : null;
  }

  async function createVehicle(vehicle) {
    const user = await getCurrentUser();

    const { data, error } = await supabaseClient
      .from("vehicles")
      .insert({
        user_id: user.id,
        nickname: vehicle.nickname,
        brand: vehicle.brand,
        model: vehicle.model,
        model_year: vehicle.year || null,
        fuel_type: vehicle.fuelType,
        plate: vehicle.plate || null,
        start_odometer: Number(vehicle.startOdometer)
      })
      .select()
      .single();

    if (error) throw error;
    return mapVehicle(data);
  }

  async function updateVehicle(vehicleId, vehicle) {
    const { data, error } = await supabaseClient
      .from("vehicles")
      .update({
        nickname: vehicle.nickname,
        brand: vehicle.brand,
        model: vehicle.model,
        model_year: vehicle.year || null,
        fuel_type: vehicle.fuelType,
        plate: vehicle.plate || null,
        start_odometer: Number(vehicle.startOdometer)
      })
      .eq("id", vehicleId)
      .select()
      .single();

    if (error) throw error;
    return mapVehicle(data);
  }

  async function getFuelRecords(vehicleId) {
    const { data, error } = await supabaseClient
      .from("fuel_records")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("odometer", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapFuelRecord);
  }

  async function createFuelRecord(vehicleId, record) {
    const user = await getCurrentUser();

    const { data, error } = await supabaseClient
      .from("fuel_records")
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        record_date: record.date,
        odometer: Number(record.odometer),
        liters: Number(record.liters),
        amount: Number(record.amount),
        fuel_type: record.fuelType,
        station: record.station || null,
        city: record.city || null,
        full_tank: Boolean(record.fullTank),
        note: record.note || null
      })
      .select()
      .single();

    if (error) throw error;
    return mapFuelRecord(data);
  }

  async function updateFuelRecord(recordId, record) {
    const { data, error } = await supabaseClient
      .from("fuel_records")
      .update({
        record_date: record.date,
        odometer: Number(record.odometer),
        liters: Number(record.liters),
        amount: Number(record.amount),
        fuel_type: record.fuelType,
        station: record.station || null,
        city: record.city || null,
        full_tank: Boolean(record.fullTank),
        note: record.note || null
      })
      .eq("id", recordId)
      .select()
      .single();

    if (error) throw error;
    return mapFuelRecord(data);
  }

  async function deleteFuelRecord(recordId) {
    const { error } = await supabaseClient
      .from("fuel_records")
      .delete()
      .eq("id", recordId);

    if (error) throw error;
  }

  return {
    getFirstVehicle,
    createVehicle,
    updateVehicle,
    getFuelRecords,
    createFuelRecord,
    updateFuelRecord,
    deleteFuelRecord
  };
})();
