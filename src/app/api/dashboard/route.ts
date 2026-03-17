import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get total counts by type
    const totalAnimals = await db.animal.count();
    const totalGoats = await db.animal.count({ where: { type: 'goat' } });
    const totalPigs = await db.animal.count({ where: { type: 'pig' } });
    
    // Get counts by status
    const healthyCount = await db.animal.count({ where: { status: 'healthy' } });
    const sickCount = await db.animal.count({ where: { status: 'sick' } });
    const pregnantCount = await db.animal.count({ 
      where: { 
        status: 'pregnant',
        gender: 'female'
      } 
    });
    
    // Get counts by gender
    const maleCount = await db.animal.count({ where: { gender: 'male' } });
    const femaleCount = await db.animal.count({ where: { gender: 'female' } });
    
    // Get breed distribution
    const breedDistribution = await db.animal.groupBy({
      by: ['type', 'breed'],
      _count: {
        id: true,
      },
    });
    
    // Get pen distribution
    const penDistribution = await db.animal.groupBy({
      by: ['penNumber'],
      _count: {
        id: true,
      },
    });
    
    // Get weight statistics
    const weightStats = await db.animal.aggregate({
      _avg: { weight: true },
      _min: { weight: true },
      _max: { weight: true },
      _sum: { weight: true },
    });
    
    const goatWeightStats = await db.animal.aggregate({
      where: { type: 'goat' },
      _avg: { weight: true },
      _sum: { weight: true },
    });
    
    const pigWeightStats = await db.animal.aggregate({
      where: { type: 'pig' },
      _avg: { weight: true },
      _sum: { weight: true },
    });
    
    // Get total expenses
    const totalExpenses = await db.expense.aggregate({
      _sum: { amount: true },
    });
    
    // Get total income
    const totalIncome = await db.income.aggregate({
      _sum: { amount: true },
    });
    
    // Get expenses by category
    const expensesByCategory = await db.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });
    
    // Get income by category
    const incomeByCategory = await db.income.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });
    
    // Get recent health records
    const recentHealthRecords = await db.healthRecord.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        animal: {
          select: {
            name: true,
            tagNumber: true,
            type: true,
          },
        },
      },
    });
    
    // Get upcoming breedings
    const upcomingBreedings = await db.breedingRecord.findMany({
      where: {
        expectedBirth: {
          gte: new Date(),
        },
        status: 'confirmed',
      },
      include: {
        male: { select: { name: true, tagNumber: true } },
        female: { select: { name: true, tagNumber: true } },
      },
      orderBy: { expectedBirth: 'asc' },
      take: 10,
    });
    
    // Get monthly expense trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const expenses = await db.expense.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
        amount: true,
        category: true,
      },
    });
    
    const income = await db.income.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
        amount: true,
        category: true,
      },
    });
    
    // Get age distribution
    const animals = await db.animal.findMany({
      select: {
        birthDate: true,
        type: true,
      },
    });
    
    const now = new Date();
    const ageGroups: Record<string, { goats: number; pigs: number }> = {
      '0-6 months': { goats: 0, pigs: 0 },
      '6-12 months': { goats: 0, pigs: 0 },
      '1-2 years': { goats: 0, pigs: 0 },
      '2-3 years': { goats: 0, pigs: 0 },
      '3+ years': { goats: 0, pigs: 0 },
    };
    
    animals.forEach(animal => {
      const ageMonths = (now.getTime() - animal.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      let group = '3+ years';
      if (ageMonths < 6) group = '0-6 months';
      else if (ageMonths < 12) group = '6-12 months';
      else if (ageMonths < 24) group = '1-2 years';
      else if (ageMonths < 36) group = '2-3 years';
      
      if (animal.type === 'goat') {
        ageGroups[group].goats++;
      } else {
        ageGroups[group].pigs++;
      }
    });

    return NextResponse.json({
      overview: {
        totalAnimals,
        totalGoats,
        totalPigs,
        healthyCount,
        sickCount,
        pregnantCount,
        maleCount,
        femaleCount,
      },
      weight: {
        average: weightStats._avg.weight || 0,
        min: weightStats._min.weight || 0,
        max: weightStats._max.weight || 0,
        total: weightStats._sum.weight || 0,
        goatAverage: goatWeightStats._avg.weight || 0,
        goatTotal: goatWeightStats._sum.weight || 0,
        pigAverage: pigWeightStats._avg.weight || 0,
        pigTotal: pigWeightStats._sum.weight || 0,
      },
      financial: {
        totalExpenses: totalExpenses._sum.amount || 0,
        totalIncome: totalIncome._sum.amount || 0,
        profit: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0),
        expensesByCategory,
        incomeByCategory,
      },
      breedDistribution,
      penDistribution,
      ageGroups,
      recentHealthRecords,
      upcomingBreedings,
      expenses,
      income,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty default data instead of error
    return NextResponse.json({
      overview: {
        totalAnimals: 0,
        totalGoats: 0,
        totalPigs: 0,
        healthyCount: 0,
        sickCount: 0,
        pregnantCount: 0,
        maleCount: 0,
        femaleCount: 0,
      },
      weight: {
        average: 0,
        min: 0,
        max: 0,
        total: 0,
        goatAverage: 0,
        goatTotal: 0,
        pigAverage: 0,
        pigTotal: 0,
      },
      financial: {
        totalExpenses: 0,
        totalIncome: 0,
        profit: 0,
        expensesByCategory: [],
        incomeByCategory: [],
      },
      breedDistribution: [],
      penDistribution: [],
      ageGroups: {
        '0-6 months': { goats: 0, pigs: 0 },
        '6-12 months': { goats: 0, pigs: 0 },
        '1-2 years': { goats: 0, pigs: 0 },
        '2-3 years': { goats: 0, pigs: 0 },
        '3+ years': { goats: 0, pigs: 0 },
      },
      recentHealthRecords: [],
      upcomingBreedings: [],
      expenses: [],
      income: [],
    });
  }
}
