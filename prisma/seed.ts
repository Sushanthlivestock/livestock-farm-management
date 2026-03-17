import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Goat breeds
const goatBreeds = ['Boer', 'Saanen', 'Nubian', 'Alpine', 'Jamnapari', 'Black Bengal', 'Kiko', 'Spanish'];
// Pig breeds  
const pigBreeds = ['Yorkshire', 'Landrace', 'Duroc', 'Hampshire', 'Berkshire', 'Large Black', 'Tamworth', 'Pietrain'];

// Names for animals
const maleNames = ['Rajah', 'King', 'Max', 'Bruno', 'Rocky', 'Duke', 'Tiger', 'Leo', 'Sam', 'Charlie', 'Jack', 'Cooper', 'Bailey', 'Buddy', 'Rocky', 'Bear', 'Duke', 'Tucker', 'Jake', 'Zeus', 'Apollo', 'Thor', 'Hercules', 'Atlas', 'Titan', 'Mars', 'Vulcan', 'Orion', 'Phoenix', 'Storm', 'Thunder', 'Lightning', 'Blaze', 'Flash', 'Hunter', 'Ranger', 'Scout', 'Chase', 'Finn', 'Milo', 'Otis', 'Gus', 'Louie', 'Rusty', 'Dusty', 'Cody', 'Rex', 'Ace', 'Brody', 'Marley'];
const femaleNames = ['Luna', 'Bella', 'Lucy', 'Daisy', 'Sadie', 'Molly', 'Maggie', 'Sophie', 'Chloe', 'Penny', 'Lily', 'Rosie', 'Coco', 'Stella', 'Gracie', 'Abby', 'Mia', 'Zoey', 'Ruby', 'Emma', 'Nala', 'Willow', 'Pearl', 'Hazel', 'Ivy', 'Olive', 'Jade', 'Amber', 'Honey', 'Ginger', 'Pepper', 'Cinnamon', 'Cookie', 'Mocha', 'Caramel', 'Buttercup', 'Daffodil', 'Rose', 'Violet', 'Daisy', 'Lily', 'Iris', 'Jasmine', 'Lotus', 'Blossom', 'Spring', 'Summer', 'Autumn', 'Winter', 'Misty'];

// Colors
const goatColors = ['White', 'Brown', 'Black', 'Spotted', 'Cream', 'Tan', 'Red', 'Gray'];
const pigColors = ['Pink', 'White', 'Black', 'Spotted', 'Red', 'Black & White', 'Golden', 'Gray'];

// Pen numbers
const pens = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4'];

// Status options
const statuses = ['healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'sick', 'pregnant'];

// Feed types
const feedTypes = ['Grass Hay', 'Alfalfa', 'Grain Mix', 'Corn', 'Soybean Meal', 'Mineral Block', 'Fresh Grass', 'Silage', 'Wheat Bran', 'Barley'];

// Medications
const medications = ['Ivermectin', 'Albendazole', 'Oxytetracycline', 'Penicillin', 'Vitamin B Complex', 'Calcium Supplement', 'Iron Dextran', 'Vaccination'];

// Veterinarians
const vets = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.healthRecord.deleteMany();
  await prisma.feedingRecord.deleteMany();
  await prisma.breedingRecord.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.animal.deleteMany();
  console.log('Cleared existing data');

  const animals = [];

  // Create 105 Goats
  for (let i = 1; i <= 105; i++) {
    const isMale = Math.random() > 0.6; // 40% male, 60% female
    const gender = isMale ? 'male' : 'female';
    const name = isMale ? randomElement(maleNames) : randomElement(femaleNames);
    const ageInMonths = randomInt(6, 60);
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - ageInMonths);
    
    let status = randomElement(statuses);
    if (gender === 'male') {
      status = status === 'pregnant' ? 'healthy' : status;
    }
    
    const animal = await prisma.animal.create({
      data: {
        tagNumber: `GOAT-${String(i).padStart(4, '0')}`,
        name: `${name} ${i}`,
        type: 'goat',
        breed: randomElement(goatBreeds),
        gender: gender,
        birthDate: birthDate,
        weight: randomFloat(15, 80),
        status: status,
        color: randomElement(goatColors),
        penNumber: randomElement(pens),
        purchasePrice: randomFloat(3000, 15000),
      }
    });
    animals.push(animal);
  }
  console.log('Created 105 goats');

  // Create 50 Pigs
  for (let i = 1; i <= 50; i++) {
    const isMale = Math.random() > 0.5; // 50% male, 50% female
    const gender = isMale ? 'male' : 'female';
    const name = isMale ? randomElement(maleNames) : randomElement(femaleNames);
    const ageInMonths = randomInt(4, 36);
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - ageInMonths);
    
    let status = randomElement(statuses);
    if (gender === 'male') {
      status = status === 'pregnant' ? 'healthy' : status;
    }
    
    const animal = await prisma.animal.create({
      data: {
        tagNumber: `PIG-${String(i).padStart(4, '0')}`,
        name: `${name} ${i}`,
        type: 'pig',
        breed: randomElement(pigBreeds),
        gender: gender,
        birthDate: birthDate,
        weight: randomFloat(30, 250),
        status: status,
        color: randomElement(pigColors),
        penNumber: randomElement(pens),
        purchasePrice: randomFloat(5000, 25000),
      }
    });
    animals.push(animal);
  }
  console.log('Created 50 pigs');

  // Create health records for each animal
  for (const animal of animals) {
    const numRecords = randomInt(1, 5);
    for (let j = 0; j < numRecords; j++) {
      const recordDate = randomDate(new Date(2024, 0, 1), new Date());
      await prisma.healthRecord.create({
        data: {
          animalId: animal.id,
          date: recordDate,
          type: randomElement(['vaccination', 'treatment', 'checkup', 'medication']),
          description: `Routine ${randomElement(['vaccination', 'health check', 'deworming', 'treatment'])} for ${animal.name}`,
          veterinarian: randomElement(vets),
          medication: randomElement(medications),
          dosage: `${randomInt(1, 10)} ml`,
          cost: randomFloat(100, 2000),
        }
      });
    }
  }
  console.log('Created health records');

  // Create feeding records (last 30 days)
  for (const animal of animals) {
    for (let day = 0; day < 30; day += randomInt(2, 5)) {
      const feedDate = new Date();
      feedDate.setDate(feedDate.getDate() - day);
      await prisma.feedingRecord.create({
        data: {
          animalId: animal.id,
          date: feedDate,
          feedType: randomElement(feedTypes),
          quantity: animal.type === 'goat' ? randomFloat(1, 4) : randomFloat(2, 6),
          notes: Math.random() > 0.7 ? 'Fed on schedule' : null,
        }
      });
    }
  }
  console.log('Created feeding records');

  // Create breeding records
  const maleGoats = animals.filter(a => a.type === 'goat' && a.gender === 'male');
  const femaleGoats = animals.filter(a => a.type === 'goat' && a.gender === 'female');
  const malePigs = animals.filter(a => a.type === 'pig' && a.gender === 'male');
  const femalePigs = animals.filter(a => a.type === 'pig' && a.gender === 'female');

  // Goat breeding records
  for (let i = 0; i < 15; i++) {
    const male = randomElement(maleGoats);
    const female = randomElement(femaleGoats);
    const breedingDate = randomDate(new Date(2024, 0, 1), new Date());
    const expectedBirth = new Date(breedingDate);
    expectedBirth.setDate(expectedBirth.getDate() + 150); // ~5 months gestation
    
    await prisma.breedingRecord.create({
      data: {
        maleId: male.id,
        femaleId: female.id,
        breedingDate: breedingDate,
        expectedBirth: expectedBirth > new Date() ? expectedBirth : null,
        actualBirth: expectedBirth <= new Date() ? expectedBirth : null,
        offspringCount: expectedBirth <= new Date() ? randomInt(1, 3) : null,
        status: expectedBirth > new Date() ? 'confirmed' : 'completed',
      }
    });
  }

  // Pig breeding records
  for (let i = 0; i < 10; i++) {
    const male = randomElement(malePigs);
    const female = randomElement(femalePigs);
    const breedingDate = randomDate(new Date(2024, 0, 1), new Date());
    const expectedBirth = new Date(breedingDate);
    expectedBirth.setDate(expectedBirth.getDate() + 114); // ~3.8 months gestation
    
    await prisma.breedingRecord.create({
      data: {
        maleId: male.id,
        femaleId: female.id,
        breedingDate: breedingDate,
        expectedBirth: expectedBirth > new Date() ? expectedBirth : null,
        actualBirth: expectedBirth <= new Date() ? expectedBirth : null,
        offspringCount: expectedBirth <= new Date() ? randomInt(6, 12) : null,
        status: expectedBirth > new Date() ? 'confirmed' : 'completed',
      }
    });
  }
  console.log('Created breeding records');

  // Create expenses
  const expenseCategories = ['feed', 'medication', 'equipment', 'labor', 'utilities', 'other'];
  for (let i = 0; i < 50; i++) {
    await prisma.expense.create({
      data: {
        category: randomElement(expenseCategories),
        description: `${randomElement(['Monthly', 'Weekly', 'Emergency', 'Routine'])} ${randomElement(expenseCategories)} expense`,
        amount: randomFloat(500, 50000),
        date: randomDate(new Date(2024, 0, 1), new Date()),
      }
    });
  }
  console.log('Created expenses');

  // Create income
  const incomeCategories = ['sale', 'product', 'other'];
  for (let i = 0; i < 20; i++) {
    await prisma.income.create({
      data: {
        category: randomElement(incomeCategories),
        description: `${randomElement(['Animal sale', 'Milk sale', 'Manure sale', 'Breeding service'])} income`,
        amount: randomFloat(10000, 100000),
        date: randomDate(new Date(2024, 0, 1), new Date()),
      }
    });
  }
  console.log('Created income records');

  console.log('Seed completed successfully!');
  console.log(`Total animals: ${animals.length}`);
  console.log(`- Goats: ${animals.filter(a => a.type === 'goat').length}`);
  console.log(`- Pigs: ${animals.filter(a => a.type === 'pig').length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
