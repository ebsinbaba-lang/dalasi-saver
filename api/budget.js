// api/budget.js
// Dynamic Calculations Engine with Custom Travel & Real Fish Money Inputs

export default async function handler(req, res) {
    const income = parseFloat(req.query.income) || 0;
    const spend = parseFloat(req.query.spend) || 0;
    const oneWay = parseFloat(req.query.oneway) || 0;
    const returnFare = parseFloat(req.query.returnf) || 0;
    
    // Catch the custom daily fish money baseline from the mobile interface
    const dailyFishMoney = parseFloat(req.query.fish) || 400; 

    if (income <= 0) {
        return res.status(200).json({
            error: "Please enter a valid monthly income greater than 0."
        });
    }

    // 1. Core Net income baseline calculation
    const netIncome = Math.max(0, income - spend);

    // 2. Transport cost formula matrix: (One-Way + Return) × 26 working days
    const transportAllocation = Math.round((oneWay + returnFare) * 26); 

    // 3. Fish Money calculation: Daily target input × 30 calendar days
    const totalMonthlyFishMoney = Math.round(dailyFishMoney * 30);

    // 4. Divide remaining cash securely between dry groceries and savings
    const remainingCash = Math.max(0, netIncome - transportAllocation - totalMonthlyFishMoney);
    
    const foodAllocation = Math.round(remainingCash * 0.60);       // 60% of remaining pool for bulk groceries
    const emergencySavings = Math.round(remainingCash * 0.40);     // 40% of remaining pool saved securely

    // 5. Civic safety comparison ratio gauge (D2,500 per bag baseline)
    const COST_PER_RICE_BAG = 2500;
    const riceBagsSafetyScore = Math.floor(emergencySavings / COST_PER_RICE_BAG);

    return res.status(200).json({
        calculations: {
            originalIncome: income,
            deductedSpend: spend,
            remainingNetIncome: netIncome
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
