// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const path = require("path")
const fs = require("fs")

async function main() {
  try {
    await updateRepo({
      repo: { owner: "artsy", repo: "metaphysics" },
      branch: "update-eigen-query-map",
      title: "Update eigen query map",
      targetBranch: "main",
      commitMessage: "Update eigen query map",
      body: "Greetings human :robot: this PR was automatically created as part of eigen's deploy process",
      assignees: ["artsyit"],
      labels: ["Merge On Green"],
      update: (dir) => {
        console.log("∙ Merging complete.queryMap.json")
        // merge metaphysics into eigen map first, to preserve any manual edits made in MP
        mergeJson("data/complete.queryMap.json", path.join(dir, "src/data/complete.queryMap.json"))
        // then merge back into metaphysics to update
        mergeJson(path.join(dir, "src/data/complete.queryMap.json"), "data/complete.queryMap.json")
      },
    })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

/**
 * merges fileB into fileA
 * @param {string} fileA
 * @param {string} fileB
 */
function mergeJson(fileA, fileB) {
  const jsonA = JSON.parse(fs.readFileSync(fileA).toString())
  const jsonB = JSON.parse(fs.readFileSync(fileB).toString())
  fs.writeFileSync(fileA, JSON.stringify(Object.assign(jsonA, jsonB), null, "  "))
}

main()
