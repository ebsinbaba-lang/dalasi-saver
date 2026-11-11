// api/budget.js
// Dynamic Calculations Engine with Custom Travel, Real Fish Money & Deficit Tracking

export default async function handler(req, res) {
    const income = parseFloat(req.query.income) || 0;
    const spend = parseFloat(req.query.spend) || 0;
    const oneWay = parseFloat(req.query.oneway) || 0;
    const returnFare = parseFloat(req.query.returnf) || 0;

    // Catch the custom daily fish money baseline (defaults to 0 if left blank)
    const dailyFishMoney = parseFloat(req.query.fish) || 0;

    if (income <= 0) {
        return res.status(200).json({
            error: "Please enter a valid monthly income greater than 0."
        });
    }

    // 1. Transport cost formula matrix: (One-way + Return) x 26 working days
    const transportAllocation = Math.round((oneWay + returnFare) * 26);

    // 2. Fish Money calculation: Daily target input x 30 calendar days
    const totalMonthlyFishMoney = Math.round(dailyFishMoney * 30);

    // 3. True Net Remaining Balance (can go negative, e.g. -1000)
    const totalCommitted = spend + transportAllocation + totalMonthlyFishMoney;
    const rawBalance = Math.round(income - totalCommitted);

    // 4. Divide positive remaining cash between dry groceries (60%) and savings (40%)
    const positivePool = Math.max(0, rawBalance);
    const foodAllocation = Math.round(positivePool * 0.60);
    const emergencySavings = Math.round(positivePool * 0.40);

    // 5. Civic safety comparison ratio gauge (D2,500 per bag baseline)
    const COST_PER_RICE_BAG = 2500;
    const riceBagsSafetyScore = Math.floor(emergencySavings / COST_PER_RICE_BAG);

    return res.status(200).json({
        calculations: {
            originalIncome: income,
            deductedSpend: spend,
            remainingNetIncome: rawBalance
        },
        budgetBuckets: {
            foodAndMaintenance: foodAllocation,
            familyFishMoney: totalMonthlyFishMoney,
            transportation: transportAllocation,
            secureSavings: emergencySavings
        },
        civicGauge: {
            bagsOfRiceStored: riceBagsSafetyScore
        }
    });
}
