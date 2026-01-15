const express = require('express');
const router = express.Router();

// Redirect all motorcycle routes to bikes
router.get('/', (req, res) => {
    res.redirect('/bikes');
});

router.get('/:id', (req, res) => {
    res.redirect(`/bikes/${req.params.id}`);
});

router.get('/new', (req, res) => {
    res.redirect('/bikes/new');
});

module.exports = router; 