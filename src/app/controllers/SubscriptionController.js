import * as Yup from 'yup';
import { isBefore } from 'date-fns';
import { Op } from 'sequelize';

import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const meetups = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['id', 'user_id'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
          attributes: ['id', 'title', 'description', 'location', 'date'],
        },
      ],
      order: [['meetup', 'date', 'DESC']],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // valida se existe o meetup
    const meetup = await Meetup.findByPk(req.body.meetup_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!meetup) {
      return res.status(401).json({ error: 'MeetUp invalido' });
    }

    // Nao permite se inscrever no meetup que criou
    if (meetup.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: 'Invalido para usuario organizador' });
    }

    // Nao permite se inscrever em meetups que já aconteceram
    if (isBefore(meetup.date, new Date())) {
      return res.status(401).json({ error: 'MeetUp ja aconteceu' });
    }

    // O usuário não pode se inscrever no mesmo meetup duas vezes
    const meetDouble = await Subscription.findOne({
      where: {
        meetup_id: meetup.id,
        user_id: req.userId,
      },
    });

    if (meetDouble) {
      return res
        .status(401)
        .json({ error: 'Usuario ja inscrito nesse MeetUp' });
    }

    // O usuário não pode se increver em dois meetups que acontecem no mesmo horário
    const dateDouble = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            id: {
              [Op.ne]: meetup.id,
            },
            date: meetup.date,
          },
        },
      ],
    });

    if (dateDouble) {
      return res
        .status(401)
        .json({ error: 'Usuario possui outro MeetUp no mesmo dia e horario' });
    }

    const subscription = await Subscription.create({
      meetup_id: req.body.meetup_id,
      user_id: req.userId,
    });

    const subsData = await Subscription.findByPk(subscription.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    // Envia e-mail para o organizador avisando nova inscrição
    await Queue.add(SubscriptionMail.key, {
      meetup,
      subsData,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
