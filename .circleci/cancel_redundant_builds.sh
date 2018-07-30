#!/usr/bin/env bash

CIRCLE_BASE_URL="https://circleci.com/api/v1.1/project/github/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME"
QUERY_PARAMS="circle-token=$CIRCLE_TOKEN"

getRunningJobs() {
  local circleApiResponse
  local runningJobs

  circleApiResponse=$(curl --silent --show-error "$CIRCLE_BASE_URL/tree/$CIRCLE_BRANCH?$QUERY_PARAMS" -H "Accept: application/json")
  runningJobs=$(echo "$circleApiResponse" | jq 'map(if .status == "running" then .build_num else "None" end) - ["None"] | .[]')
  echo "$runningJobs"
}

cancelRunningJobs() {
  local runningJobs
  runningJobs=$(getRunningJobs)
  for buildNum in $runningJobs;
  do
    echo Canceling "$buildNum"
    curl --silent --show-error -X POST "$CIRCLE_BASE_URL/$buildNum/cancel?$QUERY_PARAMS" >/dev/null
  done
}

cancelRunningJobs
