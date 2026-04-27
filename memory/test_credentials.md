# RallyCommand — Test Credentials

## Demo User
- Email: `demo@rallyteam.com`
- Password: `rally2024`

## Email Service (Brevo)
- API key, sender email, sender name are stored in `/app/backend/.env`:
  - `BREVO_API_KEY`
  - `SENDER_EMAIL` = `francisdevstudios@gmail.com` (verified Brevo sender)
  - `SENDER_NAME` = `Rally Command`
- Free tier: 300 emails/day. Verified senders can send to anyone.
- Test recipient (account owner): `francisdevstudios@gmail.com`

## Database (MongoDB Atlas — production)
- DB user: `admin`
- DB password: `MongoConnectionPassword`
- DB name: `mongoRallyCommand`
- Connection URL stored in `MONGO_URL` env var
