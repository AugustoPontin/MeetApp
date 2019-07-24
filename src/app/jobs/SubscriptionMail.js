import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, subsData } = data;

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: `Novo inscrito no MeetUp ${meetup.title}`,
      template: 'subscription',
      context: {
        organizer: meetup.user.name,
        user: subsData.user.name,
        userMail: subsData.user.email,
        meetup: meetup.title,
      },
    });
  }
}

export default new SubscriptionMail();
