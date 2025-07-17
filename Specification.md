## Overview
CoFi is a website for couples to track their family finance. It offers transparency on overall spending but keeps privacy of individual transactions. It also offers extensive charts to show spending and savings over time to help the family keep their finance healthy.
## Tech Stack
CoFi uses React 19 and tailwindcss v3 as frontend frameworks, shadcn as UI component library, Vite as frontend build tool, Next.js 15 as backend framework and local sqlite file as database.
## Features
- The website has four major pages: Dashboard, Transactions, Statistics and User Management.
- There are two users in the system.
	- Each user needs to input a pin code to log in.
	- Each user can change their pin code in User Management page.
	- The user and the pin code needs to be persisted in the database.
- All users can add/edit/remove transactions to track in Transactions page.
	- Each transaction contains an ID for the database, a description, a category, an amount and a date.
	- The amount can be either positive or negative.
	- Each user can mark the transaction he/she added to the system to be public or private.
- All users can view transactions in a table view in Transactions.
	- Each user can only see the transactions added by himself/herself and the public transactions.
	- The table needs to support pagination (20 per page), sorting and filtering (based on category or time range)
	- Users should be able to search transactions. All transactions' description matches the string will show up.
- All users can see statistics chart in Statistics page.
	- The charts includes overall income per month, spending per month, net income per month. When calculating this, the system takes all public and private transactions into account.
	- The charts should also include spending per category per month. The user can decide whether to see it for the user's own transactions or the public transactions.