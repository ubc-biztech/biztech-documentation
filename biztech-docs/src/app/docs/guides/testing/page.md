---
title: Testing Guide
nextjs:
  metadata:
    title: Testing Guide
    description: How to run unit and integration tests in the BizTech backend, with file locations, test framework details, and fixtures.
---

How to run the backend test suite, where test files live, and how unit and integration tests work. {% .lead %}

---

## Quick Reference

```bash
# Run all unit tests
npm run utest

# Run all integration tests
npm run itest

# Run both
npm test

# Run unit tests for a specific service
npm run utest -- users

# Run a specific unit test function
npm run utest -- users userCreate
```

All commands run from the `serverless-biztechapp-1/` root directory.

---

## Test Framework

The backend uses **Mocha + Chai** (expect style) for both unit and integration tests. ES6 module support is provided by `babel-core/register`.

| Tool                                   | Purpose                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| Mocha                                  | Test runner                                                  |
| Chai                                   | Assertion library (`expect` style)                           |
| `serverless-mocha-plugin`              | Wraps Lambda handlers for local invocation (unit tests only) |
| `aws-sdk-client-mock` / `aws-sdk-mock` | Mocks AWS SDK calls in unit tests                            |
| `@aws-sdk/client-lambda`               | Invokes real Lambda functions (integration tests)            |

---

## Unit Tests

Unit tests invoke Lambda handlers locally without making real AWS calls. AWS services are mocked.

### File Location

```
services/<service>/test/<functionName>.js
```

Example:

```
services/users/test/userCreate.js
services/users/test/userGet.js
services/users/test/userGetAll.js
services/events/test/eventCreate.js
```

### How They Work

Each test file uses the `serverless-mocha-plugin` wrapper to load and invoke a single Lambda handler:

```js
import mochaPlugin from 'serverless-mocha-plugin'
const expect = mochaPlugin.chai.expect
let wrapped = mochaPlugin.getWrapper('create', '/handler', 'create')

describe('createUser', () => {
  it('should create a new user', async () => {
    const event = {
      body: JSON.stringify({ id: 'test@test.com', fname: 'Test' }),
    }
    const response = await wrapped.run(event)
    expect(response.statusCode).to.equal(201)
  })
})
```

The wrapper simulates a Lambda invocation with the provided event object and returns the Lambda response.

### Runner

**Script:** `scripts/run_utests.js`

The runner:

1. Accepts optional args: `service` (default: `"all"`) and `function` (default: `"all"`)
2. When `service=all`, iterates every subdirectory in `services/` and runs `sls invoke test` in each
3. When a specific `function` is given, passes `--function <name>` to scope the test run
4. Uses `--compilers js:babel-core/register` for ES6 support

---

## Integration Tests

Integration tests call real deployed Lambda functions on the `dev` stage via the AWS SDK.

### File Location

```
services/<service>/test_integration/<name>.js
```

Example:

```
services/users/test_integration/user.js
services/events/test_integration/events.js
services/registrations/test_integration/registration.js
```

### How They Work

Integration tests use the `invokeLambda()` helper from `lib/testHelpers.js`:

```js
import { invokeLambda } from '../../../lib/testHelpers'

describe('Users integration tests', () => {
  it('should create a user', async () => {
    const [statusCode, body] = await invokeLambda('users', 'create', {
      body: JSON.stringify({ id: 'test@test.com', fname: 'Test' }),
    })
    expect(statusCode).to.equal(201)
  })
})
```

The `invokeLambda()` function:

1. Calls `Lambda.invoke()` with the function name `biztechApi-<service>-dev-<functionName>`
2. Parses the response payload
3. Returns a `[statusCode, body]` tuple

{% callout type="warning" title="Integration Tests Hit Real AWS" %}
Integration tests invoke actual deployed Lambda functions in `us-west-2` and read/write to the dev DynamoDB tables. Make sure the `dev` stage is deployed before running integration tests, and be aware that tests share the dev database with staging.
{% /callout %}

---

## Test Fixtures

Test constants are defined in `constants/test.js`:

| Fixture       | Value                           | Purpose                           |
| ------------- | ------------------------------- | --------------------------------- |
| `USER_ID`     | `victorv@ubcbiztech.com`        | Persistent test user              |
| `USER_ID_2`   | `victorv+2@ubcbiztech.com`      | Second test user                  |
| `USER_ID_DNE` | `victorv+3@ubcbiztech.com`      | Non-existent user (for 404 tests) |
| `EVENT_POST`  | `__INTEGRATION_TEST_EVENT_POST` | Event ID for create tests         |
| `EVENT`       | `__INTEGRATION_TEST_EVENT`      | Persistent test event             |
| `PRIZE_POST`  | `__INTEGRATION_TEST_PRIZE_POST` | Prize ID for create tests         |
| `PRIZE`       | `__INTEGRATION_TEST_PRIZE`      | Persistent test prize             |

All test events use `year: 2020`. Event/year combinations are prefixed with `__INTEGRATION_TEST_` to avoid collisions with real data.

---

## Test Coverage

| Service       | Unit Tests   | Integration Tests |
| ------------- | ------------ | ----------------- |
| users         | 6 test files | 1 test file       |
| members       | 5 test files | 1 test file       |
| events        | 5 test files | 1 test file       |
| registrations | 3 test files | 1 test file       |
| prizes        | 4 test files | 1 test file       |
| transactions  | 2 test files | —                 |
| profiles      | 1 test file  | —                 |
| hello         | 1 test file  | 1 test file       |
| stickers      | has test dir | —                 |

Services without tests: payments, partnerships, btx, bots, emails, instagram, interactions (core handlers).

---

## Key Files

| File                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `scripts/run_utests.js` | Unit test runner                               |
| `scripts/run_itests.js` | Integration test runner                        |
| `lib/testHelpers.js`    | `invokeLambda()` utility for integration tests |
| `lib/testTemplate.ejs`  | Auto-generated test boilerplate template       |
| `constants/test.js`     | Test fixture constants                         |

---

## Related Pages

- [Local Dev & Debugging](/docs/guides/debugging) — running the backend locally
- [Adding an API Endpoint](/docs/guides/adding-an-endpoint) — includes notes on adding tests
- [Backend Architecture](/docs/backend-architecture) — service structure
- [Backend Workflows](/docs/cicd/backend-workflows) — CI packaging checks (tests are not run in CI)
