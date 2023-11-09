Turn a question like this:

```
Which actors that are 20 years old or younger have starred in more than 5 movies? Include their age.
```

Into this:

```sql
SELECT p.name AS "Actor", COUNT(*) AS "Num Movies", (strftime('%Y', 'now') - p.birth_year) AS "Age"
  FROM people p
JOIN stars s
  ON p.id = s.person_id
WHERE (strftime('%Y', 'now') - p.birth_year) <= 20
GROUP BY p.id
HAVING COUNT(*) > 5;
```

**Note: All AI-generated SQL should be checked for correctness before running them on your database.**
