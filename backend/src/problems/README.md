# Problems directory

One folder per problem. Each folder must contain:

- `problem.json` - metadata (id, title, difficulty, category, description, examples, constraints)
- `starter.js`, `starter.py`, `starter.java` - starter code with test calls
- `public_tests.json` - tests + `combinedExpectedOutput` per language
- `hidden_tests.json` - hidden tests for judge

See `docs/PROBLEM_SYSTEM_MIGRATION.md` for full schema and migration steps.
