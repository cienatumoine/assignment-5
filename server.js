const express = require('express');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ------------------ LOGGING MIDDLEWARE ------------------
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${req.method} ${req.originalUrl}`;

  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`${base} body=`, req.body);
  } else {
    console.log(base);
  }

  next();
});

// ------------------ SAMPLE DATA ------------------
let nextId = 3;
let menu = [
  {
    id: 1,
    name: "Classic Burger",
    description: "Beef patty with lettuce, tomato, cheese, sesame bun",
    price: 12.99,
    category: "entree",
    ingredients: ["beef", "lettuce", "tomato", "cheese", "bun"],
    available: true
  },
  {
    id: 2,
    name: "Chocolate Lava Cake",
    description: "Warm cake with molten center + vanilla ice cream",
    price: 7.5,
    category: "dessert",
    ingredients: ["flour", "cocoa", "eggs", "sugar", "butter"],
    available: true
  }
];

// ------------------ VALIDATION ------------------
const menuValidators = [
  body('name')
    .exists({ checkFalsy: true }).withMessage('name required')
    .isString().withMessage('name must be a string')
    .isLength({ min: 3 }).withMessage('name min 3 chars'),

  body('description')
    .exists({ checkFalsy: true }).withMessage('description required')
    .isString().withMessage('description must be a string')
    .isLength({ min: 10 }).withMessage('description min 10 chars'),

  body('price')
    .exists().withMessage('price required')
    .isFloat({ gt: 0 }).withMessage('price must be number > 0')
    .toFloat(),

  body('category')
    .exists({ checkFalsy: true }).withMessage('category required')
    .isString().withMessage('category must be string')
    .isIn(['appetizer', 'entree', 'dessert', 'beverage']).withMessage('category must be appetizer, entree, dessert or beverage'),

  body('ingredients')
    .exists().withMessage('ingredients required')
    .isArray({ min: 1 }).withMessage('ingredients must be array with at least 1 item'),

  body('available')
    .optional()
    .isBoolean().withMessage('available must be boolean')
    .toBoolean()
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// ------------------ CRUD ROUTES ------------------

// GET all
app.get('/api/menu', (req, res) => {
  res.status(200).json(menu);
});

// GET by id
app.get('/api/menu/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = menu.find(m => m.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  res.status(200).json(item);
});

// POST create
app.post('/api/menu', menuValidators, handleValidation, (req, res) => {
  const { name, description, price, category, ingredients, available } = req.body;

  const newItem = {
    id: nextId++,
    name: name.trim(),
    description: description.trim(),
    price,
    category,
    ingredients,
    available: typeof available === 'boolean' ? available : true
  };

  menu.push(newItem);
  res.status(201).json(newItem);
});

// PUT update
app.put('/api/menu/:id', menuValidators, handleValidation, (req, res) => {
  const id = Number(req.params.id);
  const idx = menu.findIndex(m => m.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  const { name, description, price, category, ingredients, available } = req.body;

  const updated = {
    ...menu[idx],
    name: name.trim(),
    description: description.trim(),
    price,
    category,
    ingredients,
    available: typeof available === 'boolean' ? available : menu[idx].available
  };

  menu[idx] = updated;
  res.status(200).json(updated);
});

// DELETE
app.delete('/api/menu/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = menu.findIndex(m => m.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  const deleted = menu.splice(idx, 1)[0];
  res.status(200).json(deleted);
});

// 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* Published API Link */
/* https://documenter.getpostman.com/view/48299445/2sBXcEm1Ev*/