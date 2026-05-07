# arbenl-mobile-assignments-2025
Student assignments - Mobile Programming, Cloud Computing, and Mobile Cloud Computing

# 📚 Student Project Topic Catalogues

Welcome! This repo contains assignment pools that students reserve with Pull Requests (PRs).
Each topic can be claimed by **exactly one** student.

- [`TOPICS.md`](TOPICS.md) — Mobile Programming topics, kept for the next mobile semester.
- [`CLOUD_TOPICS_2026.md`](CLOUD_TOPICS_2026.md) — Cloud Computing and Mobile Cloud Computing (MCC) topics for 2026.
- [`mcc-2026.html`](mcc-2026.html) — modern browsing/reservation page for the MCC 2026 catalogue, including read-only scores for students.
- [`instructions-mcc-2026.html`](instructions-mcc-2026.html) — English static guide for reserving, solving, testing, and submitting assignments.
- [`udhezime-mcc-2026.html`](udhezime-mcc-2026.html) — Albanian static guide for reserving, solving, testing, and submitting assignments.
- [`SUBMISSIONS_2026.md`](SUBMISSIONS_2026.md) — final solution submission links.

Reservations are **first in, first served**: the first valid PR that is merged by the instructor/maintainer reserves the topic and makes it visible on the public site.
Students may change only the status segment of one available topic line when reserving. Catalogue descriptions, score lines, pages, workflows, scripts, and docs are read-only for student claim PRs. One student can reserve only one assignment, and both full name and email are required. Final solutions are submitted later by changing exactly one line in `SUBMISSIONS_2026.md`.

## 🚀 Quick Claim Checklist

1. Hap `mcc-2026.html`, zgjidh temën dhe shkruaj emrin/email-in.
2. Kliko `Copy claim line`.
3. Kliko `Edit on GitHub`.
4. Në GitHub zëvendëso vetëm rreshtin e temës tënde me rreshtin e kopjuar.
5. Kliko `Propose changes` dhe hap Pull Request.
6. Prit validimin automatik dhe rishikimin nga instruktori; tema rezervohet dhe bëhet e dukshme për të gjithë vetëm kur instruktori/maintainer e bashkon PR-në.

## ✅ How to claim a topic

1) Fork this repository to your GitHub account.
2) Open the correct catalogue in your fork: `TOPICS.md` for Mobile Programming or `CLOUD_TOPICS_2026.md` for Cloud Computing/MCC 2026.
3) Find the topic you want (use the ID like `#07`).
4) Change the status from **(Available)** to **(Taken by YOUR FULL NAME <email@example.com>)**.
5) Do not change the score line or any description line. Scores are instructor-managed and shown as `0/30` or `Not graded`.
6) Commit the change in your fork and **open a Pull Request** back to this repo.
7) Fill the PR template completely (catalogue, name, email, topic ID, chosen stack, cloud/mobile services if relevant, 1-week plan, AI tools).
8) Wait for the **automated check** to pass. If approved, the instructor/maintainer will merge your PR.

> 🔒 Your copied line is not a reservation by itself. Once **your PR is merged**, your topic becomes **unavailable** to others and appears on the public site as reserved.

Need to correct your own reservation? Open another PR that changes only your existing topic line, keeping the same name or the same email so the validator can identify it as your reservation.

## ✅ How to submit the final solution

1) Build the solution in your own GitHub repository.
2) Include source code, README, setup/run/deploy instructions, screenshots or demo notes, and `AI-log.txt` if AI tools were used.
3) Open `SUBMISSIONS_2026.md` and change only the line for your topic.
4) Use this format:

```md
01. Cloud-hosted Task Collaboration Platform — (Submitted by YOUR FULL NAME <email@example.com>) — Repo: https://github.com/user/project — Demo: https://demo.example.com
```

Use `Demo: N/A` only when the project cannot reasonably be deployed, and explain how to run it locally in the project README.

## 🧭 Udhëzues i detajuar për rezervimin e një projekti (AL)

1. **Zgjidh idenë që të intereson:** Hap katalogun e duhur (`TOPICS.md` ose `CLOUD_TOPICS_2026.md`), lexo përshkrimet dhe shëno ID-në (p.sh. `07`) të projektit që dëshiron. Sigurohu që statusi i tij të jetë ende **(Available)**.
2. **Krijo fork në GitHub:** Kliko `Fork` në repo kryesor, në mënyrë që të punosh në kopjen tënde.
3. **Klono fork-un lokalisht:**  
   ```bash
   git clone https://github.com/<username>/arbenl-mobile-assignments-2025.git
   cd arbenl-mobile-assignments-2025
   ```
4. **Krijo një degë pune (opsionale por e rekomanduar):**  
   ```bash
   git checkout -b claim-topic-07
   ```
5. **Përditëso vetëm rreshtin e temës tënde në katalogun përkatës:** Ndrysho segmentin `— (Available)` në `— (Taken by EMRI MBIEMRI <email@example.com>)` duke ruajtur identik pjesën tjetër të rreshtit. Mos modifiko titullin, ID-në apo përshkrimin.
6. **Ruaj dhe kontrollo ndryshimin:**  
   ```bash
   git status
   git diff
   ```
   Duhet të shfaqet vetëm një ndryshim në rreshtin e zgjedhur.
7. **Ekzekuto skriptin e verifikimit:**  
   ```bash
   node scripts/check-claim.js
   ```
   Vazhdon vetëm nëse shfaq `✅ Claim format looks valid.`; përndryshe rregullo gabimet që të tregohen.
8. **Bëj commit me një mesazh të qartë:**  
   ```bash
   git commit -am "Claim topic 07: Multi-language Translator Phrasebook"
   ```
9. **Shto degën në GitHub-in tënd:**  
   ```bash
   git push origin claim-topic-07
   ```
10. **Hap Pull Request te repo origjinal:** Zgjidh bazën `main`, përshkruaj shkurtimisht projektin, plotëso komplet shabllonin (emri yt, email-i, ID e temës, stack-u i zgjedhur, plani 1-javor, mjetet AI). Kontrollo që kontrolli automatik (GitHub Action) të kalojë.
11. **Monitoro PR-në:** Nëse mësimdhënësi kërkon ndryshime, përditëso degën tënde dhe shty listën e re të commit-ëve. Kur PR të miratohet dhe të bashkohet, statusi i temës bëhet automatikisht i zënë për studentët e tjerë.

## 🧑‍💻 Contributor Guidelines

- Maintainers and reviewers should follow the workflow documented in [`AGENTS.md`](AGENTS.md) for repository structure, validation steps, and PR expectations.

## 🔧 Allowed stacks & tools

- **Mobile stacks:** Flutter, React Native (Expo), Kotlin (Android), Swift (iOS)  
- **Cloud platforms:** AWS, Azure, Google Cloud, Vercel, Netlify, Render, Fly.io, Supabase, Firebase
- **Backend/API:** Node.js, Express, NestJS, FastAPI, Django, Spring Boot, serverless functions
- **Data/storage:** Supabase, Firebase/Firestore, PostgreSQL, MySQL, MongoDB, object storage, queues, analytics tools
- **DevOps:** Docker, GitHub Actions, Terraform/OpenTofu, Kubernetes, monitoring/logging tools
- **AI tools:** Gemini, GitHub Copilot, ChatGPT/Codex CLI  
- **Dev environments:** Replit, VS Code, GitHub Codespaces

## 🧠 Requirements for all projects

- Working app, API, automation, or mobile app that can be demonstrated clearly
- Mobile topics should run on device/emulator
- Cloud/MCC topics should include a deployed cloud component or reproducible deployment instructions
- Uses meaningful backend/cloud services such as auth, database, storage, serverless functions, queues, scheduled jobs, monitoring, or push notifications
- Uses AI productively when helpful (prompt logs saved in `AI-log.txt` in your app repo)
- Clear README with setup/run/deploy instructions
- Minimum 3 meaningful commits per week

## ❓ Questions

Open a **Discussion** or ask during class/Telegram group.  
Good luck!

## 📘 How to use these assignments as a student

- **Explore the catalog:** Review the relevant catalogue and shortlist ideas that fit your interests or portfolio goals.
- **Assess feasibility:** Compare the suggested schema, cloud services, and tooling with your existing skills to decide what you need to learn or prototype first.
- **Claim responsibly:** Once confident, follow the claiming workflow above so the topic is reserved in your name.
- **Plan your build:** Break the requirements into weekly milestones, documenting them in your own project board or tracker before you start coding.
- **Leverage AI effectively:** Keep a running `AI-log.txt` that records meaningful prompts and outputs you used for ideation, debugging, or asset creation.
- **Iterate and test:** Develop the app incrementally, demoing features on a device/emulator and validating Supabase integration as you go.
- **Reflect and share:** When finished, publish a concise case study or README section explaining what you built, challenges faced, and what you learned.
