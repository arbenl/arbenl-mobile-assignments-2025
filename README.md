# arbenl-mobile-assignments-2025
The students assignments 2025 - Mobile Programming

# 📚 Mobile Programming – Student Project Topics (2025)

Welcome! This repo contains **60 unique project topics** for the course.  
Each topic can be claimed by **exactly one** student using a Pull Request (PR).

## 🚀 Quick Claim Checklist

1. Bëj fork të repos në llogarinë tënde GitHub dhe klono fork-un lokalisht.
2. (Opsionale) Krijo një degë pune, p.sh. `claim-topic-07`.
3. Hap `TOPICS.md` dhe ndrysho vetëm statusin e temës së zgjedhur nga `— (Available)` në `— (Taken by EMRI MBIEMRI)`.
4. Ekzekuto `node scripts/check-claim.js` dhe sigurohu që të shfaqë `✅ Claim format looks valid.`.
5. Bëj commit për ndryshimin një-rreshtor me një mesazh si `Claim topic 07: Multi-language Translator Phrasebook`.
6. Shto degën në GitHub dhe hap një Pull Request kundrejt `main`, duke plotësuar çdo fushë të shabllonit.
7. Prit validimin automatik dhe rishikimin nga instruktori; përgjigju shpejt nëse kërkohen korrigjime.

## ✅ How to claim a topic

1) Fork this repository to your GitHub account.  
2) Open `TOPICS.md` in your fork.  
3) Find the topic you want (use the ID like `#07`).  
4) Change the status from **(Available)** to **(Taken by YOUR FULL NAME)**.  
5) Commit the change in your fork and **open a Pull Request** back to this repo.  
6) Fill the PR template completely (name, topic ID, chosen stack, 1-week plan, AI tools).  
7) Wait for the **automated check** to pass. If approved, the instructor will merge your PR.

> 🔒 Once **your PR is merged**, your topic becomes **unavailable** to others.

## 🧭 Udhëzues i detajuar për rezervimin e një projekti (AL)

1. **Zgjidh idenë që të intereson:** Hap `TOPICS.md`, lexo përshkrimet dhe shëno ID-në (p.sh. `07`) të projektit që dëshiron. Sigurohu që statusi i tij të jetë ende **(Available)**.
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
5. **Përditëso vetëm rreshtin e temës tënde në `TOPICS.md`:** Ndrysho segmentin `— (Available)` në `— (Taken by EMRI MBIEMRI)` duke ruajtur identik pjesën tjetër të rreshtit. Mos modifiko titullin, ID-në apo shembujt e Supabase.
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
10. **Hap Pull Request te repo origjinal:** Zgjidh bazën `main`, përshkruaj shkurtimisht projektin, plotëso komplet shabllonin (emri yt, ID e temës, stack-u i zgjedhur, plani 1-javor, mjetet AI). Kontrollo që kontrolli automatik (GitHub Action) të kalojë.
11. **Monitoro PR-në:** Nëse mësimdhënësi kërkon ndryshime, përditëso degën tënde dhe shty listën e re të commit-ëve. Kur PR të miratohet dhe të bashkohet, statusi i temës bëhet automatikisht i zënë për studentët e tjerë.

## 🧑‍💻 Contributor Guidelines

- Maintainers and reviewers should follow the workflow documented in [`AGENTS.md`](AGENTS.md) for repository structure, validation steps, and PR expectations.

## 🔧 Allowed stacks & tools

- **Mobile stacks:** Flutter, React Native (Expo), Kotlin (Android), Swift (iOS)  
- **Backend/DB:** Supabase (Auth + Postgres + Storage)  
- **AI tools:** Gemini, GitHub Copilot, ChatGPT/Codex CLI  
- **Dev environments:** Replit, VS Code, GitHub Codespaces

## 🧠 Requirements for all projects

- Working mobile app that runs on device/emulator  
- Uses Supabase (Auth and/or data)  
- Uses AI productively (prompt logs saved in `AI-log.txt` in your app repo)  
- Clear README with setup/run instructions  
- Minimum 3 meaningful commits per week

## ❓ Questions

Open a **Discussion** or ask during class/Telegram group.  
Good luck!

## 📘 How to use these assignments as a student

- **Explore the catalog:** Review all 60 topics in `TOPICS.md` and shortlist the ideas that fit your interests or portfolio goals.
- **Assess feasibility:** Compare the suggested Supabase schema and tooling with your existing skills to decide what you need to learn or prototype first.
- **Claim responsibly:** Once confident, follow the claiming workflow above so the topic is reserved in your name.
- **Plan your build:** Break the requirements into weekly milestones, documenting them in your own project board or tracker before you start coding.
- **Leverage AI effectively:** Keep a running `AI-log.txt` that records meaningful prompts and outputs you used for ideation, debugging, or asset creation.
- **Iterate and test:** Develop the app incrementally, demoing features on a device/emulator and validating Supabase integration as you go.
- **Reflect and share:** When finished, publish a concise case study or README section explaining what you built, challenges faced, and what you learned.
