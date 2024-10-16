const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models'); // Adjust path if needed
const router = express.Router();

// async function createUser(email, plainPassword) {
//   const hashedPassword = await bcrypt.hash(plainPassword, 10);
//   await User.create({
//     email,
//     password: hashedPassword,
//   });
// }


// router.get("/create-user", (req, res) => {
    
// createUser('admin@desa.com', 'yakinmenang');
//     res.send('sukses');
//   });

// Login page
router.get("/login", (req, res) => {
    const errorMessage = req.flash('error');
    res.render('login', { title: "Log In", errorMessage });
});

// Handle login post request
// Handle login post request
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Validasi input
      if (!email || !password) {
        req.flash('error', 'Email dan password harus diisi.');
        return res.redirect('/auth/login');
      }
  
      // Cari pengguna berdasarkan email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        req.flash('error', 'Username atau Password Salah');
        return res.redirect('/auth/login');
      }
  
      // Bandingkan password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        req.flash('error', 'Username atau Password Salah');
        return res.redirect('/auth/login');
      }
  
      // Simpan ID pengguna dalam sesi
      req.session.userId = user.id; 
      return res.redirect('/admin/dashboard'); // Arahkan ke halaman dashboard
  
    } catch (err) {
      console.error(err); // Log error ke console untuk debugging
      req.flash('error', 'Terjadi kesalahan pada server.');
      return res.redirect('/auth/login');
    }
  });
  
// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
