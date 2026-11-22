# Peluso Group

A dark automotive marketplace built with React, Node.js, Express, and MongoDB.

## Tech Stack
- Frontend: React + Vite + custom responsive CSS
- Backend: Node.js + Express
- Database: MongoDB

## Folder Structure
- `client/` - frontend application
- `server/` - backend API

## Getting Started

1. Copy `.env.example` to `.env`, set `MONGO_URI`, and configure the `SMTP_*` values for the mailbox that will send contact notifications.

2. Install root dependencies
   npm install

3. Install client dependencies
   cd client
   npm install

4. Start the app
   cd ..
   npm run dev

5. Open the app in your browser
   http://localhost:5173

## Accounts and contact form

Account signup and sign-in use MongoDB-backed users and server-side sessions.
Passwords are hashed before storage; session tokens are kept in HTTP-only cookies.
Contact messages are stored in the `contact_inquiries` collection and emailed to
`CONTACT_EMAIL` (defaults to `luigi_peluso26@proton.me`). Configure `SMTP_HOST`,
`SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS` in `.env`; `SMTP_FROM`
is optional and defaults to `SMTP_USER`. Use the SMTP credentials or app-specific
token issued by your email provider, not necessarily your normal account password.
For Proton Mail, use its SMTP submission credentials/token and provider-approved
sender address. The API reports an error if SMTP is missing or delivery fails;
the submitted inquiry remains stored in MongoDB and its email status is recorded.
Visitors can request a dealership appointment from an auto detail page by choosing
a future date and time. Requests are stored in the `dealer_visit_requests`
collection and managed in `/admin/visits`; admins must provide a reason when
accepting or declining, and the decision is emailed to the customer when SMTP is
configured. Admin notification failures are shown in the admin area while the
request remains available there.
Vehicle listings are read from MongoDB; there is no built-in example inventory.
The admin can add, edit, or remove listings at `/admin`. Vehicle photos uploaded
there are stored in `server/uploads/cars/` and served by the application. Keep this
directory on persistent storage when deploying; uploaded files are excluded from Git.
Listings can include up to 20 JPEG, PNG, or WebP images, up to 8 MB each, and
the admin can choose which uploaded photo is displayed as the primary listing image.
Listings can also include optional engine power in kW, emissions class (for example,
Euro 6D), and inspection year; these details are shown in the vehicle information
view when provided.
Signed-in customers can submit a private vehicle-sale proposal with vehicle
information and up to 20 photos. These proposals are not public listings: admins
can review them, update their status, accept or reject the proposal, or send a
counteroffer and messages in `/admin/messages`. Customers can follow each
proposal's status and continue the private conversation from `/account`.
Customers can also submit a price offer on an in-stock vehicle for sale, with an
optional comment, from the `/account` price-offers section. Offers,
counteroffers, and replies appear in a chronological negotiation history;
customers can accept or reject a counteroffer or submit a new price there. Admins
manage these negotiations from the dedicated `/admin/offers` workspace.
Proposal photos are stored separately in `server/uploads/sell-submissions/` and
served only to admins and the customer who owns the proposal. Keep this upload
directory on persistent storage in production.
From the admin inventory, mark a vehicle for sale as sold and select the customer
account (by its registered email). This moves a snapshot of the car into the public
sales history without removing its photos. Only the assigned customer account can
submit one review for that purchase from `/account`. The review is published with
the customer's consent and first name; the admin can view it in `/admin/messages`.

Admin access is configured with `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
`ADMIN_PIN_HASH`, and optionally `ADMIN_EMAIL` in `.env`. Leave the username and
password hash unset to disable admin access. Admin sign-in requires the password
and then a four-digit PIN; the PIN is stored as a bcrypt hash, never in source.
Create bcrypt hashes without putting credentials in source:

```sh
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "choose-a-unique-strong-password"
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "choose-your-four-digit-pin"
```

Set the generated values as `ADMIN_PASSWORD_HASH` and `ADMIN_PIN_HASH`. The PIN
must be exactly four digits. After the password is accepted, the server creates
a restricted verification session that expires after 60 seconds; the PIN prompt
opens on a dedicated page, shows a countdown and leaves admin APIs unavailable
until the PIN is verified.
Three incorrect PINs trigger a 30-minute lockout
across the admin account, even across new sessions or network changes. Logging
out revokes every server session for that account and clears the browser cookie. The admin role is
provisioned on server startup. Never deploy with the weak example password
`123password`; replace it with a strong unique password before exposing the site
publicly.

The team contact cards still show a placeholder phone number for Luigi and a
reserved example address for Gerardo. Confirm those details before publishing
the site.

## Production Build
   npm run build
