/* Built-in food database. Values are approximate, per the listed serving.
   calories in kcal; protein/carbs/fat in grams. */

export const FOOD_DB = [
  // --- Beef / steak cuts ---
  { name: "New York strip steak", serving: "6 oz", calories: 414, protein: 50, carbs: 0, fat: 23 },
  { name: "Ribeye steak", serving: "6 oz", calories: 500, protein: 46, carbs: 0, fat: 34 },
  { name: "Sirloin steak", serving: "6 oz", calories: 340, protein: 50, carbs: 0, fat: 14 },
  { name: "Filet mignon", serving: "6 oz", calories: 348, protein: 48, carbs: 0, fat: 16 },
  { name: "T-bone steak", serving: "6 oz", calories: 460, protein: 48, carbs: 0, fat: 29 },
  { name: "Flank steak", serving: "6 oz", calories: 320, protein: 46, carbs: 0, fat: 14 },
  { name: "Ground beef, 80/20 (cooked)", serving: "4 oz", calories: 287, protein: 26, carbs: 0, fat: 20 },
  { name: "Ground beef, 90/10 (cooked)", serving: "4 oz", calories: 199, protein: 28, carbs: 0, fat: 10 },
  { name: "Beef burger patty", serving: "4 oz", calories: 290, protein: 24, carbs: 0, fat: 21 },
  { name: "Beef hot dog", serving: "1 link", calories: 150, protein: 5, carbs: 2, fat: 13 },
  { name: "Beef brisket", serving: "4 oz", calories: 250, protein: 28, carbs: 0, fat: 15 },
  { name: "Meatballs (beef)", serving: "3 balls", calories: 230, protein: 14, carbs: 6, fat: 16 },

  // --- Poultry ---
  { name: "Chicken breast, grilled", serving: "6 oz", calories: 280, protein: 53, carbs: 0, fat: 6 },
  { name: "Chicken thigh, roasted", serving: "1 thigh", calories: 209, protein: 26, carbs: 0, fat: 11 },
  { name: "Chicken wings", serving: "4 wings", calories: 320, protein: 27, carbs: 0, fat: 22 },
  { name: "Rotisserie chicken", serving: "3 oz", calories: 170, protein: 24, carbs: 0, fat: 8 },
  { name: "Fried chicken", serving: "1 piece", calories: 320, protein: 21, carbs: 11, fat: 21 },
  { name: "Chicken nuggets", serving: "6 pieces", calories: 280, protein: 14, carbs: 16, fat: 18 },
  { name: "Turkey breast, sliced", serving: "3 oz", calories: 90, protein: 18, carbs: 1, fat: 1 },
  { name: "Ground turkey (cooked)", serving: "4 oz", calories: 220, protein: 26, carbs: 0, fat: 13 },

  // --- Pork ---
  { name: "Pork chop, grilled", serving: "6 oz", calories: 360, protein: 46, carbs: 0, fat: 18 },
  { name: "Bacon", serving: "2 slices", calories: 86, protein: 6, carbs: 0, fat: 7 },
  { name: "Ham, sliced", serving: "3 oz", calories: 120, protein: 16, carbs: 2, fat: 5 },
  { name: "Pork sausage", serving: "1 link", calories: 170, protein: 9, carbs: 1, fat: 14 },
  { name: "Pulled pork", serving: "4 oz", calories: 280, protein: 24, carbs: 5, fat: 18 },
  { name: "Pepperoni", serving: "1 oz", calories: 138, protein: 6, carbs: 0, fat: 12 },

  // --- Seafood ---
  { name: "Salmon, baked", serving: "6 oz", calories: 367, protein: 40, carbs: 0, fat: 22 },
  { name: "Tuna, canned in water", serving: "1 can (5 oz)", calories: 110, protein: 26, carbs: 0, fat: 1 },
  { name: "Shrimp, cooked", serving: "4 oz", calories: 112, protein: 24, carbs: 0, fat: 1 },
  { name: "Tilapia, baked", serving: "6 oz", calories: 220, protein: 45, carbs: 0, fat: 4 },
  { name: "Cod, baked", serving: "6 oz", calories: 190, protein: 41, carbs: 0, fat: 2 },
  { name: "Sushi roll (California)", serving: "8 pieces", calories: 255, protein: 9, carbs: 38, fat: 7 },
  { name: "Fish sticks", serving: "6 sticks", calories: 290, protein: 14, carbs: 24, fat: 16 },

  // --- Eggs & dairy ---
  { name: "Egg, large", serving: "1 egg", calories: 78, protein: 6, carbs: 1, fat: 5 },
  { name: "Scrambled eggs", serving: "2 eggs", calories: 180, protein: 12, carbs: 2, fat: 14 },
  { name: "Egg whites", serving: "3 whites", calories: 51, protein: 11, carbs: 1, fat: 0 },
  { name: "Greek yogurt, plain", serving: "170 g", calories: 100, protein: 17, carbs: 6, fat: 0 },
  { name: "Greek yogurt, flavored", serving: "150 g", calories: 130, protein: 12, carbs: 17, fat: 2 },
  { name: "Whole milk", serving: "1 cup", calories: 149, protein: 8, carbs: 12, fat: 8 },
  { name: "Skim milk", serving: "1 cup", calories: 83, protein: 8, carbs: 12, fat: 0 },
  { name: "Cheddar cheese", serving: "1 oz", calories: 113, protein: 7, carbs: 0, fat: 9 },
  { name: "Mozzarella cheese", serving: "1 oz", calories: 85, protein: 6, carbs: 1, fat: 6 },
  { name: "String cheese", serving: "1 stick", calories: 80, protein: 7, carbs: 1, fat: 6 },
  { name: "Cottage cheese", serving: "1/2 cup", calories: 90, protein: 12, carbs: 5, fat: 2 },
  { name: "Butter", serving: "1 tbsp", calories: 102, protein: 0, carbs: 0, fat: 12 },
  { name: "Cream cheese", serving: "1 tbsp", calories: 51, protein: 1, carbs: 1, fat: 5 },

  // --- Grains, bread, pasta ---
  { name: "White rice, cooked", serving: "1 cup", calories: 205, protein: 4, carbs: 45, fat: 0 },
  { name: "Brown rice, cooked", serving: "1 cup", calories: 218, protein: 5, carbs: 46, fat: 2 },
  { name: "Pasta, cooked", serving: "1 cup", calories: 220, protein: 8, carbs: 43, fat: 1 },
  { name: "Spaghetti with marinara", serving: "1 cup", calories: 270, protein: 9, carbs: 50, fat: 4 },
  { name: "White bread", serving: "1 slice", calories: 75, protein: 3, carbs: 14, fat: 1 },
  { name: "Whole wheat bread", serving: "1 slice", calories: 80, protein: 4, carbs: 14, fat: 1 },
  { name: "Bagel, plain", serving: "1 bagel", calories: 245, protein: 10, carbs: 48, fat: 2 },
  { name: "Tortilla, flour", serving: "1 (8 in)", calories: 140, protein: 4, carbs: 24, fat: 4 },
  { name: "Oatmeal, cooked", serving: "1 cup", calories: 154, protein: 6, carbs: 27, fat: 3 },
  { name: "Cereal with milk", serving: "1 bowl", calories: 250, protein: 8, carbs: 45, fat: 5 },
  { name: "Pancakes", serving: "3 pancakes", calories: 350, protein: 8, carbs: 60, fat: 9 },
  { name: "Waffle", serving: "1 waffle", calories: 218, protein: 6, carbs: 25, fat: 11 },
  { name: "Quinoa, cooked", serving: "1 cup", calories: 222, protein: 8, carbs: 39, fat: 4 },
  { name: "Couscous, cooked", serving: "1 cup", calories: 176, protein: 6, carbs: 36, fat: 0 },

  // --- Fruit ---
  { name: "Banana", serving: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Apple", serving: "1 medium", calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Orange", serving: "1 medium", calories: 62, protein: 1, carbs: 15, fat: 0 },
  { name: "Strawberries", serving: "1 cup", calories: 49, protein: 1, carbs: 12, fat: 0 },
  { name: "Blueberries", serving: "1 cup", calories: 84, protein: 1, carbs: 21, fat: 0 },
  { name: "Grapes", serving: "1 cup", calories: 104, protein: 1, carbs: 27, fat: 0 },
  { name: "Avocado", serving: "1/2 fruit", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: "Watermelon", serving: "1 cup", calories: 46, protein: 1, carbs: 12, fat: 0 },
  { name: "Pineapple", serving: "1 cup", calories: 82, protein: 1, carbs: 22, fat: 0 },
  { name: "Mango", serving: "1 cup", calories: 99, protein: 1, carbs: 25, fat: 1 },
  { name: "Pear", serving: "1 medium", calories: 101, protein: 1, carbs: 27, fat: 0 },
  { name: "Peach", serving: "1 medium", calories: 59, protein: 1, carbs: 14, fat: 0 },

  // --- Vegetables ---
  { name: "Broccoli, steamed", serving: "1 cup", calories: 55, protein: 4, carbs: 11, fat: 1 },
  { name: "Spinach, raw", serving: "1 cup", calories: 7, protein: 1, carbs: 1, fat: 0 },
  { name: "Carrots", serving: "1 cup", calories: 52, protein: 1, carbs: 12, fat: 0 },
  { name: "Sweet potato, baked", serving: "1 medium", calories: 112, protein: 2, carbs: 26, fat: 0 },
  { name: "Potato, baked", serving: "1 medium", calories: 161, protein: 4, carbs: 37, fat: 0 },
  { name: "Mashed potatoes", serving: "1 cup", calories: 237, protein: 4, carbs: 35, fat: 9 },
  { name: "Corn", serving: "1 cup", calories: 132, protein: 5, carbs: 29, fat: 2 },
  { name: "Green beans", serving: "1 cup", calories: 44, protein: 2, carbs: 10, fat: 0 },
  { name: "Side salad", serving: "1 bowl", calories: 60, protein: 2, carbs: 8, fat: 3 },
  { name: "Caesar salad", serving: "1 bowl", calories: 190, protein: 5, carbs: 9, fat: 16 },
  { name: "Tomato", serving: "1 medium", calories: 22, protein: 1, carbs: 5, fat: 0 },
  { name: "Cucumber", serving: "1 cup", calories: 16, protein: 1, carbs: 4, fat: 0 },

  // --- Legumes, nuts, plant protein ---
  { name: "Black beans, cooked", serving: "1 cup", calories: 227, protein: 15, carbs: 41, fat: 1 },
  { name: "Chickpeas, cooked", serving: "1 cup", calories: 269, protein: 15, carbs: 45, fat: 4 },
  { name: "Lentils, cooked", serving: "1 cup", calories: 230, protein: 18, carbs: 40, fat: 1 },
  { name: "Tofu, firm", serving: "1/2 cup", calories: 181, protein: 22, carbs: 4, fat: 11 },
  { name: "Hummus", serving: "2 tbsp", calories: 70, protein: 2, carbs: 6, fat: 5 },
  { name: "Almonds", serving: "28 g (23 nuts)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Peanut butter", serving: "2 tbsp", calories: 188, protein: 8, carbs: 6, fat: 16 },
  { name: "Peanuts", serving: "1 oz", calories: 161, protein: 7, carbs: 5, fat: 14 },
  { name: "Walnuts", serving: "1 oz", calories: 185, protein: 4, carbs: 4, fat: 18 },
  { name: "Cashews", serving: "1 oz", calories: 157, protein: 5, carbs: 9, fat: 12 },

  // --- Fast food / restaurant ---
  { name: "Cheeseburger (fast food)", serving: "1 burger", calories: 300, protein: 15, carbs: 33, fat: 12 },
  { name: "Double cheeseburger", serving: "1 burger", calories: 440, protein: 25, carbs: 34, fat: 23 },
  { name: "French fries, medium", serving: "1 order", calories: 365, protein: 4, carbs: 48, fat: 17 },
  { name: "Pizza, cheese", serving: "1 slice", calories: 285, protein: 12, carbs: 36, fat: 10 },
  { name: "Pizza, pepperoni", serving: "1 slice", calories: 313, protein: 13, carbs: 36, fat: 13 },
  { name: "Burrito, chicken", serving: "1 burrito", calories: 620, protein: 32, carbs: 70, fat: 22 },
  { name: "Taco", serving: "1 taco", calories: 170, protein: 8, carbs: 13, fat: 9 },
  { name: "Chicken sandwich", serving: "1 sandwich", calories: 440, protein: 28, carbs: 40, fat: 18 },
  { name: "Hot dog with bun", serving: "1", calories: 290, protein: 10, carbs: 27, fat: 16 },
  { name: "Sub sandwich (6 in)", serving: "1 sub", calories: 380, protein: 20, carbs: 46, fat: 12 },
  { name: "Mac and cheese", serving: "1 cup", calories: 310, protein: 12, carbs: 40, fat: 12 },
  { name: "Ramen noodles", serving: "1 pack", calories: 380, protein: 8, carbs: 52, fat: 14 },

  // --- Snacks & sweets ---
  { name: "Potato chips", serving: "1 oz", calories: 152, protein: 2, carbs: 15, fat: 10 },
  { name: "Tortilla chips", serving: "1 oz", calories: 138, protein: 2, carbs: 18, fat: 7 },
  { name: "Popcorn", serving: "3 cups", calories: 93, protein: 3, carbs: 19, fat: 1 },
  { name: "Granola bar", serving: "1 bar", calories: 120, protein: 3, carbs: 20, fat: 4 },
  { name: "Protein bar", serving: "1 bar", calories: 200, protein: 20, carbs: 22, fat: 7 },
  { name: "Chocolate chip cookie", serving: "1 cookie", calories: 160, protein: 2, carbs: 21, fat: 8 },
  { name: "Brownie", serving: "1 piece", calories: 230, protein: 3, carbs: 36, fat: 9 },
  { name: "Ice cream", serving: "1/2 cup", calories: 207, protein: 4, carbs: 24, fat: 11 },
  { name: "Dark chocolate", serving: "1 oz", calories: 155, protein: 2, carbs: 13, fat: 12 },
  { name: "Donut, glazed", serving: "1 donut", calories: 240, protein: 3, carbs: 31, fat: 12 },
  { name: "Muffin, blueberry", serving: "1 muffin", calories: 265, protein: 4, carbs: 41, fat: 9 },
  { name: "Crackers", serving: "5 crackers", calories: 80, protein: 1, carbs: 10, fat: 4 },

  // --- Beverages ---
  { name: "Coffee, black", serving: "1 cup", calories: 2, protein: 0, carbs: 0, fat: 0 },
  { name: "Latte", serving: "12 oz", calories: 190, protein: 12, carbs: 18, fat: 7 },
  { name: "Orange juice", serving: "1 cup", calories: 112, protein: 2, carbs: 26, fat: 0 },
  { name: "Soda (cola)", serving: "12 oz", calories: 140, protein: 0, carbs: 39, fat: 0 },
  { name: "Beer", serving: "12 oz", calories: 153, protein: 2, carbs: 13, fat: 0 },
  { name: "Wine, red", serving: "5 oz", calories: 125, protein: 0, carbs: 4, fat: 0 },
  { name: "Protein shake", serving: "1 scoop + water", calories: 120, protein: 24, carbs: 3, fat: 1 },
  { name: "Smoothie, fruit", serving: "16 oz", calories: 250, protein: 5, carbs: 55, fat: 2 },
  { name: "Energy drink", serving: "16 oz", calories: 110, protein: 0, carbs: 28, fat: 0 },
  { name: "Sports drink", serving: "20 oz", calories: 130, protein: 0, carbs: 34, fat: 0 },

  // --- Condiments / extras ---
  { name: "Olive oil", serving: "1 tbsp", calories: 119, protein: 0, carbs: 0, fat: 14 },
  { name: "Ketchup", serving: "1 tbsp", calories: 17, protein: 0, carbs: 5, fat: 0 },
  { name: "Mayonnaise", serving: "1 tbsp", calories: 94, protein: 0, carbs: 0, fat: 10 },
  { name: "Ranch dressing", serving: "2 tbsp", calories: 130, protein: 1, carbs: 2, fat: 14 },
  { name: "Soy sauce", serving: "1 tbsp", calories: 8, protein: 1, carbs: 1, fat: 0 },
  { name: "Honey", serving: "1 tbsp", calories: 64, protein: 0, carbs: 17, fat: 0 },
  { name: "Maple syrup", serving: "1 tbsp", calories: 52, protein: 0, carbs: 13, fat: 0 },
];

const norm = (s) => s.trim().toLowerCase();

/** Rank foods by relevance to the query. Returns up to `limit` matches. */
export function searchFoods(query, db, limit = 8) {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const f of db) {
    const n = norm(f.name);
    const idx = n.indexOf(q);
    let score;
    if (idx === 0) score = 0;
    else if (idx > 0) score = 1;
    else if (words.every((w) => n.includes(w))) score = 2;
    else continue;
    scored.push([score, f]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.length - b[1].name.length);
  return scored.slice(0, limit).map((s) => s[1]);
}
