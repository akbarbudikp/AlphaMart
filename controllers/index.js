const { sendCheckoutEmail } = require("../helpers/mailer");
const {
  User,
  Product,
  Profile,
  Cart,
  CartItem,
  Transaction,
  sequelize,
} = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { formatCurrency } = require("../helpers/formatterRupiah");

class Controller {
  static async home(req, res) {
    try {
      res.render("home");
    } catch (error) {
      res.send(error);
    }
  }

  static async registerForm(req, res) {
    try {
      res.render("registerForm");
    } catch (error) {
      res.send(error);
    }
  }

  static async register(req, res) {
    try {
      const { email, password, role } = req.body;

      await User.create({ email, password, role });
      res.redirect("/login");
    } catch (error) {
      res.send(error);
      console.log(error);
    }
  }

  static async loginForm(req, res) {
    try {
      res.render("loginForm");
    } catch (error) {
      res.send(error);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.redirect("/login?error=Email and password are required");
      }

      const user = await User.findOne({
        where: {
          email: email,
        },
      });

      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.role = user.role;
        return res.redirect("/products");
      } else {
        req.flash("error", "Invalid email or password");
        return res.redirect("/login");
      }
    } catch (error) {
      res.send(error);
      console.log(error);
    }
  }

  static async profile(req, res) {
    try {
      const userId = req.session.userId;
      const user = await User.findByPk(userId, {
        include: Profile,
      });
      res.render("profile", { user });
    } catch (error) {
      res.send(error);
    }
  }

  static async editProfile(req, res) {
    try {
      const userId = req.session.userId;
      const { fullName, address, phoneNumber, profilePicture } = req.body;

      const [profile, created] = await Profile.findOrCreate({
        where: { UserId: userId },
        defaults: {
          fullName,
          address,
          phoneNumber,
          profilePicture,
          UserId: userId,
        },
      });

      if (!created) {
        await profile.update({
          fullName,
          address,
          phoneNumber,
          profilePicture,
        });
      }

      req.flash("success", "Profil berhasil diperbarui.");
      res.redirect("/profile");
    } catch (error) {
      res.send(error);
    }
  }

  static async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.redirect("/login");
        }
      });
    } catch (error) {
      res.send(error);
    }
  }

  static async products(req, res) {
    try {
      const { search } = req.query;

      const products = await Product.search(search);
      res.render("products", { products, formatCurrency });
    } catch (error) {
      res.send(error);
    }
  }

  static async addProductForm(req, res) {
    try {
      res.render("addProductForm");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async addProduct(req, res) {
    try {
      const { name, price, stock, imgUrl } = req.body;

      await Product.create({ name, price, stock, imgUrl });

      req.flash("success", "Produk baru berhasil ditambahkan!");
      res.redirect("/products");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async editProductForm(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);

      res.render("editProductForm", { product });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async editProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, price, stock, imgUrl } = req.body;

      await Product.update(
        { name, price, stock, imgUrl },
        {
          where: {
            id,
          },
        }
      );

      req.flash("success", "Produk berhasil diperbarui.");

      res.redirect("/products");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      Product.destroy({ where: { id } })
        .then(() => {
          req.flash("success", "Produk berhasil dihapus.");
          res.redirect("/products");
        })
        .catch((err) => {
          console.log(err);
          res.send(err);
        });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async cart(req, res) {
    try {
      const userId = req.session.userId;

      const cart = await Cart.findOne({
        where: { UserId: userId },
        include: Product,
      });

      res.render("cart", { cart, formatCurrency });
    } catch (error) {
      res.send(error);
    }
  }

  static async addCart(req, res) {
    const t = await sequelize.transaction();

    try {
      const userId = req.session.userId;
      const { productId } = req.params;

      const product = await Product.findByPk(productId, { transaction: t });

      if (!product) {
        await t.rollback();
        req.flash("error", "Produk tidak ditemukan.");
        return res.redirect("/products");
      }

      if (product.stock <= 0) {
        await t.rollback();
        req.flash("error", `Maaf, stok untuk ${product.name} sudah habis.`);
        return res.redirect("/products");
      }

      const [cart, created] = await Cart.findOrCreate({
        where: { UserId: userId },
        transaction: t,
      });

      const cartItem = await CartItem.findOne({
        where: {
          CartId: cart.id,
          ProductId: productId,
        },
        transaction: t,
      });

      product.stock--;

      if (cartItem) {
        cartItem.quantity++;
        await cartItem.save({ transaction: t });
      } else {
        await CartItem.create(
          {
            CartId: cart.id,
            ProductId: productId,
            quantity: 1,
          },
          { transaction: t }
        );
      }

      await product.save({ transaction: t });

      await t.commit();

      req.flash("success", "Item berhasil ditambahkan ke keranjang.");

      res.redirect("/cart");
    } catch (error) {
      await t.rollback();
      res.send(error);
    }
  }

  static async incrementCart(req, res) {
    const t = await sequelize.transaction();

    try {
      const userId = req.session.userId;
      const { productId } = req.params;

      const cart = await Cart.findOne({
        where: { UserId: userId },
        transaction: t,
      });

      if (!cart) {
        await t.rollback();
        req.flash("error", "Keranjang tidak ditemukan.");
        return res.redirect("/cart");
      }

      const cartItem = await CartItem.findOne({
        where: {
          CartId: cart.id,
          ProductId: productId,
        },
        transaction: t,
      });

      if (!cartItem) {
        await t.rollback();
        req.flash("error", "Item tidak ditemukan di keranjang.");
        return res.redirect("/cart");
      }

      const product = await Product.findByPk(productId, { transaction: t });

      if (product) {
        product.stock += cartItem.quantity;
        await product.save({ transaction: t });
      }

      await cartItem.destroy({ transaction: t });

      await t.commit();

      res.redirect("/cart");
    } catch (error) {
      await t.rollback();
      console.log(error);
      res.send(error);
    }
  }

  static async decreaseCart(req, res) {
    const t = await sequelize.transaction();

    try {
      const userId = req.session.userId;
      const { productId } = req.params;

      const cart = await Cart.findOne({
        where: { UserId: userId },
        transaction: t,
      });
      if (!cart) {
        await t.rollback();
        req.flash("error", "Keranjang tidak ditemukan.");
        return res.redirect("/cart");
      }

      const cartItem = await CartItem.findOne({
        where: { CartId: cart.id, ProductId: productId },
        transaction: t,
      });
      if (!cartItem) {
        await t.rollback();
        req.flash("error", "Item tidak ditemukan di keranjang.");
        return res.redirect("/cart");
      }

      const product = await Product.findByPk(productId, { transaction: t });
      if (product) {
        product.stock++;
        await product.save({ transaction: t });
      }

      if (cartItem.quantity > 1) {
        cartItem.quantity--;
        await cartItem.save({ transaction: t });
      } else {
        await cartItem.destroy({ transaction: t });
      }

      await t.commit();

      res.redirect("/cart");
    } catch (error) {
      await t.rollback();
      console.log(error);
      res.send(error);
    }
  }

  static async checkout(req, res) {
    const t = await sequelize.transaction();

    try {
      const userId = req.session.userId;
      const user = await User.findByPk(userId, { transaction: t });

      const cart = await Cart.findOne({
        where: { UserId: userId },
        include: Product,
        transaction: t,
      });

      if (!cart || cart.Products.length === 0) {
        await t.rollback();
        req.flash("error", "Keranjang Anda kosong, tidak bisa checkout.");
        return res.redirect("/cart");
      }

      const totalPrice = cart.Products.reduce((total, product) => {
        return total + product.price * product.CartItem.quantity;
      }, 0);

      const newTransaction = await Transaction.create(
        {
          UserId: userId,
          totalPrice: totalPrice,
          status: "Paid",
          transactionDate: new Date(),
        },
        { transaction: t }
      );

      await CartItem.destroy({
        where: { CartId: cart.id },
        transaction: t,
      });

      await t.commit();

      await sendCheckoutEmail(user.email, newTransaction);

      req.flash(
        "success",
        "Checkout berhasil! Silakan cek email Anda untuk konfirmasi."
      );
      res.redirect("/transactions");
    } catch (error) {
      await t.rollback();
      res.send(error);
    }
  }

  static async transactions(req, res) {
    try {
      const userId = req.session.userId;
      const transactions = await Transaction.findAll({
        where: { UserId: userId },
        order: [["transactionDate", "DESC"]],
      });
      res.render("transactions", { transactions });
    } catch (error) {
      res.send(error);
    }
  }
}

module.exports = Controller;
