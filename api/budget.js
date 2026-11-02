// api/budget.js
// Smart Calculation Backend Engine for Dalasi Saver

export default async function handler(req, res) {
    // 1. Grab data from the front-end securely
    const income = parseFloat(req.query.income) || 0;
    const spend = parseFloat(req.query.spend) || 0;

    if (income <= 0) {
        return res.status(200).json({
            error: "Please enter a valid monthly income greater than 0."
        });
    }

    // 2. Calculate net usable cash after immediate spending item
    const netIncome = Math.max(0, income - spend);

    // 3. Apply standard local budgeting division rules
    const foodAllocation = Math.round(netIncome * 0.40);       // 40% for basic food items
    const familySupport = Math.round(netIncome * 0.25);        // 25% for family fish money
    const transportAllowance = Math.round(netIncome * 0.15);   // 15% for gelli-gellis / taxis
    const emergencySavings = Math.round(netIncome * 0.20);     // 20% safe rainy day fund

    // 4. Calculate core macroeconomic civic metric
    // Current average market price for a standard 50kg bag of rice is D2,500
    const COST_PER_RICE_BAG = 2500;
    const riceBagsSafetyScore = Math.floor(emergencySavings / COST_PER_RICE_BAG);

    // 5. Return dynamic payload array securely to front-end mobile container
    return res.status(200).json({
        calculations: {
            originalIncome: income,
            deductedSpend: spend,
            remainingNetIncome: netIncome
        },
        budgetBuckets: {
            foodAndMaintenance: foodAllocation,
            familyFishMoney: familySupport,
            transportation: transportAllowance,
            secureSavings: emergencySavings
        },
        civicGauge: {
            bagsOfRiceStored: riceBagsSafetyScore
        }
    });
}
