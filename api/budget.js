// api/budget.js
// Dynamic Calculations Engine with Custom Travel, Fish Money, Rent, Cashpower & Deficit Tracking

export default async function handler(req, res) {
    const income = parseFloat(req.query.income) || 0;
    const spend = parseFloat(req.query.spend) || 0;
    const oneWay = parseFloat(req.query.oneway) || 0;
    const returnFare = parseFloat(req.query.returnf) || 0;
    const dailyFishMoney = parseFloat(req.query.fish) || 0;
    const monthlyRent = parseFloat(req.query.rent) || 0;
    const weeklyCashpower = parseFloat(req.query.cashpower) || 0;

    if (income <= 0) {
        return res.status(200).json({
            error: "Please enter a valid monthly income greater than 0."
        });
    }

    // 1. Transport cost formula: (One-way + Return) x 26 working days
    const transportAllocation = Math.round((oneWay + returnFare) * 26);

    // 2. Fish Money calculation: Daily target input x 30 calendar days
    const totalMonthlyFishMoney = Math.round(dailyFishMoney * 30);

    // 3. Monthly Rent & Cashpower (Weekly Cashpower x 4 weeks)
    const rentAllocation = Math.round(monthlyRent);
    const monthlyCashpower = Math.round(weeklyCashpower * 4);
    const totalHousingBills = rentAllocation + monthlyCashpower;

    // 4. True Net Remaining Balance (can go negative, e.g. -1000)
    const totalCommitted = spend + transportAllocation + totalMonthlyFishMoney + totalHousingBills;
    const rawBalance = Math.round(income - totalCommitted);

    // 5. Divide positive remaining cash between dry groceries/maintenance (60%) and savings (40%)
    const positivePool = Math.max(0, rawBalance);
    const foodAllocation = Math.round(positivePool * 0.60);
    const emergencySavings = Math.round(positivePool * 0.40);

    // 6. Civic safety comparison ratio gauge (D2,500 per bag baseline)
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
            rentAndCashpower: totalHousingBills,
            secureSavings: emergencySavings
        },
        civicGauge: {
            bagsOfRiceStored: riceBagsSafetyScore
        }
    });
}
