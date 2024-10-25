const express = require("express");
const bcrypt = require("bcryptjs");
const { User, DataDiri } = require("../models"); // Adjust path if needed
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
  const errorMessage = req.flash("error");
  res.render("login", { title: "Log In", errorMessage });
});

router.get("/register", (req, res) => {
  const errorMessage = req.flash("error");
  res.render("register", { title: "Register", errorMessage });
});

router.post("/register", async (req, res) => {
  const {
    email,
    password,
    confirmPassword,
    name,
    age,
    gender,
    occupation,
    origin,
  } = req.body;

  // Validasi input
  if (!email || !password || !confirmPassword || !name || !age || !gender) {
    return res.status(400).render("register", {
      error: "All fields are required except occupation and origin.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).render("register", {
      error: "Passwords do not match.",
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).render("register", {
        error: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna baru beserta data profil
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "user",
    });

    const userId = newUser.id;

    await DataDiri.create({
      id_user: userId,
      nama: name,
      umur: age,
      jenis_kelamin: gender,
      pekerjaan: occupation,
      asal: origin,
    });

    res.redirect("/auth/login");
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).render("register", {
      error: "Internal Server Error",
    });
  }
});

// Handle login post request
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validasi input
    if (!email || !password) {
      req.flash("error", "Email dan password harus diisi.");
      return res.redirect("/auth/login");
    }

    // Cari pengguna berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash("error", "Username atau Password Salah");
      return res.redirect("/auth/login");
    }

    // Bandingkan password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      req.flash("error", "Username atau Password Salah");
      return res.redirect("/auth/login");
    }

    // Simpan ID pengguna dalam sesi
    req.session.userId = user.id;
    // Arahkan berdasarkan role
    if (user.role === "admin") {
      return res.redirect("/admin/dashboard"); // Halaman untuk admin
    } else if (user.role === "user") {
      return res.redirect("/"); // Halaman untuk user
    }

    // Jika role tidak diketahui, berikan pesan error
    req.flash("error", "Role tidak valid.");
    return res.redirect("/auth/login");
  } catch (err) {
    console.error(err); // Log error ke console untuk debugging
    req.flash("error", "Terjadi kesalahan pada server.");
    return res.redirect("/auth/login");
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/dashboard");
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
});

module.exports = router;
