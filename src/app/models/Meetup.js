import Sequelize, { Model } from 'sequelize';

class Meetup extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        description: Sequelize.STRING,
        location: Sequelize.STRING,
        date: Sequelize.DATE,
        file_id: Sequelize.INTEGER,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  // relaciona o model USER com o model FILE
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.File, { foreignKey: 'file_id', as: 'file' });
  }
}

export default Meetup;
