// api/budget.js
// Custom Travel Matrix Calculation Engine for Dalasi Saver

export default async function handler(req, res) {
    const income = parseFloat(req.query.income) || 0;
    const spend = parseFloat(req.query.spend) || 0;
    
    // Catch custom fare query tokens from the frontend view layer
    const oneWay = parseFloat(req.query.oneway) || 0;
    const returnFare = parseFloat(req.query.returnF) || 0;

    if (income <= 0) {
        return res.status(200).json({
            error: "Please enter a valid monthly income greater than 0."
        });
    }

    // 1. Calculate net usable cash after immediate spending item
    const netIncome = Math.max(0, income - spend);

    // 2. Custom Matrix Rule: (One-Way + Return) × 26 working days a month
    const dailyTravelCost = oneWay + returnFare;
    const transportAllocation = Math.round(dailyTravelCost * 26); 

    // 3. Divide the remaining cash safely among other household needs
    const remainingCash = Math.max(0, netIncome - transportAllocation);
    
    const foodAllocation = Math.round(remainingCash * 0.50);       // 50% of remainder for groceries
    const familySupport = Math.round(remainingCash * 0.30);        // 30% of remainder for fish money
    const emergencySavings = Math.round(remainingCash * 0.20);     // 20% of remainder for savings fund

    // 4. Calculate core macroeconomic civic metric (D2,500 per bag)
    const COST_PER_RICE_BAG = 2500;
    const riceBagsSafetyScore = Math.floor(emergencySavings / COST_PER_RICE_BAG);

    // 5. Return precise values securely back to mobile layout sheet
    return res.status(200).json({
        calculations: {
            originalIncome: income,
            deductedSpend: spend,
            remainingNetIncome: netIncome,
            calculatedMonthlyTransport: transportAllocation
        },
        budgetBuckets: {
            foodAndMaintenance: foodAllocation,
            familyFishMoney: familySupport,
            transportation: transportAllocation,
            secureSavings: emergencySavings
        },
        civicGauge: {
            bagsOfRiceStored: riceBagsSafetyScore
        }
    });
}
