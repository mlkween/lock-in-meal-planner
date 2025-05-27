let recipes = JSON.parse(localStorage.getItem("recipes")) || {};
let mealPlan = JSON.parse(localStorage.getItem("mealPlan")) || {};

function saveRecipes() {
  localStorage.setItem("recipes", JSON.stringify(recipes));
}

function savePlan() {
  const date = document.getElementById("planner-date").value;
  if (!date) {
    alert("Please choose a date.");
    return;
  }

  mealPlan[date] = {
    breakfast: document.getElementById("breakfast").value,
    lunch: document.getElementById("lunch").value,
    dinner: document.getElementById("dinner").value,
    snacks: document.getElementById("snacks").value,
  };

  localStorage.setItem("mealPlan", JSON.stringify(mealPlan));
  renderPlannedMeals();
  alert("Plan saved!");
}

function addRecipe() {
  const name = document.getElementById("recipe-name").value.trim();
  const ingredients = document
    .getElementById("recipe-ingredients")
    .value.split("\n")
    .map(i => i.trim())
    .filter(i => i);

  const calories = +document.getElementById("calories").value;
  const protein = +document.getElementById("protein").value;
  const fat = +document.getElementById("fat").value;
  const carbs = +document.getElementById("carbs").value;

  if (!name || ingredients.length === 0) {
    alert("Enter a recipe name and at least one ingredient.");
    return;
  }

  recipes[name] = {
    ingredients,
    calories,
    protein,
    fat,
    carbs,
  };

  saveRecipes();
  populateDropdowns();
  alert("Recipe added!");
}


function populateDropdowns() {
  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
  const scaler = document.getElementById("scaling-recipe");

  // Clear all meal dropdowns
  mealTypes.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = `<option value="">-- ${id.charAt(0).toUpperCase() + id.slice(1)} --</option>`;
    }
  });

  // Clear the scaling dropdown
  scaler.innerHTML = "<option value=''>-- Select a recipe --</option>";

  // Add options from recipes
  for (let name in recipes) {
    const recipe = recipes[name];
    const label = recipe.calories
      ? ` (${recipe.calories} cal, P:${recipe.protein || 0} F:${recipe.fat || 0} C:${recipe.carbs || 0})`
      : "";

    mealTypes.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name + label;
        select.appendChild(opt);
      }
    });

    const scaleOpt = document.createElement("option");
    scaleOpt.value = name;
    scaleOpt.textContent = name;
    scaler.appendChild(scaleOpt);
  }
}


function scaleRecipe() {
  const name = document.getElementById("scaling-recipe").value;
  const servings = +document.getElementById("scaling-servings").value;
  const recipe = recipes[name];

  if (!name || !recipe || servings < 1) {
    document.getElementById("scaled-output").innerHTML = "Select a recipe and valid serving size.";
    return;
  }

  const scaledMacros = `
    <p><strong>Scaled Macros (${servings}x):</strong></p>
    <ul>
      <li>Calories: ${recipe.calories * servings}</li>
      <li>Protein: ${recipe.protein * servings}g</li>
      <li>Fat: ${recipe.fat * servings}g</li>
      <li>Carbs: ${recipe.carbs * servings}g</li>
    </ul>
  `;

  const scaledIngredients = `
    <p><strong>Scaled Ingredients:</strong></p>
    <ul>${recipe.ingredients.map(i => `<li>${servings}x ${i}</li>`).join("")}</ul>
  `;

  document.getElementById("scaled-output").innerHTML = scaledMacros + scaledIngredients;
}



function generateShoppingList() {
  const items = {};
  for (let date in mealPlan) {
    const meals = mealPlan[date];
    for (let type in meals) {
      const recipeName = meals[type];
      const recipe = recipes[recipeName];
      if (recipe) {
        recipe.ingredients.forEach(ingredient => {
          items[ingredient] = (items[ingredient] || 0) + 1;
        });
      }
    }
  }

  const ul = document.getElementById("shopping-list");
  ul.innerHTML = "";
  for (let item in items) {
    const li = document.createElement("li");
    li.textContent = `${item} × ${items[item]}`;
    ul.appendChild(li);
  }
}


function calculateNutrition() {
  const date = document.getElementById("planner-date").value;
  if (!date || !mealPlan[date]) {
    document.getElementById("summary-output").textContent = "No meals planned for this date.";
    return;
  }

  const meals = mealPlan[date];
  let total = { calories: 0, protein: 0, fat: 0, carbs: 0 };

  for (let meal in meals) {
    const recipeName = meals[meal];
    const recipe = recipes[recipeName];
    if (recipe) {
      total.calories += recipe.calories || 0;
      total.protein += recipe.protein || 0;
      total.fat += recipe.fat || 0;
      total.carbs += recipe.carbs || 0;
    }
  }

  document.getElementById("summary-output").textContent = `
    ${total.calories} calories — Protein: ${total.protein}g, Fat: ${total.fat}g, Carbs: ${total.carbs}g
  `;
}

function showRecipeList() {
  const ul = document.getElementById("recipe-list-ul");
  ul.innerHTML = "";

  for (let name in recipes) {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${name}</strong>
      <button onclick="editRecipe('${name}')">Edit</button>
      <button onclick="deleteRecipe('${name}')">Delete</button>
    `;
    ul.appendChild(li);
  }
}

function deleteRecipe(name) {
  if (confirm(`Delete recipe "${name}"?`)) {
    delete recipes[name];
    saveRecipes();
    populateDropdowns();
    showRecipeList();
  }
}

function editRecipe(name) {
  const recipe = recipes[name];
  if (!recipe) return;

  document.getElementById("recipe-name").value = name;
  document.getElementById("recipe-ingredients").value = recipe.ingredients.join("\n");
  document.getElementById("calories").value = recipe.calories || "";
  document.getElementById("protein").value = recipe.protein || "";
  document.getElementById("fat").value = recipe.fat || "";
  document.getElementById("carbs").value = recipe.carbs || "";

  deleteRecipe(name); // allows overwrite on save
}

function renderPlannedMeals() {
  const container = document.getElementById("planned-meals");
  container.innerHTML = ""; // Clear existing cards

  for (let date in mealPlan) {
    const dayCard = document.createElement("div");
    dayCard.className = "bg-white p-4 rounded-2xl shadow border space-y-2";

    const heading = document.createElement("h3");
    heading.className = "text-xl font-semibold";
    heading.textContent = new Date(date).toDateString();

    const ul = document.createElement("ul");
    ul.className = "text-sm space-y-1";

    for (let type of ["breakfast", "lunch", "dinner", "snacks"]) {
      const recipeName = mealPlan[date][type];
      if (recipeName) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="font-medium capitalize">${type}:</span> ${recipeName}`;
        ul.appendChild(li);
      }
    }

    dayCard.appendChild(heading);
    dayCard.appendChild(ul);
    container.appendChild(dayCard);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  populateDropdowns();
  showRecipeList();
  renderPlannedMeals();
});
