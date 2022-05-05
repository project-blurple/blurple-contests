# blurple-contests

A bot made for the Blurple Events team that automates the creation of contests and leaderboard, and also has a built-in music player.

## Purpose

We had an art contest in 2021 where people could submit their art and get voted on. What we forgot to plan was how we could anonymously register these votes and export out a leaderboard as well.

This bot basically does that. The Events team can now create contests and leaderboards (I will explain both of these types further down) - and it also has a nice music feature as well for karaoke nights or other events.

## Setup

Requirements:
* Docker (https://www.docker.com/)
* Docker Compose (https://docs.docker.com/compose/install/) (usually comes with Docker)
* A Discord bot (https://discord.com/developers/applications) with the [Privileged Member Intent](https://discord.com/developers/docs/topics/gateway#privileged-intents)

Initial setup:
* Copy [`example.env`](../example.env) to `.env` and fill in the values

Although it also works without, we strongly recommend using Docker for this. If you're unexperienced or just want it up and running then use Docker.

### Setup Permissions

Now with Permissions v2, the bot will not need a built-in permission system. The only thing it has is a list of admin roles that can manage submissions and edit leaderboards as these are not interactions. Commands are handled by the built-in Discord permission system now.

![Permissions v2](./images/dark/permissions.png#gh-dark-mode-only)
![Permissions v2](./images/light/permissions.png#gh-light-mode-only)

You can choose where and who can use these commands. A participant won't need any commands to interact and participate with bots.

## Contest

A contest is a collection system of submissions where people can submit either an image or text, depending on the contest type, and vote on other submissions. It's also timed so the submission phase and voting phase are open whenever you want. When the voting period ends, results are revealed.

### Manage a contest

You can create a contest with the command [`/contests create`](../src/commands/slash/contests/create.ts) and then edit it with the command [`/contests edit`](../src/commands/slash/contests/edit.ts) later if you need to. If you want to see a list of all contests, you can use the command [`/contests list`](../src/commands/slash/contests/list.ts), and, finally, you can remove a contest with the command [`/contests remove`](../src/commands/slash/contests/remove.ts).

When you've set up a contest, you need a submit button. The button will act as a way for participants to submit their work. Create one with the command [`/contests post_button`](../src/commands/slash/contests/post_button.ts).

![Submit button](./images/dark/submit-button.png#gh-dark-mode-only)
![Submit button](./images/light/submit-button.png#gh-light-mode-only)

You can also list and filter participants in a contest with the command [`/contests list_participants`](../src/commands/slash/contests/list_participants.ts).
