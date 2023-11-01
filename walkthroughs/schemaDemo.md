Provide your schema by pasting `CREATE` statements separated by "`;`"". For example:

```sql
CREATE TABLE movies (
  id INTEGER,
  title TEXT NOT NULL,
  release_year NUMERIC,
  PRIMARY KEY(id)
);

CREATE TABLE people (
  id INTEGER,
  name TEXT NOT NULL,
  birth_year NUMERIC,
  PRIMARY KEY(id)
);

CREATE TABLE stars (
  movie_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  FOREIGN KEY(movie_id) REFERENCES movies(id),
  FOREIGN KEY(person_id) REFERENCES people(id)
);
```
