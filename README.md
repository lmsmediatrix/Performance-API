# UNLAD Template Service Typescript Version (API)

Welcome to the UNLAD Template Service API documentation

## Setup

1.  Clone the repository
    `git clone https://github.com/Unlad-Foundation/unlad-template-service-ts.git`
2.  Install dependencies
    `npm install`
3.  Run local server
    `node index.js`

## Running Tests

1. Install Postman for PCs/Mac (or use Postman for Web https://web.postman.co/)
2. Import the `UNLAD TEMPLATE SERVICE (API).postman_collection.json` file from the repository
3. Click the "UNLAD TEMPLATE API" collection name and update the following on the "Variables" tab: - `base_url`: `localhost:5000` or `UNLAD_TEST_API_URL` - `token`: retrieved when you login via the UNLAD TEMPLATE API

## User Registration (new API user)

Click the `POST - Create` request under the "User" folder, switch to the "Body" tab and add a "raw" JSON into the editor then click send.

```
{
    "email":  "gab@lmighty.com",
    "password":  "abcd1234!"
}
```

## User Login (generate session token)

Click the `POST - Login` request under the "User" folder, switch to the "Body" tab and add a "raw" JSON into the editor then click send.

```
{
    "email":  "gab@lmighty.com",
    "password":  "abcd1234!"
}
```

The response body from the API should return your access token. Update your workspace collection "token" variable with this token

```
{
"accessToken":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjYxOTIyZDZhMTk1ZmY1OTQzMzI1YTY4IiwiZW1haWwiOiJnYWJhbG1pZ2h0eUBnbWFpbC5jb20ifSwiaWF0IjoxNzEyOTI0MjU2LCJleHAiOjE3MTMwMTA2NTZ9.k0YhxdVEPhKSAtlRI2DV8Soy6Yd65ME4zNaiCkj4sfI"
}
```

## REST Calls Example

Visit the documentation - https://documenter.getpostman.com/view/30947035/2sA3Bhfv5k

## Software Configuration Management (SCM)

**"One Feature, One Branch"**
We use GitFlow Workflow [(read me)](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) as our branching strategy where we create new branches for every feature we develop. As such, we create `hotfix` and `release` branches as needed using the same concept.

e.g. You will add a feature called "Advance Analytics"

1.  Create a branch from the `develop-branch` and name it `advance-analytics-feature` and checkout this branch
2.  Make your changes to your newly created branch and perform all tests (local server and Sandbox/Dev environment) before doing a commit and push for all your changes
3.  Create a "Pull Request" to the `develop-branch` and add all the leads as reviewers. Once the PR is approved and merged, the `develop-branch` can be deployed to the "Test" environment

## Best Practices

- Use **Assistive Coding** to validate codes and review to make sure
  our codes are optimized and error free before pushing the codes to our git repository.

  - [OpenAI ChatGPT](https://chat.openai.com/)
  - [Google Gemini](https://makersuite.google.com/app/prompts/new_freeform)
  - [Groq Mixtral](https://groq.com/)

- Use different environments to isolate testing and deployment.
  - **Dev/Sandbox** (required for Developer and Isolated Testing)
  - **Test/Staging environment** (required for E2E and Client Testing)
  - **QC environment** (optional for Internal Testing, a production clone)
  - **UAT Environment** (optional for Isolated Client Testing, , a production clone)
  - **Production** (required)

## Online References and Guides

- [GitHub Desktop Doc](https://docs.github.com/en/desktop/overview/about-github-desktop)
- [REST Calls using POSTMAN](https://documenter.getpostman.com/view/30947035/2sA3Bhfv5k/)
- [How to Create a Express/Node + React Project | Node Backend + React Frontend](https://www.youtube.com/watch?v=w3vs4a03y3I&list=PLwCOqpI4WKFx_f-Fg3CHwF7n0080x-Yme&index=5&t=225s)
- [Creating High-Quality React Components: Best Practices for Reusability](https://www.youtube.com/watch?v=eXRlVpw1SIQ&t=548s)
- [Best ChatGPT prompts for coding](https://www.learnprompt.org/chat-gpt-prompts-for-coding/)
