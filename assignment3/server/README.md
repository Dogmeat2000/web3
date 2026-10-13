# How to run:

From /server

```bash
npm install
npm start
```

The navigate to: http://localhost:4000/graphql

# Saving the games in MongoDB

Without any settings the server keeps the games in memory, and they are lost when it stops.

To save them in MongoDB, copy `.env.example` to `.env` (in this folder) and fill in the connection string.
Git ignores `.env`, so the connection string is never committed.

| Variable           | Needed | Meaning                                                                                                                                     |
|--------------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `MONGODB_URI`      | yes    | The connection string of the MongoDB server: `mongodb://localhost:27017` for one on this computer, or the string Atlas shows under Connect. |
| `MONGODB_DATABASE` | no     | The database the games are saved in. `uno-assignment3` when left out.                                                                       |

On Azure the same variables are set on the App Service, under Settings > Environment variables.

When `MONGODB_URI` is set but the database cannot be reached, the server does not start.
