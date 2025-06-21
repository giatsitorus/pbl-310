const express = require('express');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const controller = require('./config/controller');

const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static('public'));

// ✅ Middleware urutan benar:
app.use(express.urlencoded({ extended: true })); // ← HARUS sebelum routes

app.use(session({
    secret: 'pbl-hole-detect', 
    resave: false,
    saveUninitialized: false,
}));

app.use(flash());

// Route controller
app.use(controller);

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

// const options = {
//     key: fs.readFileSync('/opt/hole-detect-server/localhost-key.pem'),
//     cert: fs.readFileSync('/opt/hole-detect-server/localhost.pem')
// };

app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page'});
});

app.get('/login', (req, res) => {
    const error = req.flash('error');
    const email = req.flash('email');
    const email_error = req.flash('email_error');
    res.render('login', { 
        title: 'Login Page',
        error: error,
        email_error: email_error,
        email: email.length > 0 ? email[0] : ''
    });
});

app.get('/register', (req, res) => {
    const error = req.flash('error');
    const email = req.flash('email');
    const name = req.flash('name');
    const phone = req.flash('phone');
    const password = req.flash('password');
    const confirm_password = req.flash('confirm_password');
    res.render('register', { 
        title: 'Register Page',
        email: email.length > 0 ? email[0] : '',
        name: name.length > 0 ? name[0] : '',
        phone: phone.length > 0 ? phone[0] : '',
        password: password.length > 0 ? password[0] : '',
        confirm_password: confirm_password.length > 0 ? confirm_password[0] : '',
        error: error,
    });
});

app.get('/tracking-history', isAuthenticated, (req, res) => {
    res.render('tracking_history', { 
        title: 'History Page',
    });
});

app.get('/report', isAuthenticated, (req, res) => {
    res.render('report', { 
        title: 'Report Page',
    });
});

app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { 
        title: 'Profile Page',
    });
});

app.get('/forget-passowrd', isAuthenticated, (req, res) => {
    res.render('forgetpassword', { 
        title: 'Forget Password Page',
    });
});

app.get('/tracking', isAuthenticated, (req, res) => {
    res.render('tracking', { title: 'Tracking Detail'});
});

app.get('/tracking/:id', isAuthenticated, (req, res) => {
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
// https.createServer(options, app).listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
