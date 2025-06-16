const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page'});
});

app.get('/tracking', (req, res) => {
    res.render('tracking', { title: 'Tracking Detail'});
});

app.get('/tracking/:id', (req, res) => {
    const trackingId = req.params.id;
    res.render('tracking-detail', { 
        title: 'Tracking Detail', 
        id: trackingId,
        lat1: 1.057290,
        lon1: 103.919494,
        lat2: 1.059859,
        lon2: 103.922266
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));