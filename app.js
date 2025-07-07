const express = require('express');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const controller = require('./config/controller');
const conn = require('./config/db');
const fs = require('fs');
const https = require('https');

const app = express();

const dbOptions = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Password123!',
    database: 'pbl_310',
};
  
const sessionStore = new MySQLStore(dbOptions);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(session({
    key: 'session_cookie_name',
    secret: 'pbl-hole-detect',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }
  }));

app.use(flash());

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});
// Route controller
app.use(controller);

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

function nocache(req, res, next) {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
}
const options = {
    key: fs.readFileSync('/opt/hole-detect-server/localhost-key.pem'),
    cert: fs.readFileSync('/opt/hole-detect-server/localhost.pem')
};

app.get('/', nocache, (req, res) => {
    const user = req.session.user;
    res.render('index', { title: 'Home Page', user: user});
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

app.get('/tracking-history', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    res.render('tracking_history', { 
        title: 'History Page',
        user: user
    });
});

app.get('/tracking-history/:id', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    const trackingId = req.params.id;
    const detectionQuery = "SELECT d.*, u.nama AS user_name FROM detections AS d LEFT JOIN user AS u ON d.user_id = u.user_id WHERE d.detections_id = ?";
    conn.query(detectionQuery, [trackingId], (err, detectionResult) => {
        if (err || detectionResult.length === 0) {
            return res.status(404).send("Data tidak ditemukan");
        }

        const detection = detectionResult[0];

        const historyQuery = "SELECT * FROM detectionshistory WHERE detections_id = ? ORDER BY sequence ASC";
        conn.query(historyQuery, [trackingId], (err, historyResult) => {
            if (err) {
                return res.status(500).send("Gagal ambil history");
            }
            const coordinates = historyResult.map(item => [item.latitude, item.longitude]);

            const imageQuery = "SELECT * FROM detections_image WHERE detection_id = ?";
            conn.query(imageQuery, [trackingId], (err, imageResult) => {
                if (err) {
                    return res.status(500).send("Gagal ambil gambar");
                }

                res.render('tracking_detail', {
                    title: 'Tracking Detail',
                    user,
                    detection,
                    detectionHistory: coordinates,
                    detectionImages: imageResult
                });
            });
        });
    });
});

app.get('/report', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    res.render('report', { 
        title: 'Report Page',
        user: user
    });
});

app.get('/profile', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    res.render('profile', { 
        title: 'Profile Page',
        user: user,
    });
});

app.get('/forget-passowrd', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    res.render('forgetpassword', { 
        title: 'Forget Password Page',
        user: user
    });
});

app.get('/scan', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    res.render('scan', { title: 'Tracking Detail', user: user});
});

app.get('/manage-user', isAuthenticated, nocache, (req, res) => {
    const user = req.session.user;
    let list_users = [];
    const queryStr = "SELECT * FROM user";
        conn.query(queryStr, [], (err, results) => {
        list_users = results;
        res.render('user', { title: 'Manage Users', user: user, list_users: list_users});
    });
});

const PORT = process.env.PORT || 3000;
// https.createServer(options, app).listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
