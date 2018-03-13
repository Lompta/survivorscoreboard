// Create database necessary to run the application

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/survivordraft';

const client = new pg.Client(connectionString);
client.connect();

const populateDrafterQuery = client.query(
  // TODO - verify maximum num of chars
  'INSERT INTO drafter VALUES ("Alec", 0);' +
  'INSERT INTO drafter VALUES ("Justis", 0);' +
  'INSERT INTO drafter VALUES ("Marshawn", 0);' +
  'INSERT INTO drafter VALUES ("Max", 0);'
);
populateDrafterQuery.on('end', () => { populatePlayerTable(); });

function populatePlayerTable() {
  const populatePlayerQuery = client.query(
    'INSERT INTO player VALUES ("Chelsea Townsend", 0, "Alec", false);' +
    'INSERT INTO player VALUES ("Desiree Afuye", 0, "Alec", false);' +
    'INSERT INTO player VALUES ("Wendell Holland", 0, "Alec", false);' +
    'INSERT INTO player VALUES ("Sebastian Noel", 0, "Alec", false);' +
    'INSERT INTO player VALUES ("Stephanie Gonzales", 0, "Alec", true);' +
    'INSERT INTO player VALUES ("James Lim", 0, "Justis", false);' +
    'INSERT INTO player VALUES ("Jenna Bowman", 0, "Justis", false);' +
    'INSERT INTO player VALUES ("Chris Noble", 0, "Justis", false);' +
    'INSERT INTO player VALUES ("Kellyn Bechtold", 0, "Justis", false);' +
    'INSERT INTO player VALUES ("Morgan Ricke", 0, "Justis", true);' +
    'INSERT INTO player VALUES ("Bradley Kleihege", 0, "Max", false);' +
    'INSERT INTO player VALUES ("Stephanie Johnson", 0, "Max", false);' +
    'INSERT INTO player VALUES ("Brenden Shapiro", 0, "Max", false);' +
    'INSERT INTO player VALUES ("Michael Yerger", 0, "Max", false);' +
    'INSERT INTO player VALUES ("Domenick Abbate", 0, "Max", false);' +
    'INSERT INTO player VALUES ("Donathan Hurley", 0, "Marshawn", false);' +
    'INSERT INTO player VALUES ("Laurel Johnson", 0, "Marshawn", false);' +
    'INSERT INTO player VALUES ("Libby Vincek", 0, "Marshawn", false);' +
    'INSERT INTO player VALUES ("Angela Perkins", 0, "Marshawn", false);' +
    'INSERT INTO player VALUES ("Jacob Derwin", 0, "Marshawn", true);'
  populatePlayerQuery.on('end', () => { client.end() });
}
