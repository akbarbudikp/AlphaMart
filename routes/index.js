const express = require('express');
const Controller = require('../controllers');
const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    const error = 'Please login first to access this page.';
    res.redirect(`/login?error=${error}`);
  } else {
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.role !== 'Admin') {
    const error = 'You are not authorized to access this page.';
    return res.redirect(`/products?error=${error}`);
  }
  next();
};

router.get('/', Controller.home)

router.get('/register', Controller.registerForm)
router.post('/register', Controller.register)

router.get('/login', Controller.loginForm)
router.post('/login', Controller.login)

router.get('/profile', isLoggedIn, Controller.profile);
router.post('/profile/edit', isLoggedIn, Controller.editProfile);

router.get('/logout', isLoggedIn, Controller.logout)

router.get('/products', isLoggedIn, Controller.products)
router.get('/products/add', isLoggedIn, isAdmin, Controller.addProductForm)
router.post('/products/add', isLoggedIn, isAdmin, Controller.addProduct)
router.get('/products/edit/:id', isLoggedIn, isAdmin, Controller.editProductForm)
router.post('/products/edit/:id', isLoggedIn, isAdmin, Controller.editProduct)
router.get('/products/delete/:id', isLoggedIn, isAdmin, Controller.delete)

router.get('/cart', isLoggedIn, Controller.cart)
router.post('/cart/add/:productId', isLoggedIn, Controller.addCart)
router.post('/cart/delete/:productId', isLoggedIn, Controller.incrementCart)
router.post('/cart/decrease/:productId', isLoggedIn, Controller.decreaseCart)

router.post('/checkout', isLoggedIn, Controller.checkout);

router.get('/transactions', isLoggedIn, Controller.transactions);
module.exports = router