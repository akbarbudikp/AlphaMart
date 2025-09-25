"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsToMany(models.Cart, {
        through: models.CartItem,
        foreignKey: "ProductId",
        otherKey: "CartId",
      });
    }
    static async search(query) {
      const { Op } = require("sequelize");
      const options = {
        where: {},
        order: [["id", "ASC"]],
      };
      if (query) {
        options.where.name = { [Op.iLike]: `%${query}%` };
      }
      return await Product.findAll(options);
    }
    get formattedPrice() {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(this.price);
    }
  }
  Product.init(
    {
      name: DataTypes.STRING,
      price: DataTypes.INTEGER,
      stock: DataTypes.INTEGER,
      imgUrl: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Product",
    }
  );
  return Product;
};
