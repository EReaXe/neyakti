const CalculationService = (() => {
  function sortRecords(records) {
    return [...records].sort((a, b) => {
      const odometerDifference = Number(a.odometer) - Number(b.odometer);
      if (odometerDifference !== 0) return odometerDifference;
      return new Date(a.date) - new Date(b.date);
    });
  }

  function calculateRecords(records, vehicle) {
    const sorted = sortRecords(records);
    const startOdometer = Number(vehicle?.startOdometer || 0);

    let lastFullTankOdometer = startOdometer;
    let accumulatedLiters = 0;
    let accumulatedCost = 0;

    return sorted.map((record) => {
      const liters = Number(record.liters);
      const amount = Number(record.amount);

      accumulatedLiters += liters;
      accumulatedCost += amount;

      let distance = 0;
      let consumption = null;
      let costPerKm = null;
      let calculationValid = false;

      if (record.fullTank) {
        distance = Number(record.odometer) - lastFullTankOdometer;

        if (distance > 0) {
          consumption = (accumulatedLiters / distance) * 100;
          costPerKm = accumulatedCost / distance;
          calculationValid = true;
        }

        lastFullTankOdometer = Number(record.odometer);
        accumulatedLiters = 0;
        accumulatedCost = 0;
      }

      return {
        ...record,
        liters,
        amount,
        distance,
        consumption,
        costPerKm,
        calculationValid,
        literPrice: liters > 0 ? amount / liters : null
      };
    });
  }

  function calculateStats(records, vehicle) {
    const calculated = calculateRecords(records, vehicle);
    const validPeriods = calculated.filter((record) => record.calculationValid);

    const totalCost = calculated.reduce((sum, record) => sum + record.amount, 0);
    const totalLiters = calculated.reduce((sum, record) => sum + record.liters, 0);
    const totalDistance = validPeriods.reduce((sum, record) => sum + record.distance, 0);

    const consumedLitersInValidPeriods = validPeriods.reduce(
      (sum, record) => sum + (record.consumption * record.distance) / 100,
      0
    );

    const averageConsumption =
      totalDistance > 0 ? (consumedLitersInValidPeriods / totalDistance) * 100 : null;

    const validPeriodCost = validPeriods.reduce(
      (sum, record) => sum + record.costPerKm * record.distance,
      0
    );

    const averageCostPerKm =
      totalDistance > 0 ? validPeriodCost / totalDistance : null;

    const now = new Date();
    const monthlyCost = calculated
      .filter((record) => {
        const date = new Date(`${record.date}T12:00:00`);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, record) => sum + record.amount, 0);

    const latestRecord = calculated.at(-1) ?? null;
    const latestValidPeriod = validPeriods.at(-1) ?? null;

    return {
      calculated,
      totalCost,
      totalLiters,
      totalDistance,
      averageConsumption,
      averageCostPerKm,
      monthlyCost,
      latestRecord,
      latestValidPeriod
    };
  }

  return {
    sortRecords,
    calculateRecords,
    calculateStats
  };
})();
