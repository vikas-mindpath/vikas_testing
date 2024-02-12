module.exports = async ({
  author,
  github,
  core,
  context,
  usersMapping,
  environment,
  base,
  head,
}) => {
  const { repo, owner } = context.repo;

  let prNumber, prUrl;

  // Check for existing PR
  const pulls = await github.rest.pulls.list({
    owner,
    repo,
    head: `${owner}:${head}`,
    base,
    state: "open",
  });

  if (pulls.data.length > 0) {
    prNumber = pulls.data[0].number;
    prUrl = pulls.data[0].html_url;
    core.setFailed(
      `A pull request from ${head} to ${base} already exists. you can find here ${prUrl}`
    );
  } else {
    // Create new PR
    const PR = await github.rest.pulls.create({
      owner,
      repo,
      title: `[GH-Action] Deployment to ${environment} environment`,
      head,
      base,
      body: `This pull request has been automatically generated to merge ${head} into ${base} for deployment in ${environment}. It was initiated by @${author}.`,
    });
    prNumber = PR.data.number;
    prUrl = PR.data.html_url;
    console.log(`Pull request created. PR Number: ${prNumber}, URL: ${prUrl}`);
  }

  core.setOutput("PR_URL", prUrl);

  // List contributors
  let contributorsSet = new Set();
  const comparison = await github.rest.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  });

  comparison.data.commits.forEach((commit) => {
    if (commit.author) {
      contributorsSet.add(commit.author.login);
    }
  });

  let contributors = Array.from(contributorsSet);

  // Filter out the 'github-actions[bot]' and the PR author (if applicable)
  contributors = contributors.filter(
    (contributor) =>
      contributor !== "github-actions[bot]" && contributor !== context.actor
  );

  // Request Reviewers, excluding the PR author
  if (contributors.length > 0 && prNumber) {
    try {
      await github.rest.pulls.requestReviewers({
        owner,
        repo,
        pull_number: prNumber,
        reviewers: contributors,
      });
      console.log(`Reviewers requested for PR #${prNumber}:`, contributors);
    } catch (error) {
      console.error(`Error requesting reviewers for PR #${prNumber}:`, error);
      core.setFailed(error);
    }
  }

  const contributorsSlackIds = contributors.map(
    (username) => usersMapping[username] || username
  );
  const structuredMessage = contributorsSlackIds
    .map((data) => `<@${data}>`)
    .join(", ");
  const authorIdSlack = usersMapping[author] ?? "unknown";
  core.setOutput("AUTHOR_SLACK_ID", authorIdSlack);
  core.setOutput("CONTRIBUTORS_LIST", structuredMessage);
};
