/* FitLife offline prototype
   Data is stored only in this browser/device using localStorage.
   This is a front-end capstone prototype, not a medical device. */
const STORE_KEY = "fitlife_capstone_v1";
const defaultData = {
  onboarded:false, name:"User", goal:"Feel healthier", water:0, sleep:7.5,
  calories:1250, calorieGoal:2000, steps:5230, stepGoal:10000, weight:62,
  weightHistory:[63.5,63.2,63,62.8,62.9,62.4,62], completedMeals:[], savedRecipes:[],
  workoutHistory:[], settings:{units:"kg"}, chat:[]
};
let data = loadData();
let currentScreen = data.onboarded ? "home" : "welcome";
let previousScreen = "home";
let selectedDay = 0;
let selectedWorkoutType = "Strength";
let workoutRunning = false;
let workoutSeconds = 0;
let workoutInterval = null;
let workoutExerciseIndex = 0;
let toastTimeout;

const meals = [
  {type:"Breakfast",name:"Oatmeal with Banana and Nuts",kcal:350,emoji:"🥣",desc:"Oats, banana, nuts and milk"},
  {type:"Lunch",name:"Grilled Chicken with Brown Rice and Vegetables",kcal:500,emoji:"🍗",desc:"Chicken, brown rice and vegetables"},
  {type:"Dinner",name:"Fish with Mixed Vegetables",kcal:450,emoji:"🐟",desc:"Fish fillet with steamed vegetables"},
  {type:"Snacks",name:"Greek Yogurt with Fruits",kcal:150,emoji:"🍓",desc:"Yogurt, berries and seasonal fruit"}
];
const exercises = [
  {name:"Push Up",emoji:"🤸",sets:3,reps:"12 reps",seconds:30,tip:"Keep your body straight and lower yourself with control."},
  {name:"Squat",emoji:"🏋️",sets:3,reps:"15 reps",seconds:35,tip:"Keep your feet shoulder-width apart and knees aligned with your toes."},
  {name:"Plank",emoji:"🧘",sets:3,reps:"30 sec",seconds:30,tip:"Keep your hips level and breathe normally."},
  {name:"Lunges",emoji:"🚶",sets:3,reps:"12 reps",seconds:35,tip:"Take a stable step and keep your front knee aligned."},
  {name:"Jumping Jack",emoji:"🙆",sets:3,reps:"45 sec",seconds:45,tip:"Land softly and use a comfortable pace."}
];
const mealPlans = [
  meals,
  [
    {type:"Breakfast",name:"Eggs with Whole-Wheat Toast",kcal:320,emoji:"🍳",desc:"Eggs, toast and fruit"},
    {type:"Lunch",name:"Tuna Rice Bowl",kcal:480,emoji:"🍚",desc:"Tuna, rice and greens"},
    {type:"Dinner",name:"Chicken Vegetable Soup",kcal:410,emoji:"🍲",desc:"Chicken and vegetable soup"},
    {type:"Snacks",name:"Apple with Peanut Butter",kcal:180,emoji:"🍎",desc:"Apple slices and peanut butter"}
  ],
  [
    {type:"Breakfast",name:"Yogurt Fruit Bowl",kcal:300,emoji:"🥝",desc:"Yogurt, oats and fruit"},
    {type:"Lunch",name:"Grilled Fish with Rice",kcal:470,emoji:"🐠",desc:"Fish, rice and vegetables"},
    {type:"Dinner",name:"Tofu and Vegetable Stir-Fry",kcal:420,emoji:"🥗",desc:"Tofu and mixed vegetables"},
    {type:"Snacks",name:"Boiled Egg and Banana",kcal:160,emoji:"🍌",desc:"A simple snack"}
  ],
  [
    {type:"Breakfast",name:"Peanut Butter Oatmeal",kcal:340,emoji:"🥣",desc:"Oats and peanut butter"},
    {type:"Lunch",name:"Chicken Wrap",kcal:490,emoji:"🌯",desc:"Chicken and vegetables"},
    {type:"Dinner",name:"Vegetable Omelet with Rice",kcal:430,emoji:"🍳",desc:"Eggs and vegetables"},
    {type:"Snacks",name:"Fruit Salad",kcal:140,emoji:"🍇",desc:"Fresh mixed fruit"}
  ]
];

function loadData(){
  try { return {...defaultData, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}")}; }
  catch(e){ return {...defaultData}; }
}
function saveData(){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function esc(value){return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(message){
  const el=document.getElementById("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove("show"),2400);
}
function setScreen(screen){
  if(screen!=="welcome" && !data.onboarded){currentScreen="welcome";render();return;}
  if(currentScreen==="workout") previousScreen="fitness";
  currentScreen=screen; render();
  document.getElementById("screenHost").scrollTop=0;
}
function goBack(){setScreen(previousScreen || "home");}
function setNav(){
  const main=["home","diet","fitness","progress","profile"];
  document.getElementById("bottomNav").classList.toggle("hidden",currentScreen==="welcome"||currentScreen==="mealplan"||currentScreen==="workout"||currentScreen==="chat"||currentScreen==="settings"||currentScreen==="foodlog"||currentScreen==="recipes");
  document.getElementById("backBtn").classList.toggle("hidden",!["mealplan","workout","chat","settings","foodlog","recipes"].includes(currentScreen));
  document.getElementById("topTitle").textContent=({welcome:"FitLife",home:"FitLife",diet:"Diet",mealplan:"Meal Plan",foodlog:"Food Log",recipes:"Recipes",fitness:"Fitness",workout:"Workout",progress:"Progress",chat:"Fitbot",profile:"Profile",settings:"Settings"})[currentScreen]||"FitLife";
  document.querySelectorAll(".nav-item").forEach(btn=>btn.classList.toggle("active",btn.dataset.screen===currentScreen || (currentScreen==="mealplan"||currentScreen==="foodlog"||currentScreen==="recipes")&&btn.dataset.screen==="diet" || currentScreen==="workout"&&btn.dataset.screen==="fitness" || currentScreen==="chat"&&btn.dataset.screen==="profile"));
}
function render(){
  setNav();
  const host=document.getElementById("screenHost");
  const screens={welcome:welcomeScreen,home:homeScreen,diet:dietScreen,mealplan:mealPlanScreen,foodlog:foodLogScreen,recipes:recipesScreen,fitness:fitnessScreen,workout:workoutScreen,progress:progressScreen,chat:chatScreen,profile:profileScreen,settings:settingsScreen};
  host.innerHTML=(screens[currentScreen]||homeScreen)();
  if(currentScreen==="chat") renderChatMessages();
}
function welcomeScreen(){return `<section class="welcome-screen">
  <div class="welcome-art">🌿</div><h1 class="welcome-title">FitLife</h1><p class="welcome-sub">Better Choices<br>Healthier You</p>
  <div class="card"><p class="subtitle">A simple offline companion to help you track healthy habits, meals, workouts, and progress.</p>
  <label class="form-label" for="welcomeName" style="text-align:left">What should we call you?</label><input class="form-input" id="welcomeName" maxlength="30" placeholder="Enter your name" value="${esc(data.name==="User"?"":data.name)}">
  <button class="primary-btn" style="margin-top:17px" data-action="get-started">Get Started　›</button></div>
  <p class="muted-note">Track · Eat · Be Fit</p></section>`;}
function homeScreen(){return `<p class="eyebrow">WELCOME BACK</p><h1 class="page-title">Hello, ${esc(data.name)}!</h1><p class="subtitle">Small healthy choices make a difference.</p>
  <div class="section-heading"><h2>Today's Summary</h2><span class="eyebrow">${new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div>
  <div class="grid-2">
    ${statCard("🔥","Calories",data.calories.toLocaleString(),`/ ${data.calorieGoal.toLocaleString()} kcal`,data.calories/data.calorieGoal)}
    ${statCard("👣","Steps",data.steps.toLocaleString(),`/ ${data.stepGoal.toLocaleString()}`,data.steps/data.stepGoal)}
    ${statCard("💧","Water",`${data.water} glasses`,"Daily target: 8 glasses",data.water/8)}
    ${statCard("🌙","Sleep",`${data.sleep} hrs`,"Suggested: 7–9 hours",data.sleep/8)}
  </div>
  <div class="section-heading"><h2>Choose Your Goal</h2></div>
  <div class="grid-2"><button class="goal-card" data-action="navigate" data-screen="diet"><div class="goal-icon">🍽️</div><h3>Diet</h3><p>Eat healthy, feel better</p></button><button class="goal-card" data-action="navigate" data-screen="fitness"><div class="goal-icon">🏋️</div><h3>Fitness</h3><p>Get stronger, be healthier</p></button></div>
  <div class="section-heading"><h2>Quick Actions</h2></div>
  <div class="grid-2"><button class="list-card" data-action="water"><span class="list-icon">💧</span><span class="list-copy"><strong>Add a glass of water</strong><small>${data.water} of 8 glasses today</small></span></button><button class="list-card" data-action="navigate" data-screen="chat"><span class="list-icon">🤖</span><span class="list-copy"><strong>Ask Fitbot</strong><small>Offline fitness assistant</small></span></button></div>`;}
function statCard(icon,label,value,goal,progress){return `<div class="stat-card"><div class="stat-icon">${icon}</div><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-goal">${goal}</div><div class="progress-track"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,progress*100))}%"></div></div></div>`;}
function dietScreen(){return `<div class="hero"><h2>Healthy Food<br>Better Mood</h2><p>Plan meals, track what you eat, and build better habits.</p><div class="hero-art">🥗</div></div>
  ${menuItem("🍱","Meal Plan","Daily meal suggestions","mealplan")}${menuItem("📝","Food Log","Track what you eat","foodlog")}${menuItem("🔥","Calories Tracker","Review your daily calories","progress")}${menuItem("👩‍🍳","Recipes","Simple healthy meal ideas","recipes")}
  <p class="muted-note">Nutrition values are estimates for this demo. Adjust meals to your needs and consult a qualified professional for personal medical advice.</p>`;}
function menuItem(icon,title,desc,screen){return `<button class="list-card" data-action="navigate" data-screen="${screen}"><span class="list-icon">${icon}</span><span class="list-copy"><strong>${title}</strong><small>${desc}</small></span><span class="chevron">›</span></button>`;}
function mealPlanScreen(){const plan=mealPlans[selectedDay];return `<p class="eyebrow">YOUR DAILY GUIDE</p><h1 class="page-title">Meal Plan</h1><p class="subtitle">Choose a day and view meal suggestions.</p><div class="pill-row">${[0,1,2,3].map(i=>`<button class="pill ${selectedDay===i?"active":""}" data-action="day" data-day="${i}">Day ${i+1}</button>`).join("")}</div>
  ${plan.map((m,i)=>`<div class="card"><p class="eyebrow" style="margin:0 0 10px">${m.type}</p><div class="food-row"><div class="food-emoji">${m.emoji}</div><div class="list-copy"><strong>${m.name}</strong><small>${m.desc}</small><div class="food-kcal">${m.kcal} kcal (estimated)</div></div></div><button class="text-btn" style="margin-top:10px;padding:5px 0" data-action="log-meal" data-index="${i}">＋ Add to food log</button></div>`).join("")}
  <button class="primary-btn" data-action="complete-meals">✓ Mark today's plan complete</button>`;}
function foodLogScreen(){const logs=data.completedMeals;const total=logs.reduce((s,m)=>s+m.kcal,0);return `<h1 class="page-title">Food Log</h1><p class="subtitle">Meals you've added on this device.</p><div class="hero"><h2>${total.toLocaleString()} kcal</h2><p>Estimated calories in your logged meals</p><div class="hero-art">🍎</div></div>${logs.length?logs.map((m,i)=>`<div class="list-card"><span class="food-emoji">${m.emoji}</span><span class="list-copy"><strong>${m.name}</strong><small>${m.type} · ${m.kcal} kcal</small></span><button class="icon-btn" data-action="remove-meal" data-index="${i}" aria-label="Remove meal">×</button></div>`).join(""):`<div class="card empty-state">No meals logged yet. Open Meal Plan and tap “Add to food log”.</div>`}<button class="secondary-btn" data-action="navigate" data-screen="mealplan">Browse Meal Plan</button>`;}
function recipesScreen(){const recipes=[["🥑","Avocado Toast","Toast, avocado, egg (optional)","Mash avocado onto whole-grain toast. Add an egg if you like."],["🥗","Simple Garden Salad","Lettuce, tomato, cucumber","Wash and chop vegetables. Mix together and add your preferred dressing."],["🍌","Banana Oat Bowl","Oats, banana, milk","Cook oats with milk or water. Add sliced banana and a few nuts."],["🍲","Vegetable Soup","Mixed vegetables, broth","Simmer chopped vegetables in broth until tender. Season to taste."]];return `<h1 class="page-title">Healthy Recipes</h1><p class="subtitle">Easy ideas you can prepare at home.</p>${recipes.map((r,i)=>`<button class="list-card" data-action="recipe" data-index="${i}"><span class="food-emoji">${r[0]}</span><span class="list-copy"><strong>${r[1]}</strong><small>${r[2]}</small></span><span class="chevron">›</span></button>`).join("")}<p class="muted-note">Check ingredients for allergies and follow safe food-handling practices.</p>`;}
function fitnessScreen(){return `<div class="hero dark"><h2>Stronger<br>Every Day</h2><p>Track workouts, reach your goals, and build a healthy routine.</p><div class="hero-art">🏋️</div></div>${menuItem("🏋️","Workout Plans","Follow a simple guided routine","workout")}${menuItem("📋","Workout Tracker","Log your exercises","workout")}${menuItem("🏃","Exercise Library","Learn basic exercise tips","exercises")}${menuItem("🏆","Challenges","Stay motivated with small goals","progress")}
  <div class="section-heading"><h2>Today's Activity</h2><button data-action="navigate" data-screen="progress">View progress</button></div><div class="grid-2">${statCard("💪","Workouts",String(data.workoutHistory.length),"Completed sessions",Math.min(1,data.workoutHistory.length/5))}${statCard("👣","Steps",data.steps.toLocaleString(),"Daily movement",data.steps/data.stepGoal)}</div>`;}
function workoutScreen(){
  const ex=exercises[workoutExerciseIndex%exercises.length];
  const activeWorkout = workoutRunning ? `
    <div class="card">
      <div class="timer" id="workoutTimer">${formatTime(workoutSeconds)}</div>
      <div class="timer-label">Elapsed time</div>
      <div class="ring"><span>${ex.emoji}</span></div>
      <h2 style="text-align:center;margin:0">${ex.name}</h2>
      <p class="subtitle" style="text-align:center;margin-top:6px">Exercise ${workoutExerciseIndex+1} of ${exercises.length}</p>
      <p class="subtitle" style="text-align:center;margin-top:12px">${ex.tip}</p>
      <div class="button-row"><button class="secondary-btn" data-action="next-exercise">Next Exercise</button><button class="primary-btn" data-action="finish-workout">Finish</button></div>
      <button class="text-btn" style="width:100%;margin-top:12px" data-action="pause-workout">Pause timer</button>
    </div>` : `
    <div class="card"><h2 style="margin:0 0 6px">Beginner ${selectedWorkoutType} Routine</h2><p class="subtitle">Move at a comfortable pace. Stop if you feel pain, dizziness, or unusual discomfort.</p>
      ${exercises.map((e,i)=>`<div class="exercise-row"><div class="exercise-emoji">${e.emoji}</div><div class="exercise-info"><strong>${e.name}</strong><small>${e.sets} sets · ${e.reps}</small></div><button class="check-circle ${data.workoutChecked?.includes(i)?"checked":""}" data-action="check-exercise" data-index="${i}">${data.workoutChecked?.includes(i)?"✓":""}</button></div>`).join("")}
      <button class="primary-btn" style="margin-top:15px" data-action="start-workout">▶ Start Workout</button>
    </div>
    <div class="section-heading"><h2>Exercise Tips</h2></div>${menuItem("🤸","Push Up","Keep your body in a straight line","exercises")}${menuItem("🧘","Plank","Brace your core and breathe steadily","exercises")}`;
  return `<p class="eyebrow">YOUR MOVEMENT SESSION</p><h1 class="page-title">Workout Tracker</h1><div class="pill-row">${["Strength","Cardio","Flexibility"].map(t=>`<button class="pill ${selectedWorkoutType===t?"active":""}" data-action="workout-type" data-type="${t}">${t}</button>`).join("")}</div>${activeWorkout}`;
}
function formatTime(s){return `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function progressScreen(){const history=data.weightHistory;const min=Math.min(...history)-1,max=Math.max(...history)+1;const points=history.map((v,i)=>`${12+i*(276/Math.max(1,history.length-1))},${110-(v-min)/(max-min)*82}`).join(" ");return `<h1 class="page-title">Your Progress</h1><p class="subtitle">Review your habits and update your weight when needed.</p><div class="grid-2">${statCard("🔥","Calories",data.calories.toLocaleString(),`Goal ${data.calorieGoal}`,data.calories/data.calorieGoal)}${statCard("👣","Steps",data.steps.toLocaleString(),`Goal ${data.stepGoal}`,data.steps/data.stepGoal)}${statCard("💧","Water",`${data.water}/8 glasses`,"Daily water",data.water/8)}${statCard("💪","Workouts",String(data.workoutHistory.length),"Sessions logged",Math.min(1,data.workoutHistory.length/5))}</div>
  <div class="card"><div class="section-heading" style="margin-top:0"><h2>Weight Progress</h2><strong>${data.weight} kg</strong></div><svg class="chart" viewBox="0 0 300 130" role="img" aria-label="Weight history line chart"><line x1="10" y1="110" x2="290" y2="110" stroke="#dce9e0"/><line x1="10" y1="70" x2="290" y2="70" stroke="#edf3ef"/><line x1="10" y1="30" x2="290" y2="30" stroke="#edf3ef"/><polyline points="${points}" fill="none" stroke="#15986b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${history.map((v,i)=>`<circle cx="${12+i*(276/Math.max(1,history.length-1))}" cy="${110-(v-min)/(max-min)*82}" r="3" fill="#087f5b"/>`).join("")}</svg><p class="muted-note">Demo history is illustrative. Add your own weight below to update this chart.</p><form id="weightForm"><label class="form-label" for="weightInput">Current weight (kg)</label><div class="button-row"><input id="weightInput" class="form-input" type="number" min="1" max="500" step=".1" required value="${data.weight}"><button class="primary-btn" style="max-width:125px">Save Weight</button></div></form></div>
  <div class="card"><div class="section-heading" style="margin-top:0"><h2>Daily Goals</h2></div><form id="goalsForm"><label class="form-label" for="stepsGoal">Steps target</label><input class="form-input" id="stepsGoal" type="number" min="100" max="100000" value="${data.stepGoal}" required><label class="form-label" for="calorieGoal">Calories target (kcal)</label><input class="form-input" id="calorieGoal" type="number" min="500" max="10000" value="${data.calorieGoal}" required><label class="form-label" for="stepsToday">Steps today (manual entry)</label><input class="form-input" id="stepsToday" type="number" min="0" max="200000" value="${data.steps}" required><button class="primary-btn" style="margin-top:14px">Update Goals</button></form></div>`;}
function chatScreen(){return `<h1 class="page-title">Fitbot</h1><p class="subtitle">Your offline fitness assistant</p><div class="chat-wrap"><div class="chat-messages" id="chatMessages"></div><form class="chat-form" id="chatForm"><input id="chatInput" maxlength="300" placeholder="Ask a fitness question..." autocomplete="off" required><button aria-label="Send message">➤</button></form></div><p class="muted-note">Fitbot uses prepared offline responses and cannot diagnose illness or replace professional advice.</p>`;}
function renderChatMessages(){const box=document.getElementById("chatMessages");if(!box)return;let messages=data.chat;if(!messages.length)messages=[{role:"bot",text:"Hi! I'm Fitbot 🌟\\nAsk me about FitLife, healthy habits, workouts, water, sleep, or beginner fitness tips."}];box.innerHTML=messages.map(m=>`<div class="chat-bubble ${m.role==="user"?"user":"bot"}">${esc(m.text)}</div>`).join("");box.scrollTop=box.scrollHeight;}
function botReply(text){const t=text.toLowerCase();if(/hello|hi\\b|hey/.test(t))return "Hello! 😊 What would you like help with today?";if(/fitlife|app|how.*use/.test(t))return "Use the bottom menu to open Home, Diet, Fitness, Progress, or Profile. Your entries are saved locally in this browser on this device.";if(/water|drink|hydration/.test(t))return "A simple reminder: drink water regularly through the day. Your needs vary with weather, activity, and health. Tap “Add a glass of water” on Home to track a glass.";if(/sleep|rest/.test(t))return "Many adults do best with about 7–9 hours of sleep. Try a consistent bedtime and reduce screen use before sleeping.";if(/exercise|benefit|fitness|workout|muscle/.test(t))return "Regular physical activity can support heart health, strength, mood, and daily energy. Start gently, warm up, and increase difficulty gradually.";if(/weight|lose weight|gain weight/.test(t))return "Healthy weight goals depend on age, health, food, activity, and other factors. Focus on balanced meals, regular movement, sleep, and realistic goals rather than extreme diets.";if(/calorie|food|meal|diet|eat/.test(t))return "Try balanced meals with vegetables or fruit, protein foods, and suitable portions of grains or other energy foods. Calorie values in this demo are estimates.";if(/push.?up|squat|plank/.test(t))return "Use controlled movement and good form, and choose an easier variation if needed. Stop if you feel pain or dizziness. Check the Fitness section for beginner exercise tips.";if(/stress|motivation|lazy/.test(t))return "Start with a tiny goal you can repeat, such as a 5-minute walk. Consistency matters more than doing everything at once.";if(/pain|injury|sick|medical|diagnos/.test(t))return "I can't diagnose symptoms. Stop the activity if you feel pain or unwell, and contact a qualified healthcare professional for advice. Seek urgent help for severe or sudden symptoms.";return "I can help with basic questions about FitLife, meals, water, sleep, calories, and beginner workouts. Try asking one of those topics."; }
function profileScreen(){return `<h1 class="page-title">Profile</h1><div class="profile-head"><div class="avatar">👤</div><div><strong style="font-size:16px">${esc(data.name)}</strong><p class="subtitle">Fitness & Healthy Living</p></div></div>
  ${menuItem("🎯","My Goals","Set your targets","progress")}${menuItem("🤖","Fitbot Chatbot","Ask general fitness questions","chat")}${menuItem("🍲","Saved Recipes","Your healthy meal ideas","recipes")}${menuItem("📋","Workout History",`${data.workoutHistory.length} completed session(s)`,"progress")}${menuItem("⚙️","Settings","App preferences and data","settings")}
  <div class="card"><p class="eyebrow">ABOUT FITLIFE</p><strong>FitLife: A Monitoring Application</strong><p class="muted-note">Offline front-end capstone prototype. Version 1.0. Data is stored locally on this device and is not synced between phones.</p></div>`;}
function settingsScreen(){return `<h1 class="page-title">Settings</h1><p class="subtitle">Manage your local FitLife data.</p><div class="card"><label class="form-label" for="profileName">Display name</label><input class="form-input" id="profileName" maxlength="30" value="${esc(data.name)}"><label class="form-label" for="sleepInput">Average sleep (hours)</label><input class="form-input" id="sleepInput" type="number" min="0" max="24" step=".5" value="${data.sleep}"><label class="form-label" for="caloriesInput">Calories eaten today (manual entry)</label><input class="form-input" id="caloriesInput" type="number" min="0" max="20000" value="${data.calories}"><button class="primary-btn" style="margin-top:15px" data-action="save-settings">Save Settings</button></div><div class="card"><h2 style="margin-top:0;font-size:15px">Local Data</h2><p class="muted-note">Your records are saved in this browser using local storage. Clearing browser data or changing devices may remove or not transfer your records.</p><button class="primary-btn danger-btn" data-action="reset-data">Reset All FitLife Data</button></div>`;}
function startWorkoutTimer(){if(workoutInterval)return;workoutRunning=true;workoutInterval=setInterval(()=>{workoutSeconds++;const el=document.getElementById("workoutTimer");if(el)el.textContent=formatTime(workoutSeconds);},1000);render();}
function stopWorkoutTimer(){if(workoutInterval){clearInterval(workoutInterval);workoutInterval=null;}workoutRunning=false;}
function addMeal(meal){data.completedMeals.push({...meal});data.calories+=meal.kcal;saveData();toast("Meal added to your food log");}
function handleAction(el){
  const action=el.dataset.action;
  if(action==="get-started"){const name=document.getElementById("welcomeName").value.trim();data.name=name||"User";data.onboarded=true;saveData();setScreen("home");toast("Welcome to FitLife!");}
  else if(action==="navigate"){if(el.dataset.screen==="workout"||el.dataset.screen==="exercises"){previousScreen="fitness";setScreen("workout");}else setScreen(el.dataset.screen);}
  else if(action==="water"){data.water=Math.min(99,data.water+1);saveData();render();toast("Water updated");}
  else if(action==="day"){selectedDay=Number(el.dataset.day);render();}
  else if(action==="log-meal"){addMeal(mealPlans[selectedDay][Number(el.dataset.index)]);render();}
  else if(action==="complete-meals"){toast("Nice work! Keep building healthy habits.");}
  else if(action==="remove-meal"){const i=Number(el.dataset.index);const removed=data.completedMeals.splice(i,1)[0];if(removed)data.calories=Math.max(0,data.calories-removed.kcal);saveData();render();toast("Meal removed");}
  else if(action==="recipe"){const recipes=[["Avocado Toast","Toast, avocado, egg (optional)","Mash avocado onto whole-grain toast. Add an egg if you like."],["Simple Garden Salad","Lettuce, tomato, cucumber","Wash and chop vegetables. Mix together and add your preferred dressing."],["Banana Oat Bowl","Oats, banana, milk","Cook oats with milk or water. Add sliced banana and a few nuts."],["Vegetable Soup","Mixed vegetables, broth","Simmer chopped vegetables in broth until tender. Season to taste."]];const r=recipes[Number(el.dataset.index)];alert(`${r[0]}\\n\\nIngredients: ${r[1]}\\n\\nInstructions: ${r[2]}`);}
  else if(action==="workout-type"){selectedWorkoutType=el.dataset.type;render();}
  else if(action==="check-exercise"){data.workoutChecked=data.workoutChecked||[];const i=Number(el.dataset.index);data.workoutChecked=data.workoutChecked.includes(i)?data.workoutChecked.filter(n=>n!==i):[...data.workoutChecked,i];saveData();render();}
  else if(action==="start-workout"){workoutSeconds=0;workoutExerciseIndex=0;startWorkoutTimer();}
  else if(action==="pause-workout"){stopWorkoutTimer();render();toast("Workout paused");}
  else if(action==="next-exercise"){workoutExerciseIndex=(workoutExerciseIndex+1)%exercises.length;render();}
  else if(action==="finish-workout"){stopWorkoutTimer();data.workoutHistory.push({date:new Date().toISOString(),seconds:workoutSeconds,type:selectedWorkoutType});data.steps=Math.min(200000,data.steps+500);saveData();setScreen("fitness");toast("Workout saved! Great job.");}
  else if(action==="save-settings"){const name=document.getElementById("profileName").value.trim();const sleep=Number(document.getElementById("sleepInput").value);const calories=Number(document.getElementById("caloriesInput").value);if(!Number.isFinite(sleep)||sleep<0||sleep>24||!Number.isFinite(calories)||calories<0){toast("Please check the values");return;}data.name=name||"User";data.sleep=sleep;data.calories=calories;saveData();render();toast("Settings saved");}
  else if(action==="reset-data"){if(confirm("Reset all FitLife data on this device? This cannot be undone.")){stopWorkoutTimer();localStorage.removeItem(STORE_KEY);data={...defaultData};currentScreen="welcome";saveData();render();toast("Data reset");}}
}
document.addEventListener("click",e=>{const actionEl=e.target.closest("[data-action]");if(actionEl)handleAction(actionEl);});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>setScreen(btn.dataset.screen)));
document.getElementById("backBtn").addEventListener("click",goBack);
document.getElementById("settingsBtn").addEventListener("click",()=>{previousScreen=currentScreen;setScreen("settings");});
document.addEventListener("submit",e=>{
  if(e.target.id==="weightForm"){e.preventDefault();const w=Number(document.getElementById("weightInput").value);if(w>0&&w<501){data.weight=w;data.weightHistory.push(w);if(data.weightHistory.length>12)data.weightHistory.shift();saveData();render();toast("Weight saved");}}
  if(e.target.id==="goalsForm"){e.preventDefault();const sg=Number(document.getElementById("stepsGoal").value),cg=Number(document.getElementById("calorieGoal").value),st=Number(document.getElementById("stepsToday").value);if(sg>0&&cg>0&&st>=0){data.stepGoal=sg;data.calorieGoal=cg;data.steps=st;saveData();render();toast("Goals updated");}}
  if(e.target.id==="chatForm"){e.preventDefault();const input=document.getElementById("chatInput");const message=input.value.trim();if(!message)return;data.chat.push({role:"user",text:message});data.chat.push({role:"bot",text:botReply(message)});if(data.chat.length>60)data.chat=data.chat.slice(-60);saveData();renderChatMessages();input.value="";}
});
render();
