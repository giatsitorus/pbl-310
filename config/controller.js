const express = require('express');
const conn = require('./db');
const router = express.Router();
const bcrypt = require('bcrypt');

router.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        const queryStr = "SELECT * FROM user WHERE email = ? and status = 'active'";
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
            
            req.session.user = user;
            console.log("cek here");
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

        const queryStr = "INSERT INTO user (nama, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [name, email, phone, hashedPassword, role, status];

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

// router.post('/api/add-detection', function(req, res) {
//     const user = req.session.user;
//     const { hole_count, coordinates, distance, start_location, end_location, list_images } = req.body;

//     conn.beginTransaction(err => {
//         if (err) return res.status(500).json({ error: 'Transaction start failed' });

//         const detectionQuery = "INSERT INTO detections (user_id, hole_count, distance, start_location, end_location) VALUES (?, ?, ?, ?, ?)";
//         const detectionValues = [user.user_id, hole_count, distance, start_location, end_location];

//         conn.query(detectionQuery, detectionValues, (err, result) => {
//             if (err) {
//                 return conn.rollback(() => {
//                     console.error('Insert detection failed:', err);
//                     res.status(500).json({ error: 'Insert detection failed' });
//                 });
//             }

//             const detectionId = result.insertId;

//             const historyValues = coordinates.map((coord, index) => [detectionId, index + 1, coord.lat, coord.lon]);
//             const historyQuery = "INSERT INTO detectionshistory (detections_id, sequence, latitude, longitude) VALUES ?";

//             conn.query(historyQuery, [historyValues], (err, result) => {
//                 if (err) {
//                     return conn.rollback(() => {
//                         console.error('Insert detection history failed:', err);
//                         res.status(500).json({ error: 'Insert detection history failed' });
//                     });
//                 }

//                 conn.commit(err => {
//                     if (err) {
//                         return conn.rollback(() => {
//                             console.error('Commit failed:', err);
//                             res.status(500).json({ error: 'Commit failed' });
//                         });
//                     }

//                     res.status(200).json({ message: 'Detection saved successfully' });
//                 });
//             });
//         });
//     });
// });

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
    const { detectionId, status, sort} = req.body;
    console.log(req.body);
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
        if (status != 'semua'){
            queryStr += ' WHERE d.status = ?';
            values.push(status);
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