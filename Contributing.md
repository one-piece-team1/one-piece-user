# How to contribute

We love pull requests. And following this guidelines will make your pull request easier to merge.

If you want to contribute but don’t know what to do, take a look at these two labels: [help wanted](https://github.com/one-piece-team1/one-piece-trip/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) and [good first issue](https://github.com/one-piece-team1/one-piece-trip/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

_[Use GitHub interface](https://blog.sapegin.me/all/open-source-for-everyone/) for simple documentation changes, otherwise follow the steps below._

## Prerequisites

- If it’s your first pull request, watch [this amazing course](http://makeapullrequest.com/) by [Kent C. Dodds](https://twitter.com/kentcdodds).
- Install [Eslint](https://eslint.org/) and [Prettier](https://prettier.io/) plugin for your code editor to make sure it uses correct settings.
- Install [Docker](https://www.docker.com/) for your image build process.
- Install [make](https://www.gnu.org/software/make/) plugin for our broker and db running on docker.
- Fork the repository and clone your fork.
- Install dependencies: `npm install`.

## Development workflow

Pull Broker and Db from Deploys

```
git clone https://github.com/one-piece-team1/one-piece-deploy.git
cd data-only // if you only want to run broker and db...
cd services // if you want to run services, broker and db...
make up
```

Run linters and tests:

```bash
npm test
```

Or run tests in watch mode:

```bash
npm run test:watch
```

**Don’t forget to add tests and update documentation for your changes.**

**Please update npm lock file (`package-lock.json`) if you add or update dependencies.**

## Other notes

- If you have commit access to repository and want to make big change or not sure about something, make a new branch and open pull request.
- We’re using [Prettier](https://github.com/prettier/prettier) to format code, so don’t worry much about code formatting.
- Don’t commit generated files, like minified JavaScript.
- Don’t change version number and changelog.

## Need help?

If you want to contribute but have any questions, concerns or doubts, feel free to ping maintainers. Ideally create a pull request with `WIP` (Work in progress) in its title and ask questions in the pull request description.
