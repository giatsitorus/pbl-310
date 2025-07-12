const express = require('express');
const conn = require('./db');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = 'PBL_310';
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'giat3003@gmail.com',
        pass: 'syzpnndgwcdlpsdr'
    }
});

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
        if (user.status != 'active'){
            req.flash('email_error', 'Status pengguna tidak aktif');
            req.flash('email', username);
            return res.redirect('/login');
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Internal Server Error');
                req.flash('email', username);
                return res.redirect('/login');
            }
            if (!isMatch) {
                req.flash('error', 'Kata sandi salah');
                console.log("getting here  :" + username);
                req.flash('email', username);
                return res.redirect('/login');
            }
            
            req.session.user = user;
            console.log(req.session.user);
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
    const status = 'inactive';

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

        const queryStr = "INSERT INTO user (nama, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [name, email, phone, hashedPassword, role, status];

        conn.query(queryStr, values, (err, results) => {
            if (err) {
                console.log(err)
                req.flash('internal_error', 'Gagal mendaftar pengguna.');
                return res.redirect('/register');
            }

            const token = jwt.sign(
                { email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            const activationLink = `http://192.168.1.15:3000/activate/${token}`;
            const mailOptions = {
                from: 'Hole Vision <giat3003@gmail.com>',
                to: email,
                subject: 'Aktivasi Akun Hole Vision',
                html: `
                    <p>Hai!</p>
                    <p>Silakan klik link di bawah ini untuk mengaktifkan akun kamu:</p>
                    <a href="${activationLink}">Klik disini</a>
                    <p>Link berlaku selama 24 jam.</p>
                `
            };
    
            transporter.sendMail(mailOptions, (err2, info) => {
                if (err2) {
                    console.log(err2);
                    req.flash('success', 'Gagal mengirim email aktivasi.');
                }
                req.flash('success', 'Registrasi berhasil! Cek email kamu untuk aktivasi akun.');
                return res.redirect('/login');
            });
        });
    });
});

router.post('/api/change-password', function(req, res) {
    console.log(req.body);
    console.log(req.session.user);
    
    const user = req.session.user;
    
    const { password, new_password, confirm_new_password } = req.body;
    
    if (new_password != confirm_new_password) {
        console.log("masuk kesini");
        console.log(new_password);
        console.log(confirm_new_password);
        return res.status(200).json({
            "success": false,
            "field": 'confirm_new_password',
            "message": 'Password baru dan konfirmasi tidak cocok',
        });
    }

    const queryStr = "SELECT * FROM user WHERE user_id = ?";
    conn.query(queryStr, [user.user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                "success": false,
                "message": "Internal Server Error (Database Query Error)",
            });
        }

        const dbUser = results[0];
        
        bcrypt.compare(password, dbUser.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({
                    "success": false,
                    "message": "Internal Server Error (Hashing Error)",
                });
            }
            if (!isMatch) {
                return res.status(200).json({
                    "success": false,
                    "field": 'password',
                    "message": "Kata sandi lama tidak cocok",
                });
            }

            bcrypt.hash(new_password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({
                        "success": false,
                        "message": "Internal Server Error (Hashing Error)",
                    });
                }

                const updateQuery = "UPDATE user SET password = ? WHERE user_id = ?";
                const values = [hashedPassword, dbUser.user_id];
                
                conn.query(updateQuery, values, (err, results) => {
                    if (err) {
                        return res.status(500).json({
                            "success": false,
                            "message": "Internal Server Error (Database Update Error)",
                        });
                    }
                    
                    return res.status(200).json({
                        "success": true,
                        "message": "Berhasil mengubah password",
                    });
                });
            });
        });
    });
});

router.post('/api/send-reset-password', (req, res) => {
    const { email } = req.body;

    if (email) {
        const queryStr = "SELECT * FROM user WHERE email = ? ";
        conn.query(queryStr, [email], (err, results) => {
            if (err) {
                console.log(err);
                req.flash('error', 'Internal Server Error');
                return res.redirect('/forget-password');
            }
            if (results.length === 0) {
                req.flash('error', 'Pengguna tidak ditemukan');
                return res.redirect('/forget-password');
            }

            const user = results[0];
            const payload = {
                user: user,
                exp: Math.floor(Date.now() / 1000) + (60 * 60)
            };
            const token = jwt.sign(payload, JWT_SECRET);
    
            const resetLink = `http://192.168.1.15:3000/reset-password/${token}`;
            const mailOptions = {
                from: 'Hole Vision <giat3003@gmail.com>',
                to: email,
                subject: 'Reset Password Hole Vision',
                html: `
                    <p>Halo,</p>
                    <p>Klik link di bawah ini untuk mereset password kamu. Link ini berlaku selama 5 menit:</p>
                    <a href="${resetLink}">Reset Password</a>
                    <p>Jika kamu tidak meminta reset, abaikan saja email ini.</p>
                `
            };
            
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log('Gagal kirim email:', err);
                    req.flash('error', 'Gagal mengirim email reset');
                    return res.redirect('/forget-password');
                } else {
                    console.log('Email terkirim:', info.response);
                    req.flash('success', `Link reset password telah dikirim ke email ${email}`);
                    return res.redirect('/forget-password');
                }
            });
        });
    } else {
        req.flash('error', 'Pengguna tidak ditemukan');
        return res.redirect('/forget-password');
    }

});

router.post('/api/public/change-password', function(req, res) {
    const { email, password, confirm_password, token } = req.body;
    if (password != confirm_password) {
        req.flash('error', 'Password tidak cocok');
        req.flash('password', password);
        req.flash('confirm_password', confirm_password);
        return res.redirect(`/reset-password/${token}`);
    }
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            req.flash('error', 'Internal Server Error');
            req.flash('password', password);
            req.flash('confirm_password', confirm_password);
            return res.redirect(`/reset-password/${token}`);
        }

        const queryStr = "UPDATE user SET password = ? WHERE email = ?";
        const values = [hashedPassword, email];

        conn.query(queryStr, values, (err, results) => {
            if (err) {
                console.log(err)
                req.flash('error', 'Gagal mendaftar pengguna.');
                req.flash('password', password);
                req.flash('confirm_password', confirm_password);
                return res.redirect(`/reset-password/${token}`);
            }

            req.flash('success', 'Berhasil mengubah kata sandi');
            return res.redirect('/login');
        });
    });
});

router.post('/api/update-profile', function(req, res) {
    const user = req.session.user;
    const { name, email, phone, password } = req.body;

    const queryStr = "SELECT * FROM user WHERE user_id = ?";
    conn.query(queryStr, [user.user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                "success": false,
                "message": "Internal Server Error (Database Query Error)",
            });
        }

        const dbUser = results[0];
        
        bcrypt.compare(password, dbUser.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({
                    "success": false,
                    "message": "Internal Server Error (Hashing Error)",
                });
            }
            if (!isMatch) {
                return res.status(200).json({
                    "success": false,
                    "field": 'password',
                    "message": "Kata sandi tidak cocok",
                });
            }

            const updateQuery = "UPDATE user SET nama = ?, email = ?, phone = ? WHERE user_id = ?";
            const values = [name, email, phone, dbUser.user_id];
            
            conn.query(updateQuery, values, (err, results) => {
                if (err) {
                    return res.status(500).json({
                        "success": false,
                        "message": "Internal Server Error (Database Update Error)",
                    });
                }

                const queryStr = "SELECT * FROM user WHERE user_id = ?";
                conn.query(queryStr, [user.user_id], (err, results) => {
                    const userUpdated = results[0];
                    req.session.user = userUpdated;

                    console.log(req.session.user);

                    return res.status(200).json({
                        "success": true,
                        "message": "Berhasil mengubah data",
                    });
                });
                
                
            });

            
        });
    });
});

router.post('/api/add-detection', function(req, res) {
    const user = req.session.user;
    const { hole_count, coordinates, distance, start_location, end_location, list_images } = req.body;

    conn.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Transaction start failed' });

        const detectionQuery = `
            INSERT INTO detections (user_id, hole_count, distance, start_location, end_location)
            VALUES (?, ?, ?, ?, ?)`;
        const detectionValues = [user.user_id, hole_count, distance, start_location, end_location];

        conn.query(detectionQuery, detectionValues, (err, result) => {
            if (err) {
                return conn.rollback(() => {
                    console.error('Insert detection failed:', err);
                    res.status(500).json({ error: 'Insert detection failed' });
                });
            }

            const detectionId = result.insertId;

            // INSERT HISTORY
            const historyValues = coordinates.map((coord, index) => [
                detectionId,
                index + 1,
                coord.lat,
                coord.lon
            ]);
            const historyQuery = `
                INSERT INTO detectionshistory (detections_id, sequence, latitude, longitude)
                VALUES ?`;

            conn.query(historyQuery, [historyValues], (err) => {
                if (err) {
                    return conn.rollback(() => {
                        console.error('Insert detection history failed:', err);
                        res.status(500).json({ error: 'Insert detection history failed' });
                    });
                }

                if (Array.isArray(list_images) && list_images.length > 0) {
                    const imageValues = list_images.map((imgPath, index) => [
                        detectionId,
                        imgPath
                    ]);
                    const imageQuery = `
                        INSERT INTO detections_image (detection_id, image_path)
                        VALUES ?`;

                    conn.query(imageQuery, [imageValues], (err) => {
                        if (err) {
                            return conn.rollback(() => {
                                console.error('Insert detection images failed:', err);
                                res.status(500).json({ error: 'Insert detection images failed' });
                            });
                        }

                        conn.commit(err => {
                            if (err) {
                                return conn.rollback(() => {
                                    console.error('Commit failed:', err);
                                    res.status(500).json({ error: 'Commit failed' });
                                });
                            }

                            res.status(200).json({ message: 'Detection & images saved successfully' });
                        });
                    });
                } else {
                    conn.commit(err => {
                        if (err) {
                            return conn.rollback(() => {
                                console.error('Commit failed:', err);
                                res.status(500).json({ error: 'Commit failed' });
                            });
                        }

                        res.status(200).json({ message: 'Detection saved successfully (no images)' });
                    });
                }
            });
        });
    });
});


router.post('/api/add-user', function(req, res) {
    const { name, email, phone, password, role, status } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({
                "success": false,
                "message": "Internal Server Error (Database Query Error)",
            });
        }

        const queryStr = "INSERT INTO user (nama, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [name, email, phone, hashedPassword, role, status];

        conn.query(queryStr, values, (err, results) => {
            if (err) {
                return res.status(500).json({
                    "success": false,
                    "message": "Internal Server Error (Database Query Error)",
                });
            }
            return res.status(200).json({
                "success": true,
                "message": "Berhasil menambah user",
            });
        });
    });
});

router.post('/api/update-status', function(req, res) {
    const { user_id, status } = req.body;
    const updateQuery = "UPDATE user SET status = ? WHERE user_id = ?";
    const values = [status, user_id];
    
    conn.query(updateQuery, values, (err, results) => {
        if (err) {
            return res.status(500).json({
                "success": false,
                "message": "Internal Server Error (Database Update Error)",
            });
        }
        return res.status(200).json({
            "success": true,
            "message": "Berhasil mengubah data",
        });
    });
});

router.post('/api/update-role', function(req, res) {
    const { user_id, role } = req.body;
    const updateQuery = "UPDATE user SET role = ? WHERE user_id = ?";
    const values = [role, user_id];
    
    conn.query(updateQuery, values, (err, results) => {
        if (err) {
            return res.status(500).json({
                "success": false,
                "message": "Internal Server Error (Database Update Error)",
            });
        }
        return res.status(200).json({
            "success": true,
            "message": "Berhasil mengubah data",
        });
    });
});


router.post('/api/get/tracking', async (req, res) => {
    const user = req.session.user;
    const { detectionId, status, sort, search } = req.body;
    if (detectionId){
        const queryStr = "SELECT * FROM detections WHERE detections_id = ?";
        conn.query(queryStr, [get], (err, results) => {
            if (err) {
                return res.status(500).json({
                    "success": false,
                    "message": "Internal Server Error (Database Query Error)",
                });
            }
            return res.status(200).json({
                "success": true,
                "results" : results,
            });
        });

    }else{
        let queryStr = "SELECT d.*, u.nama AS user_name FROM detections AS d LEFT JOIN user AS u ON d.user_id = u.user_id";
        let values = []
        let conditions = [];
        if (status != 'semua') {
            conditions.push("d.status = ?");
            values.push(status);
        }

        if (search != '') {
            conditions.push("(LOWER(d.start_location) LIKE ? OR LOWER(d.end_location) LIKE ? OR LOWER(u.nama) LIKE ?)");
            const searchValue = `%${search}%`;
            values.push(searchValue, searchValue, searchValue);
        }

        if (user.role == 'user'){
            conditions.push("d.user_id = ?");
            values.push(user.user_id);
        }

        if (conditions.length > 0) {
            queryStr += ' WHERE ' + conditions.join(' AND ');
        }
        
        if (sort == 'terbaru'){
            queryStr += ' ORDER BY d.created_at DESC';
        }else if (sort == 'terlama'){
            queryStr += ' ORDER BY d.created_at ASC';
        }
        conn.query(queryStr, values, (err, results) => {
            if (err) {
                console.log(err)
                return res.status(500).json({
                    "success": false,
                    "message": "Internal Server Error (Database Query Error)",
                });
            }
            return res.status(200).json({
                "success": true,
                "results" : results,
            });
        });
    }
    
});

router.post('/api/update/tracking', async (req, res) => {
    const { detectionId, status, reason } = req.body;
    console.log(req.body);
    const updateQuery = "UPDATE detections SET status = ?, decline_reason = ? WHERE detections_id = ?";
    const values = [status, reason, detectionId];
    
    conn.query(updateQuery, values, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                "success": false,
                "message": "Internal Server Error (Database Update Error)",
            });
        }
        return res.status(200).json({
            "success": true,
            "message": "Berhasil mengubah data",
        });
    });
});

router.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/profile');
        }
        res.clearCookie('session_cookie_name');
        res.redirect('/');
    });
});

router.get('/api/reverse-geocode', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).send('Missing lat or lon');
  
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: {
          'User-Agent': 'MyApp/1.0 (email@domain.com)'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reverse geocode' });
    }
});

module.exports = router;