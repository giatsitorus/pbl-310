const express = require('express');
const conn = require('./db');
const router = express.Router();
const bcrypt = require('bcrypt');

router.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        const queryStr = "SELECT * FROM user WHERE email = ?";
        conn.query(queryStr, [username], (err, results) => {
        if (err) {
            console.log(err);
            req.flash('error', 'Internal Server Error');
            req.flash('email', username);
            return res.redirect('/login');
        }
        if (results.length === 0) {
            req.flash('email_error', 'Pengguna tidak ditemukan');
            req.flash('email', username);
            return res.redirect('/login');
        }

        const user = results[0];
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Internal Server Error');
                req.flash('email', username);
                return res.redirect('/login');
            }
            if (!isMatch) {
                req.flash('error', 'Kata sandi salah');
                req.flash('email', username);
                return res.redirect('/login');
            }
            
            req.session.user = { username };
            return res.redirect('/');
        });
        
        });
    } else {
        req.flash('error', 'Username atau password salah.');
        req.flash('email', username);
        return res.redirect('/login');
    }

});

router.post('/api/register', function(req, res) {
    const { name, email, phone, password, confirm_password } = req.body;
    const role = 'user';
    const status = 'active';

    if (password != confirm_password){
        req.flash('error', 'Password tidak cocok');
        req.flash('name', name);
        req.flash('email', email);
        req.flash('phone', phone);
        req.flash('password', password);
        req.flash('confirm_password', confirm_password);
        return res.redirect('/register');
    }


    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            req.flash('internal_error', 'Internal Server Error');
            return res.redirect('/register');
        }

        const queryStr = "INSERT INTO user (nama, email, password, role, status) VALUES (?, ?, ?, ?, ?)";
        const values = [name, email, hashedPassword, role, status];

        conn.query(queryStr, values, (err, results) => {
            if (err) {
                console.log(err)
                req.flash('internal_error', 'Gagal mendaftar pengguna.');
                return res.redirect('/register');
            }
            req.session.user = { name };
            return res.redirect('/');
        });
    });
});

router.get('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;