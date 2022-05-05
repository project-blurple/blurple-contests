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
