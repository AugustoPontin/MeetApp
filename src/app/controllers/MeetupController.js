import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  startOfHour,
  parseISO,
  isBefore,
  subHours,
  startOfDay,
  endOfDay,
} from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: [User],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { title, description, location, date, file_id } = req.body;

    const hourStart = startOfHour(parseISO(date)); // zera os minutos e segundos

    /**
     * Não permite Meets anteriores ao dia/hora atual
     */
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const meetup = await Meetup.create({
      title,
      description,
      location,
      date,
      file_id,
      user_id: req.userId,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(401).json({ error: 'MeetUp nao encontrado' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'MeetUp nao pertence ao usuario' });
    }

    /**
     * Não permite alterar meets antigos
     */
    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const hourStart = startOfHour(parseISO(req.body.date)); // zera os minutos e segundos

    /**
     * Não permite Meets anteriores ao dia/hora atual
     */
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const meetupUpdated = await meetup.update(req.body);

    return res.json(meetupUpdated);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    // Valida se é o usuário responsável pelo MeetUp
    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: "You dont't have permission to cancel this MeetUp.",
      });
    }

    const dateWithSub = subHours(meetup.date, 1);

    // Não permite excluir antigo
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel MeetUp 1 hors in advance.',
      });
    }

    // deleta MeetUp
    meetup.destroy();

    return res.json({ result: 'ok' });
  }
}

export default new MeetupController();
