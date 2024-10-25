'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasOne(models.DataDiri, { foreignKey: 'id_user', onDelete: 'CASCADE' });

    }
  }
  User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    total_point: DataTypes.INTEGER,
    role: {
      type: DataTypes.ENUM,
      values: ["admin", "user"],
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  });
  return User;
};